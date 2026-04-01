import axios from "axios"

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000"

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  login: async (username: string, password: string) => {
    const params = new URLSearchParams()
    params.append("username", username)
    params.append("password", password)
    const res = await api.post("/auth/login", params, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    })
    return res.data
  },
  register: async (username: string, email: string, password: string) => {
    const res = await api.post("/auth/register", { username, email, password })
    return res.data
  },
}

export const ragAPI = {
  ask: async (query: string, chat_history: { question: string; answer: string }[]) => {
    const res = await api.post("/rag/ask", { query, chat_history })
    return res.data
  },
  askStream: async function* (query: string, chat_history: { question: string; answer: string }[]) {
    const token = localStorage.getItem("token")
    const response = await fetch(`${API_BASE}/rag/ask/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query, chat_history }),
    })
    if (!response.ok) throw new Error("Stream request failed")
    const reader = response.body?.getReader()
    if (!reader) return
    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const text = decoder.decode(value, { stream: true })
      const lines = text.split("\n")
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6)
          if (data === "[DONE]") return
          try {
            yield JSON.parse(data)
          } catch {
            yield { token: data }
          }
        }
      }
    }
  },
  uploadPdf: async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)
    const res = await api.post("/rag/upload-pdf", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return res.data
  },
}

export const adminAPI = {
  getUsers: async () => {
    const res = await api.get("/admin/users")
    return res.data
  },
  getStats: async () => {
    const res = await api.get("/admin/stats")
    return res.data
  },
  getQueries: async (page = 1) => {
    const res = await api.get(`/admin/queries?page=${page}`)
    return res.data
  },
}

export default api
