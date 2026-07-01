import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Profile from '../pages/Profile';
import ExamScheduleManager from '../pages/ExamScheduleManager';
import MarkImportPage from '../pages/MarkImportPage';
import { 
  Users, CheckSquare, Award, BookOpen, Calendar, HelpCircle, Save, 
  PlusCircle, Eye, EyeOff, Sparkles, Clock, ChevronRight, CheckCircle2, ArrowLeft
} from 'lucide-react';
import CustomSelect from '../components/common/CustomSelect';
import TimeDropdownPicker from '../components/common/TimeDropdownPicker';

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
            Select an operation below or in the sidebar to organize assignments, schedules, and grades.
          </p>
        </div>
      </div>

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

      <div className="glass-card">
        <h3 style={{ marginBottom: '16px' }}>Quick Syllabus Log</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.7', marginBottom: '20px' }}>
          All continuous evaluations (CAT1, CAT2, Model Exams, Assignments) must comply with department frameworks. Please cross-verify students' attendance and internal marks before HOD audit cycles.
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link to="/staff/attendance" className="btn btn-primary" style={{ display: 'inline-flex', gap: '8px', minHeight: '36px' }}>
            Open Attendance Book <ChevronRight size={16} />
          </Link>
          <Link to="/staff/marks" className="btn btn-secondary" style={{ minHeight: '36px' }}>Upload Test Marks</Link>
        </div>
      </div>

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
