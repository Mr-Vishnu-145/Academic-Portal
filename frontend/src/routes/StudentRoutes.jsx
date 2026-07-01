import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Profile from '../pages/Profile';
import ExamScheduleManager from '../pages/ExamScheduleManager';
import { 
  CheckCircle, XCircle, AlertCircle, FileText, Download, Play, 
  CreditCard, BookOpen, Clock, Calendar, CheckSquare, Award,
  Sparkles, Send, MoveUp, MoveDown, Minimize2, Maximize2, Trash2, Check, RefreshCw, ArrowLeft,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import CustomSelect from '../components/common/CustomSelect';

const formatTime12Hour = (timeStr) => {
  if (!timeStr) return '';
  if (timeStr.includes('AM') || timeStr.includes('PM')) {
    return timeStr;
  }
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strHours = hours < 10 ? '0' + hours : hours;
  return `${strHours}:${minutes} ${ampm}`;
};

// Central Student Layout Shell
const StudentLayout = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const showBackButton = !location.pathname.toLowerCase().endsWith('/dashboard');

  const getHeaderInfo = (pathname) => {
    const path = pathname.toLowerCase().replace(/\/$/, '');
    if (path.endsWith('/dashboard')) {
      return {
        title: 'Dashboard Workspace',
        subtitle: `Welcome back, ${user?.name}! Here is your personalized academic cockpit.`
      };
    }
    if (path.endsWith('/profile')) {
      return {
        title: 'User Profile Settings',
        subtitle: 'View and manage your verified registration details.'
      };
    }
    if (path.endsWith('/fees')) {
      return {
        title: 'Financial Statements',
        subtitle: 'Track your pending invoices, payments, and digital receipts.'
      };
    }
    if (path.endsWith('/marks')) {
      return {
        title: 'Marks & Internal Grades',
        subtitle: 'Evaluate your performance in continuous internal assessments.'
      };
    }
    if (path.endsWith('/results')) {
      return {
        title: 'Published Semester Grades',
        subtitle: 'View controller-signed semester marksheets and reports.'
      };
    }
    if (path.endsWith('/attendance')) {
      return {
        title: 'Attendance Analytics',
        subtitle: 'Monitor your hourly check-ins and course-wise compliance rates.'
      };
    }
    if (path.endsWith('/assignments')) {
      return {
        title: 'Assignments & Submissions',
        subtitle: 'Deliver your lab code reports and track grade outcomes.'
      };
    }
    if (path.endsWith('/exams')) {
      return {
        title: 'Exam Hall Timetables',
        subtitle: 'Locate exam dates, times, and hall assignments.'
      };
    }
    if (path.endsWith('/documents')) {
      return {
        title: 'Verified Documents',
        subtitle: 'Download signed transcripts and other official records.'
      };
    }
    if (path.endsWith('/notifications')) {
      return {
        title: 'Announcements Board',
        subtitle: 'Keep up with department events and system notices.'
      };
    }
    return {
      title: 'Academic Portal',
      subtitle: `Authorized: Student Session`
    };
  };

  const headerInfo = getHeaderInfo(location.pathname);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      <div className="portal-content">
        {showBackButton && (
          <button className="btn-back" onClick={() => navigate(-1)}>
            <ArrowLeft size={14} /> Back
          </button>
        )}
        <div className="content-header" style={{ marginBottom: '24px' }}>
          <div className="page-title-group">
            <h1 className="page-title">{headerInfo.title}</h1>
            <p className="page-subtitle">{headerInfo.subtitle}</p>
          </div>
        </div>
        {children}
        <footer style={{ 
          marginTop: 'auto', 
          paddingTop: '32px', 
          paddingBottom: '16px', 
          borderTop: '1px solid var(--border)', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          color: 'var(--text-muted)', 
          fontSize: '12px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>&copy; {new Date().getFullYear()} Academic Portal. Enterprise Grade.</div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <span>Status: <strong style={{ color: 'var(--success)' }}>All Systems Operational</strong></span>
          </div>
        </footer>
      </div>
    </div>
  );
};

// 1. Dashboard Page with Aurora Welcome, News Ticker, Custom Charts, Movable widgets
const StudentDashboard = () => {
  const { authenticatedFetch, user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [typedText, setTypedText] = useState('');
  const [confetti, setConfetti] = useState([]);
  
  // Dynamic calendar resources
  const [exams, setExams] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [feeSummary, setFeeSummary] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDayEvents, setSelectedDayEvents] = useState(null);

  // Widget ordering and states
  const [widgetOrder, setWidgetOrder] = useState(['schedule', 'quickLinks', 'calendar', 'aiAssistant']);
  const [collapsedWidgets, setCollapsedWidgets] = useState({});

  useEffect(() => {
    // 1. Fetch dashboard stats
    authenticatedFetch('/api/student/dashboard')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error('Stats fetch err:', err));

    // 2. Fetch exams
    authenticatedFetch('/api/exams')
      .then(res => res.ok ? res.json() : [])
      .then(data => setExams(data))
      .catch(err => console.error('Exams fetch err:', err));

    // 3. Fetch assignments
    authenticatedFetch('/api/student/assignments')
      .then(res => res.ok ? res.json() : [])
      .then(data => setAssignments(data))
      .catch(err => console.error('Assignments fetch err:', err));

    // 4. Fetch fees
    authenticatedFetch('/api/student/fees/summary')
      .then(res => res.ok ? res.json() : null)
      .then(data => setFeeSummary(data))
      .catch(err => console.error('Fees fetch err:', err))
      .finally(() => setLoading(false));
  }, []);

  // Simulating typing text welcoming the user
  useEffect(() => {
    if (!user?.name) return;
    const fullText = `We are delighted to support your academic progression in the CSE Department this semester.`;
    let idx = 0;
    const interval = setInterval(() => {
      setTypedText(prev => prev + fullText.charAt(idx));
      idx++;
      if (idx >= fullText.length - 1) {
        clearInterval(interval);
      }
    }, 40);
    return () => clearInterval(interval);
  }, [user]);

  // Confetti burst for 100% attendance or user triggers
  const triggerConfetti = () => {
    const particles = [];
    const colors = ['#34d399', '#10b981', '#6ee7b7', '#f59e0b', '#3b82f6', '#ec4899'];
    for (let i = 0; i < 60; i++) {
      particles.push({
        id: i,
        x: `${(Math.random() - 0.5) * 400}px`,
        y: `${-150 - Math.random() * 200}px`,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: `${Math.random() * 0.2}s`
      });
    }
    setConfetti(particles);
    setTimeout(() => setConfetti([]), 2000);
  };

  // Movable Widget Position Shifter
  const moveWidget = (direction, index) => {
    const newOrder = [...widgetOrder];
    if (direction === 'up' && index > 0) {
      const temp = newOrder[index];
      newOrder[index] = newOrder[index - 1];
      newOrder[index - 1] = temp;
    } else if (direction === 'down' && index < newOrder.length - 1) {
      const temp = newOrder[index];
      newOrder[index] = newOrder[index + 1];
      newOrder[index + 1] = temp;
    }
    setWidgetOrder(newOrder);
  };

  const toggleCollapse = (widgetId) => {
    setCollapsedWidgets(prev => ({
      ...prev,
      [widgetId]: !prev[widgetId]
    }));
  };

  // Simulated AI responses
  const [aiInput, setAiInput] = useState('');
  const [aiChat, setAiChat] = useState([
    { sender: 'ai', text: `Hi ${user?.name || 'Student'}! I am your AI Academic Assistant. Ask me about your attendance compliance, internal marks, or next exams!` }
  ]);
  const [aiTyping, setAiTyping] = useState(false);

  const handleAiSend = (e) => {
    e.preventDefault();
    if (!aiInput.trim()) return;

    const userText = aiInput;
    setAiChat(prev => [...prev, { sender: 'user', text: userText }]);
    setAiInput('');
    setAiTyping(true);

    setTimeout(() => {
      let reply = `I could not resolve that query. Try asking: "What is my SGPA?", "Check attendance" or "Next exam".`;
      const query = userText.toLowerCase();

      if (query.includes('attendance') || query.includes('compliance')) {
        reply = `Grace, your average attendance is currently ${stats?.attendancePercentage || '90'}%. You have logged ${stats?.attendancePercentage >= 75 ? 'sufficient' : 'insufficient'} sessions to take the end-semester examinations.`;
      } else if (query.includes('gpa') || query.includes('cgpa') || query.includes('marks')) {
        reply = `Your current CGPA is outstandingly registered at ${stats?.cgpa || '9.00'}! You have cleared all units from Semester 3.`;
      } else if (query.includes('exam') || query.includes('schedule') || query.includes('next')) {
        reply = `Your next exam is "${stats?.nextExam || 'OS Exam tomorrow at 14:00'}" located in Hall "${stats?.nextExam ? 'LH 301' : 'LH 302'}". Make sure to carry your student ID card.`;
      } else if (query.includes('fee') || query.includes('payment')) {
        reply = `Your Tuition Fees have been successfully paid! However, you have Exam Fees due soon. Make sure to complete payment under the Financial Statements page.`;
      }

      setAiChat(prev => [...prev, { sender: 'ai', text: reply }]);
      setAiTyping(false);
    }, 850);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="skeleton-box" style={{ height: '180px', width: '100%' }} />
        <div className="dashboard-grid">
          <div className="skeleton-box" style={{ height: '90px' }} />
          <div className="skeleton-box" style={{ height: '90px' }} />
          <div className="skeleton-box" style={{ height: '90px' }} />
        </div>
      </div>
    );
  }

  // Render Widget Based on ID
  const renderWidget = (widgetId, idx) => {
    const isCollapsed = collapsedWidgets[widgetId];

    const widgetControls = (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button 
          onClick={() => toggleCollapse(widgetId)} 
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          title={isCollapsed ? "Expand" : "Collapse"}
        >
          {isCollapsed ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
        </button>
        <button 
          onClick={() => moveWidget('up', idx)} 
          disabled={idx === 0}
          style={{ background: 'none', border: 'none', color: idx === 0 ? 'rgba(0,0,0,0.1)' : 'var(--text-muted)', cursor: 'pointer' }}
        >
          <MoveUp size={14} />
        </button>
        <button 
          onClick={() => moveWidget('down', idx)} 
          disabled={idx === widgetOrder.length - 1}
          style={{ background: 'none', border: 'none', color: idx === widgetOrder.length - 1 ? 'rgba(0,0,0,0.1)' : 'var(--text-muted)', cursor: 'pointer' }}
        >
          <MoveDown size={14} />
        </button>
      </div>
    );

    if (widgetId === 'schedule') {
      return (
        <div className="glass-card widget-movable" key="schedule">
          <div className="widget-header">
            <h3><Calendar size={18} style={{ color: 'var(--primary)', verticalAlign: 'middle', marginRight: '8px' }} /> Upcoming Exam Alerts</h3>
            {widgetControls}
          </div>
          {!isCollapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'var(--primary-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <Clock size={32} style={{ color: 'var(--primary)' }} />
              <div>
                <div style={{ fontWeight: '700', fontSize: '15px' }}>Next Scheduled Exam</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginTop: '2px' }}>{stats?.nextExam || 'No upcoming examinations registered'}</div>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (widgetId === 'quickLinks') {
      return (
        <div className="glass-card widget-movable" key="quickLinks">
          <div className="widget-header">
            <h3><BookOpen size={18} style={{ color: 'var(--primary)', verticalAlign: 'middle', marginRight: '8px' }} /> Quick Access Commands</h3>
            {widgetControls}
          </div>
          {!isCollapsed && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Link to="/student/fees" className="btn btn-secondary" style={{ padding: '12px', fontSize: '13px' }}>Financial Ledger</Link>
              <Link to="/student/marks" className="btn btn-secondary" style={{ padding: '12px', fontSize: '13px' }}>Marks Summary</Link>
              <Link to="/student/attendance" className="btn btn-secondary" style={{ padding: '12px', fontSize: '13px' }}>Check Attendance</Link>
              <Link to="/student/assignments" className="btn btn-secondary" style={{ padding: '12px', fontSize: '13px' }}>Lab Submissions</Link>
            </div>
          )}
        </div>
      );
    }

    if (widgetId === 'calendar') {
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const firstDay = new Date(currentYear, currentMonth, 1).getDay();
      
      const prevMonth = () => {
        if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
        else setCurrentMonth(currentMonth - 1);
      };
      const nextMonth = () => {
        if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
        else setCurrentMonth(currentMonth + 1);
      };

      // Gather events
      const allEvents = [];
      exams.forEach(ex => {
        if (ex.examDate) allEvents.push({ id: `ex-${ex.id}`, date: ex.examDate, title: `📝 ${ex.subject.code} Exam`, color: 'var(--primary)', details: `Time: ${ex.examTime.substring(0,5)} | Hall: ${ex.hallNumber}` });
      });
      assignments.forEach(as => {
        if (as.dueDate) allEvents.push({ id: `as-${as.id}`, date: as.dueDate, title: `📚 ${as.title}`, color: 'var(--success)', details: `Max Marks: ${as.maxMarks}` });
      });
      if (feeSummary && feeSummary.pendingFees) {
        feeSummary.pendingFees.forEach(fee => {
          if (fee.dueDate) allEvents.push({ id: `fee-${fee.feeId}`, date: fee.dueDate, title: `💰 ${fee.feeType} Due`, color: 'var(--warning)', details: `Remaining: INR ${fee.remaining}` });
        });
      }

      const gridCells = [];
      for (let i = 0; i < firstDay; i++) {
        gridCells.push(<span key={`empty-${i}`} className="calendar-day-cell" style={{ visibility: 'hidden' }}></span>);
      }
      for (let day = 1; day <= daysInMonth; day++) {
        const dayStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayEvents = allEvents.filter(e => e.date === dayStr);
        const isToday = dayStr === new Date().toLocaleDateString('en-CA');
        
        gridCells.push(
          <span 
            key={day} 
            className={`calendar-day-cell ${isToday ? 'calendar-day-today' : ''}`}
            onClick={() => setSelectedDayEvents({ date: dayStr, events: dayEvents })}
          >
            <div style={{ textAlign: 'right', marginBottom: '2px' }}>
              {day} {isToday && <span style={{ fontSize: '8px', fontWeight: 'bold' }}>TODAY</span>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
              {dayEvents.slice(0, 2).map(evt => (
                <div key={evt.id} style={{
                  background: evt.color === 'var(--primary)' ? 'rgba(99, 102, 241, 0.1)' : evt.color === 'var(--success)' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                  color: evt.color, borderLeft: `2px solid ${evt.color}`, fontSize: '9px', padding: '1px 3px',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', borderRadius: '2px', fontWeight: '700', textAlign: 'left'
                }}>
                  {evt.title}
                </div>
              ))}
              {dayEvents.length > 2 && (
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', textAlign: 'left', fontWeight: '600' }}>+{dayEvents.length - 2} more</div>
              )}
            </div>
          </span>
        );
      }

      return (
        <div className="glass-card widget-movable" key="calendar">
          <div className="widget-header">
            <h3><Calendar size={18} style={{ color: 'var(--primary)', verticalAlign: 'middle', marginRight: '8px' }} /> Academic Calendar</h3>
            {widgetControls}
          </div>
          {!isCollapsed && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <button className="btn btn-secondary btn-sm" onClick={prevMonth} style={{ padding: '4px 8px' }}><ChevronLeft size={16} /></button>
                <div style={{ fontWeight: '700', fontSize: '15px' }}>{monthNames[currentMonth]} {currentYear}</div>
                <button className="btn btn-secondary btn-sm" onClick={nextMonth} style={{ padding: '4px 8px' }}><ChevronRight size={16} /></button>
              </div>
              <div className="calendar-grid">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => <span key={i} className="calendar-day-header">{day}</span>)}
                {gridCells}
              </div>
              
              {/* Event Details Modal */}
              {selectedDayEvents && selectedDayEvents.events.length > 0 && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <div className="glass-card" style={{ width: '360px', padding: '24px', position: 'relative' }}>
                    <button className="theme-toggle-btn" style={{ position: 'absolute', top: '16px', right: '16px' }} onClick={() => setSelectedDayEvents(null)}>
                      <XCircle size={20} />
                    </button>
                    <h3 style={{ marginBottom: '16px' }}>Events on {selectedDayEvents.date}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {selectedDayEvents.events.map(evt => (
                        <div key={evt.id} style={{ padding: '12px', background: 'var(--bg-muted)', borderRadius: 'var(--radius-sm)', borderLeft: `4px solid ${evt.color}` }}>
                          <div style={{ fontWeight: '700', color: evt.color, marginBottom: '4px' }}>{evt.title}</div>
                          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{evt.details}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    if (widgetId === 'aiAssistant') {
      return (
        <div className="glass-card widget-movable" key="aiAssistant" style={{ gridColumn: 'span 2' }}>
          <div className="widget-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} style={{ color: 'var(--primary)' }} /> 
              AI Academic Assistant
            </h3>
            {widgetControls}
          </div>
          {!isCollapsed && (
            <div className="ai-assistant-container">
              <div className="ai-chat-history">
                {aiChat.map((msg, i) => (
                  <div key={i} className={`ai-msg ${msg.sender === 'ai' ? 'ai-msg-system' : 'ai-msg-user'}`}>
                    {msg.text}
                  </div>
                ))}
                {aiTyping && (
                  <div className="ai-msg ai-msg-system" style={{ fontStyle: 'italic' }}>
                    Thinking of answers...
                  </div>
                )}
              </div>
              <form onSubmit={handleAiSend} style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Ask me: 'Check attendance rate' or 'When is my next exam?'" 
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                />
                <button type="submit" className="btn btn-primary" style={{ padding: '0 16px', minWidth: '48px', minHeight: '44px' }}>
                  <Send size={16} />
                </button>
              </form>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div style={{ position: 'relative' }}>
      
      {/* Dynamic Confetti Burst overlay */}
      {confetti.map(p => (
        <div 
          key={p.id} 
          className="confetti-particle" 
          style={{ 
            left: '50%', 
            top: '30%', 
            backgroundColor: p.color,
            animationDelay: p.delay,
            '--x': p.x, 
            '--y': p.y 
          }} 
        />
      ))}

      {/* Auto Scrolling News Announcements Ticker */}
      <div className="ticker-wrap">
        <span className="ticker-title">Announcements</span>
        <div className="ticker-content">
          <div className="ticker-scroll">
            🚀 The results for CSE Semester 3 exams are now officially published. SGPA metrics uploaded! | 📚 Registration window is open for Special Term and Arrear examinations. | 📅 Grace, check your calendar: Next DBMS CAT2 exam is on July 2nd.
          </div>
        </div>
      </div>

      {/* Premium Aurora Welcome Banner */}
      <div className="aurora-container">
        <div className="aurora-bg">
          <div className="aurora-blob aurora-blob-1" />
          <div className="aurora-blob aurora-blob-2" />
        </div>
        <div className="welcome-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--primary)', fontWeight: '700', fontSize: '13px', textTransform: 'uppercase', marginBottom: '8px' }}>
            <Sparkles size={16} />
            <span>Academic Performance cockpit</span>
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px' }}>Welcome Back, {user?.name}!</h2>
          <p className="typing-text" style={{ fontSize: '15px', color: 'var(--text-secondary)', minHeight: '40px', fontWeight: '500' }}>
            {typedText}
          </p>
        </div>
      </div>

      {/* Quick Statistics with custom visual rings and bars */}
      <div className="dashboard-grid" style={{ marginBottom: '32px' }}>
        
        {/* Attendance card with Circular Progress Gauge */}
        <div className="glass-card stat-card" onClick={triggerConfetti} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="stat-number">{stats?.attendancePercentage}%</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>Attendance Rate</div>
            <div style={{ color: 'var(--success)', fontSize: '12px', marginTop: '4px', fontWeight: '600' }}>✓ Compliance Status: OK</div>
          </div>
          <div>
            <svg className="circular-progress-svg">
              <circle className="circular-progress-bg" cx="60" cy="60" r="45" />
              <circle 
                className="circular-progress-bar" 
                cx="60" 
                cy="60" 
                r="45" 
                style={{ strokeDashoffset: 283 - (283 * (stats?.attendancePercentage || 90)) / 100 }} 
              />
            </svg>
          </div>
        </div>

        {/* CGPA Card with custom SVG GPA Area line chart */}
        <div className="glass-card stat-card" onClick={triggerConfetti} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="stat-number">{stats?.cgpa}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>Current CGPA</div>
            </div>
            <span className="badge badge-success">Top 5%</span>
          </div>
          <div style={{ height: '60px', marginTop: '8px' }}>
            <svg className="sparkline-svg" viewBox="0 0 100 40" preserveAspectRatio="none">
              <defs>
                <linearGradient id="gpaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Semester 1 (8.5) -> Sem 2 (8.7) -> Sem 3 (9.0) */}
              <path className="sparkline-fill" d="M 0 40 L 0 25 L 50 20 L 100 10 L 100 40 Z" />
              <path className="sparkline-line" d="M 0 25 L 50 20 L 100 10" />
            </svg>
          </div>
        </div>

        {/* Assignments Metric */}
        <div className="glass-card stat-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="stat-number">{stats?.pendingAssignmentsCount}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>Pending Assignments</div>
            <div style={{ color: 'var(--warning)', fontSize: '12px', marginTop: '4px', fontWeight: '600' }}>⚠ Submission pending this week</div>
          </div>
          <div className="stat-icon stat-icon-success">
            <BookOpen size={24} />
          </div>
        </div>

      </div>

      {/* Movable/Collapsible Widget Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
        {widgetOrder.map((wId, idx) => renderWidget(wId, idx))}
      </div>

    </div>
  );
};

// 2. Fees Page (financial statements, invoices, receipts downloads)
const FeesPage = () => {
  const { authenticatedFetch } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payModal, setPayModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState('ONLINE');
  const [txRef, setTxRef] = useState('');
  const [payingState, setPayingState] = useState(false);

  const fetchSummary = () => {
    authenticatedFetch('/api/student/fees/summary')
      .then(res => res.json())
      .then(data => {
        setSummary(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const openPay = (fee) => {
    setSelectedFee(fee);
    setPayAmount(fee.remaining);
    setPayModal(true);
  };

  const handlePay = async (e) => {
    e.preventDefault();
    setPayingState(true);
    try {
      const response = await authenticatedFetch('/api/student/fees/pay', {
        method: 'POST',
        body: JSON.stringify({
          feeStructureId: selectedFee.feeId,
          amount: payAmount,
          paymentMode: payMode,
          transactionRef: txRef || 'TXN' + Date.now()
        })
      });
      if (response.ok) {
        setPayModal(false);
        fetchSummary();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPayingState(false);
    }
  };

  if (loading) return <div className="skeleton-box" style={{ height: '300px' }} />;

  return (
    <>
      <div className="glass-card">
        <h2 style={{ marginBottom: '24px' }}>Financial Invoices & Ledger</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '32px' }}>
          <div style={{ padding: '20px', background: 'var(--bg-muted)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Total Cost Invoiced</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>INR {summary?.totalDue}</div>
          </div>
          <div style={{ padding: '20px', background: 'var(--success-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--success)' }}>Total Amount Settled</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--success)', marginTop: '4px' }}>INR {summary?.totalPaid}</div>
          </div>
          <div style={{ padding: '20px', background: 'var(--warning-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--warning)' }}>Total Fees Outstanding</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--warning)', marginTop: '4px' }}>INR {summary?.totalPending}</div>
          </div>
        </div>

        <h3 style={{ marginBottom: '16px' }}>Outstanding Invoices</h3>
        {summary?.pendingFees?.length === 0 ? (
          <div style={{ padding: '20px', color: 'var(--text-secondary)', background: 'var(--primary-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={18} style={{ color: 'var(--primary)' }} /> No outstanding invoices. Account fully settled.
          </div>
        ) : (
          <div className="table-container" style={{ marginBottom: '32px' }}>
            <table className="portal-table">
              <thead>
                <tr>
                  <th>Fee Particular</th>
                  <th>Amount</th>
                  <th>Amount Paid</th>
                  <th>Remaining Balance</th>
                  <th>Due Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {summary?.pendingFees?.map((fee) => (
                  <tr key={fee.feeId}>
                    <td style={{ fontWeight: '700' }}>{fee.feeType}</td>
                    <td>INR {fee.amount}</td>
                    <td>INR {fee.amountPaid}</td>
                    <td style={{ color: 'var(--warning)', fontWeight: '700' }}>INR {fee.remaining}</td>
                    <td>{fee.dueDate}</td>
                    <td>
                      <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '12px', minHeight: '32px' }} onClick={() => openPay(fee)}>Pay Now</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <h3 style={{ marginBottom: '16px' }}>Settled Payments & Receipts</h3>
        <div className="table-container">
          <table className="portal-table">
            <thead>
              <tr>
                <th>Particular</th>
                <th>Settled Cost</th>
                <th>Receipt Date</th>
                <th>Receipt Reference</th>
                <th>Official Receipt</th>
              </tr>
            </thead>
            <tbody>
              {summary?.paidFees?.map((fee) => (
                <tr key={fee.feeId}>
                  <td style={{ fontWeight: '700' }}>{fee.feeType}</td>
                  <td style={{ color: 'var(--primary)', fontWeight: '700' }}>INR {fee.amountPaid}</td>
                  <td>{fee.paymentDate}</td>
                  <td>{fee.receiptNumber}</td>
                  <td>
                    <a
                      href={fee.receiptUrl}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '12px', minHeight: '32px', display: 'inline-flex', gap: '6px' }}
                      download
                    >
                      <Download size={14} /> Download Receipt
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {payModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', zIndex: 100, justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
          <div className="glass-card" style={{ width: '420px', background: 'var(--bg-surface-solid)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="widget-header">
              <h3 style={{ fontSize: '18px' }}>Execute Fee Payment</h3>
              <button onClick={() => setPayModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><XCircle size={18} /></button>
            </div>
            <form onSubmit={handlePay}>
              <div className="form-group">
                <label className="form-label">Particular</label>
                <input type="text" className="form-control" value={selectedFee?.feeType} disabled />
              </div>
              <div className="form-group">
                <label className="form-label">Payment Amount (INR)</label>
                <input type="number" className="form-control" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Payment Mode</label>
                <CustomSelect
                  value={payMode}
                  onChange={(e) => setPayMode(e.target.value)}
                  options={[
                    { value: 'ONLINE', label: 'ONLINE / UPI GATEWAY' },
                    { value: 'CASH', label: 'CASH ENCOUNTER' },
                    { value: 'DD', label: 'DEMAND DRAFT' }
                  ]}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Transaction Reference Code (Optional)</label>
                <input type="text" className="form-control" placeholder="TXNXXXXXXXX" value={txRef} onChange={(e) => setTxRef(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" className="btn btn-primary" style={{ flexGrow: 1 }} disabled={payingState}>
                  {payingState ? 'Processing...' : 'Settle Payment'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setPayModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

// 3. Marks & CGPA Page (Internal Assessments and GPA charts)
const MarksPage = () => {
  const { authenticatedFetch } = useAuth();
  const [internalMarks, setInternalMarks] = useState([]);
  const [gpaData, setGpaData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      authenticatedFetch('/api/student/marks/internal').then(res => res.json()),
      authenticatedFetch('/api/student/marks/gpa').then(res => res.json())
    ]).then(([marks, gpa]) => {
      setInternalMarks(marks);
      setGpaData(gpa);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="skeleton-box" style={{ height: '320px' }} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      <div className="glass-card">
        <h2 style={{ marginBottom: '24px' }}>GPA Progression & CGPA Dashboard</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', alignItems: 'center' }}>
          
          {/* Custom CSS Bar Chart */}
          <div style={{ flexGrow: 1, minWidth: '300px' }}>
            <h3 style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Semester-wise GPA</h3>
            <div className="custom-chart-bar-container">
              {gpaData?.semesters?.map((sem) => (
                <div className="custom-chart-bar-col" key={sem.id}>
                  <div 
                    className="custom-chart-bar" 
                    style={{ height: `${(Number(sem.sgpa || 0) / 10.0) * 100}%` }}
                    data-value={typeof sem.sgpa === 'number' ? sem.sgpa.toFixed(2) : (sem.sgpa ? Number(sem.sgpa).toFixed(2) : '0.00')}
                  ></div>
                  <div className="custom-chart-label">Semester {sem.semester}</div>
                </div>
              ))}
            </div>
          </div>
          
          {/* CGPA display */}
          <div style={{ padding: '32px', background: 'var(--primary-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', textAlign: 'center', width: '240px' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px' }}>Accumulated CGPA</div>
            <div style={{ fontSize: '64px', fontWeight: '800', color: 'var(--primary)', lineHeight: 1 }}>
              {typeof gpaData?.overallCgpa === 'number' 
                ? gpaData.overallCgpa.toFixed(2) 
                : (gpaData?.overallCgpa ? Number(gpaData.overallCgpa).toFixed(2) : '0.00')}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px', fontWeight: '500' }}>Unified Grading Scale: 0.00 - 10.00</div>
          </div>
        </div>
      </div>

      <div className="glass-card">
        <h2>Continuous Internal Assessment Grades</h2>
        <div className="table-container">
          <table className="portal-table">
            <thead>
              <tr>
                <th>Subject Name</th>
                <th>Subject Code</th>
                <th>Assessment Grade Type</th>
                <th>Max Marks</th>
                <th>Scored Marks</th>
              </tr>
            </thead>
            <tbody>
              {internalMarks.map((m) => (
                <tr key={m.id}>
                  <td style={{ fontWeight: '700' }}>{m.subject.name}</td>
                  <td>{m.subject.code}</td>
                  <td>{m.assessmentType}</td>
                  <td>{m.maxMarks}</td>
                  <td style={{ fontWeight: '800', color: 'var(--primary)' }}>{m.scoredMarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// 4. Results Page
const ResultPage = () => {
  const { authenticatedFetch } = useAuth();
  const [results, setResults] = useState([]);
  const [gpaData, setGpaData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      authenticatedFetch('/api/student/results').then(res => res.json()),
      authenticatedFetch('/api/student/marks/gpa').then(res => res.json())
    ]).then(([resData, gpa]) => {
      setResults(resData);
      setGpaData(gpa);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="skeleton-box" style={{ height: '320px' }} />;

  const resultsBySemester = {};
  results.forEach(r => {
    const sem = r.semester;
    if (!resultsBySemester[sem]) {
      resultsBySemester[sem] = [];
    }
    resultsBySemester[sem].push(r);
  });

  const semestersList = Object.keys(resultsBySemester).sort((a, b) => b - a);

  const handlePrint = (sem) => {
    const semResults = resultsBySemester[sem];
    const semGpaRaw = gpaData?.semesters?.find(s => s.semester === parseInt(sem))?.sgpa;
    const semGpa = semGpaRaw !== undefined && semGpaRaw !== null ? Number(semGpaRaw).toFixed(2) : '0.00';
    const cgpaRaw = gpaData?.overallCgpa;
    const cgpa = cgpaRaw !== undefined && cgpaRaw !== null ? Number(cgpaRaw).toFixed(2) : '0.00';
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Semester ${sem} Marksheet</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; background: #fff; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #0f766e; padding-bottom: 20px; }
            .header h1 { margin: 0; font-size: 26px; color: #0f766e; letter-spacing: -0.03em; }
            .header p { margin: 5px 0 0; color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.1em; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; }
            .info-item { font-size: 14px; }
            .info-item strong { color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th, td { border: 1px solid #e2e8f0; padding: 14px; text-align: left; }
            th { background-color: #f8fafc; font-weight: 700; color: #64748b; font-size: 11px; text-transform: uppercase; }
            .footer { display: flex; justify-content: space-between; margin-top: 50px; font-size: 14px; border-top: 1px solid #e2e8f0; padding-top: 20px; color: #64748b; }
            .gpa-box { display: flex; gap: 30px; background: #f0fdf4; padding: 15px; border-radius: 8px; border: 1px solid #bbf7d0; margin-bottom: 30px; font-weight: 700; color: #166534; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ACADEMIC PORTAL</h1>
            <p>OFFICIAL SEMESTER MARKSHEET</p>
          </div>
          
          <div class="info-grid">
            <div class="info-item"><strong>Student Name:</strong> ${semResults[0]?.studentName || semResults[0]?.student?.name || 'Student'}</div>
            <div class="info-item"><strong>Register Number:</strong> ${semResults[0]?.studentRegisterNumber || semResults[0]?.student?.registerNumber || '-'}</div>
            <div class="info-item"><strong>Semester:</strong> Semester ${sem}</div>
            <div class="info-item"><strong>Department:</strong> ${semResults[0]?.studentDepartmentName || semResults[0]?.student?.department?.name || 'N/A'}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Subject Code</th>
                <th>Subject Name</th>
                <th>Credits</th>
                <th>Grade</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${semResults.map(r => `
                <tr>
                  <td><strong>${r.subject?.code || r.subjectCode}</strong></td>
                  <td>${r.subject?.name || r.subjectName}</td>
                  <td>${r.credits}</td>
                  <td style="font-weight: bold; color: #0f766e;">${r.grade}</td>
                  <td><span style="color: ${r.resultStatus === 'PASS' ? '#166534' : '#991b1b'}; font-weight: 700;">${r.resultStatus}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="gpa-box">
            <div>SEMESTER SGPA: <span>${semGpa}</span></div>
            <div>OVERALL CGPA: <span>${cgpa}</span></div>
          </div>

          <div class="footer">
            <div>Date of Issue: ${new Date().toLocaleDateString()}</div>
            <div>Controller of Examinations</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {semestersList.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px', color: 'var(--text-secondary)', textAlign: 'center' }}>
          <AlertCircle size={32} style={{ color: 'var(--warning)', marginBottom: '12px' }} />
          <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>No Published Results Found</div>
          <p style={{ fontSize: '14px', marginTop: '6px' }}>Your marks are currently undergoing controller registration audits.</p>
        </div>
      ) : (
        semestersList.map((sem) => {
          const semResults = resultsBySemester[sem];
          const semGpa = gpaData?.semesters?.find(s => s.semester === parseInt(sem))?.sgpa || '0.00';
          const cgpa = gpaData?.overallCgpa || '0.00';

          return (
            <div className="glass-card" key={sem}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ margin: 0 }}>Semester {sem} Results</h2>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>
                    <span>SGPA: <strong style={{ color: 'var(--primary)' }}>{semGpa}</strong></span>
                    <span>CGPA: <strong style={{ color: 'var(--primary)' }}>{cgpa}</strong></span>
                  </div>
                </div>
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', minHeight: '36px' }}
                  onClick={() => handlePrint(sem)}
                >
                  <Download size={16} /> Download Marksheet
                </button>
              </div>

              <div className="table-container">
                <table className="portal-table">
                  <thead>
                    <tr>
                      <th>Subject Code</th>
                      <th>Subject Name</th>
                      <th>Credits</th>
                      <th>Grade Letter</th>
                      <th>Grade Points</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {semResults.map((r) => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: '700' }}>{r.subject?.code || r.subjectCode}</td>
                        <td>{r.subject?.name || r.subjectName}</td>
                        <td>{r.credits}</td>
                        <td style={{ fontWeight: '800', color: 'var(--primary)' }}>{r.grade}</td>
                        <td>{r.gradePoint}</td>
                        <td>
                          <span className={`badge ${r.resultStatus === 'PASS' ? 'badge-success' : 'badge-danger'}`}>
                            {r.resultStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

// 5. Attendance Page (with compliance visual indicator bars)
const AttendancePage = () => {
  const { authenticatedFetch } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authenticatedFetch('/api/student/attendance')
      .then(res => res.json())
      .then(data => {
        setRecords(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="skeleton-box" style={{ height: '320px' }} />;

  const grouped = {};
  records.forEach(r => {
    const key = r.subject.code;
    if (!grouped[key]) {
      grouped[key] = {
        subject: r.subject.name,
        code: r.subject.code,
        present: 0,
        absent: 0,
        od: 0,
        medical: 0,
        logs: []
      };
    }
    grouped[key].logs.push(r);
    if (r.status === 'PRESENT') grouped[key].present++;
    else if (r.status === 'ABSENT') grouped[key].absent++;
    else if (r.status === 'OD') grouped[key].od++;
    else if (r.status === 'MEDICAL') grouped[key].medical++;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="glass-card">
        <h2 style={{ marginBottom: '24px' }}>Subject-wise Attendance Progress</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {Object.values(grouped).map(sub => {
            const total = sub.present + sub.absent + sub.od + sub.medical;
            const rate = total > 0 ? ((sub.present + sub.od) * 100 / total).toFixed(1) : '100.0';
            const rateVal = parseFloat(rate);
            
            return (
              <div key={sub.code} style={{ padding: '20px', background: 'var(--bg-muted)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div>
                    <span style={{ fontWeight: '700', fontSize: '15px' }}>{sub.subject}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '12px', fontWeight: '600' }}>{sub.code}</span>
                  </div>
                  <div style={{ fontWeight: '800', color: rateVal >= 75 ? 'var(--success)' : 'var(--danger)' }}>{rate}%</div>
                </div>
                <div style={{ height: '8px', background: 'rgba(0,0,0,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${rate}%`, background: rateVal >= 75 ? 'var(--primary)' : 'var(--danger)', borderRadius: '4px' }}></div>
                </div>
                <div style={{ display: 'flex', gap: '20px', marginTop: '14px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <div>Present: <span style={{ color: 'var(--success)', fontWeight: '700' }}>{sub.present}</span></div>
                  <div>Absent: <span style={{ color: 'var(--danger)', fontWeight: '700' }}>{sub.absent}</span></div>
                  <div>On Duty (OD): <span style={{ color: 'var(--primary)', fontWeight: '700' }}>{sub.od}</span></div>
                  <div>Medical: <span style={{ color: 'var(--warning)', fontWeight: '700' }}>{sub.medical}</span></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass-card">
        <h2>Daily Check-in Verification History</h2>
        <div className="table-container">
          <table className="portal-table">
            <thead>
              <tr>
                <th>Class Date</th>
                <th>Subject Code</th>
                <th>Subject Name</th>
                <th>Verification Status</th>
                <th>Authorized Instructor</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id}>
                  <td>{r.classDate}</td>
                  <td>{r.subject.code}</td>
                  <td style={{ fontWeight: '700' }}>{r.subject.name}</td>
                  <td>
                    <span className={`badge ${r.status === 'PRESENT' ? 'badge-success' : r.status === 'ABSENT' ? 'badge-danger' : r.status === 'OD' ? 'badge-success' : 'badge-warning'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td>{r.markedBy.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// 6. Assignment Page
const AssignmentPage = () => {
  const { authenticatedFetch } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitModal, setSubmitModal] = useState(false);
  const [selectedAsg, setSelectedAsg] = useState(null);
  const [fileUrl, setFileUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAsg = () => {
    authenticatedFetch('/api/student/assignments')
      .then(res => res.json())
      .then(data => {
        setAssignments(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAsg();
  }, []);

  const openSubmit = (asg) => {
    setSelectedAsg(asg);
    setFileUrl('');
    setSubmitModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await authenticatedFetch('/api/student/assignments/submit', {
        method: 'POST',
        body: JSON.stringify({
          assignmentId: selectedAsg.id,
          fileUrl: fileUrl
        })
      });
      if (response.ok) {
        setSubmitModal(false);
        fetchAsg();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="skeleton-box" style={{ height: '320px' }} />;

  return (
    <>
      <div className="glass-card">
        <h2 style={{ marginBottom: '24px' }}>Course Assignments & Labs</h2>
        <div className="table-container">
          <table className="portal-table">
            <thead>
              <tr>
                <th>Title / Specifications</th>
                <th>Subject Name</th>
                <th>Due Date</th>
                <th>Max Marks</th>
                <th>Submission Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((asg) => (
                <tr key={asg.id}>
                  <td style={{ fontWeight: '700' }}>
                    <div>{asg.title}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '400', marginTop: '2px' }}>{asg.description}</div>
                  </td>
                  <td>{asg.subject.name}</td>
                  <td style={{ color: 'var(--danger)', fontWeight: '700' }}>{asg.dueDate}</td>
                  <td>{asg.maxMarks}</td>
                  <td>No submission registered</td>
                  <td>
                    <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '12px', minHeight: '32px' }} onClick={() => openSubmit(asg)}>Upload File</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {submitModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', zIndex: 100, justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
          <div className="glass-card" style={{ width: '420px', background: 'var(--bg-surface-solid)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="widget-header">
              <h3>Upload Assignment Report</h3>
              <button onClick={() => setSubmitModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><XCircle size={18} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Specification Name</label>
                <input type="text" className="form-control" value={selectedAsg?.title} disabled />
              </div>
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Submission Drive Link / Code URL</label>
                <input type="url" className="form-control" placeholder="https://github.com/... or Google Drive Link" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" className="btn btn-primary" style={{ flexGrow: 1 }} disabled={submitting}>
                  {submitting ? 'Delivering...' : 'Deliver Submission'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setSubmitModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

// 7. Exam Schedule Page
const ExamSchedulePage = () => {
  const { authenticatedFetch } = useAuth();
  const [schedule, setSchedule] = useState([]);
  const [arrears, setArrears] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      authenticatedFetch('/api/student/exams/schedule').then(res => res.json()),
      authenticatedFetch('/api/student/exams/arrears').then(res => res.json())
    ]).then(([sched, arr]) => {
      setSchedule(sched);
      setArrears(arr);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="skeleton-box" style={{ height: '320px' }} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="glass-card">
        <h2 style={{ marginBottom: '24px' }}>Semester Term Exam schedules</h2>
        <div className="table-container">
          <table className="portal-table">
            <thead>
              <tr>
                <th>Subject Code</th>
                <th>Subject Name</th>
                <th>Category</th>
                <th>Exam Date</th>
                <th>Reporting Time</th>
                <th>Hall Code</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: '700' }}>{s.subject.code}</td>
                  <td>{s.subject.name}</td>
                  <td>{s.examType}</td>
                  <td style={{ fontWeight: '600' }}>{s.examDate}</td>
                  <td>{formatTime12Hour(s.examTime)}</td>
                  <td><span className="badge badge-neutral" style={{ border: '1px solid var(--border)' }}>{s.hallNumber}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-card">
        <h2 style={{ marginBottom: '24px' }}>Arrear Exam Registrations</h2>
        {arrears.length === 0 ? (
          <div style={{ padding: '20px', background: 'var(--primary-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={18} style={{ color: 'var(--primary)' }} /> Zero outstanding arrear papers. Clean registration profile!
          </div>
        ) : (
          <div className="table-container">
            <table className="portal-table">
              <thead>
                <tr>
                  <th>Subject Code</th>
                  <th>Subject Name</th>
                  <th>Original Term</th>
                  <th>Exam Date Scheduled</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {arrears.map((a) => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: '700' }}>{a.subject.code}</td>
                    <td>{a.subject.name}</td>
                    <td>Semester {a.originalSemester}</td>
                    <td>{a.arrearExamDate || 'TBD'}</td>
                    <td>
                      <span className={`badge ${a.status === 'CLEARED' ? 'badge-success' : 'badge-danger'}`}>
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// 8. Documents Page
const DocumentsPage = () => {
  const { authenticatedFetch } = useAuth();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authenticatedFetch('/api/student/documents')
      .then(res => res.json())
      .then(data => {
        setDocs(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="skeleton-box" style={{ height: '320px' }} />;

  return (
    <div className="glass-card">
      <h2 style={{ marginBottom: '24px' }}>Officially Uploaded Transcripts & Files</h2>
      <div className="table-container">
        <table className="portal-table">
          <thead>
            <tr>
              <th>Document Classification</th>
              <th>Semester Context</th>
              <th>Registration Timestamp</th>
              <th>Authorized Download</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((doc) => (
              <tr key={doc.id}>
                <td style={{ fontWeight: '700' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={16} style={{ color: 'var(--primary)' }} />
                    <span>{doc.docType}</span>
                  </div>
                </td>
                <td>{doc.semester ? 'Semester ' + doc.semester : 'Global Account'}</td>
                <td>{doc.uploadedAt}</td>
                <td>
                  <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '12px', minHeight: '32px', display: 'inline-flex', gap: '6px' }}>
                    <Download size={14} /> Download Document
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// 9. Notifications Page
const NotificationsPage = () => {
  const { authenticatedFetch } = useAuth();
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = () => {
    authenticatedFetch('/api/notifications')
      .then(res => res.json())
      .then(data => {
        setNotifs(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const markAsRead = async (id) => {
    try {
      const response = await authenticatedFetch(`/api/notifications/${id}/read`, {
        method: 'POST'
      });
      if (response.ok) {
        fetchNotifs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="skeleton-box" style={{ height: '320px' }} />;

  return (
    <div className="glass-card">
      <h2 style={{ marginBottom: '24px' }}>Announcements & Notifications Inbox</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {notifs.map((n) => (
          <div 
            key={n.id} 
            style={{ 
              padding: '20px', 
              background: n.isRead ? 'var(--bg-muted)' : 'var(--primary-surface)', 
              border: n.isRead ? '1px solid var(--border)' : '1px solid var(--primary)', 
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              transition: 'var(--transition-fast)'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className={`badge ${n.type === 'FEE' ? 'badge-warning' : n.type === 'EXAM' ? 'badge-danger' : 'badge-success'}`}>{n.type}</span>
                <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{n.title}</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '6px' }}>{n.message}</p>
            </div>
            
            {!n.isRead && (
              <button 
                className="btn btn-secondary btn-sm" 
                style={{ display: 'inline-flex', gap: '4px', minHeight: '32px' }} 
                onClick={() => markAsRead(n.id)}
              >
                <Check size={14} /> Mark Read
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Route Switcher Export
const StudentRoutes = () => {
  return (
    <StudentLayout>
      <Routes>
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="fees" element={<FeesPage />} />
        <Route path="marks" element={<MarksPage />} />
        <Route path="results" element={<ResultPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="assignments" element={<AssignmentPage />} />
        <Route path="exams" element={<ExamScheduleManager />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Routes>
    </StudentLayout>
  );
};

export default StudentRoutes;
