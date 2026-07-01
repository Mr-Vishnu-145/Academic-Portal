import React, { useEffect, useRef, useState } from 'react';
import { Routes, Route, useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Profile from '../pages/Profile';
import ExamScheduleManager from '../pages/ExamScheduleManager';
import MarkImportPage from '../pages/MarkImportPage';
import SemesterResultUploadPage from '../pages/SemesterResultUploadPage';
import { 
  Users, Briefcase, Award, GraduationCap, ShieldAlert, PlusCircle, 
  Save, Eye, EyeOff, CheckCircle, RefreshCw, XCircle, ArrowRight, ShieldCheck, ArrowLeft 
} from 'lucide-react';
import CustomSelect from '../components/common/CustomSelect';
import useStaffUpdates from '../hooks/useStaffUpdates';

const HodLayout = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const showBackButton = !location.pathname.toLowerCase().endsWith('/dashboard');

  const getHeaderInfo = (pathname) => {
    const path = pathname.toLowerCase().replace(/\/$/, '');
    if (path.endsWith('/dashboard')) {
      return {
        title: 'HOD Executive Cockpit',
        subtitle: `Departmental management console for Dr. ${user?.name ? user.name.split(' ').pop() : 'Connor'}.`
      };
    }
    if (path.endsWith('/profile')) {
      return {
        title: 'HOD Session Profile',
        subtitle: 'View your official credentials and security settings.'
      };
    }
    if (path.endsWith('/students')) {
      return {
        title: 'Student Demographics Registry',
        subtitle: `Track and monitor active learners enrolled in the ${user?.departmentCode || 'CSE'} department.`
      };
    }
    if (path.endsWith('/staff')) {
      return {
        title: 'Faculty & Instructor Directory',
        subtitle: 'Register faculty accounts and assign academic year oversight.'
      };
    }
    if (path.endsWith('/exams')) {
      return {
        title: 'Exam Coordination Board',
        subtitle: 'Supervise department-wide test timetables and hall logs.'
      };
    }
    if (path.endsWith('/results/upload')) {
      return {
        title: 'Import Term Results',
        subtitle: 'Compile semester end exam draft marksheets for publication.'
      };
    }
    if (path.endsWith('/results')) {
      return {
        title: 'Release Semester Grades',
        subtitle: 'Audit and approve final grades to calculate student SGPA/CGPA records.'
      };
    }
    if (path.endsWith('/import-marks')) {
      return {
        title: 'Automatic Grade Extraction',
        subtitle: 'OCR and Excel file grade processor for HOD validation.'
      };
    }
    return {
      title: 'Department Workspace',
      subtitle: `Authorized: HOD Session`
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

// 1. HOD Dashboard
const HodDashboard = () => {
  const { authenticatedFetch } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authenticatedFetch('/api/hod/dashboard')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch HOD stats');
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
            <ShieldCheck size={16} />
            <span>Administrative Command</span>
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '8px' }}>Welcome, HOD of {stats?.departmentName || 'CSE'}</h2>
          <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)' }}>
            Oversight active for academic schedules, grade registries, and results validation. 
            All changes will immediately replicate across student nodes.
          </p>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="glass-card stat-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="stat-number">{stats?.studentsCount}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>Enrolled Students</div>
          </div>
          <div className="stat-icon stat-icon-primary">
            <Users size={24} />
          </div>
        </div>
        <div className="glass-card stat-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="stat-number">{stats?.staffCount}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>Department Staff</div>
          </div>
          <div className="stat-icon stat-icon-accent">
            <Briefcase size={24} />
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ marginBottom: '12px' }}>Operational Scope Settings</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.7', marginBottom: '20px' }}>
          As Head of the <strong>{stats?.departmentName} ({stats?.departmentCode})</strong>, your access level permits you to govern employee access tokens, register study sections, set examinations, and sign off on terminal SGPA reports.
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link to="/hod/results" className="btn btn-primary" style={{ display: 'inline-flex', gap: '8px', minHeight: '40px' }}>
            Go to Results Release <ArrowRight size={16} />
          </Link>
          <Link to="/hod/staff" className="btn btn-secondary" style={{ minHeight: '40px' }}>Faculty Directory</Link>
        </div>
      </div>

    </div>
  );
};

// 2. Manage Staff (with WebSocket transfers live status indicators)
const ManageStaffPage = () => {
  const { authenticatedFetch, user } = useAuth();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  
  const [editUser, setEditUser] = useState(null);
  const [isActive, setIsActive] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  const [designation, setDesignation] = useState('');
  const [section, setSection] = useState('');
  const [staffIdCode, setStaffIdCode] = useState('');
  const [departments, setDepartments] = useState([]);
  const [deptId, setDeptId] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('password');
  const [role, setRole] = useState('STAFF');
  const [year, setYear] = useState('2');
  const [registerNumber, setRegisterNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [liveToast, setLiveToast] = useState(null);

  const fetchStaff = () => {
    authenticatedFetch('/api/hod/staff')
      .then(res => res.json())
      .then(data => {
        setStaffList(data);
        setLoading(false);
      });
  };

  const fetchDepts = () => {
    authenticatedFetch('/api/admin/departments')
      .then(res => res.json())
      .then(data => setDepartments(data))
      .catch(() => {});
  };

  // Live WebSocket updates — refresh list instantly
  useStaffUpdates((event) => {
    if (event.type === 'DEPT_TRANSFER') {
      fetchStaff();
      setLiveToast(`🔄 Staff Shift: ${event.staffName} transferred to ${event.newDeptCode}`);
      setTimeout(() => setLiveToast(null), 4000);
    }
  });

  useEffect(() => {
    fetchStaff();
    fetchDepts();
  }, []);

  const startAdd = () => {
    setEditUser(null);
    setName('');
    setEmail('');
    setPhone('');
    setPassword('password');
    setYear('2');
    setRegisterNumber('');
    setStaffIdCode('');
    setDesignation('');
    setSection('');
    setIsActive(true);
    setRole('STAFF');
    setAddModal(true);
  };

  const startEdit = (u) => {
    setEditUser(u);
    setName(u.name);
    setEmail(u.email);
    setPhone(u.phone || '');
    setPassword('');
    setYear(u.year?.toString() || '2');
    setRegisterNumber(u.registerNumber || '');
    setStaffIdCode(u.staffIdCode || '');
    setDesignation(u.designation || '');
    setSection(u.section || '');
    setDeptId(u.department?.id?.toString() || '');
    setIsActive(u.isActive ?? true);
    setRole(u.role);
    setAddModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const response = await authenticatedFetch(`/api/hod/staff/${deleteConfirm}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setDeleteConfirm(null);
        fetchStaff();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete staff member');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred.');
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const isEdit = !!editUser;
    const endpoint = isEdit 
      ? (role === 'STAFF' ? `/api/hod/staff/${editUser.id}` : `/api/hod/students/${editUser.id}`)
      : (role === 'STAFF' ? '/api/hod/staff/add' : '/api/hod/students');
      
    const payload = role === 'STAFF' 
      ? { name, email, phone, year: parseInt(year), isActive, designation, staffIdCode, ...(isEdit && deptId ? { departmentId: parseInt(deptId) } : {}) }
      : { name, email, phone, year: parseInt(year), registerNumber, section, isActive };

    if (password) {
      payload.password = password;
    }

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
        fetchStaff();
      } else {
        setError(data.error || 'Failed to save user');
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
      {/* Live WebSocket toast notification */}
      {liveToast && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
          background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
          color: '#fff', padding: '12px 20px', borderRadius: '10px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          fontSize: '14px', fontWeight: '600',
          animation: 'slideInRight 0.3s ease',
          display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          <RefreshCw size={18} className="animate-spin" />
          <span>{liveToast}</span>
        </div>
      )}

      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2>Faculty Directory</h2>
          <button className="btn btn-primary" onClick={startAdd} style={{ display: 'flex', gap: '8px', minHeight: '36px' }}>
            <PlusCircle size={16} /> Register Instructor
          </button>
        </div>

        <div className="table-container">
          <table className="portal-table">
            <thead>
              <tr>
                <th>Faculty Code</th>
                <th>Instructor Name</th>
                <th>Email Address</th>
                <th>Designation</th>
                <th>Oversight Year</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: '700' }}>{s.staffIdCode}</td>
                  <td>{s.name}</td>
                  <td>{s.email}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{s.designation || '—'}</td>
                  <td style={{ fontWeight: '700', color: 'var(--primary)' }}>Year {s.year}</td>
                  <td>
                    <span className={`badge ${s.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {s.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button className="btn btn-secondary" onClick={() => startEdit(s)} style={{ padding: '4px 10px', minHeight: '28px', fontSize: '12px' }}>
                        Edit
                      </button>
                      <button className="btn btn-secondary" onClick={() => setDeleteConfirm(s.id)} style={{ padding: '4px 10px', minHeight: '28px', fontSize: '12px', color: 'var(--danger)' }}>
                        Deactivate
                      </button>
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
              <h3>{editUser ? 'Update Employee File' : 'Register Department Account'}</h3>
              <button onClick={() => { setAddModal(false); setEditUser(null); setError(''); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><XCircle size={18} /></button>
            </div>
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
                <label className="form-label">Email Address</label>
                <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input type="text" className="form-control" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              
              {!editUser && (
                <div className="form-group">
                  <label className="form-label">Role Category</label>
                  <CustomSelect
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    options={[
                      { value: 'STAFF', label: 'Faculty Staff' },
                      { value: 'STUDENT', label: 'Student Enrollee' }
                    ]}
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Department</label>
                {editUser && role === 'STAFF' && departments.length > 0 ? (
                  <CustomSelect
                    value={deptId}
                    onChange={(e) => setDeptId(e.target.value)}
                    options={departments.map(d => ({ value: String(d.id), label: `${d.code} — ${d.name}` }))}
                  />
                ) : (
                  <input type="text" className="form-control" value={user?.departmentCode || 'N/A'} readOnly style={{ background: 'rgba(255,255,255,0.04)', cursor: 'default', color: 'var(--text-secondary)' }} />
                )}
              </div>

              {role === 'STUDENT' ? (
                <>
                  <div className="form-group">
                    <label className="form-label">Oversight Year</label>
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
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label">Assigned Year</label>
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
                  <div className="form-group">
                    <label className="form-label">Employee ID Code</label>
                    <input type="text" className="form-control" placeholder="STFXXXXXX" value={staffIdCode} onChange={(e) => setStaffIdCode(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Designation</label>
                    <input type="text" className="form-control" placeholder="e.g. Associate Professor" value={designation} onChange={(e) => setDesignation(e.target.value)} required />
                  </div>
                </>
              )}

              <div className="form-group">
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

              {editUser && (
                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label className="form-label">Account Status</label>
                  <CustomSelect
                    value={isActive ? 'true' : 'false'}
                    onChange={(e) => setIsActive(e.target.value === 'true')}
                    options={[
                      { value: 'true', label: 'Active' },
                      { value: 'false', label: 'Inactive / Deactivated' }
                    ]}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" className="btn btn-primary" style={{ flexGrow: 1 }} disabled={saving}>
                  {saving ? 'Saving...' : (editUser ? 'Update Details' : 'Register Account')}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => { setAddModal(false); setEditUser(null); setError(''); }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', zIndex: 110, justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
          <div className="glass-card" style={{ width: '420px', background: 'var(--bg-surface-solid)', padding: '24px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '600', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={20} /> Deactivate Instructor
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Are you sure you want to deactivate this staff account? They will lose their grading permission rights immediately.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setDeleteConfirm(null)} style={{ padding: '8px 16px', fontSize: '14px' }}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={confirmDelete} style={{ background: 'var(--danger)', color: '#fff', border: 'none' }}>
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// 3. Dept Students
const DeptStudentsPage = () => {
  const { authenticatedFetch, user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);

  const [editUser, setEditUser] = useState(null);
  const [isActive, setIsActive] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [section, setSection] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('password');
  const [role, setRole] = useState('STUDENT');
  const [year, setYear] = useState('2');
  const [registerNumber, setRegisterNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const fetchStudents = () => {
    authenticatedFetch('/api/hod/students')
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
    setPassword('password');
    setYear('2');
    setRegisterNumber('');
    setSection('');
    setIsActive(true);
    setRole('STUDENT');
    setAddModal(true);
  };

  const startEdit = (s) => {
    setEditUser(s);
    setName(s.name);
    setEmail(s.email);
    setPhone(s.phone || '');
    setPassword('');
    setYear(s.year?.toString() || '2');
    setRegisterNumber(s.registerNumber || '');
    setSection(s.section || '');
    setIsActive(s.isActive ?? true);
    setRole('STUDENT');
    setAddModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const response = await authenticatedFetch(`/api/hod/students/${deleteConfirm}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setDeleteConfirm(null);
        fetchStudents();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete student');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred.');
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const isEdit = !!editUser;
    const endpoint = isEdit 
      ? (role === 'STAFF' ? `/api/hod/staff/${editUser.id}` : `/api/hod/students/${editUser.id}`)
      : (role === 'STAFF' ? '/api/hod/staff/add' : '/api/hod/students');
      
    const payload = role === 'STAFF' 
      ? { name, email, phone, year: parseInt(year), isActive }
      : { name, email, phone, year: parseInt(year), registerNumber, section, isActive };

    if (password) {
      payload.password = password;
    }

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
          <h2>Student Demographics</h2>
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
                    <span className={`badge ${s.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {s.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button className="btn btn-secondary" onClick={() => startEdit(s)} style={{ padding: '4px 10px', minHeight: '28px', fontSize: '12px' }}>
                        Edit
                      </button>
                      <button className="btn btn-secondary" onClick={() => setDeleteConfirm(s.id)} style={{ padding: '4px 10px', minHeight: '28px', fontSize: '12px', color: 'var(--danger)' }}>
                        Deactivate
                      </button>
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
              <h3>{editUser ? 'Update Student File' : 'Register Department Student'}</h3>
              <button onClick={() => { setAddModal(false); setEditUser(null); setError(''); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><XCircle size={18} /></button>
            </div>
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
                <label className="form-label">Email Address</label>
                <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input type="text" className="form-control" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              
              {!editUser && (
                <div className="form-group">
                  <label className="form-label">Role Category</label>
                  <CustomSelect
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    options={[
                      { value: 'STUDENT', label: 'Student Enrollee' },
                      { value: 'STAFF', label: 'Faculty Staff' }
                    ]}
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Department</label>
                <input type="text" className="form-control" value={user?.departmentCode || 'N/A'} readOnly style={{ background: 'rgba(255,255,255,0.04)', cursor: 'default', color: 'var(--text-secondary)' }} />
              </div>

              {role === 'STUDENT' ? (
                <>
                  <div className="form-group">
                    <label className="form-label">Oversight Year</label>
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
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label">Assigned Year</label>
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
                </>
              )}

              <div className="form-group">
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

              {editUser && (
                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label className="form-label">Account Status</label>
                  <CustomSelect
                    value={isActive ? 'true' : 'false'}
                    onChange={(e) => setIsActive(e.target.value === 'true')}
                    options={[
                      { value: 'true', label: 'Active' },
                      { value: 'false', label: 'Inactive / Deactivated' }
                    ]}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" className="btn btn-primary" style={{ flexGrow: 1 }} disabled={saving}>
                  {saving ? 'Saving...' : (editUser ? 'Update Details' : 'Register Account')}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => { setAddModal(false); setEditUser(null); setError(''); }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', zIndex: 110, justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
          <div className="glass-card" style={{ width: '420px', background: 'var(--bg-surface-solid)', padding: '24px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '600', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={20} /> Deactivate Student
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Are you sure you want to deactivate this student account? They will lose access to course portals immediately.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setDeleteConfirm(null)} style={{ padding: '8px 16px', fontSize: '14px' }}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={confirmDelete} style={{ background: 'var(--danger)', color: '#fff', border: 'none' }}>
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// 4. Publish Results Page (with draft record checklists and warnings)
const PublishResultsPage = () => {
  const { authenticatedFetch, user } = useAuth();
  const [semester, setSemester] = useState('4');
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [publishing, setPublishing] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [draftCount, setDraftCount] = useState(null);
  const [loadingDraft, setLoadingDraft] = useState(true);
  const [draftError, setDraftError] = useState('');
  const [publishStatus, setPublishStatus] = useState({ type: '', message: '' });

  const departmentId = user?.departmentId;

  const fetchDraftCount = async (sem) => {
    if (!departmentId) {
      setDraftError('Session missing department credentials.');
      setLoadingDraft(false);
      return;
    }
    setLoadingDraft(true);
    setDraftError('');
    setDraftCount(null);
    try {
      const response = await authenticatedFetch(
        `/api/admin/results/draft-count?departmentId=${departmentId}&semester=${sem}`
      );
      if (response.ok) {
        const data = await response.json();
        setDraftCount(typeof data.count === 'number' ? data.count : 0);
      } else {
        const errData = await response.json().catch(() => ({}));
        setDraftError(errData.error || `Server error: ${response.status}`);
        setDraftCount(0);
      }
    } catch (err) {
      console.error(err);
      setDraftError('Network disconnected. Check backend server.');
      setDraftCount(0);
    } finally {
      setLoadingDraft(false);
    }
  };

  useEffect(() => {
    fetchDraftCount(semester);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [semester, departmentId]);

  const handlePublish = async (e) => {
    e.preventDefault();
    setPublishStatus({ type: '', message: '' });
    await fetchDraftCount(semester);
    setShowPublishConfirm(true);
  };

  const doPublish = async () => {
    setShowPublishConfirm(false);
    setPublishing(true);
    setPublishStatus({ type: '', message: '' });
    try {
      const response = await authenticatedFetch('/api/admin/results/publish', {
        method: 'POST',
        body: JSON.stringify({ departmentId, semester })
      });
      const data = await response.json();
      if (response.ok) {
        setPublishStatus({ type: 'success', message: data.message || 'Results published successfully.' });
        fetchDraftCount(semester);
      } else {
        setPublishStatus({ type: 'error', message: data.error || 'Failed to publish results.' });
      }
    } catch (err) {
      console.error(err);
      setPublishStatus({ type: 'error', message: 'Network timeout during publication.' });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '620px' }}>

      {publishStatus.type === 'success' && (
        <div className="alert-banner alert-banner-success">
          <CheckCircle size={18} />
          <span>{publishStatus.message}</span>
        </div>
      )}
      {publishStatus.type === 'error' && (
        <div className="alert-banner alert-banner-danger">
          <ShieldAlert size={18} />
          <span>{publishStatus.message}</span>
        </div>
      )}

      <div className="glass-card" style={{ width: '100%' }}>
        <h2 style={{ marginTop: 0, marginBottom: '6px' }}>Publish Semester Results</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginBottom: '20px' }}>
          Releasing grades makes semester report cards downloadable for students and locks GPA indices.
        </p>

        <div style={{ padding: '16px', background: 'var(--warning-surface)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: 'var(--radius-sm)', color: 'var(--warning)', fontSize: '13px', marginBottom: '20px', display: 'flex', gap: '8px' }}>
          <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Irreversible Action:</strong> Releasing grades instantly triggers WebHook updates and alerts student profiles. Recalculation takes up to 30 seconds.
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label className="form-label">Authorized Department Scope</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-muted)', border: '1px solid var(--border)', fontSize: '14px' }}>
            <Briefcase size={16} style={{ color: 'var(--primary)' }} />
            {departmentId ? (
              <strong style={{ color: 'var(--primary)' }}>{user.departmentCode} Department (ID: {departmentId})</strong>
            ) : (
              <span style={{ color: 'var(--danger)' }}>⚠ Session invalid. Re-login.</span>
            )}
          </div>
        </div>

        <form onSubmit={handlePublish}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Academic Calendar Year</label>
            <CustomSelect
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              options={[
                { value: '2025-2026', label: '2025-2026' },
                { value: '2024-2025', label: '2024-2025' }
              ]}
            />
          </div>
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Semester Track</label>
            <CustomSelect
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              options={[1,2,3,4,5,6,7,8].map(n => ({ value: String(n), label: `Semester ${n}` }))}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '16px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-muted)', border: '1px solid var(--border)', marginBottom: '24px', fontSize: '13px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {loadingDraft ? (
                <><RefreshCw size={14} className="animate-spin" /><span style={{ color: 'var(--text-muted)' }}>Scanning draft database...</span></>
              ) : draftError ? (
                <><ShieldAlert size={16} style={{ color: 'var(--danger)' }} /><span>{draftError}</span></>
              ) : draftCount > 0 ? (
                <><CheckCircle size={16} style={{ color: 'var(--success)' }} /><span>Ready to Release: <strong>{draftCount} Student Grade records</strong></span></>
              ) : (
                <><XCircle size={16} style={{ color: 'var(--text-muted)' }} /><span>No drafts found. Upload semester files first.</span></>
              )}
            </div>
            {!loadingDraft && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => fetchDraftCount(semester)}
                style={{ padding: '4px 10px', minHeight: '28px', fontSize: '12px' }}
              >
                Refresh
              </button>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '13px' }}
            disabled={publishing || loadingDraft || !departmentId || draftCount === 0 || draftCount === null}
          >
            {publishing ? 'Publishing...' : draftCount > 0 ? `Confirm Publication (${draftCount} records)` : 'Publish Grades'}
          </button>
        </form>
      </div>

      {showPublishConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', zIndex: 110, justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
          <div className="glass-card" style={{ width: '450px', background: 'var(--bg-surface-solid)', padding: '28px', borderRadius: 'var(--radius-lg)' }}>
            <div className="widget-header">
              <h3 style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldCheck size={20} /> Publish Release Audit</h3>
              <button onClick={() => setShowPublishConfirm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><XCircle size={18} /></button>
            </div>
            
            <div style={{ padding: '16px', background: 'var(--bg-muted)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '13.5px', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <div>Department: <strong style={{ color: 'var(--primary)' }}>{user?.departmentCode}</strong></div>
              <div>Semester: <strong>Semester {semester}</strong></div>
              <div>Academic Term: <strong>{academicYear}</strong></div>
              <div>Release Size: <strong style={{ color: 'var(--primary)' }}>{draftCount} Grade records</strong></div>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '24px' }}>
              Dr. {user?.name.split(' ').pop()}, this authorization publishes the finalized grades database. GPAs will calculate, and students can download signs instantly.
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="button" className="btn btn-primary" style={{ flexGrow: 1 }} onClick={doPublish} disabled={publishing}>
                {publishing ? 'Publishing...' : 'Authorize Release'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowPublishConfirm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const HodRoutes = () => {
  return (
    <HodLayout>
      <Routes>
        <Route path="dashboard" element={<HodDashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="staff" element={<ManageStaffPage />} />
        <Route path="students" element={<DeptStudentsPage />} />
        <Route path="exams" element={<ExamScheduleManager />} />
        <Route path="import-marks" element={<MarkImportPage />} />
        <Route path="results/upload" element={<SemesterResultUploadPage />} />
        <Route path="results" element={<PublishResultsPage />} />
      </Routes>
    </HodLayout>
  );
};

export default HodRoutes;
