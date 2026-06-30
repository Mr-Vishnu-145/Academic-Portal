import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Users, Building, CreditCard, ShieldCheck, Settings, PlusCircle, Trash, RefreshCw, Eye, EyeOff, CheckCircle, ShieldAlert } from 'lucide-react';
import ExamScheduleManager from '../pages/ExamScheduleManager';
import MarkImportPage from '../pages/MarkImportPage';
import SemesterResultUploadPage from '../pages/SemesterResultUploadPage';
import CustomSelect from '../components/common/CustomSelect';

const getTodayDateString = () => new Date().toLocaleDateString('en-CA');

const AdminLayout = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  const getHeaderInfo = (pathname) => {
    const path = pathname.toLowerCase().replace(/\/$/, '');
    if (path.endsWith('/dashboard')) {
      return {
        title: 'Dashboard',
        subtitle: `Welcome, ${user?.name || 'Administrator'}! institution-wide metrics and server status.`
      };
    }
    if (path.endsWith('/departments')) {
      return {
        title: 'Departments',
        subtitle: 'Create, update, and manage academic departments.'
      };
    }
    if (path.endsWith('/users')) {
      return {
        title: 'User Management',
        subtitle: 'Create institution accounts for Students, Staff, HODs, and Admins.'
      };
    }
    if (path.endsWith('/fees')) {
      return {
        title: 'Fee Configurations',
        subtitle: 'Configure fee templates, tuition schedules, and track collections.'
      };
    }
    if (path.endsWith('/exams')) {
      return {
        title: 'Exam Scheduler',
        subtitle: 'View and override institutional examination tables.'
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
        title: 'Release Results',
        subtitle: 'Globally publish semester end exam grades and compute student CGPA.'
      };
    }
    if (path.endsWith('/import-marks')) {
      return {
        title: 'Mark Import & Auto Entry',
        subtitle: 'Upload institutional mark sheets and automatically extract/manage student grades.'
      };
    }
    if (path.endsWith('/settings')) {
      return {
        title: 'System Settings',
        subtitle: 'Configure institutuion settings, security rules, and database parameters.'
      };
    }
    return {
      title: 'Admin Console',
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
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Root Admin</div>
            </div>
            <div className="avatar">A</div>
          </div>
        </div>
        {children}
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

  if (loading) return <div>Loading admin stats...</div>;

  return (
    <div>
      <div className="dashboard-grid">
        <div className="glass-card stat-card">
          <div className="stat-icon stat-icon-primary"><Users size={24} /></div>
          <div>
            <div className="stat-number">{stats?.totalUsers}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Total Accounts</div>
          </div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon stat-icon-accent"><Building size={24} /></div>
          <div>
            <div className="stat-number">{stats?.totalDepartments}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Departments</div>
          </div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon stat-icon-success"><ShieldCheck size={24} /></div>
          <div>
            <div className="stat-number">{stats?.studentCount}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Registered Students</div>
          </div>
        </div>
      </div>

      <div className="glass-card">
        <h3 style={{ marginBottom: '16px' }}>System Administrator Console</h3>
        <p style={{ color: 'var(--text-secondary)' }}>
          You have complete, unrestricted CRUD database access. Use the sidebar to create departments, add or suspend users (HODs, Staff, Students), modify tuition schedules, and force-publish semester grades.
        </p>
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

  if (loading) return <div>Loading departments...</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
      <div className="glass-card">
        <h2>Department Registry</h2>
        <div className="table-container">
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
                  <td style={{ fontWeight: '600', color: 'var(--accent)' }}>{d.code}</td>
                  <td style={{ fontWeight: '600' }}>{d.name}</td>
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
            <input type="text" className="form-control" placeholder="Information Technology" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Code</label>
            <input type="text" className="form-control" placeholder="IT" value={code} onChange={(e) => setCode(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Register Department</button>
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

  if (loading) return <div>Loading user accounts...</div>;

  return (
    <>
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2>Global User Registry</h2>
          <button className="btn btn-primary" onClick={startAdd} style={{ display: 'flex', gap: '8px' }}>
            <PlusCircle size={18} /> Add User
          </button>
        </div>

        <div className="table-container">
          <table className="portal-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Details</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td style={{ fontWeight: '600' }}>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`badge ${u.role === 'ADMIN' ? 'badge-danger' : u.role === 'HOD' ? 'badge-pending' : 'badge-success'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>{u.department ? u.department.code : 'N/A'}</td>
                  <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {u.role === 'STUDENT' ? `Reg: ${u.registerNumber} (Yr ${u.year} Sec ${u.section || 'N/A'})` : u.role === 'ADMIN' ? 'System Root' : `Staff: ${u.staffIdCode} (${u.designation || 'N/A'})`}
                  </td>
                  <td>
                    <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {u.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button className="btn btn-secondary" onClick={() => startEdit(u)} style={{ padding: '4px 8px' }}>
                        Edit
                      </button>
                      {u.isActive && u.role !== 'ADMIN' && (
                        <button className="btn btn-secondary" style={{ padding: '4px 8px', color: 'var(--danger)' }} onClick={() => setDeleteConfirm(u.id)}>
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
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', zIndex: 100, justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
          <div className="glass-card" style={{ width: '450px', background: 'var(--bg-surface-solid)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '20px' }}>{editUser ? 'Update User Registry' : 'Register New User'}</h3>
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
                      { value: 'STAFF', label: 'Staff' },
                      { value: 'HOD', label: 'Head of Department (HOD)' },
                      { value: 'ADMIN', label: 'Administrator' }
                    ]}
                  />
                </div>
              )}

              {role !== 'ADMIN' && (
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <CustomSelect
                    value={deptId}
                    onChange={(e) => setDeptId(e.target.value)}
                    options={departments.map(d => ({ value: d.id, label: d.name }))}
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
                    <label className="form-label">Employee ID / Staff Code</label>
                    <input type="text" className="form-control" placeholder="STFXXXXXX" value={staffIdCode} onChange={(e) => setStaffIdCode(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Designation</label>
                    <input type="text" className="form-control" placeholder="Professor" value={designation} onChange={(e) => setDesignation(e.target.value)} required />
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
                      { value: 'false', label: 'Suspended / Deactivated' }
                    ]}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" className="btn btn-primary" style={{ flexGrow: 1 }} disabled={saving}>
                  {saving ? 'Saving...' : (editUser ? 'Update User' : 'Register User')}
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
              <Users size={20} /> Suspend User Account
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Are you sure you want to suspend this user? This will disable their portal login and set their status to Suspended.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setDeleteConfirm(null)} style={{ padding: '8px 16px', fontSize: '14px' }}>
                Cancel
              </button>
              <button type="button" className="btn" onClick={confirmDeactivate} style={{ padding: '8px 16px', fontSize: '14px', background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Suspend
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

  if (loading) return <div>Loading invoice templates...</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
      <div className="glass-card">
        <h2>Fee Configurations</h2>
        <div className="table-container">
          <table className="portal-table">
            <thead>
              <tr>
                <th>Dept</th>
                <th>Year</th>
                <th>Fee Type</th>
                <th>Amount</th>
                <th>Due Date</th>
              </tr>
            </thead>
            <tbody>
              {structures.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: '600' }}>{s.department.code}</td>
                  <td>Year {s.year}</td>
                  <td>{s.feeType}</td>
                  <td style={{ fontWeight: '700', color: 'var(--success)' }}>INR {s.amount}</td>
                  <td>{s.dueDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-card" style={{ height: 'fit-content' }}>
        <h2>Configure Fee Invoicing</h2>
        <form onSubmit={handleCreate} style={{ marginTop: '20px' }}>
          <div className="form-group">
            <label className="form-label">Department</label>
            <CustomSelect
              value={deptId}
              onChange={(e) => setDeptId(e.target.value)}
              options={depts.map(d => ({ value: d.id, label: d.name }))}
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
            <label className="form-label">Fee Type</label>
            <input type="text" className="form-control" placeholder="Hostel Fee / Library Fee" value={feeType} onChange={(e) => setFeeType(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Invoice Amount (INR)</label>
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
              onClick={(e) => { 
                try { e.target.showPicker(); } catch (err) {} 
                const today = getTodayDateString();
                if (dueDate < today) {
                  setDueDate(today);
                }
              }}
              required 
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Configure Invoices</button>
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
        <div className="alert-banner alert-banner-success" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', borderRadius: '6px' }}>
          <CheckCircle size={20} style={{ color: 'var(--success)' }} />
          <span>{publishStatus.message}</span>
        </div>
      )}
      {publishStatus.type === 'error' && (
        <div className="alert-banner alert-banner-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171' }}>
          <ShieldAlert size={20} />
          <span>{publishStatus.message}</span>
        </div>
      )}

      <div className="glass-card" style={{ width: '100%' }}>
        <h2>Global Results Release</h2>
        <form onSubmit={handlePublish} style={{ marginTop: '24px' }}>
          <div className="form-group">
            <label className="form-label">Department</label>
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
                { value: '2024-2025', label: '2024-2025' },
                { value: '2023-2024', label: '2023-2024' }
              ]}
            />
          </div>
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Semester</label>
            <CustomSelect
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              options={[
                { value: '1', label: 'Semester 1' },
                { value: '2', label: 'Semester 2' },
                { value: '3', label: 'Semester 3' },
                { value: '4', label: 'Semester 4' },
                { value: '5', label: 'Semester 5' },
                { value: '6', label: 'Semester 6' },
                { value: '7', label: 'Semester 7' },
                { value: '8', label: 'Semester 8' }
              ]}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={publishing}>
            {publishing ? 'Publishing...' : 'Release Results'}
          </button>
        </form>
      </div>

      {showPublishConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', zIndex: 110, justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
          <div className="glass-card" style={{ width: '420px', background: 'var(--bg-surface-solid)', padding: '24px', borderRadius: '8px', border: '1px solid var(--border)', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '600', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={20} /> Publish Results Confirmation
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: '16px 0 20px 0', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px' }}>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Department:</span> <strong style={{ color: 'var(--primary)' }}>{selectedDeptName}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Semester:</span> <strong>Semester {semester}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Academic Year:</span> <strong>{academicYear}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Total Student Records:</span> <strong style={{ color: draftCount > 0 ? 'var(--success)' : 'var(--warning)' }}>{draftCount} Draft Records</strong>
              </div>
            </div>

            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              {draftCount > 0 
                ? 'Published results will immediately become visible to students. Are you sure you want to publish?'
                : 'Warning: There are no draft results found for this department and semester. Please upload results first.'}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowPublishConfirm(false)} style={{ padding: '8px 16px', fontSize: '14px' }}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={doPublish} disabled={draftCount === 0 || publishing} style={{ padding: '8px 16px', fontSize: '14px' }}>
                {publishing ? 'Publishing...' : 'Publish Results'}
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
      <h2>Global Portal Settings</h2>
      <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h4>Core System Configuration</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            System state: <strong>ACTIVE</strong> | Node environment: <strong>PRODUCTION</strong>
          </p>
        </div>
        <div>
          <h4>Cron Schedules & Background Work</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Daily Deadline Notification job runs daily at <strong>08:00 AM</strong>.
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
