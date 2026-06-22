import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import RoleBasedSidebar from './components/common/RoleBasedSidebar';
import Login from './pages/Login';
import Unauthorized from './pages/Unauthorized';
import StudentRoutes from './routes/StudentRoutes';
import StaffRoutes from './routes/StaffRoutes';
import HodRoutes from './routes/HodRoutes';
import AdminRoutes from './routes/AdminRoutes';

// Layout wrapper that conditionally renders the Sidebar for logged-in users
const MainLayout = ({ children }) => {
  const { token } = useAuth();
  
  if (!token) {
    return <>{children}</>;
  }

  return (
    <div className="portal-layout">
      <RoleBasedSidebar />
      <div style={{ flexGrow: 1, minWidth: 0 }}>
        {children}
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
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
