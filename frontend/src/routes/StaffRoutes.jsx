import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Profile from '../pages/Profile';
import ExamScheduleManager from '../pages/ExamScheduleManager';
import MarkImportPage from '../pages/MarkImportPage';
import { 
  Users, CheckSquare, Award, BookOpen, Calendar, HelpCircle, Save, 
  PlusCircle, Eye, EyeOff, Sparkles, Clock, ChevronRight, ChevronLeft, CheckCircle2, ArrowLeft,
  Plus, Trash2, Edit2, Check, MessageSquare, MapPin, MoreHorizontal, X, Search, Bell
} from 'lucide-react';
import CustomSelect from '../components/common/CustomSelect';
import TimeDropdownPicker from '../components/common/TimeDropdownPicker';

const COMMON_EVENTS = [
  { id: 'common-1', date: '2026-07-01', title: '🎓 Semester Orientation', color: 'var(--primary)', details: 'Welcome session for all students and faculty.' },
  { id: 'common-2', date: '2026-08-15', title: '🇮🇳 Holiday: Independence Day', color: 'var(--danger)', details: 'National holiday. Campus offices closed.' },
  { id: 'common-3', date: '2026-08-20', title: '🎵 Annual Cultural Festival', color: 'var(--accent)', details: 'Inter-departmental music, dance, and arts fest.' },
  { id: 'common-4', date: '2026-07-28', title: '💡 Tech Symposium 2026', color: 'var(--success)', details: 'Paper presentations and hackathon events.' }
];

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

const getCurrentTimeString = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const getTodayDateString = () => new Date().toLocaleDateString('en-CA');

const StaffLayout = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const showBackButton = !location.pathname.toLowerCase().endsWith('/dashboard');

  const getHeaderInfo = (pathname) => {
    const path = pathname.toLowerCase().replace(/\/$/, '');
    if (path.endsWith('/dashboard')) {
      return {
        title: 'Faculty Workspace',
        subtitle: `Welcome back, ${user?.name}! Here is your pedagogical dashboard.`
      };
    }
    if (path.endsWith('/profile')) {
      return {
        title: 'Faculty File Details',
        subtitle: 'View your staff profile record.'
      };
    }
    if (path.endsWith('/students')) {
      return {
        title: 'Class Student Roster',
        subtitle: 'Manage and register students assigned to your classes.'
      };
    }
    if (path.endsWith('/attendance')) {
      return {
        title: 'Mark Attendance Workspace',
        subtitle: 'Log and track student class attendance.'
      };
    }
    if (path.endsWith('/marks')) {
      return {
        title: 'Continuous Evaluation Tracker',
        subtitle: 'Upload and grade student internal tests and CAT exams.'
      };
    }
    if (path.endsWith('/import-marks')) {
      return {
        title: 'AI Mark Sheet Importer',
        subtitle: 'OCR and digital file processor for course marks entries.'
      };
    }
    if (path.endsWith('/assignments')) {
      return {
        title: 'Assignments Manager',
        subtitle: 'Post lab sheets, exercises, and deliverables briefs.'
      };
    }
    if (path.endsWith('/exams')) {
      return {
        title: 'Exam Coordinator Board',
        subtitle: 'Configure exam schedules, slots, and hall allocation.'
      };
    }
    return {
      title: 'Pedagogical Workspace',
      subtitle: `Authorized: Faculty Session`
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

// 1. Dashboard
// 1. Dashboard
const StaffDashboard = () => {
  const { user, authenticatedFetch } = useAuth();
  const [stats, setStats] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDayEvents, setSelectedDayEvents] = useState(null);

  // Custom private events state
  const [privateEvents, setPrivateEvents] = useState(() => {
    const saved = localStorage.getItem(`private_calendar_events_staff_${user?.id}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDetails, setNewEventDetails] = useState('');

  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`private_calendar_events_staff_${user.id}`, JSON.stringify(privateEvents));
    }
  }, [privateEvents, user]);

  const handleAddPrivateEvent = (date) => {
    if (!newEventTitle.trim()) return;
    const newEvt = {
      id: `pvt-${Date.now()}`,
      date: date,
      title: `📌 ${newEventTitle.trim()}`,
      color: 'var(--accent)',
      details: newEventDetails.trim() || 'Private event note',
      isPrivate: true
    };
    const updated = [...privateEvents, newEvt];
    setPrivateEvents(updated);
    setNewEventTitle('');
    setNewEventDetails('');
    
    if (selectedDayEvents) {
      setSelectedDayEvents(prev => ({
        ...prev,
        events: [...prev.events, newEvt]
      }));
    }
  };

  const handleDeletePrivateEvent = (eventId) => {
    const updated = privateEvents.filter(e => e.id !== eventId);
    setPrivateEvents(updated);
    if (selectedDayEvents) {
      setSelectedDayEvents(prev => ({
        ...prev,
        events: prev.events.filter(e => e.id !== eventId)
      }));
    }
  };
  const [loading, setLoading] = useState(true);

  // Tasks state
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem(`staff_tasks_${user?.id}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      { 
        id: 1, 
        title: 'Read poem & answer questions', 
        subject: 'English Literature', 
        dueDate: '2026-07-28', 
        status: 'inprogress',
        comments: [
          { id: 101, author: 'Grace Hopper', text: 'I completed the reading! Will submit the answers by tonight.', date: 'Jul 10, 11:30 AM' },
          { id: 102, author: 'Ada Lovelace', text: 'Could we get an extension on the questions? The poem is quite long.', date: 'Jul 11, 02:15 PM' }
        ]
      },
      { 
        id: 2, 
        title: 'Create a comic strip with a story', 
        subject: 'Social Studies', 
        dueDate: '2026-08-17', 
        status: 'todo',
        comments: [] 
      },
      { 
        id: 3, 
        title: 'Prepare for the math test', 
        subject: 'Mathematics', 
        dueDate: '2026-08-11', 
        status: 'todo',
        comments: [
          { id: 103, author: 'Alan Turing', text: 'Will the test include calculus and integrals?', date: 'Jul 12, 09:00 AM' }
        ] 
      },
      { 
        id: 4, 
        title: 'Review student lab submissions', 
        subject: 'Computer Science', 
        dueDate: '2026-07-25', 
        status: 'done',
        comments: [
          { id: 104, author: 'John von Neumann', text: 'Submitted the code structure. Please review.', date: 'Jul 09, 04:45 PM' }
        ] 
      }
    ];
  });

  const [activeTaskFilter, setActiveTaskFilter] = useState('all');
  const [showAllTasks, setShowAllTasks] = useState(false);

  // Notes state
  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem(`staff_notes_${user?.id}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      { id: 1, title: 'Math conspect', content: 'A linear equation is an equation of the form: ax+b=c, where x is the variable, a, b, and c are constants, and a ≠ 0.', date: 'May 05, 2026', theme: 'green' },
      { id: 2, title: 'Biology conspect', content: 'A cell is the basic structural, functional, and biological unit of all living organisms. It is the smallest unit capable of performing life functions.', date: 'Apr 28, 2026', theme: 'purple' }
    ];
  });

  // Schedule/Exams state
  const [exams, setExams] = useState([]);
  const [mySubjects, setMySubjects] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toLocaleDateString('en-CA'); // YYYY-MM-DD
  });

  // Modal states for Tasks
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskSubject, setTaskSubject] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskStatus, setTaskStatus] = useState('todo');
  const [taskCommentsList, setTaskCommentsList] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');

  // Modal states for Notes
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteTheme, setNoteTheme] = useState('green');

  // Save to localStorage when states change
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`staff_tasks_${user.id}`, JSON.stringify(tasks));
    }
  }, [tasks, user]);

  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`staff_notes_${user.id}`, JSON.stringify(notes));
    }
  }, [notes, user]);

  // Fetch stats, exams and subjects
  useEffect(() => {
    authenticatedFetch('/api/staff/dashboard')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch staff stats');
        return res.json();
      })
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });

    authenticatedFetch('/api/staff/subjects')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setMySubjects(data);
        }
      })
      .catch(err => console.error('Error fetching subjects:', err));

    authenticatedFetch('/api/exams')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setExams(data);
        }
      })
      .catch(err => console.error('Error fetching exams:', err));
  }, []);

  // Task handlers
  const handleSaveTask = (e) => {
    e.preventDefault();
    if (!taskTitle.trim() || !taskSubject.trim() || !taskDueDate) {
      alert('Please fill out all required task fields.');
      return;
    }
    if (editingTask) {
      setTasks(tasks.map(t => t.id === editingTask.id ? {
        ...t,
        title: taskTitle,
        subject: taskSubject,
        dueDate: taskDueDate,
        status: taskStatus,
        comments: taskCommentsList
      } : t));
    } else {
      const newTask = {
        id: Date.now(),
        title: taskTitle,
        subject: taskSubject,
        dueDate: taskDueDate,
        status: taskStatus,
        comments: []
      };
      setTasks([newTask, ...tasks]);
    }
    setTaskModalOpen(false);
    setEditingTask(null);
    resetTaskForm();
  };

  const handleEditTask = (task, e) => {
    e.stopPropagation();
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskSubject(task.subject);
    setTaskDueDate(task.dueDate);
    setTaskStatus(task.status);
    setTaskCommentsList(task.comments || []);
    setNewCommentText('');
    setTaskModalOpen(true);
  };

  const handleDeleteTask = (taskId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this task?')) {
      setTasks(tasks.filter(t => t.id !== taskId));
    }
  };

  const cycleTaskStatus = (taskId, e) => {
    e.stopPropagation();
    setTasks(tasks.map(t => {
      if (t.id === taskId) {
        let newStatus = 'todo';
        if (t.status === 'todo') newStatus = 'inprogress';
        else if (t.status === 'inprogress') newStatus = 'done';
        return { ...t, status: newStatus };
      }
      return t;
    }));
  };

  const handleAddComment = () => {
    if (!newCommentText.trim()) return;
    const newComment = {
      id: Date.now(),
      author: user?.name || 'Faculty',
      text: newCommentText.trim(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    };
    const updatedComments = [...taskCommentsList, newComment];
    setTaskCommentsList(updatedComments);
    setNewCommentText('');
    
    if (editingTask) {
      setTasks(prevTasks => prevTasks.map(t => t.id === editingTask.id ? {
        ...t,
        comments: updatedComments
      } : t));
    }
  };

  const resetTaskForm = () => {
    setTaskTitle('');
    setTaskSubject('');
    setTaskDueDate('');
    setTaskStatus('todo');
    setTaskComments(0);
  };

  // Note handlers
  const handleSaveNote = (e) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) {
      alert('Please fill out note title and content.');
      return;
    }
    const currentDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (editingNote) {
      setNotes(notes.map(n => n.id === editingNote.id ? {
        ...n,
        title: noteTitle,
        content: noteContent,
        theme: noteTheme,
        date: currentDate
      } : n));
    } else {
      const newNote = {
        id: Date.now(),
        title: noteTitle,
        content: noteContent,
        theme: noteTheme,
        date: currentDate
      };
      setNotes([newNote, ...notes]);
    }
    setNoteModalOpen(false);
    setEditingNote(null);
    resetNoteForm();
  };

  const handleEditNote = (note, e) => {
    e.stopPropagation();
    setEditingNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setNoteTheme(note.theme);
    setNoteModalOpen(true);
  };

  const handleDeleteNote = (noteId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this note?')) {
      setNotes(notes.filter(n => n.id !== noteId));
    }
  };

  const resetNoteForm = () => {
    setNoteTitle('');
    setNoteContent('');
    setNoteTheme('green');
  };

  // Schedule filtering & generation
  const formatDateLabel = (dateStr) => {
    if (!dateStr) return '';
    const dateObj = new Date(dateStr + 'T00:00:00');
    const month = dateObj.toLocaleString('en-US', { month: 'short' });
    const day = dateObj.getDate();
    const weekday = dateObj.toLocaleString('en-US', { weekday: 'short' });
    return `${month} ${day}, ${weekday}`;
  };

  const getMockClasses = (dayIdx, subjectsList, username) => {
    const initials = username ? username.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'T';
    
    // If subjects are loaded, build a strictly personalized schedule of classes for those subjects
    if (subjectsList && subjectsList.length > 0) {
      const classes = [];
      if (dayIdx === 1) { // Monday
        if (subjectsList[0]) {
          classes.push({ time: '09:30 AM', lesson: subjectsList[0].name, teacher: username, initials, location: 'Room ' + (subjectsList[0].id * 10 + 101) });
        }
        if (subjectsList[1]) {
          classes.push({ time: '01:30 PM', lesson: subjectsList[1].name, teacher: username, initials, location: 'Room ' + (subjectsList[1].id * 10 + 102) });
        }
      } else if (dayIdx === 2) { // Tuesday
        const sub = subjectsList[1] || subjectsList[0];
        if (sub) {
          classes.push({ time: '10:30 AM', lesson: sub.name, teacher: username, initials, location: 'Room ' + (sub.id * 10 + 103) });
        }
      } else if (dayIdx === 3) { // Wednesday
        if (subjectsList[0]) {
          classes.push({ time: '11:30 AM', lesson: subjectsList[0].name, teacher: username, initials, location: 'Room ' + (subjectsList[0].id * 10 + 101) });
        }
      } else if (dayIdx === 4) { // Thursday
        const sub = subjectsList[1] || subjectsList[0];
        if (sub) {
          classes.push({ time: '09:00 AM', lesson: sub.name, teacher: username, initials, location: 'Room ' + (sub.id * 10 + 104) });
        }
      } else if (dayIdx === 5) { // Friday
        if (subjectsList[0]) {
          classes.push({ time: '02:00 PM', lesson: subjectsList[0].name, teacher: username, initials, location: 'Room ' + (subjectsList[0].id * 10 + 102) });
        }
      } else if (dayIdx === 6) { // Saturday
        classes.push({ time: '10:00 AM', lesson: 'Department Meeting', teacher: 'HOD Office', initials: 'HO', location: 'Conference Room' });
      }
      return classes;
    }

    // Fallback: if no subjects are assigned in the backend, show default mock classes but personalized with the current staff's name!
    switch (dayIdx) {
      case 1: // Monday
        return [
          { time: '08:30 AM', lesson: 'Applied Mathematics', teacher: username || 'Faculty', initials, location: 'B3, Room 124' },
          { time: '12:00 PM', lesson: 'Molecular Biology', teacher: username || 'Faculty', initials, location: 'B3, Room 310' }
        ];
      case 2: // Tuesday
        return [
          { time: '09:30 AM', lesson: 'Database Systems', teacher: username || 'Faculty', initials, location: 'Lab 2, Floor 1' },
          { time: '02:00 PM', lesson: 'Computer Networks', teacher: username || 'Faculty', initials, location: 'B1, Room 204' }
        ];
      case 3: // Wednesday
        return [
          { time: '10:30 AM', lesson: 'Software Engineering', teacher: username || 'Faculty', initials, location: 'B2, Room 158' },
          { time: '03:00 PM', lesson: 'Physics Theory', teacher: username || 'Faculty', initials, location: 'B1, Room 112' }
        ];
      case 4: // Thursday
        return [
          { time: '09:00 AM', lesson: 'Web Design Lab', teacher: username || 'Faculty', initials, location: 'Lab 4, Floor 3' },
          { time: '02:00 PM', lesson: 'Social Studies', teacher: username || 'Faculty', initials, location: 'B1, Room 112' }
        ];
      case 5: // Friday
        return [
          { time: '10:30 AM', lesson: 'Molecular Biology', teacher: username || 'Faculty', initials, location: 'B3, Room 310' },
          { time: '01:00 PM', lesson: 'Database Systems', teacher: username || 'Faculty', initials, location: 'Lab 2, Floor 1' }
        ];
      case 6: // Saturday
        return [
          { time: '10:00 AM', lesson: 'Department Meeting', teacher: 'HOD Office', initials: 'HO', location: 'Conference Room' }
        ];
      default: // Sunday
        return [];
    }
  };

  const dayIdx = new Date(selectedDate + 'T00:00:00').getDay();
  const mockClassesForDay = getMockClasses(dayIdx, mySubjects, user?.name);

  // Filter real exams for selectedDate: only show exams matching their handled subjects OR exams they uploaded themselves!
  const examsForDay = exams
    .filter(ex => {
      const matchesDate = ex.examDate === selectedDate;
      const isMySubject = mySubjects.some(sub => sub.id === ex.subject?.id);
      const isMyUpload = ex.uploadedBy?.id === user?.id;
      return matchesDate && (isMySubject || isMyUpload);
    })
    .map(ex => ({
      time: formatTime12Hour(ex.examTime),
      lesson: `EXAM: ${ex.subject?.name || 'Subject'} (${ex.subject?.code || ''})`,
      teacher: `Invigilator: ${ex.uploadedBy?.name || 'Faculty'}`,
      initials: ex.uploadedBy?.name ? ex.uploadedBy.name.charAt(0) : 'E',
      location: `Hall ${ex.hallNumber}`,
      isExam: true
    }));

  const combinedSchedule = [...examsForDay, ...mockClassesForDay];

  // Filtering tasks
  const filteredTasks = tasks.filter(t => activeTaskFilter === 'all' || t.status === activeTaskFilter);
  const displayedTasks = showAllTasks ? filteredTasks : filteredTasks.slice(0, 4);

  if (loading) return <div className="skeleton-box" style={{ height: '220px' }} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Aurora Welcome Header */}
      <div className="aurora-container">
        <div className="aurora-bg">
          <div className="aurora-blob aurora-blob-1" />
          <div className="aurora-blob aurora-blob-2" />
        </div>
        <div className="welcome-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: '700', fontSize: '13px', textTransform: 'uppercase', marginBottom: '8px' }}>
            <Sparkles size={16} />
            <span>Faculty Account</span>
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '8px' }}>Welcome, {user?.name}!</h2>
          <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)' }}>
            Teaching privileges enabled for department <strong>{user?.departmentCode}</strong>, Year <strong>{stats?.assignedYear || '2'}</strong>.
            Review tasks, syllabus logs, schedule and notes below.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="dashboard-grid">
        <div className="glass-card stat-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="stat-number">{stats?.studentsCount}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>My Students</div>
          </div>
          <div className="stat-icon stat-icon-primary">
            <Users size={24} />
          </div>
        </div>
        <div className="glass-card stat-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="stat-number">{stats?.subjectsHandled}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>Assigned Courses</div>
          </div>
          <div className="stat-icon stat-icon-accent">
            <CheckSquare size={24} />
          </div>
        </div>
        <div className="glass-card stat-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="stat-number">{stats?.assignmentsUploaded}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>Active Assignments</div>
          </div>
          <div className="stat-icon stat-icon-success">
            <BookOpen size={24} />
          </div>
        </div>
      </div>

      {/* Double Column Split Layout */}
      <div className="dashboard-split-layout">
        
        {/* Left Column: My Tasks */}
        <div className="dashboard-column">
          <div className="widget-card">
            <div className="widget-title-bar">
              <h3 className="widget-title">My tasks</h3>
              <button className="btn-circle-add" title="Add Task" onClick={() => { resetTaskForm(); setEditingTask(null); setTaskModalOpen(true); }}>
                <Plus size={18} />
              </button>
            </div>

            {/* Filter Chips */}
            <div className="filter-chips-container">
              <button className={`filter-chip ${activeTaskFilter === 'all' ? 'active' : ''}`} onClick={() => { setActiveTaskFilter('all'); setShowAllTasks(false); }}>All task</button>
              <button className={`filter-chip ${activeTaskFilter === 'todo' ? 'active' : ''}`} onClick={() => { setActiveTaskFilter('todo'); setShowAllTasks(false); }}>To do</button>
              <button className={`filter-chip ${activeTaskFilter === 'inprogress' ? 'active' : ''}`} onClick={() => { setActiveTaskFilter('inprogress'); setShowAllTasks(false); }}>In progress</button>
              <button className={`filter-chip ${activeTaskFilter === 'done' ? 'active' : ''}`} onClick={() => { setActiveTaskFilter('done'); setShowAllTasks(false); }}>Done</button>
            </div>

            {/* Tasks List */}
            <div className="task-list">
              {displayedTasks.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '24px 0' }}>No tasks found in this category.</div>
              ) : (
                displayedTasks.map(t => (
                  <div key={t.id} className="dashboard-task-card" onClick={(e) => handleEditTask(t, e)}>
                    <div className="task-card-header">
                      <div>
                        <h4 className="task-card-title">{t.title}</h4>
                        <span className="task-card-subtitle">{t.subject}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span 
                          className={`task-badge task-badge-${t.status.toLowerCase()}`}
                          title="Click to cycle status"
                          onClick={(e) => cycleTaskStatus(t.id, e)}
                        >
                          {t.status === 'todo' ? 'To do' : t.status === 'inprogress' ? 'In progress' : 'Done'}
                        </span>
                        <div style={{ display: 'flex', gap: '2px' }}>
                          <button className="theme-toggle-btn" style={{ padding: '4px', minHeight: '24px', border: 'none', background: 'transparent' }} title="Edit Task" onClick={(e) => handleEditTask(t, e)}>
                            <Edit2 size={12} style={{ color: 'var(--text-muted)' }} />
                          </button>
                          <button className="theme-toggle-btn" style={{ padding: '4px', minHeight: '24px', border: 'none', background: 'transparent' }} title="Delete Task" onClick={(e) => handleDeleteTask(t.id, e)}>
                            <Trash2 size={12} style={{ color: 'var(--danger)' }} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Progress indicator */}
                    <div className="task-progress-bar-container">
                      <div className={`task-progress-bar task-progress-${t.status.toLowerCase()}`} />
                    </div>

                    {/* Footer */}
                    <div className="task-card-footer">
                      <span>{t.dueDate ? new Date(t.dueDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</span>
                      <div className="task-comments-count">
                        <MessageSquare size={13} />
                        <span>{t.comments && t.comments.length > 0 ? `${t.comments.length} comments` : 'No comments'}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* View All Button */}
            {filteredTasks.length > 4 && (
              <button className="btn-view-all" onClick={() => setShowAllTasks(!showAllTasks)}>
                {showAllTasks ? 'Show less' : 'View all tasks'}
              </button>
            )}
          </div>
        </div>

        {/* Right Column: My Notes & My Schedule */}
        <div className="dashboard-column">
          
          {/* Notes Section */}
          <div className="widget-card">
            <div className="widget-title-bar">
              <h3 className="widget-title">My notes</h3>
              <button className="btn-circle-add" title="Add Note" onClick={() => { resetNoteForm(); setEditingNote(null); setNoteModalOpen(true); }}>
                <Plus size={18} />
              </button>
            </div>

            {/* Notes Grid */}
            <div className="notes-grid">
              {notes.length === 0 ? (
                <div style={{ gridColumn: 'span 2', color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '24px 0' }}>No notes taken yet.</div>
              ) : (
                notes.map(n => (
                  <div key={n.id} className={`note-card note-theme-${n.theme}`} onClick={(e) => handleEditNote(n, e)}>
                    <div className="widget-header" style={{ marginBottom: '8px' }}>
                      <h4 className="note-card-title">{n.title}</h4>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'inherit' }} title="Edit Note" onClick={(e) => handleEditNote(n, e)}>
                          <Edit2 size={13} />
                        </button>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'inherit' }} title="Delete Note" onClick={(e) => handleDeleteNote(n.id, e)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <p className="note-card-content" style={{ color: 'inherit' }}>{n.content}</p>
                    <span className="note-card-date">{n.date}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Academic Calendar Widget */}
          <div className="widget-card">
            <div className="widget-title-bar">
              <h3 className="widget-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={18} style={{ color: 'var(--primary)' }} />
                Academic Calendar
              </h3>
            </div>
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => {
                  if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
                  else setCurrentMonth(currentMonth - 1);
                }} style={{ padding: '4px 8px' }}><ChevronLeft size={16} /></button>
                <div style={{ fontWeight: '700', fontSize: '15px' }}>
                  {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][currentMonth]} {currentYear}
                </div>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => {
                  if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
                  else setCurrentMonth(currentMonth + 1);
                }} style={{ padding: '4px 8px' }}><ChevronRight size={16} /></button>
              </div>
              
              <div className="calendar-grid">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => <span key={i} className="calendar-day-header">{day}</span>)}
                {(() => {
                  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
                  
                  const allEvents = [...COMMON_EVENTS, ...privateEvents];
                  exams.forEach(ex => {
                    if (ex.examDate) allEvents.push({ id: `ex-${ex.id}`, date: ex.examDate, title: `📝 ${ex.subject?.code || ''} Exam`, color: 'var(--primary)', details: `Time: ${ex.examTime.substring(0,5)} | Hall: ${ex.hallNumber}` });
                  });

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
                          {day}
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
                            <div style={{ fontSize: '8px', color: 'var(--text-muted)', textAlign: 'left', fontWeight: '600' }}>+{dayEvents.length - 2} more</div>
                          )}
                        </div>
                      </span>
                    );
                  }
                  return gridCells;
                })()}
              </div>
            </div>
          </div>

          {/* Schedule Section */}
          <div className="widget-card">
            <div className="widget-title-bar">
              <h3 className="widget-title">My schedule</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--primary)' }}>
                  {formatDateLabel(selectedDate)}
                </span>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input 
                    type="date" 
                    value={selectedDate} 
                    onChange={(e) => setSelectedDate(e.target.value)} 
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      padding: '4px 8px',
                      fontSize: '13px',
                      fontFamily: 'var(--font-body)',
                      fontWeight: '600',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Schedule List */}
            <div className="schedule-table-list">
              {combinedSchedule.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '24px 0' }}>No classes scheduled for today.</div>
              ) : (
                combinedSchedule.map((sch, index) => (
                  <div key={index} className="schedule-table-row" style={sch.isExam ? { borderLeft: '4px solid var(--danger)', paddingLeft: '12px' } : {}}>
                    <div className="schedule-cell-time">
                      {sch.time}
                    </div>
                    <div className="schedule-cell-lesson">
                      {sch.lesson}
                    </div>
                    <div className="schedule-cell-teacher">
                      <div className="schedule-teacher-avatar-circle" style={sch.isExam ? { background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.2)' } : {}}>
                        {sch.initials}
                      </div>
                      <span className="schedule-teacher-name-text">
                        {sch.teacher}
                      </span>
                    </div>
                    <div className="schedule-cell-location">
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} />
                        <span>{sch.location}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Direct Schedule Link */}
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <Link to="/staff/exams" className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '12px', minHeight: '32px' }}>
                <Calendar size={13} /> Schedule Exam Slot
              </Link>
            </div>
          </div>

        </div>

      </div>

      {/* Task Form Modal */}
      {taskModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', zIndex: 100, justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
          <div className="glass-card" style={{ width: editingTask ? '500px' : '420px', maxWidth: '100%', background: 'var(--bg-surface-solid)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="widget-header">
              <h3>{editingTask ? 'Edit Task Details' : 'Add New Task'}</h3>
              <button onClick={() => { setTaskModalOpen(false); setEditingTask(null); resetTaskForm(); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveTask}>
              <div className="form-group">
                <label className="form-label">Task Title</label>
                <input type="text" className="form-control" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="e.g. Read poem & answer questions" required />
              </div>
              <div className="form-group">
                <label className="form-label">Course / Subject Name</label>
                <input type="text" className="form-control" value={taskSubject} onChange={(e) => setTaskSubject(e.target.value)} placeholder="e.g. English Literature" required />
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input type="date" className="form-control" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Task Status</label>
                <CustomSelect 
                  value={taskStatus} 
                  onChange={(e) => setTaskStatus(e.target.value)}
                  options={[
                    { value: 'todo', label: 'To do' },
                    { value: 'inprogress', label: 'In progress' },
                    { value: 'done', label: 'Done' }
                  ]}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button type="submit" className="btn btn-primary" style={{ flexGrow: 1 }}>
                  {editingTask ? 'Update Task' : 'Create Task'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => { setTaskModalOpen(false); setEditingTask(null); resetTaskForm(); }}>Cancel</button>
              </div>
            </form>

            {/* Real Comments Discussion Board */}
            {editingTask && (
              <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                <h4 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '700' }}>
                  <MessageSquare size={16} />
                  <span>Discussion ({taskCommentsList.length})</span>
                </h4>
                
                {/* Comments List */}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '10px', 
                  maxHeight: '180px', 
                  overflowY: 'auto', 
                  marginBottom: '16px',
                  paddingRight: '4px',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-xs)',
                  padding: '8px',
                  background: 'var(--bg-input)'
                }}>
                  {taskCommentsList.length === 0 ? (
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', margin: '12px 0' }}>No comments yet. Start the conversation!</p>
                  ) : (
                    taskCommentsList.map(c => (
                      <div key={c.id} style={{ background: 'var(--bg-surface-solid)', padding: '10px', borderRadius: 'var(--radius-xs)', fontSize: '13px', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '11px', fontWeight: '700' }}>
                          <span style={{ color: 'var(--primary)' }}>{c.author}</span>
                          <span style={{ color: 'var(--text-muted)' }}>{c.date}</span>
                        </div>
                        <div style={{ color: 'var(--text-primary)', lineHeight: '1.4' }}>{c.text}</div>
                      </div>
                    ))
                  )}
                </div>

                {/* New Comment Input */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-control"
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Write a reply..."
                    style={{ padding: '8px 12px', fontSize: '13px' }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddComment();
                      }
                    }}
                  />
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    onClick={handleAddComment}
                    style={{ padding: '8px 16px', fontSize: '13px', minHeight: '36px' }}
                  >
                    Post
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Note Form Modal */}
      {noteModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', zIndex: 100, justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
          <div className="glass-card" style={{ width: '420px', background: 'var(--bg-surface-solid)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="widget-header">
              <h3>{editingNote ? 'Edit Note Details' : 'Add New Note'}</h3>
              <button onClick={() => { setNoteModalOpen(false); setEditingNote(null); resetNoteForm(); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveNote}>
              <div className="form-group">
                <label className="form-label">Note Title</label>
                <input type="text" className="form-control" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder="e.g. Math conspect" required />
              </div>
              <div className="form-group">
                <label className="form-label">Content Description</label>
                <textarea className="form-control" rows="4" value={noteContent} onChange={(e) => setNoteContent(e.target.value)} placeholder="Write note text..." required></textarea>
              </div>
              <div className="form-group">
                <label className="form-label">Card Color Theme</label>
                <div className="color-picker-container">
                  <button 
                    type="button" 
                    className={`color-option-btn note-theme-green ${noteTheme === 'green' ? 'selected' : ''}`} 
                    onClick={() => setNoteTheme('green')}
                    title="Green theme"
                  />
                  <button 
                    type="button" 
                    className={`color-option-btn note-theme-purple ${noteTheme === 'purple' ? 'selected' : ''}`} 
                    onClick={() => setNoteTheme('purple')}
                    title="Purple theme"
                  />
                  <button 
                    type="button" 
                    className={`color-option-btn note-theme-peach ${noteTheme === 'peach' ? 'selected' : ''}`} 
                    onClick={() => setNoteTheme('peach')}
                    title="Peach theme"
                  />
                  <button 
                    type="button" 
                    className={`color-option-btn note-theme-blue ${noteTheme === 'blue' ? 'selected' : ''}`} 
                    onClick={() => setNoteTheme('blue')}
                    title="Blue theme"
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="submit" className="btn btn-primary" style={{ flexGrow: 1 }}>
                  {editingNote ? 'Update Note' : 'Create Note'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => { setNoteModalOpen(false); setEditingNote(null); resetNoteForm(); }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Event Details Modal */}
      {selectedDayEvents && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px', boxSizing: 'border-box' }}>
          <div className="glass-card" style={{ width: '400px', background: 'var(--bg-surface-solid)', padding: '24px', position: 'relative' }}>
            <button className="theme-toggle-btn" style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', background: 'transparent', cursor: 'pointer' }} onClick={() => setSelectedDayEvents(null)}>
              <XCircle size={20} style={{ color: 'var(--text-muted)' }} />
            </button>
            <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '700' }}>Events on {selectedDayEvents.date}</h3>
            
            {/* Events List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '200px', overflowY: 'auto', marginBottom: '16px', paddingRight: '4px' }}>
              {selectedDayEvents.events.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', margin: '12px 0' }}>No academic events or reminders on this day.</p>
              ) : (
                selectedDayEvents.events.map(evt => (
                  <div key={evt.id} style={{ padding: '12px', background: 'var(--bg-muted)', borderRadius: 'var(--radius-sm)', borderLeft: `4px solid ${evt.color}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ flexGrow: 1 }}>
                      <div style={{ fontWeight: '700', color: evt.color, marginBottom: '4px', fontSize: '13.5px' }}>{evt.title}</div>
                      <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{evt.details}</div>
                    </div>
                    {evt.isPrivate && (
                      <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); handleDeletePrivateEvent(evt.id); }} 
                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                        title="Delete Private Event"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Add Private Event Form */}
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={16} />
                <span>Add Private Event</span>
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Event title..." 
                  value={newEventTitle} 
                  onChange={e => setNewEventTitle(e.target.value)} 
                  style={{ padding: '8px 12px', fontSize: '13px' }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddPrivateEvent(selectedDayEvents.date);
                    }
                  }}
                />
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Short detail (optional)..." 
                  value={newEventDetails} 
                  onChange={e => setNewEventDetails(e.target.value)} 
                  style={{ padding: '8px 12px', fontSize: '13px' }}
                />
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={() => handleAddPrivateEvent(selectedDayEvents.date)} 
                  style={{ padding: '8px 16px', fontSize: '13px', minHeight: '36px' }}
                >
                  Add Event
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

// 2. My Students
const MyStudentsPage = () => {
  const { authenticatedFetch, user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);

  const [editUser, setEditUser] = useState(null);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [registerNumber, setRegisterNumber] = useState('');
  const [section, setSection] = useState('');
  const [year, setYear] = useState('2');
  const [password, setPassword] = useState('password');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const fetchStudents = () => {
    authenticatedFetch('/api/staff/students')
      .then(res => res.json())
      .then(data => {
        setStudents(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const startAdd = () => {
    setEditUser(null);
    setName('');
    setEmail('');
    setPhone('');
    setRegisterNumber('');
    setSection('');
    setYear('2');
    setPassword('password');
    setAddModal(true);
  };

  const startEdit = (s) => {
    setEditUser(s);
    setName(s.name);
    setEmail(s.email);
    setPhone(s.phone || '');
    setRegisterNumber(s.registerNumber || '');
    setSection(s.section || '');
    setYear(s.year?.toString() || '2');
    setPassword('');
    setAddModal(true);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const isEdit = !!editUser;
    const endpoint = isEdit ? `/api/staff/students/${editUser.id}` : '/api/staff/students';
    const payload = { name, email, phone, year, registerNumber, section };
    if (password) payload.password = password;
    try {
      const response = await authenticatedFetch(endpoint, {
        method: isEdit ? 'PUT' : 'POST',
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (response.ok) {
        setAddModal(false);
        setEditUser(null);
        setName('');
        setEmail('');
        setPhone('');
        setRegisterNumber('');
        setSection('');
        setYear('2');
        setPassword('password');
        fetchStudents();
      } else {
        setError(data.error || 'Failed to save student');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="skeleton-box" style={{ height: '320px' }} />;

  return (
    <>
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2>Class Student Roster</h2>
          <button className="btn btn-primary" onClick={startAdd} style={{ display: 'flex', gap: '8px', minHeight: '36px' }}>
            <PlusCircle size={16} /> Register Student
          </button>
        </div>
        <div className="table-container">
          <table className="portal-table">
            <thead>
              <tr>
                <th>Register Number</th>
                <th>Full Name</th>
                <th>Email Address</th>
                <th>Year & Section</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: '700' }}>{s.registerNumber}</td>
                  <td>{s.name}</td>
                  <td>{s.email}</td>
                  <td style={{ fontWeight: '600', color: 'var(--primary)' }}>Year {s.year} — Section {s.section || 'A'}</td>
                  <td>
                    <span className={`badge ${s.isActive ? 'badge-success' : 'badge-danger'}`}>{s.isActive ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button className="btn btn-secondary" onClick={() => startEdit(s)} style={{ padding: '4px 10px', minHeight: '28px', fontSize: '12px' }}>Edit</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {addModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', zIndex: 100, justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
          <div className="glass-card" style={{ width: '420px', background: 'var(--bg-surface-solid)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="widget-header">
              <h3>{editUser ? 'Edit Student details' : 'Register New Student'}</h3>
              <button onClick={() => { setAddModal(false); setEditUser(null); setError(''); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><PlusCircle size={18} style={{ transform: 'rotate(45deg)' }} /></button>
            </div>
            {error && (
              <div className="alert-banner alert-banner-danger" style={{ marginBottom: '16px' }}>
                <span>{error}</span>
              </div>
            )}
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label className="form-label">Department</label>
                <input type="text" className="form-control" value={user?.departmentCode || 'N/A'} readOnly style={{ background: 'rgba(255,255,255,0.04)', cursor: 'default', color: 'var(--text-secondary)' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="form-group" style={{ flexGrow: 1 }}>
                  <label className="form-label">Register Number</label>
                  <input type="text" className="form-control" placeholder="REGXXXXXX" value={registerNumber} onChange={(e) => setRegisterNumber(e.target.value)} required />
                </div>
                <div className="form-group" style={{ width: '110px' }}>
                  <label className="form-label">Section</label>
                  <input type="text" className="form-control" placeholder="A" value={section} onChange={(e) => setSection(e.target.value)} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input type="text" className="form-control" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Study Year</label>
                <CustomSelect 
                  value={year} 
                  onChange={(e) => setYear(e.target.value)}
                  options={[
                    { value: '1', label: 'Year 1' },
                    { value: '2', label: 'Year 2' },
                    { value: '3', label: 'Year 3' },
                    { value: '4', label: 'Year 4' }
                  ]}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">{editUser ? 'Password (leave blank to keep current)' : 'Default Password'}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ paddingRight: '48px' }}
                    required={!editUser}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      outline: 'none'
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" className="btn btn-primary" style={{ flexGrow: 1 }} disabled={saving}>
                  {saving ? 'Saving...' : (editUser ? 'Update Student' : 'Register Student')}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => { setAddModal(false); setEditUser(null); setError(''); }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

// 3. Mark Attendance
const MarkAttendancePage = () => {
  const { authenticatedFetch } = useAuth();
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSub, setSelectedSub] = useState('');
  const [classDate, setClassDate] = useState(getTodayDateString);
  const [statuses, setStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      authenticatedFetch('/api/staff/students').then(res => res.json()),
      authenticatedFetch('/api/staff/subjects').then(res => res.json())
    ]).then(([studentsData, subjectsData]) => {
      setStudents(studentsData);
      setSubjects(subjectsData);
      
      const initial = {};
      studentsData.forEach(s => { initial[s.id] = 'PRESENT'; });
      setStatuses(initial);

      if (subjectsData.length > 0) {
        setSelectedSub(subjectsData[0].id.toString());
      }
      setLoading(false);
    }).catch(err => console.error(err));
  }, []);

  const changeStatus = (studentId, status) => {
    setStatuses(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await authenticatedFetch('/api/staff/attendance/mark', {
        method: 'POST',
        body: JSON.stringify({
          subjectId: selectedSub,
          classDate: classDate,
          statuses: statuses
        })
      });
      if (response.ok) {
        alert('Attendance marked successfully.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="skeleton-box" style={{ height: '320px' }} />;

  return (
    <div className="glass-card">
      <h2>Daily Class Attendance Book</h2>
      
      <div style={{ display: 'flex', gap: '20px', margin: '24px 0', flexWrap: 'wrap' }}>
        <div className="form-group" style={{ flexGrow: 1, minWidth: '200px' }}>
          <label className="form-label">Subject</label>
          <CustomSelect 
            value={selectedSub} 
            onChange={(e) => setSelectedSub(e.target.value)}
            options={subjects.map(s => ({ value: s.id.toString(), label: s.name }))}
          />
        </div>
        <div className="form-group" style={{ width: '200px' }}>
          <label className="form-label">Class Date</label>
          <input 
            type="date" 
            className="form-control" 
            value={classDate} 
            min={getTodayDateString()} 
            onChange={(e) => setClassDate(e.target.value)} 
          />
        </div>
      </div>

      <div className="attendance-grid">
        {students.map(s => (
          <div className="attendance-item" key={s.id}>
            <div>
              <div style={{ fontWeight: '700' }}>{s.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>{s.registerNumber}</div>
            </div>
            <div className="attendance-actions">
              <button 
                className={`attendance-btn ${statuses[s.id] === 'PRESENT' ? 'active-present' : ''}`}
                onClick={() => changeStatus(s.id, 'PRESENT')}
              >
                P
              </button>
              <button 
                className={`attendance-btn ${statuses[s.id] === 'ABSENT' ? 'active-absent' : ''}`}
                onClick={() => changeStatus(s.id, 'ABSENT')}
              >
                A
              </button>
              <button 
                className={`attendance-btn ${statuses[s.id] === 'OD' ? 'active-present' : ''}`}
                style={{ backgroundColor: statuses[s.id] === 'OD' ? 'var(--primary)' : 'transparent', color: statuses[s.id] === 'OD' ? 'white' : 'var(--text-secondary)' }}
                onClick={() => changeStatus(s.id, 'OD')}
              >
                OD
              </button>
            </div>
          </div>
        ))}
      </div>

      <button className="btn btn-primary" style={{ marginTop: '32px', display: 'flex', gap: '8px', minHeight: '40px' }} onClick={handleSave} disabled={saving}>
        <Save size={16} /> {saving ? 'Saving...' : 'Settle Attendance Sheet'}
      </button>
    </div>
  );
};

// 4. Upload Marks
const UploadMarksPage = () => {
  const { authenticatedFetch } = useAuth();
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedSub, setSelectedSub] = useState('');
  const [examType, setExamType] = useState('CAT1');
  const [maxMarks, setMaxMarks] = useState('50');
  const [scored, setScored] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      authenticatedFetch('/api/staff/students').then(res => res.json()),
      authenticatedFetch('/api/staff/subjects').then(res => res.json())
    ]).then(([studentsData, subjectsData]) => {
      setStudents(studentsData);
      setSubjects(subjectsData);
      if (studentsData.length > 0) setSelectedStudent(studentsData[0].id.toString());
      if (subjectsData.length > 0) setSelectedSub(subjectsData[0].id.toString());
      setLoading(false);
    }).catch(err => console.error(err));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await authenticatedFetch('/api/staff/marks/upload', {
        method: 'POST',
        body: JSON.stringify({
          studentId: selectedStudent,
          subjectId: selectedSub,
          assessmentType: examType,
          maxMarks: maxMarks,
          scoredMarks: scored
        })
      });
      if (response.ok) {
        alert('Marks uploaded successfully.');
        setScored('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="skeleton-box" style={{ height: '320px' }} />;

  return (
    <div className="glass-card" style={{ maxWidth: '600px' }}>
      <h2>Upload Student Marks</h2>
      <form onSubmit={handleSave} style={{ marginTop: '24px' }}>
        <div className="form-group">
          <label className="form-label">Student Enrollee</label>
          <CustomSelect 
            value={selectedStudent} 
            onChange={(e) => setSelectedStudent(e.target.value)}
            options={students.map(s => ({ value: s.id.toString(), label: `${s.name} (${s.registerNumber})` }))}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Subject</label>
          <CustomSelect 
            value={selectedSub} 
            onChange={(e) => setSelectedSub(e.target.value)}
            options={subjects.map(s => ({ value: s.id.toString(), label: `${s.name} (${s.code})` }))}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Assessment Code</label>
          <CustomSelect 
            value={examType} 
            onChange={(e) => setExamType(e.target.value)}
            options={[
              { value: 'CAT1', label: 'CAT 1 (Unit 1-2)' },
              { value: 'CAT2', label: 'CAT 2 (Unit 3-4)' },
              { value: 'MODEL', label: 'Model Examination' },
              { value: 'ASSIGNMENT', label: 'Continuous Lab Assignment' }
            ]}
          />
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div className="form-group" style={{ flexGrow: 1 }}>
            <label className="form-label">Maximum Evaluation Marks</label>
            <input type="number" className="form-control" value={maxMarks} onChange={(e) => setMaxMarks(e.target.value)} required />
          </div>
          <div className="form-group" style={{ flexGrow: 1 }}>
            <label className="form-label">Scored Marks</label>
            <input type="number" step="0.01" className="form-control" value={scored} onChange={(e) => setScored(e.target.value)} required />
          </div>
        </div>
        <button type="submit" className="btn btn-primary" style={{ marginTop: '16px', width: '100%', minHeight: '44px' }} disabled={saving}>
          {saving ? 'Saving...' : 'Upload Student Marks'}
        </button>
      </form>
    </div>
  );
};

// 5. Manage Assignments
const ManageAssignmentsPage = () => {
  const { authenticatedFetch } = useAuth();
  const [selectedSub, setSelectedSub] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [dueDate, setDueDate] = useState(getTodayDateString);
  const [maxMarks, setMaxMarks] = useState('10');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authenticatedFetch('/api/staff/subjects')
      .then(res => res.json())
      .then(data => {
        setSubjects(data);
        if (data.length > 0) setSelectedSub(data[0].id.toString());
        setLoading(false);
      }).catch(err => console.error(err));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await authenticatedFetch('/api/staff/assignments/create', {
        method: 'POST',
        body: JSON.stringify({
          subjectId: selectedSub,
          title: title,
          description: desc,
          dueDate: dueDate,
          maxMarks: maxMarks
        })
      });
      if (response.ok) {
        alert('Assignment uploaded successfully.');
        setTitle('');
        setDesc('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="skeleton-box" style={{ height: '320px' }} />;

  return (
    <div className="glass-card" style={{ maxWidth: '650px' }}>
      <h2>Post Course Assignment Brief</h2>
      <form onSubmit={handleCreate} style={{ marginTop: '24px' }}>
        <div className="form-group">
          <label className="form-label">Subject</label>
          <CustomSelect 
            value={selectedSub} 
            onChange={(e) => setSelectedSub(e.target.value)}
            options={subjects.map(s => ({ value: s.id.toString(), label: `${s.name} (${s.code})` }))}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Assignment Title</label>
          <input type="text" className="form-control" placeholder="Joins and Subqueries Lab" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">Specifications & Task Details</label>
          <textarea className="form-control" rows="4" placeholder="Enter instructions, requirements, deliverables..." value={desc} onChange={(e) => setDesc(e.target.value)}></textarea>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div className="form-group" style={{ flexGrow: 1 }}>
            <label className="form-label">Submission Due Date</label>
            <input 
              type="date" 
              className="form-control" 
              value={dueDate} 
              min={getTodayDateString()} 
              onChange={(e) => setDueDate(e.target.value)} 
            />
          </div>
          <div className="form-group" style={{ flexGrow: 1 }}>
            <label className="form-label">Evaluation Maximum Weightage</label>
            <input type="number" className="form-control" value={maxMarks} onChange={(e) => setMaxMarks(e.target.value)} required />
          </div>
        </div>
        <button type="submit" className="btn btn-primary" style={{ marginTop: '16px', width: '100%', minHeight: '44px' }} disabled={saving}>
          {saving ? 'Publishing...' : 'Publish Course Brief'}
        </button>
      </form>
    </div>
  );
};

// 6. Set Exam Schedule
const SetExamSchedulePage = () => {
  const { authenticatedFetch } = useAuth();
  const [selectedSub, setSelectedSub] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [examType, setExamType] = useState('CAT1');
  const [date, setDate] = useState(getTodayDateString);
  const [time, setTime] = useState(getCurrentTimeString);
  const [hall, setHall] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authenticatedFetch('/api/staff/subjects')
      .then(res => res.json())
      .then(data => {
        setSubjects(data);
        if (data.length > 0) setSelectedSub(data[0].id.toString());
        setLoading(false);
      }).catch(err => console.error(err));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (!date || date.trim() === '') {
        alert('Exam Date is required.');
        setSaving(false);
        return;
      }
      if (!time || time.trim() === '') {
        alert('Time Slot is required.');
        setSaving(false);
        return;
      }

      const todayStr = getTodayDateString();
      if (date < todayStr) {
        alert('Selected date is in the past. Choose a future date.');
        setSaving(false);
        return;
      }

      if (date === todayStr) {
        const now = new Date();
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        
        const timeParts = time.split(':');
        if (timeParts.length >= 2) {
          const selHours = parseInt(timeParts[0], 10);
          const selMinutes = parseInt(timeParts[1], 10);
          if (selHours < currentHours || (selHours === currentHours && selMinutes < currentMinutes)) {
            alert('Selected slot is in the past.');
            setSaving(false);
            return;
          }
        }
      }

      const response = await authenticatedFetch('/api/staff/exams/create', {
        method: 'POST',
        body: JSON.stringify({
          subjectId: selectedSub,
          examType: examType,
          examDate: date,
          examTime: time + ':00',
          hallNumber: hall
        })
      });
      if (response.ok) {
        alert('Exam schedule updated successfully.');
        setDate('');
        setTime('');
        setHall('');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update exam schedule.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="skeleton-box" style={{ height: '320px' }} />;

  return (
    <div className="glass-card" style={{ maxWidth: '600px' }}>
      <h2>Schedule Examination</h2>
      <form onSubmit={handleSave} style={{ marginTop: '24px' }}>
        <div className="form-group">
          <label className="form-label">Subject</label>
          <CustomSelect 
            value={selectedSub} 
            onChange={(e) => setSelectedSub(e.target.value)}
            options={subjects.map(s => ({ value: s.id.toString(), label: `${s.name} (${s.code})` }))}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Exam Category</label>
          <CustomSelect 
            value={examType} 
            onChange={(e) => setExamType(e.target.value)}
            options={[
              { value: 'CAT1', label: 'CAT 1' },
              { value: 'CAT2', label: 'CAT 2' },
              { value: 'MODEL', label: 'MODEL Exam' },
              { value: 'SEMESTER', label: 'SEMESTER Final' },
              { value: 'ARREAR', label: 'ARREAR Backlog' }
            ]}
          />
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div className="form-group" style={{ flexGrow: 1 }}>
            <label className="form-label">Exam Date</label>
            <input 
              type="date" 
              className="form-control" 
              value={date} 
              min={getTodayDateString()} 
              onChange={(e) => setDate(e.target.value)} 
            />
          </div>
          <div className="form-group" style={{ flexGrow: 1 }}>
            <label className="form-label">Time Slot</label>
            <TimeDropdownPicker 
              value={time} 
              onChange={(e) => setTime(e.target.value)} 
            />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Hall / Classroom Number</label>
          <input type="text" className="form-control" placeholder="LH 301 / LH 302" value={hall} onChange={(e) => setHall(e.target.value)} required />
        </div>
        <button type="submit" className="btn btn-primary" style={{ marginTop: '16px', width: '100%', minHeight: '44px' }} disabled={saving}>
          {saving ? 'Scheduling...' : 'Configure Examination'}
        </button>
      </form>
    </div>
  );
};

const StaffRoutes = () => {
  return (
    <StaffLayout>
      <Routes>
        <Route path="dashboard" element={<StaffDashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="students" element={<MyStudentsPage />} />
        <Route path="attendance" element={<MarkAttendancePage />} />
        <Route path="marks" element={<UploadMarksPage />} />
        <Route path="import-marks" element={<MarkImportPage />} />
        <Route path="assignments" element={<ManageAssignmentsPage />} />
        <Route path="exams" element={<ExamScheduleManager />} />
      </Routes>
    </StaffLayout>
  );
};

export default StaffRoutes;
