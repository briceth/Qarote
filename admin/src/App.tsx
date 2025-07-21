import { Routes, Route, Navigate } from "react-router-dom";

// Layout
import AdminLayout from "./components/layout/AdminLayout";

// Pages
import Dashboard from "./pages/Dashboard";
import FeedbackList from "./pages/feedback/FeedbackList";
import FeedbackDetail from "./pages/feedback/FeedbackDetail";
import Login from "./pages/auth/Login";

// Context
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background font-sans antialiased">
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="feedback" element={<FeedbackList />} />
            <Route path="feedback/:id" element={<FeedbackDetail />} />
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;
