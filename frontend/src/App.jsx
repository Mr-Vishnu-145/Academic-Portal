import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import RoleBasedSidebar from './components/common/RoleBasedSidebar';
import Login from './pages/Login';
import Unauthorized from './pages/Unauthorized';
import StudentRoutes from './routes/StudentRoutes';
import StaffRoutes from './routes/StaffRoutes';
import HodRoutes from './routes/HodRoutes';
import AdminRoutes from './routes/AdminRoutes';
import { Menu, Moon, Sun } from 'lucide-react';

// Layout wrapper that conditionally renders the Sidebar for logged-in users
const MainLayout = ({ children }) => {
  const { token, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  
  // Normalize pathname to strip trailing slashes for robust matching
  const cleanPath = location.pathname.toLowerCase().replace(/\/$/, '');
  const isAuthPage = cleanPath === '/login' || cleanPath === '/unauthorized';

  if (!token || !user || isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="portal-layout">
      {/* Mobile Sidebar backdrop */}
      {sidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      <RoleBasedSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0 }}>
        {/* Mobile Header Bar */}
        <div className="mobile-top-bar">
          <button 
            className="menu-toggle-btn" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle Navigation Menu"
          >
            <Menu size={22} />
          </button>
          
          <div className="mobile-logo">
            <span>Academic Portal</span>
          </div>
          
          <button 
            className="theme-toggle-btn" 
            onClick={toggleTheme}
            aria-label="Switch Design Theme"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
        
        <div style={{ flexGrow: 1, minWidth: 0 }}>
          {children}
        </div>
      </div>
    </div>
  );
};

const AppContent = () => {
  const { user } = useAuth();

  return (
    <MainLayout>
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Protected Student Routes */}
        <Route 
          path="/student/*" 
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <StudentRoutes />
            </ProtectedRoute>
          } 
        />

        {/* Protected Staff Routes */}
        <Route 
          path="/staff/*" 
          element={
            <ProtectedRoute allowedRoles={['STAFF']}>
              <StaffRoutes />
            </ProtectedRoute>
          } 
        />

        {/* Protected HOD Routes */}
        <Route 
          path="/hod/*" 
          element={
            <ProtectedRoute allowedRoles={['HOD']}>
              <HodRoutes />
            </ProtectedRoute>
          } 
        />

        {/* Protected Admin Routes */}
        <Route 
          path="/admin/*" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminRoutes />
            </ProtectedRoute>
          } 
        />

        {/* Default redirect routing */}
        <Route 
          path="/" 
          element={
            user ? (
              user.role === 'ADMIN' ? <Navigate to="/admin/dashboard" replace /> :
              user.role === 'HOD' ? <Navigate to="/hod/dashboard" replace /> :
              user.role === 'STAFF' ? <Navigate to="/staff/dashboard" replace /> :
              <Navigate to="/student/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MainLayout>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
