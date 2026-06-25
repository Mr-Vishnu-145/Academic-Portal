import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  LayoutDashboard,
  CreditCard,
  Award,
  FileCheck,
  CheckSquare,
  BookOpen,
  Calendar,
  FileSpreadsheet,
  Bell,
  Users,
  User,
  Briefcase,
  Settings,
  ShieldCheck,
  Building,
  LogOut,
  Moon,
  Sun,
  ChevronDown
} from 'lucide-react';

const RoleBasedSidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [themeDropdownOpen, setThemeDropdownOpen] = React.useState(false);
  const themeDropdownRef = React.useRef(null);

  React.useEffect(() => {
    function handleClickOutside(event) {
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(event.target)) {
        setThemeDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    setSidebarOpen(false);
    navigate('/login');
  };

  // Menu items config for each role
  const menuConfig = {
    STUDENT: [
      { path: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/student/profile', label: 'My Profile', icon: User },
      { path: '/student/fees', label: 'Fees', icon: CreditCard },
      { path: '/student/marks', label: 'Marks & CGPA', icon: Award },
      { path: '/student/results', label: 'Results', icon: FileCheck },
      { path: '/student/attendance', label: 'Attendance', icon: CheckSquare },
      { path: '/student/assignments', label: 'Assignments', icon: BookOpen },
      { path: '/student/exams', label: 'Exam Schedule', icon: Calendar },
      { path: '/student/documents', label: 'Documents', icon: FileSpreadsheet },
      { path: '/student/notifications', label: 'Notifications', icon: Bell },
    ],
    STAFF: [
      { path: '/staff/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/staff/profile', label: 'My Profile', icon: User },
      { path: '/staff/students', label: 'My Students', icon: Users },
      { path: '/staff/attendance', label: 'Mark Attendance', icon: CheckSquare },
      { path: '/staff/marks', label: 'Upload Marks', icon: Award },
      { path: '/staff/assignments', label: 'Manage Assignments', icon: BookOpen },
      { path: '/staff/exams', label: 'Set Exam Schedule', icon: Calendar },
    ],
    HOD: [
      { path: '/hod/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/hod/profile', label: 'My Profile', icon: User },
      { path: '/hod/students', label: 'Dept Students', icon: Users },
      { path: '/hod/staff', label: 'Manage Staff', icon: Briefcase },
      { path: '/hod/exams', label: 'Exam Schedule', icon: Calendar },
      { path: '/hod/results', label: 'Publish Results', icon: ShieldCheck },
    ],
    ADMIN: [
      { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/admin/departments', label: 'All Departments', icon: Building },
      { path: '/admin/users', label: 'All Users', icon: Users },
      { path: '/admin/exams', label: 'Exam Schedule', icon: Calendar },
      { path: '/admin/fees', label: 'Fee Management', icon: CreditCard },
      { path: '/admin/results', label: 'Publish Results', icon: ShieldCheck },
      { path: '/admin/settings', label: 'System Settings', icon: Settings },
    ]
  };

  const currentMenu = menuConfig[user.role] || [];

  return (
    <div className={`portal-sidebar ${sidebarOpen ? 'open' : ''}`}>
      <div className="sidebar-logo">
        <GraduationCapIcon size={32} style={{ stroke: 'var(--primary)' }} />
        <span>Academic Portal</span>
      </div>
      
      <ul className="sidebar-menu">
        {currentMenu.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>

      <div className="sidebar-footer">
        <div className="theme-selector-container" ref={themeDropdownRef} style={{ position: 'relative', marginBottom: '8px' }}>
          <div 
            className="menu-item theme-dropdown-trigger" 
            onClick={() => setThemeDropdownOpen(!themeDropdownOpen)} 
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {theme === 'light' && <Sun size={20} />}
              {theme === 'dark' && <Moon size={20} />}
              <span style={{ textTransform: 'capitalize' }}>
                {theme} Mode
              </span>
            </div>
            <ChevronDown size={16} style={{ transition: 'transform 0.2s', transform: themeDropdownOpen ? 'rotate(180deg)' : 'none', opacity: 0.7 }} />
          </div>

          {themeDropdownOpen && (
            <div className="theme-dropdown-menu">
              <div 
                className={`theme-dropdown-item ${theme === 'light' ? 'active' : ''}`}
                onClick={() => {
                  setTheme('light');
                  setThemeDropdownOpen(false);
                }}
              >
                <Sun size={16} />
                <span>Light Mode</span>
              </div>
              <div 
                className={`theme-dropdown-item ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => {
                  setTheme('dark');
                  setThemeDropdownOpen(false);
                }}
              >
                <Moon size={16} />
                <span>Dark Mode</span>
              </div>
            </div>
          )}
        </div>

        <div className="menu-item" onClick={handleLogout} style={{ color: 'var(--danger)', cursor: 'pointer' }}>
          <LogOut size={20} />
          <span>Logout</span>
        </div>
      </div>
    </div>
  );
};

// Simple inline SVG helper for GraduationCap icon
const GraduationCapIcon = ({ size, style }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
  >
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
  </svg>
);

export default RoleBasedSidebar;
