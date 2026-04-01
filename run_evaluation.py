"""
MediAssist Pro — Full RAG Evaluation Script
============================================
Sends multiple test queries through the API endpoint.
Each query triggers the FULL pipeline:
  1. RAG retrieval (ChromaDB + BM25 hybrid → cross-encoder reranking)
  2. LLM generation (Mistral via Ollama)
  3. DeepEval scoring (answer_relevancy, faithfulness, contextual_relevancy)
  4. MLflow logging (params + metrics + artifacts)
  5. Prometheus gauge updates

After all queries, it reads back the scores from MLflow and prints a report.
"""

import time
import requests
import json
import os

API_URL = "http://localhost:8000"

# ── Test queries based on the ELISA protocol PDF ──────────────────────────────
TEST_QUERIES = [
    "Qu'est-ce que le test ELISA et comment fonctionne-t-il ?",
    "Quels sont les composants principaux nécessaires pour réaliser un test ELISA ?",
    "Comment préparer les échantillons avant un test ELISA ?",
    "Quelle est la procédure de lavage des plaques ELISA ?",
    "Quels types de lecteurs ELISA sont mentionnés dans le document ?",
    "Comment interpréter les résultats d'un test ELISA ?",
    "Quelles sont les précautions à prendre lors de la manipulation des réactifs ?",
    "Quel est le rôle de l'incubateur dans le protocole ELISA ?",
    "Comment calibrer le lecteur ELISA ?",
    "Quelles sont les étapes de contrôle qualité pour un test ELISA ?",
]


def login() -> str:
    """Login and return JWT token."""
    # Try existing user first
    r = requests.post(f"{API_URL}/auth/login", data={"username": "evaluser", "password": "Eval1234"})
    if r.status_code == 200:
        return r.json()["access_token"]
    
    # Register if needed
    requests.post(f"{API_URL}/auth/register", json={
        "username": "evaluser", "email": "eval@test.com", "password": "Eval1234"
    })
    r = requests.post(f"{API_URL}/auth/login", data={"username": "evaluser", "password": "Eval1234"})
    return r.json()["access_token"]


def run_query(token: str, query: str, chat_history: list = None) -> dict:
    """Send a RAG query and return the full response + timing."""
    headers = {"Authorization": f"Bearer {token}"}
    payload = {"query": query, "chat_history": chat_history or []}
    
    start = time.time()
    r = requests.post(f"{API_URL}/rag/ask", json=payload, headers=headers, timeout=600)
    elapsed = time.time() - start
    
    if r.status_code == 200:
        data = r.json()
        data["_elapsed"] = round(elapsed, 2)
        data["_status"] = 200
        return data
    else:
        return {"_status": r.status_code, "_error": r.text, "_elapsed": round(elapsed, 2)}


def get_mlflow_scores() -> list:
    """Read all MLflow runs from the mediassist-rag experiment."""
    try:
        import mlflow
        mlflow.set_tracking_uri("sqlite:///mlflow.db")
        client = mlflow.tracking.MlflowClient()
        
        experiment = client.get_experiment_by_name("mediassist-rag")
        if not experiment:
            return []
        
        runs = client.search_runs(
            experiment_ids=[experiment.experiment_id],
            order_by=["start_time DESC"],
            max_results=len(TEST_QUERIES)
        )
        
        results = []
        for run in runs:
            metrics = run.data.metrics
            results.append({
                "run_id": run.info.run_id[:8],
                "de_answer_relevancy": metrics.get("de_answer_relevancy", metrics.get("answer_relevance", -1)),
                "de_faithfulness": metrics.get("de_faithfulness", metrics.get("faithfulness", -1)),
                "de_contextual_relevancy": metrics.get("de_contextual_relevancy", -1),
                "precision_at_k": metrics.get("precision_at_k", -1),
                "recall_at_k": metrics.get("recall_at_k", -1),
                "response_time_ms": metrics.get("response_time_ms", -1),
                "num_sources": metrics.get("num_sources", 0),
                "quality_source": run.data.params.get("quality_metric_source", "unknown"),
            })
        return results
    except Exception as e:
        print(f"[MLflow] Could not read runs: {e}")
        return []


def get_prometheus_gauges() -> dict:
    """Read the current Prometheus gauge values from the /metrics endpoint."""
    try:
        r = requests.get(f"{API_URL}/metrics", timeout=5)
        lines = r.text.split("\n")
        gauges = {}
        for line in lines:
            if line.startswith("rag_"):
                parts = line.split(" ")
                if len(parts) == 2:
                    gauges[parts[0]] = float(parts[1])
        return gauges
    except Exception as e:
        print(f"[Prometheus] Could not fetch metrics: {e}")
        return {}


def print_report(query_results: list, mlflow_scores: list, prometheus_gauges: dict):
    """Print a comprehensive evaluation report."""
    
    print("\n" + "=" * 80)
    print("  MEDIASSIST PRO — RAG EVALUATION REPORT")
    print("=" * 80)
    
    # ── Query Results ──
    print("\n── QUERY RESULTS ──────────────────────────────────────────────────")
    
    success = [r for r in query_results if r["_status"] == 200]
    failed = [r for r in query_results if r["_status"] != 200]
    
    print(f"  Total queries:    {len(query_results)}")
    print(f"  Successful:       {len(success)}")
    print(f"  Failed:           {len(failed)}")
    
    if success:
        times = [r["_elapsed"] for r in success]
        print(f"  Avg response:     {sum(times)/len(times):.2f}s")
        print(f"  Min response:     {min(times):.2f}s")
        print(f"  Max response:     {max(times):.2f}s")
    
    for i, r in enumerate(query_results):
        q = TEST_QUERIES[i][:60]
        status = "OK" if r["_status"] == 200 else f"ERR {r['_status']}"
        elapsed = r["_elapsed"]
        answer_preview = r.get("answer", r.get("_error", ""))[:80]
        sources_count = len(r.get("sources", []))
        print(f"\n  Q{i+1}: {q}...")
        print(f"      [{status}] {elapsed}s | {sources_count} sources")
        print(f"      A: {answer_preview}...")
    
    # ── MLflow DeepEval Scores ──
    print("\n── DEEPEVAL SCORES (from MLflow) ───────────────────────────────────")
    
    if mlflow_scores:
        de_ar = [s["de_answer_relevancy"] for s in mlflow_scores if s["de_answer_relevancy"] >= 0]
        de_f  = [s["de_faithfulness"] for s in mlflow_scores if s["de_faithfulness"] >= 0]
        de_cr = [s["de_contextual_relevancy"] for s in mlflow_scores if s["de_contextual_relevancy"] >= 0]
        pk    = [s["precision_at_k"] for s in mlflow_scores if s["precision_at_k"] >= 0]
        rk    = [s["recall_at_k"] for s in mlflow_scores if s["recall_at_k"] >= 0]
        
        print(f"\n  {'Metric':<30} {'Avg':>8} {'Min':>8} {'Max':>8} {'Count':>6}")
        print(f"  {'-'*30} {'-'*8} {'-'*8} {'-'*8} {'-'*6}")
        
        for name, vals in [
            ("Answer Relevancy", de_ar),
            ("Faithfulness", de_f),
            ("Contextual Relevancy", de_cr),
            ("Precision@K", pk),
            ("Recall@K", rk),
        ]:
            if vals:
                avg = sum(vals) / len(vals)
                print(f"  {name:<30} {avg:>8.3f} {min(vals):>8.3f} {max(vals):>8.3f} {len(vals):>6}")
            else:
                print(f"  {name:<30} {'N/A':>8} {'N/A':>8} {'N/A':>8} {'0':>6}")
        
        print(f"\n  Quality source: {mlflow_scores[0]['quality_source']}")
        
        # Per-query breakdown
        print(f"\n  {'Run':<10} {'AnswerRel':>10} {'Faithful':>10} {'CtxRel':>10} {'P@K':>8} {'R@K':>8} {'Latency':>10}")
        print(f"  {'-'*10} {'-'*10} {'-'*10} {'-'*10} {'-'*8} {'-'*8} {'-'*10}")
        for s in mlflow_scores:
            print(f"  {s['run_id']:<10} "
                  f"{s['de_answer_relevancy']:>10.3f} "
                  f"{s['de_faithfulness']:>10.3f} "
                  f"{s['de_contextual_relevancy']:>10.3f} "
                  f"{s['precision_at_k']:>8.3f} "
                  f"{s['recall_at_k']:>8.3f} "
                  f"{s['response_time_ms']:>8.0f}ms")
    else:
        print("  No MLflow runs found.")
    
    # ── Prometheus Gauges ──
    print("\n── PROMETHEUS LIVE GAUGES ──────────────────────────────────────────")
    if prometheus_gauges:
        for k, v in sorted(prometheus_gauges.items()):
            print(f"  {k:<40} {v:.4f}")
    else:
        print("  No RAG metrics found.")
    
    # ── Summary Rating ──
    print("\n── OVERALL RATING ─────────────────────────────────────────────────")
    if mlflow_scores:
        de_ar_avg = sum(de_ar) / len(de_ar) if de_ar else 0
        de_f_avg = sum(de_f) / len(de_f) if de_f else 0
        de_cr_avg = sum(de_cr) / len(de_cr) if de_cr else 0
        overall = (de_ar_avg + de_f_avg + de_cr_avg) / 3 if (de_ar and de_f and de_cr) else 0
        
        rating = "EXCELLENT" if overall >= 0.8 else "GOOD" if overall >= 0.6 else "FAIR" if overall >= 0.4 else "NEEDS IMPROVEMENT"
        
        print(f"  Answer Relevancy:      {de_ar_avg:.1%}")
        print(f"  Faithfulness:          {de_f_avg:.1%}")
        print(f"  Contextual Relevancy:  {de_cr_avg:.1%}")
        print(f"  ─────────────────────────────")
        print(f"  Overall Score:         {overall:.1%}  [{rating}]")
    
    print("\n" + "=" * 80)


def main():
    print("MediAssist Pro — RAG Evaluation")
    print("=" * 50)
    
    # Step 1: Login
    print("\n[1/4] Logging in...")
    token = login()
    print(f"  OK — got JWT token")
    
    # Step 2: Run queries
    print(f"\n[2/4] Running {len(TEST_QUERIES)} evaluation queries...")
    print("  (Each query does: retrieval → generation → DeepEval scoring → MLflow logging)")
    print("  This will take a few minutes...\n")
    
    query_results = []
    for i, query in enumerate(TEST_QUERIES):
        print(f"  [{i+1}/{len(TEST_QUERIES)}] {query[:65]}...")
        try:
            result = run_query(token, query)
            status = "OK" if result["_status"] == 200 else f"FAIL({result['_status']})"
            print(f"         → {status} in {result['_elapsed']}s")
        except Exception as e:
            result = {"_status": -1, "_error": str(e), "_elapsed": -1}
            print(f"         → TIMEOUT/ERROR: {str(e)[:80]}")
        query_results.append(result)
        time.sleep(1)
    
    # Step 3: Collect MLflow scores
    print(f"\n[3/4] Reading MLflow scores...")
    mlflow_scores = get_mlflow_scores()
    print(f"  Found {len(mlflow_scores)} runs")
    
    # Step 4: Read Prometheus gauges
    print(f"\n[4/4] Reading Prometheus gauges...")
    prometheus_gauges = get_prometheus_gauges()
    print(f"  Found {len(prometheus_gauges)} RAG metrics")
    
    # Report
    print_report(query_results, mlflow_scores, prometheus_gauges)


if __name__ == "__main__":
    main()
