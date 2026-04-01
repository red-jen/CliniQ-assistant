import requests, time

token = requests.post("http://localhost:8000/auth/login", data={"username":"evaluser","password":"Eval1234"}).json()["access_token"]
print("Token OK")

start = time.time()
r = requests.post(
    "http://localhost:8000/rag/ask",
    json={"query": "Comment preparer les echantillons pour un test ELISA?", "chat_history": []},
    headers={"Authorization": f"Bearer {token}"},
    timeout=300
)
elapsed = time.time() - start
print(f"Status: {r.status_code} | Time: {elapsed:.1f}s")

if r.status_code == 200:
    d = r.json()
    ans = d.get("answer", "")
    print(f"Answer (first 300 chars): {ans[:300]}")
else:
    print(f"Error: {r.text[:500]}")
