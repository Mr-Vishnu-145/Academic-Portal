import React, { useState, useRef, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
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
import { Menu, Moon, Sun, Search, Bell, Sparkles, Command, ShieldAlert, CheckCircle, GraduationCap } from 'lucide-react';

// Layout wrapper that conditionally renders the Sidebar for logged-in users
const MainLayout = ({ children }) => {
  const { token, user, logout, authenticatedFetch } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();

  const quickActionsRef = useRef(null);
  const notificationsRef = useRef(null);
  const notificationsMobileRef = useRef(null);

  const fetchUnreadNotifications = async () => {
    if (!token || !user) return;
    try {
      // 1. Fetch unread system notifications
      const notifRes = await authenticatedFetch('/api/notifications/unread');
      let backendNotifs = [];
      if (notifRes.ok) {
        backendNotifs = await notifRes.json();
      }

      // 2. Fetch upcoming events (for students) to build dynamic alerts
      let upcomingAlerts = [];
      if (user.role === 'STUDENT') {
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);
        const formatYMD = (d) => d.toLocaleDateString('en-CA');
        const todayStr = formatYMD(today);
        const nextWeekStr = formatYMD(nextWeek);

        // Fetch exams
        const examRes = await authenticatedFetch('/api/exams');
        if (examRes.ok) {
          const examsData = await examRes.json();
          examsData.forEach(exam => {
            if (exam.examDate && exam.examDate >= todayStr && exam.examDate <= nextWeekStr) {
              upcomingAlerts.push({
                id: `upcoming-exam-${exam.id}`,
                title: `Upcoming Exam: ${exam.subject.name}`,
                message: `Your exam for ${exam.subject.code} is scheduled on ${exam.examDate} at ${exam.examTime.substring(0, 5)} in Hall ${exam.hallNumber}.`,
                type: 'EXAM',
                isRead: false
              });
            }
          });
        }

        // Fetch assignments
        const asgRes = await authenticatedFetch('/api/student/assignments');
        if (asgRes.ok) {
          const asgData = await asgRes.json();
          asgData.forEach(asg => {
            if (asg.dueDate && asg.dueDate >= todayStr && asg.dueDate <= nextWeekStr) {
              upcomingAlerts.push({
                id: `upcoming-asg-${asg.id}`,
                title: `Assignment Due: ${asg.title}`,
                message: `Assignment lab is due on ${asg.dueDate}. Max Marks: ${asg.maxMarks}.`,
                type: 'ASSIGNMENT',
                isRead: false
              });
            }
          });
        }

        // Fetch outstanding fees
        const feeRes = await authenticatedFetch('/api/student/fees/summary');
        if (feeRes.ok) {
          const feeData = await feeRes.json();
          if (feeData && feeData.pendingFees) {
            feeData.pendingFees.forEach(fee => {
              if (fee.dueDate && fee.dueDate >= todayStr && fee.dueDate <= nextWeekStr) {
                upcomingAlerts.push({
                  id: `upcoming-fee-${fee.feeId}`,
                  title: `Fees Outstanding: ${fee.feeType}`,
                  message: `Payment of INR ${fee.remaining} is due on ${fee.dueDate}.`,
                  type: 'FEE',
                  isRead: false
                });
              }
            });
          }
        }
      }

      setNotifications([...upcomingAlerts, ...backendNotifs]);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchUnreadNotifications();
    const interval = setInterval(fetchUnreadNotifications, 30000);
    return () => clearInterval(interval);
  }, [token, user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (quickActionsRef.current && !quickActionsRef.current.contains(event.target)) {
        setShowQuickActions(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (notificationsMobileRef.current && !notificationsMobileRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  
  // Normalize pathname to strip trailing slashes for robust matching
  const cleanPath = location.pathname.toLowerCase().replace(/\/$/, '');
  const isAuthPage = cleanPath === '/login' || cleanPath === '/unauthorized';

  if (!token || !user || isAuthPage) {
    return <>{children}</>;
  }

  // Quick Action Config based on Role
  const handleQuickAction = (actionPath) => {
    setShowQuickActions(false);
    navigate(actionPath);
  };

  return (
    <div className="portal-layout">
      {/* Background Decorative Glowing Blobs */}
      <div className="aurora-bg">
        <div className="aurora-blob aurora-blob-1" />
        <div className="aurora-blob aurora-blob-2" />
      </div>

      {/* Mobile Sidebar backdrop */}
      {sidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      <RoleBasedSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0, position: 'relative', zIndex: 1 }}>
        
        {/* Desktop Premium Top Navigation Bar */}
        <header className="portal-top-navbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Mobile menu toggle only visible below 1024px */}
            <button 
              className="menu-toggle-btn" 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ display: 'none' }}
              aria-label="Open sidebar menu"
            >
              <Menu size={22} />
            </button>

            {/* Premium Search Bar */}
            <div className="navbar-search-group">
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="navbar-search-input" 
                placeholder="Search resources, marks..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', color: 'var(--text-muted)', border: '1px solid var(--border)', padding: '2px 4px', borderRadius: '4px', background: 'var(--bg-muted)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                <Command size={10} /> K
              </span>
            </div>
          </div>

          <div className="navbar-actions">
            {/* AI Assistant Quick Indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: '600', fontSize: '13px', background: 'var(--primary-surface)', padding: '6px 12px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border)' }}>
              <Sparkles size={14} className="animate-pulse" />
              <span className="desktop-only">AI Assistant Live</span>
            </div>

            {/* Pulsing Notification Bell */}
            <div style={{ position: 'relative' }} ref={notificationsRef}>
              <button 
                className="theme-toggle-btn"
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="View notifications"
              >
                <Bell size={18} />
                {notifications.length > 0 && (
                  <span style={{ position: 'absolute', top: '2px', right: '2px', width: '8px', height: '8px', background: 'var(--danger)', borderRadius: '50%', animation: 'pulse-dot 1.5s infinite' }} />
                )}
              </button>
              {showNotifications && (
                <div className="theme-dropdown-menu" style={{ width: '320px', right: 0, left: 'auto', bottom: 'auto', top: '100%', marginTop: '8px', padding: '12px', maxHeight: '360px', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontWeight: '700', fontSize: '13px' }}>Unread Bulletins</div>
                    <span className="badge badge-success">{notifications.length} New</span>
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '12px 8px', color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center' }}>No unread bulletins or upcoming alerts.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {notifications.map((n) => (
                        <div key={n.id} style={{ background: 'var(--primary-surface)', padding: '8px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border)', fontSize: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <span className={`badge ${n.type === 'EXAM' ? 'badge-danger' : n.type === 'FEE' ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '8px', padding: '2px 4px' }}>{n.type || 'SYSTEM'}</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{n.title}</strong>
                          </div>
                          <div style={{ color: 'var(--text-secondary)' }}>{n.message}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Design Theme Switcher */}
            <button 
              className="theme-toggle-btn" 
              onClick={toggleTheme}
              aria-label="Switch Design Theme"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {/* Clickable User Profile Summary triggering dropdown */}
            <div 
              className="user-profile-summary" 
              onClick={() => setShowQuickActions(!showQuickActions)}
              style={{ 
                padding: '4px 12px 4px 4px', 
                border: '1px solid var(--border)',
                cursor: 'pointer',
                position: 'relative',
                userSelect: 'none',
                transition: 'var(--transition-fast)'
              }}
              ref={quickActionsRef}
            >
              <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '12px' }}>{user.name ? user.name.charAt(0) : 'U'}</div>
              <div style={{ textAlign: 'left', fontSize: '12px', display: 'flex', flexDirection: 'column' }} className="desktop-only">
                <span style={{ fontWeight: '600', lineHeight: '1.2' }}>{user.name}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{user.role}</span>
              </div>
              
              {showQuickActions && (
                <div className="theme-dropdown-menu" style={{ width: '220px', right: 0, top: 'calc(100% + 8px)', left: 'auto', bottom: 'auto' }}>
                  <div className="sidebar-section-label">Quick Actions</div>
                  {user.role === 'STUDENT' && (
                    <>
                      <div className="theme-dropdown-item" onClick={() => handleQuickAction('/student/exams')}>Check Exam Hall</div>
                      <div className="theme-dropdown-item" onClick={() => handleQuickAction('/student/fees')}>Pay Term Fees</div>
                      <div className="theme-dropdown-item" onClick={() => handleQuickAction('/student/assignments')}>Submit Labs</div>
                    </>
                  )}
                  {user.role === 'STAFF' && (
                    <>
                      <div className="theme-dropdown-item" onClick={() => handleQuickAction('/staff/attendance')}>Mark Daily Attendance</div>
                      <div className="theme-dropdown-item" onClick={() => handleQuickAction('/staff/marks')}>Upload Unit Grades</div>
                      <div className="theme-dropdown-item" onClick={() => handleQuickAction('/staff/assignments')}>Post Assignment</div>
                    </>
                  )}
                  {user.role === 'HOD' && (
                    <>
                      <div className="theme-dropdown-item" onClick={() => handleQuickAction('/hod/staff')}>Appoint Faculty</div>
                      <div className="theme-dropdown-item" onClick={() => handleQuickAction('/hod/results')}>Publish Term Results</div>
                    </>
                  )}
                  {user.role === 'ADMIN' && (
                    <>
                      <div className="theme-dropdown-item" onClick={() => handleQuickAction('/admin/departments')}>Add New Dept</div>
                      <div className="theme-dropdown-item" onClick={() => handleQuickAction('/admin/users')}>Register User</div>
                    </>
                  )}
                  <hr style={{ border: 'none', height: '1px', background: 'var(--divider)', margin: '4px 0' }} />
                  <div className="theme-dropdown-item" style={{ color: 'var(--danger)' }} onClick={() => { logout(); navigate('/login'); }}>Sign Out</div>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Mobile Header Bar (Only visible below 1024px) */}
        <div className="mobile-top-bar">
          <button 
            className="menu-toggle-btn" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle Navigation Menu"
          >
            <Menu size={22} />
          </button>
          
          <div className="mobile-logo">
            <GraduationCap size={22} style={{ stroke: 'var(--primary)' }} />
            <span>Academic Portal</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Pulsing Notification Bell (Mobile) */}
            <div style={{ position: 'relative' }} ref={notificationsMobileRef}>
              <button 
                className="theme-toggle-btn"
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="View notifications"
              >
                 <Bell size={18} />
                 {notifications.length > 0 && (
                   <span style={{ position: 'absolute', top: '2px', right: '2px', width: '8px', height: '8px', background: 'var(--danger)', borderRadius: '50%', animation: 'pulse-dot 1.5s infinite' }} />
                 )}
               </button>
               {showNotifications && (
                 <div className="theme-dropdown-menu" style={{ width: '280px', right: '-40px', left: 'auto', bottom: 'auto', top: '100%', marginTop: '8px', padding: '12px', maxHeight: '300px', overflowY: 'auto' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                     <div style={{ fontWeight: '700', fontSize: '13px' }}>Unread Bulletins</div>
                     <span className="badge badge-success">{notifications.length} New</span>
                   </div>
                   {notifications.length === 0 ? (
                     <div style={{ padding: '12px 8px', color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center' }}>No unread bulletins or upcoming alerts.</div>
                   ) : (
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                       {notifications.map((n) => (
                         <div key={n.id} style={{ background: 'var(--primary-surface)', padding: '8px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border)', fontSize: '12px' }}>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                             <span className={`badge ${n.type === 'EXAM' ? 'badge-danger' : n.type === 'FEE' ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '8px', padding: '2px 4px' }}>{n.type || 'SYSTEM'}</span>
                             <strong style={{ color: 'var(--text-primary)' }}>{n.title}</strong>
                           </div>
                           <div style={{ color: 'var(--text-secondary)' }}>{n.message}</div>
                         </div>
                       ))}
                     </div>
                   )}
                 </div>
               )}
             </div>

            {/* Design Theme Switcher (Mobile) */}
            <button 
              className="theme-toggle-btn" 
              onClick={toggleTheme}
              aria-label="Switch Design Theme"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
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
