import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Profile from '../pages/Profile';
import ExamScheduleManager from '../pages/ExamScheduleManager';
import { Users, CheckSquare, Award, BookOpen, Calendar, HelpCircle, Save, PlusCircle, Eye, EyeOff } from 'lucide-react';

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

  const getHeaderInfo = (pathname) => {
    const path = pathname.toLowerCase().replace(/\/$/, '');
    if (path.endsWith('/dashboard')) {
      return {
        title: 'Dashboard',
        subtitle: `Welcome back, ${user?.name}! Here is your teaching overview.`
      };
    }
    if (path.endsWith('/profile')) {
      return {
        title: 'My Profile',
        subtitle: 'View and manage your academic profile details.'
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
        title: 'Daily Attendance',
        subtitle: 'Log and track student class attendance.'
      };
    }
    if (path.endsWith('/marks')) {
      return {
        title: 'Upload Test Marks',
        subtitle: 'Upload and grade student internal tests and CAT exams.'
      };
    }
    if (path.endsWith('/assignments')) {
      return {
        title: 'Assignments Manager',
        subtitle: 'Create, edit, and post assignment briefs for students.'
      };
    }
    if (path.endsWith('/exams')) {
      return {
        title: 'Exam Scheduler',
        subtitle: 'Configure examination timings, hall numbers, and dates.'
      };
    }
    return {
      title: 'Staff Portal',
      subtitle: `Welcome, ${user?.name}`
    };
  };

  const headerInfo = getHeaderInfo(location.pathname);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      <div className="portal-content">
        <div className="content-header">
          <div className="page-title-group">
            <h1 className="page-title">{headerInfo.title}</h1>
            <p className="page-subtitle">{headerInfo.subtitle}</p>
          </div>
          <div className="user-profile-summary">
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: '600' }}>{user?.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Staff Code: {user?.staffIdCode}</div>
            </div>
            <div className="avatar">{user?.name ? user.name.charAt(0) : 'T'}</div>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
};

// 1. Dashboard
const StaffDashboard = () => {
  const { user, authenticatedFetch } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

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
  }, []);

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div>
      <div className="dashboard-grid">
        <div className="glass-card stat-card">
          <div className="stat-icon stat-icon-primary"><Users size={24} /></div>
          <div>
            <div className="stat-number">{stats?.studentsCount}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>My Students</div>
          </div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon stat-icon-accent"><CheckSquare size={24} /></div>
          <div>
            <div className="stat-number">{stats?.subjectsHandled}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Assigned Subjects</div>
          </div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon stat-icon-success"><BookOpen size={24} /></div>
          <div>
            <div className="stat-number">{stats?.assignmentsUploaded}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Uploaded Tasks</div>
          </div>
        </div>
      </div>

      <div className="glass-card">
        <h3 style={{ marginBottom: '16px' }}>Staff Overview</h3>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '700px' }}>
          You have teaching privileges for department <strong>{user?.departmentCode}</strong>, Year <strong>{stats?.assignedYear}</strong>. 
          Use the side navigation panel to log student attendance, post assignment briefs, schedule semester and test modules, and upload raw marks.
        </p>
      </div>
    </div>
  );
};

// 2. My Students
const MyStudentsPage = () => {
  const { authenticatedFetch } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [registerNumber, setRegisterNumber] = useState('');
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

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const response = await authenticatedFetch('/api/staff/students', {
        method: 'POST',
        body: JSON.stringify({ name, email, phone, password, year, registerNumber })
      });
      const data = await response.json();
      if (response.ok) {
        setAddModal(false);
        setName('');
        setEmail('');
        setPhone('');
        setRegisterNumber('');
        setYear('2');
        setPassword('password');
        fetchStudents();
      } else {
        setError(data.error || 'Failed to add student');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading students...</div>;

  return (
    <>
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2>Class Student Roster</h2>
          <button className="btn btn-primary" onClick={() => setAddModal(true)} style={{ display: 'flex', gap: '8px' }}>
            <PlusCircle size={18} /> Add Student
          </button>
        </div>
        <div className="table-container">
          <table className="portal-table">
            <thead>
              <tr>
                <th>Register Number</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: '600' }}>{s.registerNumber}</td>
                  <td>{s.name}</td>
                  <td>{s.email}</td>
                  <td>{s.phone}</td>
                  <td>
                    <span className="badge badge-success">Active</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {addModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', zIndex: 100, justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
          <div className="glass-card" style={{ width: '400px', background: 'var(--bg-surface-solid)', maxHeight: '90dvh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '20px' }}>Register New Student</h3>
            {error && (
              <div className="alert-banner alert-banner-danger" style={{ marginBottom: '16px' }}>
                <span>{error}</span>
              </div>
            )}
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Register Number</label>
                <input type="text" className="form-control" placeholder="REGXXXXXX" value={registerNumber} onChange={(e) => setRegisterNumber(e.target.value)} required />
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
                <select className="form-control" value={year} onChange={(e) => setYear(e.target.value)}>
                  <option value="1">Year 1</option>
                  <option value="2">Year 2</option>
                  <option value="3">Year 3</option>
                  <option value="4">Year 4</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Default Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ paddingRight: '48px' }}
                    required
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
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" className="btn btn-primary" style={{ flexGrow: 1 }} disabled={saving}>
                  {saving ? 'Saving...' : 'Register Student'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => { setAddModal(false); setError(''); }}>Cancel</button>
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
      
      // Seed default statuses as PRESENT
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

  if (loading) return <div>Loading attendance workspace...</div>;

  return (
    <div className="glass-card">
      <h2>Daily Class Attendance Workspace</h2>
      
      <div style={{ display: 'flex', gap: '20px', margin: '24px 0', flexWrap: 'wrap' }}>
        <div className="form-group" style={{ flexGrow: 1, minWidth: '200px' }}>
          <label className="form-label">Subject</label>
          <select className="form-control" value={selectedSub} onChange={(e) => setSelectedSub(e.target.value)}>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ width: '200px' }}>
          <label className="form-label">Class Date</label>
          <input 
            type="date" 
            className="form-control" 
            value={classDate} 
            min={getTodayDateString()} 
            onChange={(e) => setClassDate(e.target.value)} 
            onClick={(e) => { try { e.target.showPicker(); } catch (err) {} }}
          />
        </div>
      </div>

      <div className="attendance-grid">
        {students.map(s => (
          <div className="attendance-item" key={s.id}>
            <div>
              <div style={{ fontWeight: '600' }}>{s.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{s.registerNumber}</div>
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
                style={{ backgroundColor: statuses[s.id] === 'OD' ? 'var(--accent)' : 'transparent', color: statuses[s.id] === 'OD' ? 'white' : 'var(--text-secondary)' }}
                onClick={() => changeStatus(s.id, 'OD')}
              >
                OD
              </button>
            </div>
          </div>
        ))}
      </div>

      <button className="btn btn-primary" style={{ marginTop: '32px', display: 'flex', gap: '8px' }} onClick={handleSave} disabled={saving}>
        <Save size={18} /> {saving ? 'Saving...' : 'Save Attendance'}
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

  if (loading) return <div>Loading marks workspace...</div>;

  return (
    <div className="glass-card" style={{ maxWidth: '600px' }}>
      <h2>Upload Test Marks</h2>
      <form onSubmit={handleSave} style={{ marginTop: '24px' }}>
        <div className="form-group">
          <label className="form-label">Student</label>
          <select className="form-control" value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)}>
            {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.registerNumber})</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Subject</label>
          <select className="form-control" value={selectedSub} onChange={(e) => setSelectedSub(e.target.value)}>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Assessment Type</label>
          <select className="form-control" value={examType} onChange={(e) => setExamType(e.target.value)}>
            <option value="CAT1">CAT 1</option>
            <option value="CAT2">CAT 2</option>
            <option value="MODEL">MODEL Exam</option>
            <option value="ASSIGNMENT">Assignment</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div className="form-group" style={{ flexGrow: 1 }}>
            <label className="form-label">Max Marks</label>
            <input type="number" className="form-control" value={maxMarks} onChange={(e) => setMaxMarks(e.target.value)} required />
          </div>
          <div className="form-group" style={{ flexGrow: 1 }}>
            <label className="form-label">Scored Marks</label>
            <input type="number" step="0.01" className="form-control" value={scored} onChange={(e) => setScored(e.target.value)} required />
          </div>
        </div>
        <button type="submit" className="btn btn-primary" style={{ marginTop: '16px', width: '100%' }} disabled={saving}>
          {saving ? 'Uploading...' : 'Upload Marks'}
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
        alert('Assignment uploaded.');
        setTitle('');
        setDesc('');
        setDueDate('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading assignment manager...</div>;

  return (
    <div className="glass-card" style={{ maxWidth: '650px' }}>
      <h2>Post Course Assignment Brief</h2>
      <form onSubmit={handleCreate} style={{ marginTop: '24px' }}>
        <div className="form-group">
          <label className="form-label">Subject</label>
          <select className="form-control" value={selectedSub} onChange={(e) => setSelectedSub(e.target.value)}>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Assignment Title</label>
          <input type="text" className="form-control" placeholder="SQL Lab Exercise" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">Brief Description</label>
          <textarea className="form-control" rows="4" placeholder="Enter assignment tasks, upload links..." value={desc} onChange={(e) => setDesc(e.target.value)}></textarea>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div className="form-group" style={{ flexGrow: 1 }}>
            <label className="form-label">Due Date</label>
            <input 
              type="date" 
              className="form-control" 
              value={dueDate} 
              min={getTodayDateString()} 
              onChange={(e) => setDueDate(e.target.value)} 
              onClick={(e) => { try { e.target.showPicker(); } catch (err) {} }}
              required 
            />
          </div>
          <div className="form-group" style={{ flexGrow: 1 }}>
            <label className="form-label">Max Marks</label>
            <input type="number" className="form-control" value={maxMarks} onChange={(e) => setMaxMarks(e.target.value)} required />
          </div>
        </div>
        <button type="submit" className="btn btn-primary" style={{ marginTop: '16px', width: '100%' }} disabled={saving}>
          {saving ? 'Uploading...' : 'Publish Assignment'}
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
      const response = await authenticatedFetch('/api/staff/exams/create', {
        method: 'POST',
        body: JSON.stringify({
          subjectId: selectedSub,
          examType: examType,
          examDate: date,
          examTime: time + ':00', // standard LocalTime formatting
          hallNumber: hall
        })
      });
      if (response.ok) {
        alert('Exam schedule updated.');
        setDate('');
        setHall('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading exam scheduler...</div>;

  return (
    <div className="glass-card" style={{ maxWidth: '600px' }}>
      <h2>Set Exam Schedule</h2>
      <form onSubmit={handleSave} style={{ marginTop: '24px' }}>
        <div className="form-group">
          <label className="form-label">Subject</label>
          <select className="form-control" value={selectedSub} onChange={(e) => setSelectedSub(e.target.value)}>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Exam Type</label>
          <select className="form-control" value={examType} onChange={(e) => setExamType(e.target.value)}>
            <option value="CAT1">CAT 1</option>
            <option value="CAT2">CAT 2</option>
            <option value="MODEL">MODEL Exam</option>
            <option value="SEMESTER">SEMESTER Final</option>
            <option value="ARREAR">ARREAR Backlog</option>
          </select>
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
              onClick={(e) => { try { e.target.showPicker(); } catch (err) {} }}
              required 
            />
          </div>
          <div className="form-group" style={{ flexGrow: 1 }}>
            <label className="form-label">Time Slot</label>
            <input 
              type="time" 
              className="form-control" 
              value={time} 
              min={date === getTodayDateString() ? getCurrentTimeString() : undefined} 
              onChange={(e) => setTime(e.target.value)} 
              onClick={(e) => { try { e.target.showPicker(); } catch (err) {} }}
              required 
            />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Hall Number</label>
          <input type="text" className="form-control" placeholder="LH 301 / MAIN AUDI" value={hall} onChange={(e) => setHall(e.target.value)} required />
        </div>
        <button type="submit" className="btn btn-primary" style={{ marginTop: '16px', width: '100%' }} disabled={saving}>
          {saving ? 'Scheduling...' : 'Set Exam Date'}
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
        <Route path="assignments" element={<ManageAssignmentsPage />} />
        <Route path="exams" element={<ExamScheduleManager />} />
      </Routes>
    </StaffLayout>
  );
};

export default StaffRoutes;
