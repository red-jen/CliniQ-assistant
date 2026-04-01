import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "./context/AuthContext"
import { ThemeProvider } from "./context/ThemeContext"
import Layout from "./components/Layout"
import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"
import ChatPage from "./pages/ChatPage"
import UploadPage from "./pages/UploadPage"
import DashboardPage from "./pages/DashboardPage"
import AdminPage from "./pages/AdminPage"
import { Spinner } from "./components/ui/spinner"

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <div className="flex h-screen items-center justify-center"><Spinner size={32} /></div>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <div className="flex h-screen items-center justify-center"><Spinner size={32} /></div>
  if (isAuthenticated) return <Navigate to="/chat" replace />
  return <>{children}</>
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/chat" replace />} />
              <Route path="chat" element={<ChatPage />} />
              <Route path="upload" element={<UploadPage />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="admin" element={<AdminPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
