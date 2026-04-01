import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Spinner } from "../components/ui/spinner"
import { Users, Search, Shield, Clock, MessageSquare, Trash2 } from "lucide-react"

interface UserData {
  id: number
  username: string
  email: string
  role: string
  query_count: number
  created_at: string
}

interface QueryLog {
  id: number
  user: string
  query: string
  response_time: number
  relevance: number
  created_at: string
}

const sampleUsers: UserData[] = [
  { id: 1, username: "dr_martin", email: "dr.martin@hospital.com", role: "admin", query_count: 87, created_at: "2025-12-01" },
  { id: 2, username: "dr_chen", email: "dr.chen@hospital.com", role: "user", query_count: 145, created_at: "2025-12-15" },
  { id: 3, username: "nurse_jones", email: "nurse.jones@hospital.com", role: "user", query_count: 62, created_at: "2026-01-10" },
  { id: 4, username: "tech_smith", email: "tech.smith@hospital.com", role: "user", query_count: 34, created_at: "2026-02-01" },
]

const sampleQueries: QueryLog[] = [
  { id: 1, user: "dr_chen", query: "What is the maintenance schedule for ventilator X200?", response_time: 2.3, relevance: 0.95, created_at: "2026-03-04 10:30" },
  { id: 2, user: "dr_martin", query: "Ibuprofen dosage for pediatric patients?", response_time: 1.8, relevance: 0.92, created_at: "2026-03-04 10:25" },
  { id: 3, user: "nurse_jones", query: "ELISA test protocol steps?", response_time: 3.1, relevance: 0.88, created_at: "2026-03-04 10:20" },
  { id: 4, user: "tech_smith", query: "Calibration procedure for blood gas analyzer?", response_time: 2.7, relevance: 0.91, created_at: "2026-03-04 10:15" },
  { id: 5, user: "dr_chen", query: "Contraindications for CT contrast agents?", response_time: 1.5, relevance: 0.97, created_at: "2026-03-04 10:10" },
]

export default function AdminPage() {
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"users" | "queries">("users")
  const [search, setSearch] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size={32} />
      </div>
    )
  }

  const filteredUsers = sampleUsers.filter(
    (u) => u.username.includes(search.toLowerCase()) || u.email.includes(search.toLowerCase())
  )

  const filteredQueries = sampleQueries.filter(
    (q) => q.user.includes(search.toLowerCase()) || q.query.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold">Admin Panel</h2>
        <p className="mt-1 text-muted-foreground">Manage users, view query logs, and monitor system</p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold">{sampleUsers.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Queries</p>
              <p className="text-2xl font-bold">{sampleUsers.reduce((a, u) => a + u.query_count, 0)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Response</p>
              <p className="text-2xl font-bold">2.3s</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs + Search */}
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-lg border p-1">
          <button
            onClick={() => setTab("users")}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === "users" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setTab("queries")}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === "queries" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Query Logs
          </button>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Users Table */}
      {tab === "users" && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-muted-foreground">
                  <th className="px-6 py-3 font-medium">User</th>
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium">Role</th>
                  <th className="px-6 py-3 font-medium">Queries</th>
                  <th className="px-6 py-3 font-medium">Joined</th>
                  <th className="px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b last:border-0 hover:bg-accent/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                          {user.username[0].toUpperCase()}
                        </div>
                        <span className="font-medium">{user.username}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{user.email}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          user.role === "admin"
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                            : "bg-secondary text-secondary-foreground"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{user.query_count}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{user.created_at}</td>
                    <td className="px-6 py-4">
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Query Logs Table */}
      {tab === "queries" && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-muted-foreground">
                  <th className="px-6 py-3 font-medium">User</th>
                  <th className="px-6 py-3 font-medium">Query</th>
                  <th className="px-6 py-3 font-medium">Latency</th>
                  <th className="px-6 py-3 font-medium">Relevance</th>
                  <th className="px-6 py-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredQueries.map((q) => (
                  <tr key={q.id} className="border-b last:border-0 hover:bg-accent/50">
                    <td className="px-6 py-4 text-sm font-medium">{q.user}</td>
                    <td className="max-w-xs truncate px-6 py-4 text-sm">{q.query}</td>
                    <td className="px-6 py-4 text-sm">{q.response_time}s</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          q.relevance >= 0.9
                            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                        }`}
                      >
                        {(q.relevance * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{q.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
