import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { authAPI } from "../lib/api"
import type { User, TokenResponse } from "../types"

interface AuthContextType {
  user: User | null
  token: string | null
  login: (username: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const savedToken = localStorage.getItem("token")
    const savedUser = localStorage.getItem("user")
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (username: string, password: string) => {
    const data: TokenResponse = await authAPI.login(username, password)
    const userObj: User = { id: 0, username, email: "", role: "user" }
    setToken(data.access_token)
    setUser(userObj)
    localStorage.setItem("token", data.access_token)
    localStorage.setItem("user", JSON.stringify(userObj))
  }

  const register = async (username: string, email: string, password: string) => {
    const data = await authAPI.register(username, email, password)
    setUser(data)
    localStorage.setItem("user", JSON.stringify(data))
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem("token")
    localStorage.removeItem("user")
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isAuthenticated: !!token, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
