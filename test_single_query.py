import requests, time, json

token = requests.post("http://localhost:8000/auth/login", data={"username":"evaluser","password":"Eval1234"}).json()["access_token"]
print("Token OK")

start = time.time()
r = requests.post(
    "http://localhost:8000/rag/ask",
    json={"query": "Qu'est-ce que le test ELISA?", "chat_history": []},
    headers={"Authorization": f"Bearer {token}"},
    timeout=120
)
elapsed = time.time() - start
print(f"Status: {r.status_code} | Time: {elapsed:.1f}s")

if r.status_code == 200:
    d = r.json()
    print(f"Answer: {d['answer'][:300]}")
    print(f"Sources: {d.get('sources', [])}")
else:
    print(f"Error: {r.text[:500]}")
