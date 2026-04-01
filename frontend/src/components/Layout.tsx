import { NavLink, Outlet, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useTheme } from "../context/ThemeContext"
import {
  MessageSquare,
  LayoutDashboard,
  Upload,
  Shield,
  LogOut,
  Sun,
  Moon,
  Activity,
  Menu,
  X,
} from "lucide-react"
import { Button } from "./ui/button"
import { useState } from "react"

const navItems = [
  { to: "/chat", icon: MessageSquare, label: "Chat" },
  { to: "/upload", icon: Upload, label: "Upload PDF" },
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin", icon: Shield, label: "Admin" },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-card border-r transition-transform duration-200 lg:relative lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center gap-3 border-b px-6 py-4">
            <Activity className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-lg font-bold">MediAssist Pro</h1>
              <p className="text-xs text-muted-foreground">RAG Medical Assistant</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Bottom */}
          <div className="border-t p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{user?.username}</span>
              <Button variant="ghost" size="icon" onClick={toggleTheme}>
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
            <Button variant="outline" className="w-full justify-start gap-2" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="flex items-center gap-4 border-b px-4 py-3 lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <h1 className="text-lg font-semibold">MediAssist Pro</h1>
        </header>

        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
