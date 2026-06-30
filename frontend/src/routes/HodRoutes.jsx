import React, { useEffect, useRef, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Profile from '../pages/Profile';
import ExamScheduleManager from '../pages/ExamScheduleManager';
import MarkImportPage from '../pages/MarkImportPage';
import SemesterResultUploadPage from '../pages/SemesterResultUploadPage';
import { Users, Briefcase, Award, GraduationCap, ShieldAlert, PlusCircle, Save, Eye, EyeOff, CheckCircle } from 'lucide-react';
import CustomSelect from '../components/common/CustomSelect';
import useStaffUpdates from '../hooks/useStaffUpdates';

const HodLayout = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  const getHeaderInfo = (pathname) => {
    const path = pathname.toLowerCase().replace(/\/$/, '');
    if (path.endsWith('/dashboard')) {
      return {
        title: 'Dashboard',
        subtitle: `Welcome back, Dr. ${user?.name ? user.name.split(' ').pop() : 'Connor'}! Department management overview.`
      };
    }
    if (path.endsWith('/profile')) {
      return {
        title: 'My Profile',
        subtitle: 'View and manage HOD profile details.'
      };
    }
    if (path.endsWith('/students')) {
      return {
        title: 'Department Students',
        subtitle: `View and monitor students in the ${user?.departmentCode || 'CSE'} department.`
      };
    }
    if (path.endsWith('/staff')) {
      return {
        title: 'Staff Directory',
        subtitle: 'Register new staff members and assign year permissions.'
      };
    }
    if (path.endsWith('/exams')) {
      return {
        title: 'Exam Schedule Tracker',
        subtitle: 'Review department-wide exam schedules and timetables.'
      };
    }
    if (path.endsWith('/results/upload')) {
      return {
        title: 'Semester Result Upload',
        subtitle: 'Upload semester end exam marksheets in draft status.'
      };
    }
    if (path.endsWith('/results')) {
      return {
        title: 'Publish Results',
        subtitle: 'Review and release student semester exam results to calculate CGPA.'
      };
    }
    if (path.endsWith('/import-marks')) {
      return {
        title: 'Mark Import & Auto Entry',
        subtitle: 'Upload department mark sheets and automatically extract/manage student grades.'
      };
    }
    return {
      title: 'HOD Portal',
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
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Head of Department</div>
            </div>
            <div className="avatar">{user?.name ? user.name.charAt(0) : 'H'}</div>
          </div>
        </div>
        {children}
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

  if (loading) return <div>Loading HOD dashboard...</div>;

  return (
    <div>
      <div className="dashboard-grid">
        <div className="glass-card stat-card">
          <div className="stat-icon stat-icon-primary"><Users size={24} /></div>
          <div>
            <div className="stat-number">{stats?.studentsCount}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Total Students (All Years)</div>
          </div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon stat-icon-accent"><Briefcase size={24} /></div>
          <div>
            <div className="stat-number">{stats?.staffCount}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Department Staff members</div>
          </div>
        </div>
      </div>

      <div className="glass-card">
        <h3 style={{ marginBottom: '16px' }}>Department Scope Management</h3>
        <p style={{ color: 'var(--text-secondary)' }}>
          As HOD of the <strong>{stats?.departmentName} ({stats?.departmentCode})</strong>, you are responsible for monitoring student records, managing staff roles and duties, and finalizing semester results publication to calculate student GPAs.
        </p>
      </div>
    </div>
  );
};

// 2. Manage Staff
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

  // Live WebSocket updates — refresh staff list instantly when any dept transfer happens
  useStaffUpdates((event) => {
    if (event.type === 'DEPT_TRANSFER') {
      fetchStaff();
      setLiveToast(`🔄 ${event.staffName} transferred to ${event.newDeptCode}`);
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
      : { name, email, phone, year: parseInt(year), registerNumber, isActive, section };

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

  if (loading) return <div>Loading staff list...</div>;

  return (
    <>
      {/* Live WebSocket toast notification */}
      {liveToast && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
          background: 'linear-gradient(135deg, var(--primary), var(--accent))',
          color: '#fff', padding: '12px 20px', borderRadius: '10px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          fontSize: '14px', fontWeight: '600',
          animation: 'slideInRight 0.3s ease',
          display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          <span style={{ fontSize: '18px' }}>🔄</span>
          <span>{liveToast}</span>
        </div>
      )}

      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2>Faculty & Staff Registry</h2>
          <button className="btn btn-primary" onClick={startAdd} style={{ display: 'flex', gap: '8px' }}>
            <PlusCircle size={18} /> Add Faculty
          </button>
        </div>

        <div className="table-container">
          <table className="portal-table">
            <thead>
              <tr>
                <th>Staff Code</th>
                <th>Name</th>
                <th>Email</th>
                <th>Designation</th>
                <th>Assigned Year</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: '600' }}>{s.staffIdCode}</td>
                  <td>{s.name}</td>
                  <td>{s.email}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{s.designation || '—'}</td>
                  <td style={{ fontWeight: '600', color: 'var(--primary)' }}>Year {s.year}</td>
                  <td>
                    <span className={`badge ${s.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {s.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button className="btn btn-secondary" onClick={() => startEdit(s)} style={{ padding: '4px 8px' }}>
                        Edit
                      </button>
                      <button className="btn btn-secondary" onClick={() => setDeleteConfirm(s.id)} style={{ padding: '4px 8px', color: 'var(--danger)' }}>
                        Delete
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
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', zIndex: 100, justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
          <div className="glass-card" style={{ width: '400px', background: 'var(--bg-surface-solid)', maxHeight: '90dvh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '20px' }}>{editUser ? 'Update Department User' : 'Register Department User'}</h3>
            {error && (
              <div className="alert-banner alert-banner-danger" style={{ marginBottom: '16px', padding: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '4px', color: '#f87171' }}>
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
                  <label className="form-label">Role</label>
                  <CustomSelect
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    options={[
                      { value: 'STAFF', label: 'Staff' },
                      { value: 'STUDENT', label: 'Student' }
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
                    options={departments.map(d => ({ value: d.id, label: `${d.code} — ${d.name}` }))}
                  />
                ) : (
                  <input type="text" className="form-control" value={user?.departmentCode || 'N/A'} readOnly style={{ background: 'rgba(255,255,255,0.04)', cursor: 'default', color: 'var(--text-secondary)' }} />
                )}
              </div>

              {role === 'STUDENT' ? (
                <>
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
                    <label className="form-label">Employee ID / Staff Code</label>
                    <input type="text" className="form-control" placeholder="STFXXXXXX" value={staffIdCode} onChange={(e) => setStaffIdCode(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Designation</label>
                    <input type="text" className="form-control" placeholder="e.g. Professor" value={designation} onChange={(e) => setDesignation(e.target.value)} required />
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
                    aria-label={showPassword ? "Hide password" : "Show password"}
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
                  {saving ? 'Saving...' : (editUser ? 'Update' : 'Register')}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => { setAddModal(false); setEditUser(null); setError(''); }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', zIndex: 110, justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
          <div className="glass-card" style={{ width: '420px', background: 'var(--bg-surface-solid)', padding: '24px', borderRadius: '8px', border: '1px solid var(--border)', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '600', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={20} /> Deactivate Staff Member
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Are you sure you want to deactivate this staff member? This will disable their portal login and set their status to Inactive.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setDeleteConfirm(null)} style={{ padding: '8px 16px', fontSize: '14px' }}>
                Cancel
              </button>
              <button type="button" className="btn" onClick={confirmDelete} style={{ padding: '8px 16px', fontSize: '14px', background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
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

  if (loading) return <div>Loading department students...</div>;

  return (
    <>
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2>Department Student Demographics</h2>
          <button className="btn btn-primary" onClick={startAdd} style={{ display: 'flex', gap: '8px' }}>
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
                <th>Year / Section</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: '600' }}>{s.registerNumber}</td>
                  <td>{s.name}</td>
                  <td>{s.email}</td>
                  <td>Year {s.year}{s.section ? ` - Sec ${s.section}` : ''}</td>
                  <td>
                    <span className={`badge ${s.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {s.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button className="btn btn-secondary" onClick={() => startEdit(s)} style={{ padding: '4px 8px' }}>
                        Edit
                      </button>
                      <button className="btn btn-secondary" onClick={() => setDeleteConfirm(s.id)} style={{ padding: '4px 8px', color: 'var(--danger)' }}>
                        Delete
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
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', zIndex: 100, justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
          <div className="glass-card" style={{ width: '400px', background: 'var(--bg-surface-solid)', maxHeight: '90dvh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '20px' }}>{editUser ? 'Update Department Student' : 'Register Department User'}</h3>
            {error && (
              <div className="alert-banner alert-banner-danger" style={{ marginBottom: '16px', padding: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '4px', color: '#f87171' }}>
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
                  <label className="form-label">Role</label>
                  <CustomSelect
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    options={[
                      { value: 'STUDENT', label: 'Student' },
                      { value: 'STAFF', label: 'Staff' }
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
                    aria-label={showPassword ? "Hide password" : "Show password"}
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
                  {saving ? 'Saving...' : (editUser ? 'Update' : 'Register')}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => { setAddModal(false); setEditUser(null); setError(''); }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', zIndex: 110, justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
          <div className="glass-card" style={{ width: '420px', background: 'var(--bg-surface-solid)', padding: '24px', borderRadius: '8px', border: '1px solid var(--border)', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '600', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={20} /> Deactivate Student
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Are you sure you want to deactivate this student? This will disable their portal login and set their status to Inactive.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setDeleteConfirm(null)} style={{ padding: '8px 16px', fontSize: '14px' }}>
                Cancel
              </button>
              <button type="button" className="btn" onClick={confirmDelete} style={{ padding: '8px 16px', fontSize: '14px', background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// 4. Publish Results
const PublishResultsPage = () => {
  const { authenticatedFetch, user } = useAuth();
  const [semester, setSemester] = useState('4');
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [publishing, setPublishing] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [draftCount, setDraftCount] = useState(null);
  const [loadingDraft, setLoadingDraft] = useState(true); // start as true
  const [draftError, setDraftError] = useState('');
  const [publishStatus, setPublishStatus] = useState({ type: '', message: '' });

  // departmentId MUST come from user session — HOD is always locked to their dept
  const departmentId = user?.departmentId;

  const fetchDraftCount = async (sem) => {
    if (!departmentId) {
      setDraftError('Your session is missing department info. Please log out and log back in.');
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
        setDraftError(errData.error || `Server error ${response.status} — could not load draft count.`);
        setDraftCount(0);
      }
    } catch (err) {
      console.error('fetchDraftCount error:', err);
      setDraftError('Network error. Is the backend server running?');
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
        fetchDraftCount(semester); // refresh — draft count should now be 0
      } else {
        setPublishStatus({ type: 'error', message: data.error || 'Failed to publish results.' });
      }
    } catch (err) {
      console.error(err);
      setPublishStatus({ type: 'error', message: 'Network error while publishing. Is the backend running?' });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '620px' }}>

      {/* Success / Error status banners */}
      {publishStatus.type === 'success' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', borderRadius: '8px', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', color: '#4ade80' }}>
          <CheckCircle size={20} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '14px' }}>{publishStatus.message}</span>
        </div>
      )}
      {publishStatus.type === 'error' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', borderRadius: '8px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}>
          <ShieldAlert size={20} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '14px' }}>{publishStatus.message}</span>
        </div>
      )}

      <div className="glass-card" style={{ width: '100%' }}>
        <h2 style={{ marginTop: 0, marginBottom: '6px' }}>Publish Academic Results</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: 0, marginBottom: '20px' }}>
          Releasing results makes them visible to students and triggers SGPA/CGPA recalculation.
        </p>

        {/* Warning banner */}
        <div style={{ padding: '12px 16px', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '8px', color: '#fcd34d', fontSize: '13px', marginBottom: '20px', lineHeight: '1.6' }}>
          ⚠ <strong>Warning:</strong> This action cannot be undone. Published results will be immediately visible to all students.
        </div>

        {/* Department locked badge */}
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label className="form-label">Department (locked to your dept)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', fontSize: '14px' }}>
            <Briefcase size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            {departmentId ? (
              <strong style={{ color: 'var(--primary)' }}>{user.departmentCode} (ID: {departmentId})</strong>
            ) : (
              <span style={{ color: '#f87171' }}>⚠ Department not found in session — please re-login</span>
            )}
          </div>
        </div>

        <form onSubmit={handlePublish}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Academic Year</label>
            <CustomSelect
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              options={[
                { value: '2025-2026', label: '2025-2026' },
                { value: '2024-2025', label: '2024-2025' },
                { value: '2023-2024', label: '2023-2024' }
              ]}
            />
          </div>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label">Semester</label>
            <CustomSelect
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              options={[1,2,3,4,5,6,7,8].map(n => ({ value: String(n), label: `Semester ${n}` }))}
            />
          </div>

          {/* Live draft count status box */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '14px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', marginBottom: '20px', fontSize: '13px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {loadingDraft ? (
                <><span style={{ color: 'var(--text-secondary)' }}>⏳</span><span style={{ color: 'var(--text-secondary)' }}>Checking draft records for Semester {semester}…</span></>
              ) : draftError ? (
                <><ShieldAlert size={16} style={{ color: '#f87171', flexShrink: 0 }} /><span style={{ color: '#f87171' }}>{draftError}</span></>
              ) : draftCount > 0 ? (
                <><CheckCircle size={16} style={{ color: '#4ade80', flexShrink: 0 }} /><span><strong style={{ color: '#4ade80' }}>{draftCount} unpublished record{draftCount !== 1 ? 's' : ''}</strong> ready to publish for Semester {semester}</span></>
              ) : (
                <><ShieldAlert size={16} style={{ color: '#fbbf24', flexShrink: 0 }} /><span style={{ color: '#fbbf24' }}>No draft results for Semester {semester}. Upload results first via <strong>Results → Upload</strong>.</span></>
              )}
            </div>
            {/* Manual refresh button */}
            {!loadingDraft && (
              <button
                type="button"
                onClick={() => fetchDraftCount(semester)}
                style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-secondary)', padding: '4px 10px', cursor: 'pointer', fontSize: '12px', whiteSpace: 'nowrap' }}
              >
                ↻ Refresh
              </button>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '13px', fontSize: '15px', fontWeight: '600' }}
            disabled={publishing || loadingDraft || !departmentId || draftCount === 0 || draftCount === null}
          >
            {publishing ? '⏳ Publishing…' : draftCount > 0 ? `Review & Publish ${draftCount} Record${draftCount !== 1 ? 's' : ''}` : 'Publish Grades'}
          </button>
        </form>
      </div>

      {/* Confirmation modal */}
      {showPublishConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', zIndex: 110, justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
          <div className="glass-card" style={{ width: '460px', maxWidth: '100%', background: 'var(--bg-surface-solid)', padding: '28px', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 16px 48px rgba(0,0,0,0.65)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '700', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={20} /> Confirm Publication
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px', lineHeight: '1.8' }}>
              <div><span style={{ color: 'var(--text-secondary)', display: 'inline-block', width: '130px' }}>Department:</span> <strong style={{ color: 'var(--primary)' }}>{user?.departmentCode} (Dept #{departmentId})</strong></div>
              <div><span style={{ color: 'var(--text-secondary)', display: 'inline-block', width: '130px' }}>Semester:</span> <strong>Semester {semester}</strong></div>
              <div><span style={{ color: 'var(--text-secondary)', display: 'inline-block', width: '130px' }}>Academic Year:</span> <strong>{academicYear}</strong></div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'inline-block', width: '130px' }}>Draft Records:</span>
                <strong style={{ color: draftCount > 0 ? '#4ade80' : '#fbbf24' }}>
                  {draftCount} record{draftCount !== 1 ? 's' : ''}
                </strong>
              </div>
            </div>

            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.7', padding: '12px', background: 'rgba(245,158,11,0.05)', borderRadius: '6px', border: '1px solid rgba(245,158,11,0.1)' }}>
              {draftCount > 0
                ? `Publishing will make all ${draftCount} result record(s) for Semester ${semester} visible to students in your department. SGPA and CGPA will be recalculated automatically. This cannot be undone.`
                : 'No draft results available to publish. Please upload semester results first.'}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowPublishConfirm(false)} style={{ padding: '10px 20px' }}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={doPublish}
                disabled={draftCount === 0 || publishing}
                style={{ padding: '10px 20px', fontWeight: '600' }}
              >
                {publishing ? 'Publishing…' : `Publish ${draftCount} Record${draftCount !== 1 ? 's' : ''}`}
              </button>
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
