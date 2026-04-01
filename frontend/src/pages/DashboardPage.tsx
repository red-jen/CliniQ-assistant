import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card"
import { Spinner } from "../components/ui/spinner"
import {
  MessageSquare,
  Clock,
  TrendingUp,
  Shield,
  Activity,
  FileText,
} from "lucide-react"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  Legend,
} from "recharts"

const sampleLatencyData = [
  { name: "10:00", latency: 2.1 },
  { name: "10:05", latency: 1.8 },
  { name: "10:10", latency: 3.2 },
  { name: "10:15", latency: 2.5 },
  { name: "10:20", latency: 1.9 },
  { name: "10:25", latency: 2.8 },
  { name: "10:30", latency: 2.1 },
  { name: "10:35", latency: 3.5 },
  { name: "10:40", latency: 2.3 },
  { name: "10:45", latency: 1.7 },
]

const sampleQualityData = [
  { name: "Relevance", value: 92, fill: "hsl(217, 91%, 60%)" },
  { name: "Faithfulness", value: 95, fill: "hsl(142, 71%, 45%)" },
  { name: "Context", value: 88, fill: "hsl(38, 92%, 50%)" },
]

const sampleQueriesPerDay = [
  { day: "Mon", queries: 45 },
  { day: "Tue", queries: 62 },
  { day: "Wed", queries: 38 },
  { day: "Thu", queries: 71 },
  { day: "Fri", queries: 55 },
  { day: "Sat", queries: 22 },
  { day: "Sun", queries: 18 },
]

interface MetricCardProps {
  title: string
  value: string
  subtitle: string
  icon: React.ReactNode
  trend?: string
}

function MetricCard({ title, value, subtitle, icon, trend }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">{icon}</div>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        {trend && <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">{trend}</span>}
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size={32} />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        <p className="mt-1 text-muted-foreground">Monitor RAG performance, quality metrics, and system health</p>
      </div>

      {/* Metric Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Queries"
          value="312"
          subtitle="Last 30 days"
          icon={<MessageSquare className="h-6 w-6 text-primary" />}
          trend="+12%"
        />
        <MetricCard
          title="Avg Response Time"
          value="2.3s"
          subtitle="p95: 4.1s"
          icon={<Clock className="h-6 w-6 text-primary" />}
        />
        <MetricCard
          title="Avg Quality Score"
          value="91.7%"
          subtitle="Relevance + Faithfulness"
          icon={<TrendingUp className="h-6 w-6 text-primary" />}
          trend="+3%"
        />
        <MetricCard
          title="Documents Indexed"
          value="24"
          subtitle="1,247 chunks"
          icon={<FileText className="h-6 w-6 text-primary" />}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Response Latency */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Response Latency (seconds)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={sampleLatencyData}>
                <defs>
                  <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Area type="monotone" dataKey="latency" stroke="hsl(217, 91%, 60%)" fill="url(#latencyGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Quality Scores */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quality Scores (DeepEval)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="30%"
                outerRadius="90%"
                data={sampleQualityData}
                startAngle={180}
                endAngle={0}
              >
                <RadialBar background dataKey="value" cornerRadius={10} />
                <Legend iconSize={10} layout="horizontal" verticalAlign="bottom" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Queries per Day */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Queries per Day</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={sampleQueriesPerDay}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="day" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Bar dataKey="queries" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "FastAPI Server", status: "healthy", uptime: "99.9%" },
                { name: "PostgreSQL", status: "healthy", uptime: "99.9%" },
                { name: "Ollama (Mistral)", status: "healthy", uptime: "98.5%" },
                { name: "ChromaDB", status: "healthy", uptime: "99.8%" },
                { name: "Prometheus", status: "healthy", uptime: "99.9%" },
                { name: "Grafana", status: "healthy", uptime: "99.9%" },
              ].map((service) => (
                <div key={service.name} className="flex items-center justify-between rounded-lg border px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                    <span className="text-sm font-medium">{service.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{service.uptime}</span>
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900 dark:text-green-300">
                      {service.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
