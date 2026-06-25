import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Profile from '../pages/Profile';
import ExamScheduleManager from '../pages/ExamScheduleManager';
import { Users, Briefcase, Award, GraduationCap, ShieldAlert, PlusCircle, Save, Eye, EyeOff } from 'lucide-react';
import CustomSelect from '../components/common/CustomSelect';

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
    if (path.endsWith('/results')) {
      return {
        title: 'Publish Results',
        subtitle: 'Review and release student semester exam results to calculate CGPA.'
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
  const { authenticatedFetch } = useAuth();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  
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

  const fetchStaff = () => {
    authenticatedFetch('/api/hod/staff')
      .then(res => res.json())
      .then(data => {
        setStaffList(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const endpoint = role === 'STAFF' ? '/api/hod/staff/add' : '/api/hod/students';
    const payload = role === 'STAFF' 
      ? { name, email, phone, password, year: parseInt(year) }
      : { name, email, phone, password, year: parseInt(year), registerNumber };

    try {
      const response = await authenticatedFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (response.ok) {
        setAddModal(false);
        setName('');
        setEmail('');
        setPhone('');
        setRegisterNumber('');
        fetchStaff();
      } else {
        setError(data.error || 'Failed to register user');
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
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2>Faculty & Staff Registry</h2>
          <button className="btn btn-primary" onClick={() => { setRole('STAFF'); setAddModal(true); }} style={{ display: 'flex', gap: '8px' }}>
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
                <th>Phone</th>
                <th>Assigned Year</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: '600' }}>{s.staffIdCode}</td>
                  <td>{s.name}</td>
                  <td>{s.email}</td>
                  <td>{s.phone}</td>
                  <td style={{ fontWeight: '600', color: 'var(--primary)' }}>Year {s.year}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {addModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', zIndex: 100, justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
          <div className="glass-card" style={{ width: '400px', background: 'var(--bg-surface-solid)', maxHeight: '90dvh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '20px' }}>Register Department User</h3>
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
                  <div className="form-group">
                    <label className="form-label">Register Number</label>
                    <input type="text" className="form-control" placeholder="REGXXXXXX" value={registerNumber} onChange={(e) => setRegisterNumber(e.target.value)} required />
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
                  {saving ? 'Saving...' : 'Register'}
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

// 3. Dept Students
const DeptStudentsPage = () => {
  const { authenticatedFetch } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);

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

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const endpoint = role === 'STAFF' ? '/api/hod/staff/add' : '/api/hod/students';
    const payload = role === 'STAFF' 
      ? { name, email, phone, password, year: parseInt(year) }
      : { name, email, phone, password, year: parseInt(year), registerNumber };

    try {
      const response = await authenticatedFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (response.ok) {
        setAddModal(false);
        setName('');
        setEmail('');
        setPhone('');
        setRegisterNumber('');
        fetchStudents();
      } else {
        setError(data.error || 'Failed to register user');
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
          <button className="btn btn-primary" onClick={() => { setRole('STUDENT'); setAddModal(true); }} style={{ display: 'flex', gap: '8px' }}>
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
                <th>Year</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: '600' }}>{s.registerNumber}</td>
                  <td>{s.name}</td>
                  <td>{s.email}</td>
                  <td>Year {s.year}</td>
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
            <h3 style={{ marginBottom: '20px' }}>Register Department User</h3>
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
                  <div className="form-group">
                    <label className="form-label">Register Number</label>
                    <input type="text" className="form-control" placeholder="REGXXXXXX" value={registerNumber} onChange={(e) => setRegisterNumber(e.target.value)} required />
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
                  {saving ? 'Saving...' : 'Register'}
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

// 4. Publish Results
const PublishResultsPage = () => {
  const { authenticatedFetch, user } = useAuth();
  const [semester, setSemester] = useState('4');
  const [publishing, setPublishing] = useState(false);

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!window.confirm(`Are you sure you want to publish results for Semester ${semester}? This will update CGPA tables.`)) {
      return;
    }
    
    setPublishing(true);
    try {
      const response = await authenticatedFetch('/api/admin/results/publish', {
        method: 'POST',
        body: JSON.stringify({
          departmentId: user.departmentId,
          semester: semester
        })
      });
      
      const data = await response.json();
      if (response.ok) {
        alert(data.message || 'Results published successfully.');
      } else {
        alert(data.error || 'Failed to publish results.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="glass-card" style={{ maxWidth: '550px' }}>
      <h2>Publish Academic Results</h2>
      <div style={{ padding: '16px', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.1)', borderRadius: '8px', color: '#fcd34d', fontSize: '14px', margin: '16px 0 24px' }}>
        <strong>Warning:</strong> Publishing grades makes them instantly visible on Student results tabs and triggers automated weighted GPA calculations.
      </div>
      <form onSubmit={handlePublish}>
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
          {publishing ? 'Publishing...' : 'Publish Grades & Calculate GPA'}
        </button>
      </form>
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
        <Route path="results" element={<PublishResultsPage />} />
      </Routes>
    </HodLayout>
  );
};

export default HodRoutes;
