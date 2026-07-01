import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Users, Building, CreditCard, ShieldCheck, Settings, PlusCircle, 
  Trash, RefreshCw, Eye, EyeOff, CheckCircle, ShieldAlert, Sparkles, XCircle, ArrowLeft 
} from 'lucide-react';
import ExamScheduleManager from '../pages/ExamScheduleManager';
import MarkImportPage from '../pages/MarkImportPage';
import SemesterResultUploadPage from '../pages/SemesterResultUploadPage';
import CustomSelect from '../components/common/CustomSelect';

const getTodayDateString = () => new Date().toLocaleDateString('en-CA');

const AdminLayout = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const showBackButton = !location.pathname.toLowerCase().endsWith('/dashboard');

  const getHeaderInfo = (pathname) => {
    const path = pathname.toLowerCase().replace(/\/$/, '');
    if (path.endsWith('/dashboard')) {
      return {
        title: 'System Admin Center',
        subtitle: `Welcome, ${user?.name || 'Administrator'}! System health metrics and overall database control.`
      };
    }
    if (path.endsWith('/departments')) {
      return {
        title: 'Department Directories',
        subtitle: 'Configure, audit, and append institutional departments.'
      };
    }
    if (path.endsWith('/users')) {
      return {
        title: 'Institution User Registry',
        subtitle: 'CRUD dashboard for all student, staff, HOD, and root administrator accounts.'
      };
    }
    if (path.endsWith('/fees')) {
      return {
        title: 'Fee Structure Master',
        subtitle: 'Configure academic bill invoices, templates, and track incoming receipts.'
      };
    }
    if (path.endsWith('/exams')) {
      return {
        title: 'Academic Exam schedules',
        subtitle: 'Audit and reschedule exam configurations and hall schedules.'
      };
    }
    if (path.endsWith('/results/upload')) {
      return {
        title: 'Terminal Result Logs',
        subtitle: 'Upload and audit draft semester end marks lists.'
      };
    }
    if (path.endsWith('/results')) {
      return {
        title: 'Grade Release Hub',
        subtitle: 'Recalculate SGPA profiles and release final marks to the student database.'
      };
    }
    if (path.endsWith('/import-marks')) {
      return {
        title: 'OCR Marksheet Parser',
        subtitle: 'AI-assisted automated marksheet uploader and database feeder.'
      };
    }
    if (path.endsWith('/settings')) {
      return {
        title: 'System Parameter Settings',
        subtitle: 'Override security profiles, SMTP variables, and database connections.'
      };
    }
    return {
      title: 'Root Console',
      subtitle: `Authorized: Root Admin Session`
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
const AdminDashboard = () => {
  const { authenticatedFetch } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authenticatedFetch('/api/admin/dashboard')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch admin stats');
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
            <span>Root System Administrator Console</span>
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '8px' }}>System Administrator Center</h2>
          <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)' }}>
            Institutional databases fully online. Use this dashboard to manage user access rights, append departments, verify fee collections, and calculate grades.
          </p>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="glass-card stat-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="stat-number">{stats?.totalUsers}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>Active Accounts</div>
          </div>
          <div className="stat-icon stat-icon-primary">
            <Users size={24} />
          </div>
        </div>
        <div className="glass-card stat-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="stat-number">{stats?.totalDepartments}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>Departments</div>
          </div>
          <div className="stat-icon stat-icon-accent">
            <Building size={24} />
          </div>
        </div>
        <div className="glass-card stat-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="stat-number">{stats?.studentCount}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>Registered Learners</div>
          </div>
          <div className="stat-icon stat-icon-success">
            <ShieldCheck size={24} />
          </div>
        </div>
      </div>

      <div className="glass-card">
        <h3 style={{ marginBottom: '16px' }}>System Performance Indicators</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.7', marginBottom: '20px' }}>
          Root database credentials verified. All endpoints replicate in real-time. Background sync tasks executed successfully.
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link to="/admin/users" className="btn btn-primary" style={{ minHeight: '36px' }}>Global User Directory</Link>
          <Link to="/admin/settings" className="btn btn-secondary" style={{ minHeight: '36px' }}>Portal Settings</Link>
        </div>
      </div>

    </div>
  );
};

// 2. Manage Departments
const ManageDepartmentsPage = () => {
  const { authenticatedFetch } = useAuth();
  const [depts, setDepts] = useState([]);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchDepts = () => {
    authenticatedFetch('/api/admin/departments')
      .then(res => res.json())
      .then(data => {
        setDepts(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDepts();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const response = await authenticatedFetch('/api/admin/departments', {
        method: 'POST',
        body: JSON.stringify({ name, code })
      });
      if (response.ok) {
        setName('');
        setCode('');
        fetchDepts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="skeleton-box" style={{ height: '320px' }} />;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }} className="dashboard-grid">
      <div className="glass-card">
        <h2>Department Registry</h2>
        <div className="table-container" style={{ marginTop: '20px' }}>
          <table className="portal-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Department Code</th>
                <th>Department Name</th>
              </tr>
            </thead>
            <tbody>
              {depts.map((d) => (
                <tr key={d.id}>
                  <td>{d.id}</td>
                  <td style={{ fontWeight: '700', color: 'var(--primary)' }}>{d.code}</td>
                  <td style={{ fontWeight: '700' }}>{d.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-card" style={{ height: 'fit-content' }}>
        <h2>Create Department</h2>
        <form onSubmit={handleCreate} style={{ marginTop: '20px' }}>
          <div className="form-group">
            <label className="form-label">Department Name</label>
            <input type="text" className="form-control" placeholder="Computer Science and Engineering" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Code</label>
            <input type="text" className="form-control" placeholder="CSE" value={code} onChange={(e) => setCode(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', minHeight: '44px' }}>Register Department</button>
        </form>
      </div>
    </div>
  );
};

// 3. Manage All Users
const ManageAllUsersPage = () => {
  const { authenticatedFetch } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  
  const [editUser, setEditUser] = useState(null);
  const [isActive, setIsActive] = useState(true);
  const [designation, setDesignation] = useState('');
  const [section, setSection] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('password');
  const [role, setRole] = useState('STUDENT');
  const [deptId, setDeptId] = useState('');
  const [year, setYear] = useState('1');
  const [registerNumber, setRegisterNumber] = useState('');
  const [staffIdCode, setStaffIdCode] = useState('');
  const [departments, setDepartments] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const fetchUsers = () => {
    authenticatedFetch('/api/admin/users')
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      });
  };

  const fetchDepts = () => {
    authenticatedFetch('/api/admin/departments')
      .then(res => res.json())
      .then(data => {
        setDepartments(data);
        if (data.length > 0) setDeptId(data[0].id.toString());
      });
  };

  useEffect(() => {
    fetchUsers();
    fetchDepts();
  }, []);

  const startAdd = () => {
    setEditUser(null);
    setName('');
    setEmail('');
    setPhone('');
    setPassword('password');
    setRole('STUDENT');
    setDeptId(departments[0]?.id?.toString() || '');
    setYear('1');
    setRegisterNumber('');
    setStaffIdCode('');
    setDesignation('');
    setSection('');
    setIsActive(true);
    setAddModal(true);
  };

  const startEdit = (u) => {
    setEditUser(u);
    setName(u.name);
    setEmail(u.email);
    setPhone(u.phone || '');
    setPassword('');
    setRole(u.role);
    setDeptId(u.department?.id?.toString() || '');
    setYear(u.year?.toString() || '1');
    setRegisterNumber(u.registerNumber || '');
    setStaffIdCode(u.staffIdCode || '');
    setDesignation(u.designation || '');
    setSection(u.section || '');
    setIsActive(u.isActive ?? true);
    setAddModal(true);
  };

  const confirmDeactivate = async () => {
    if (!deleteConfirm) return;
    try {
      const response = await authenticatedFetch(`/api/admin/users/${deleteConfirm}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setDeleteConfirm(null);
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const isEdit = !!editUser;
    const endpoint = isEdit ? `/api/admin/users/${editUser.id}` : '/api/admin/users';

    const payload = {
      name,
      email,
      phone,
      role,
      departmentId: role !== 'ADMIN' && deptId ? parseInt(deptId) : null,
      year: role === 'STUDENT' ? parseInt(year) : null,
      registerNumber: role === 'STUDENT' ? registerNumber : null,
      staffIdCode: (role === 'STAFF' || role === 'HOD') ? staffIdCode : null,
      designation: (role === 'STAFF' || role === 'HOD') ? designation : null,
      section: role === 'STUDENT' ? section : null,
      isActive: isActive
    };

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
        setStaffIdCode('');
        setDesignation('');
        setSection('');
        fetchUsers();
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
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2>Global User Registry</h2>
          <button className="btn btn-primary" onClick={startAdd} style={{ display: 'flex', gap: '8px', minHeight: '36px' }}>
            <PlusCircle size={16} /> Register User
          </button>
        </div>

        <div className="table-container">
          <table className="portal-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email Address</th>
                <th>Role</th>
                <th>Department</th>
                <th>Registry Details</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td style={{ fontWeight: '700' }}>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`badge ${u.role === 'ADMIN' ? 'badge-danger' : u.role === 'HOD' ? 'badge-warning' : 'badge-success'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>{u.department ? u.department.code : 'System'}</td>
                  <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {u.role === 'STUDENT' ? `Reg: ${u.registerNumber} (Yr ${u.year} Sec ${u.section || 'A'})` : u.role === 'ADMIN' ? 'System Root' : `Staff: ${u.staffIdCode} (${u.designation || 'N/A'})`}
                  </td>
                  <td>
                    <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {u.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button className="btn btn-secondary" onClick={() => startEdit(u)} style={{ padding: '4px 10px', minHeight: '28px', fontSize: '12px' }}>
                        Edit
                      </button>
                      {u.isActive && u.role !== 'ADMIN' && (
                        <button className="btn btn-secondary" style={{ padding: '4px 10px', minHeight: '28px', fontSize: '12px', color: 'var(--danger)' }} onClick={() => setDeleteConfirm(u.id)}>
                          Suspend
                        </button>
                      )}
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
          <div className="glass-card" style={{ width: '450px', background: 'var(--bg-surface-solid)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="widget-header">
              <h3>{editUser ? 'Update Registry Entry' : 'Register New account'}</h3>
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
                  <label className="form-label">System Role</label>
                  <CustomSelect
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    options={[
                      { value: 'STUDENT', label: 'Student Enrollee' },
                      { value: 'STAFF', label: 'Instructor Staff' },
                      { value: 'HOD', label: 'Head of Department' },
                      { value: 'ADMIN', label: 'Root Admin' }
                    ]}
                  />
                </div>
              )}

              {role !== 'ADMIN' && (
                <div className="form-group">
                  <label className="form-label">Academic Department</label>
                  <CustomSelect
                    value={deptId}
                    onChange={(e) => setDeptId(e.target.value)}
                    options={departments.map(d => ({ value: String(d.id), label: d.name }))}
                  />
                </div>
              )}

              {role === 'STUDENT' && (
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
                    <div className="form-group" style={{ width: '120px' }}>
                      <label className="form-label">Section</label>
                      <input type="text" className="form-control" placeholder="A" value={section} onChange={(e) => setSection(e.target.value)} required />
                    </div>
                  </div>
                </>
              )}

              {(role === 'STAFF' || role === 'HOD') && (
                <>
                  <div className="form-group">
                    <label className="form-label">Employee ID Code</label>
                    <input type="text" className="form-control" placeholder="STFXXXXXX" value={staffIdCode} onChange={(e) => setStaffIdCode(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Designation</label>
                    <input type="text" className="form-control" placeholder="Associate Professor" value={designation} onChange={(e) => setDesignation(e.target.value)} required />
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
                  <label className="form-label">Account status</label>
                  <CustomSelect
                    value={isActive ? 'true' : 'false'}
                    onChange={(e) => setIsActive(e.target.value === 'true')}
                    options={[
                      { value: 'true', label: 'Active / Enabled' },
                      { value: 'false', label: 'Suspended / Disabled' }
                    ]}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" className="btn btn-primary" style={{ flexGrow: 1 }} disabled={saving}>
                  {saving ? 'Saving...' : (editUser ? 'Update Account' : 'Register Account')}
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
              <ShieldAlert size={20} /> Suspend User Account
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Are you sure you want to suspend this account? The user will immediately be logged out of their current session.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setDeleteConfirm(null)} style={{ padding: '8px 16px', fontSize: '14px' }}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={confirmDeactivate} style={{ background: 'var(--danger)', color: '#fff', border: 'none' }}>
                Suspend Account
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// 4. Fee Management
const FeeManagementPage = () => {
  const { authenticatedFetch } = useAuth();
  const [structures, setStructures] = useState([]);
  const [depts, setDepts] = useState([]);
  const [deptId, setDeptId] = useState('1');
  const [year, setYear] = useState('1');
  const [feeType, setFeeType] = useState('Tuition Fee');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(getTodayDateString);
  const [loading, setLoading] = useState(true);

  const fetchFees = () => {
    Promise.all([
      authenticatedFetch('/api/admin/fees/structures').then(res => res.json()),
      authenticatedFetch('/api/admin/departments').then(res => res.json())
    ]).then(([fees, departments]) => {
      setStructures(fees);
      setDepts(departments);
      if (departments.length > 0) setDeptId(departments[0].id.toString());
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchFees();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const response = await authenticatedFetch('/api/admin/fees/structures', {
        method: 'POST',
        body: JSON.stringify({
          departmentId: deptId,
          year: year,
          feeType: feeType,
          amount: amount,
          dueDate: dueDate,
          academicYear: '2026-2027'
        })
      });
      if (response.ok) {
        setAmount('');
        setDueDate('');
        fetchFees();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="skeleton-box" style={{ height: '320px' }} />;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }} className="dashboard-grid">
      <div className="glass-card">
        <h2>Fee structures</h2>
        <div className="table-container" style={{ marginTop: '20px' }}>
          <table className="portal-table">
            <thead>
              <tr>
                <th>Dept</th>
                <th>Academic Year</th>
                <th>Particular</th>
                <th>Amount</th>
                <th>Due Date</th>
              </tr>
            </thead>
            <tbody>
              {structures.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: '700', color: 'var(--primary)' }}>{s.department.code}</td>
                  <td>Year {s.year}</td>
                  <td>{s.feeType}</td>
                  <td style={{ fontWeight: '800', color: 'var(--success)' }}>INR {s.amount}</td>
                  <td>{s.dueDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-card" style={{ height: 'fit-content' }}>
        <h2>Configure Invoices</h2>
        <form onSubmit={handleCreate} style={{ marginTop: '20px' }}>
          <div className="form-group">
            <label className="form-label">Academic Department</label>
            <CustomSelect
              value={deptId}
              onChange={(e) => setDeptId(e.target.value)}
              options={depts.map(d => ({ value: d.id.toString(), label: d.name }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Student Year</label>
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
            <label className="form-label">Fee Particular Name</label>
            <input type="text" className="form-control" placeholder="Hostel Fee / Library Fee" value={feeType} onChange={(e) => setFeeType(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Amount (INR)</label>
            <input type="number" className="form-control" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </div>
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Due Date</label>
            <input 
              type="date" 
              className="form-control" 
              value={dueDate} 
              min={getTodayDateString()} 
              onChange={(e) => setDueDate(e.target.value)} 
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', minHeight: '44px' }}>Release Invoice Particular</button>
        </form>
      </div>
    </div>
  );
};

// 5. Force Publish Results (Admin version)
const PublishResultsPage = () => {
  const { authenticatedFetch } = useAuth();
  const [depts, setDepts] = useState([]);
  const [deptId, setDeptId] = useState('1');
  const [semester, setSemester] = useState('4');
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [publishing, setPublishing] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [draftCount, setDraftCount] = useState(0);
  const [publishStatus, setPublishStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    authenticatedFetch('/api/admin/departments')
      .then(res => res.json())
      .then(data => {
        setDepts(data);
        if (data.length > 0) setDeptId(data[0].id.toString());
      });
  }, []);

  const handlePublish = async (e) => {
    e.preventDefault();
    setPublishStatus({ type: '', message: '' });
    try {
      const response = await authenticatedFetch(`/api/admin/results/draft-count?departmentId=${deptId}&semester=${semester}`);
      if (response.ok) {
        const data = await response.json();
        setDraftCount(data.count || 0);
      }
    } catch (err) {
      console.error(err);
    }
    setShowPublishConfirm(true);
  };

  const doPublish = async () => {
    setShowPublishConfirm(false);
    setPublishing(true);
    try {
      const response = await authenticatedFetch('/api/admin/results/publish', {
        method: 'POST',
        body: JSON.stringify({
          departmentId: deptId,
          semester: semester,
          academicYear: academicYear
        })
      });
      const data = await response.json();
      if (response.ok) {
        setPublishStatus({ type: 'success', message: 'Semester results published globally.' });
      } else {
        setPublishStatus({ type: 'error', message: data.error || 'Failed to publish results.' });
      }
    } catch (err) {
      console.error(err);
      setPublishStatus({ type: 'error', message: 'An error occurred while publishing results.' });
    } finally {
      setPublishing(false);
    }
  };

  const selectedDeptName = depts.find(d => d.id.toString() === deptId)?.name || 'N/A';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '550px' }}>
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
        <h2>Global Results Release</h2>
        <form onSubmit={handlePublish} style={{ marginTop: '24px' }}>
          <div className="form-group">
            <label className="form-label">Target Department</label>
            <CustomSelect
              value={deptId}
              onChange={(e) => setDeptId(e.target.value)}
              options={depts.map(d => ({ value: d.id.toString(), label: d.name }))}
            />
          </div>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Academic Year</label>
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
          <button type="submit" className="btn btn-primary" style={{ width: '100%', minHeight: '44px' }} disabled={publishing}>
            {publishing ? 'Publishing...' : 'Release Semester Grades'}
          </button>
        </form>
      </div>

      {showPublishConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', zIndex: 110, justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
          <div className="glass-card" style={{ width: '420px', background: 'var(--bg-surface-solid)', padding: '24px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div className="widget-header">
              <h3 style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldAlert size={20} /> Publish Results confirmation</h3>
              <button onClick={() => setShowPublishConfirm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><XCircle size={18} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: '16px 0 20px 0', padding: '16px', background: 'var(--bg-muted)', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px' }}>
              <div>Department: <strong style={{ color: 'var(--primary)' }}>{selectedDeptName}</strong></div>
              <div>Semester: <strong>Semester {semester}</strong></div>
              <div>Academic Term: <strong>{academicYear}</strong></div>
              <div>Release Size: <strong style={{ color: 'var(--primary)' }}>{draftCount} Draft Records</strong></div>
            </div>

            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              {draftCount > 0 
                ? 'Confirming this action immediately calculates Student SGPA/CGPA records. Students can download marksheets.'
                : 'No draft results found. Please upload semester results sheets first.'}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowPublishConfirm(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={doPublish} disabled={draftCount === 0 || publishing}>
                {publishing ? 'Publishing...' : 'Release Grades'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 6. Settings Page
const SystemSettingsPage = () => {
  return (
    <div className="glass-card">
      <h2>Portal System Settings</h2>
      <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ padding: '16px', background: 'var(--bg-muted)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
          <h4 style={{ color: 'var(--primary)' }}>Academic Portal core Configuration</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '6px' }}>
            System state: <span className="badge badge-success">ACTIVE</span> | Database Host: <strong>postgresql-main</strong> | SMTP Relay: <strong>relay.portal.edu</strong>
          </p>
        </div>
        <div style={{ padding: '16px', background: 'var(--bg-muted)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
          <h4 style={{ color: 'var(--primary)' }}>Sync Services Scheduling</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '6px' }}>
            Internal grade sync runs every night at <strong>02:00 AM</strong>. Attendance compliance notification reminders dispatcher runs daily at <strong>08:00 AM</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};

const AdminRoutes = () => {
  return (
    <AdminLayout>
      <Routes>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="departments" element={<ManageDepartmentsPage />} />
        <Route path="users" element={<ManageAllUsersPage />} />
        <Route path="fees" element={<FeeManagementPage />} />
        <Route path="import-marks" element={<MarkImportPage />} />
        <Route path="exams" element={<ExamScheduleManager />} />
        <Route path="results/upload" element={<SemesterResultUploadPage />} />
        <Route path="results" element={<PublishResultsPage />} />
        <Route path="settings" element={<SystemSettingsPage />} />
      </Routes>
    </AdminLayout>
  );
};

export default AdminRoutes;
