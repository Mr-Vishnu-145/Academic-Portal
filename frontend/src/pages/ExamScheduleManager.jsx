import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, PlusCircle, Trash2, Edit, XCircle, AlertCircle, CheckCircle, 
  User, BookOpen, Layers, MapPin, Clock, Tag, RefreshCw, BarChart2, PieChart, ShieldAlert
} from 'lucide-react';
import CustomSelect from '../components/common/CustomSelect';
import TimeDropdownPicker from '../components/common/TimeDropdownPicker';

const getCurrentTimeString = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const getTodayDateString = () => new Date().toLocaleDateString('en-CA');

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

const ExamScheduleManager = () => {
  const { user, authenticatedFetch } = useAuth();
  
  // State variables
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [editError, setEditError] = useState('');

  // Form states (Create)
  const [selectedSub, setSelectedSub] = useState('');
  const [examDate, setExamDate] = useState(getTodayDateString);
  const [examTime, setExamTime] = useState(getCurrentTimeString);
  const [hallNumber, setHallNumber] = useState('');
  const [assignmentType, setAssignmentType] = useState('DEPARTMENT'); // INDIVIDUAL, YEAR, SECTION, DEPARTMENT
  const [selectedYear, setSelectedYear] = useState('1');
  const [section, setSection] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [targetDeptId, setTargetDeptId] = useState('');
  const [saving, setSaving] = useState(false);

  // Form states (Edit Modal)
  const [editingExam, setEditingExam] = useState(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editHall, setEditHall] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  // Filter states
  const [filterYear, setFilterYear] = useState('ALL');
  const [filterSection, setFilterSection] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [adminDeptFilter, setAdminDeptFilter] = useState('ALL');

  // Fetch initial data based on role
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch exam schedules
      const examRes = await authenticatedFetch('/api/exams');
      if (examRes.ok) {
        const examData = await examRes.json();
        setExams(examData);
      } else {
        setError('Failed to load exam schedules');
      }

      // 2. Fetch subjects (For staff/HOD/admin to schedule)
      if (user.role !== 'STUDENT') {
        const subRes = await authenticatedFetch('/api/staff/subjects');
        if (subRes.ok) {
          const subData = await subRes.json();
          setSubjects(subData);
          if (subData.length > 0) setSelectedSub(subData[0].id.toString());
        }

        // Fetch students in department
        const studentRes = await authenticatedFetch('/api/staff/students');
        if (studentRes.ok) {
          const studentData = await studentRes.json();
          setStudents(studentData);
          if (studentData.length > 0) setSelectedStudent(studentData[0].id.toString());
        }
      }

      // 3. Fetch departments if user is admin
      if (user.role === 'ADMIN') {
        const deptRes = await authenticatedFetch('/api/admin/departments');
        if (deptRes.ok) {
          const deptData = await deptRes.json();
          setDepartments(deptData);
          if (deptData.length > 0) setTargetDeptId(deptData[0].id.toString());
        }
      } else {
        setTargetDeptId(user.departmentId ? user.departmentId.toString() : '');
      }

    } catch (err) {
      console.error(err);
      setError('An error occurred while fetching data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setCreateError('');
    setCreateSuccess('');
    setError('');
    setSuccess('');

    if (!examDate || examDate.trim() === '') {
      setCreateError('Exam Date is required.');
      setSaving(false);
      return;
    }
    if (!examTime || examTime.trim() === '') {
      setCreateError('Time Slot is required.');
      setSaving(false);
      return;
    }

    const todayStr = getTodayDateString();
    if (examDate < todayStr) {
      setCreateError('Selected date is in the past. Please choose today or a future date.');
      setSaving(false);
      return;
    }

    if (examDate === todayStr) {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      
      const timeParts = examTime.split(':');
      if (timeParts.length >= 2) {
        const selHours = parseInt(timeParts[0], 10);
        const selMinutes = parseInt(timeParts[1], 10);
        if (selHours < currentHours || (selHours === currentHours && selMinutes < currentMinutes)) {
          setCreateError('Selected time is in the past. Please choose a future time.');
          setSaving(false);
          return;
        }
      }
    }

    const payload = {
      subjectId: parseInt(selectedSub),
      examDate,
      examTime,
      hallNumber,
      assignmentType,
      departmentId: parseInt(targetDeptId),
      studyYear: assignmentType === 'YEAR' || assignmentType === 'SECTION' ? parseInt(selectedYear) : null,
      section: assignmentType === 'SECTION' ? section.toUpperCase() : null,
      studentId: assignmentType === 'INDIVIDUAL' ? parseInt(selectedStudent) : null
    };

    try {
      const response = await authenticatedFetch('/api/exams', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (response.ok) {
        setCreateSuccess('Exam scheduled successfully!');
        setExamDate('');
        setExamTime('');
        setHallNumber('');
        setSection('');
        fetchData();
      } else {
        setCreateError(data.error || 'Failed to schedule exam.');
      }
    } catch (err) {
      console.error(err);
      setCreateError('An error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setEditError('');
    setError('');
    setSuccess('');

    if (!editDate || editDate.trim() === '') {
      setEditError('Exam Date is required.');
      setUpdating(false);
      return;
    }
    if (!editTime || editTime.trim() === '') {
      setEditError('Time Slot is required.');
      setUpdating(false);
      return;
    }

    const todayStr = getTodayDateString();
    if (editDate < todayStr) {
      setEditError('Selected date is in the past. Please choose today or a future date.');
      setUpdating(false);
      return;
    }

    if (editDate === todayStr) {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      
      const timeParts = editTime.split(':');
      if (timeParts.length >= 2) {
        const selHours = parseInt(timeParts[0], 10);
        const selMinutes = parseInt(timeParts[1], 10);
        if (selHours < currentHours || (selHours === currentHours && selMinutes < currentMinutes)) {
          setEditError('Selected time is in the past. Please choose a future time.');
          setUpdating(false);
          return;
        }
      }
    }

    try {
      const response = await authenticatedFetch(`/api/exams/${editingExam.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          examDate: editDate,
          examTime: editTime,
          hallNumber: editHall,
          status: editStatus
        })
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess('Exam schedule updated successfully.');
        setEditingExam(null);
        fetchData();
      } else {
        setEditError(data.error || 'Failed to update exam schedule.');
      }
    } catch (err) {
      console.error(err);
      setEditError('An error occurred. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this exam schedule?')) {
      return;
    }
    setError('');
    setSuccess('');

    try {
      const response = await authenticatedFetch(`/api/exams/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess('Exam schedule deleted successfully.');
        fetchData();
      } else {
        setError(data.error || 'Failed to delete exam schedule.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred. Please try again.');
    }
  };

  const openEdit = (exam) => {
    setEditingExam(exam);
    setEditDate(exam.examDate);
    setEditTime(exam.examTime.substring(0, 5));
    setEditHall(exam.hallNumber);
    setEditStatus(exam.status);
    setEditError('');
  };

  // Helper to format Date
  const formatDateStr = (dateStr) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString(undefined, options);
  };

  // Helper for status badge class
  const getStatusBadge = (status) => {
    if (status === 'UPCOMING') return 'badge-pending';
    if (status === 'COMPLETED') return 'badge-success';
    if (status === 'CANCELLED') return 'badge-danger';
    return 'badge-secondary';
  };

  // Filter Logic
  const filteredExams = exams.filter(exam => {
    // 1. Year Filter
    if (filterYear !== 'ALL') {
      if (exam.studyYear !== parseInt(filterYear)) return false;
    }
    // 2. Section Filter
    if (filterSection !== 'ALL') {
      if (exam.section !== filterSection.toUpperCase()) return false;
    }
    // 3. Assignment Type Filter
    if (filterType !== 'ALL') {
      if (exam.assignmentType !== filterType) return false;
    }
    // 4. Admin Department Filter
    if (user.role === 'ADMIN' && adminDeptFilter !== 'ALL') {
      if (exam.department.id !== parseInt(adminDeptFilter)) return false;
    }
    return true;
  });

  // Simple Analytics calculations (Department/Global)
  const totalExams = filteredExams.length;
  const upcomingCount = filteredExams.filter(e => e.status === 'UPCOMING').length;
  const completedCount = filteredExams.filter(e => e.status === 'COMPLETED').length;
  const cancelledCount = filteredExams.filter(e => e.status === 'CANCELLED').length;

  const typeBreakdown = filteredExams.reduce((acc, e) => {
    acc[e.assignmentType] = (acc[e.assignmentType] || 0) + 1;
    return acc;
  }, {});

  if (loading) {
    return <div style={{ padding: '24px' }}><RefreshCw className="animate-spin" /> Loading exam schedules...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', width: '100%' }}>
      
      {/* Messages */}
      {error && (
        <div className="alert-banner alert-banner-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="alert-banner alert-banner-success" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={20} />
          <span>{success}</span>
        </div>
      )}

      {/* Role specific header cards & statistics */}
      {user.role === 'STUDENT' && (
        <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="stat-icon stat-icon-primary" style={{ background: 'var(--primary-glow)' }}>
              <Calendar size={28} />
            </div>
            <div>
              <h2 style={{ margin: 0 }}>My Exam Schedule</h2>
              <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                View your personal exams, year-wise dates, section tests, and department announcements.
              </p>
            </div>
          </div>
        </div>
      )}

      {(user.role === 'STAFF' || user.role === 'HOD' || user.role === 'ADMIN') && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
          <div className="glass-card stat-card">
            <div className="stat-icon stat-icon-primary"><Calendar size={24} /></div>
            <div>
              <div className="stat-number">{totalExams}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Total Scheduled</div>
            </div>
          </div>
          <div className="glass-card stat-card">
            <div className="stat-icon stat-icon-success"><CheckCircle size={24} style={{ color: 'var(--success)' }} /></div>
            <div>
              <div className="stat-number">{upcomingCount}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Upcoming Exams</div>
            </div>
          </div>
          <div className="glass-card stat-card">
            <div className="stat-icon stat-icon-accent"><PieChart size={24} /></div>
            <div>
              <div className="stat-number">{typeBreakdown['INDIVIDUAL'] || 0}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Individual Assigned</div>
            </div>
          </div>
          {user.role === 'HOD' && (
            <div className="glass-card stat-card">
              <div className="stat-icon stat-icon-danger"><XCircle size={24} style={{ color: 'var(--danger)' }} /></div>
              <div>
                <div className="stat-number">{cancelledCount}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Cancelled Exams</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Workspace Area */}
      <div style={{ display: 'grid', gridTemplateColumns: (user.role === 'STUDENT' ? '1fr' : '1.2fr 0.8fr'), gap: '32px' }}>
        
        {/* LEFT COLUMN: Filters and Exam Schedules List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Filters card */}
          {user.role !== 'STUDENT' && (
            <div className="glass-card" style={{ padding: '16px 24px', zIndex: 10 }}>
              <h3 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={18} /> Filters & Coverage
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                
                {user.role === 'ADMIN' && (
                  <div style={{ flexGrow: 1, minWidth: '150px' }}>
                    <label className="form-label" style={{ fontSize: '12px' }}>Department</label>
                    <CustomSelect 
                      value={adminDeptFilter} 
                      onChange={(e) => setAdminDeptFilter(e.target.value)}
                      options={[
                        { value: 'ALL', label: 'All Departments' },
                        ...departments.map(d => ({ value: d.id.toString(), label: d.name }))
                      ]}
                    />
                  </div>
                )}

                <div style={{ flexGrow: 1, minWidth: '120px' }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>Study Year</label>
                  <CustomSelect 
                    value={filterYear} 
                    onChange={(e) => setFilterYear(e.target.value)}
                    options={[
                      { value: 'ALL', label: 'All Years' },
                      { value: '1', label: 'Year 1' },
                      { value: '2', label: 'Year 2' },
                      { value: '3', label: 'Year 3' },
                      { value: '4', label: 'Year 4' }
                    ]}
                  />
                </div>

                <div style={{ flexGrow: 1, minWidth: '120px' }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>Section</label>
                  <CustomSelect 
                    value={filterSection} 
                    onChange={(e) => setFilterSection(e.target.value)}
                    options={[
                      { value: 'ALL', label: 'All Sections' },
                      { value: 'A', label: 'Section A' },
                      { value: 'B', label: 'Section B' },
                      { value: 'C', label: 'Section C' }
                    ]}
                  />
                </div>

                <div style={{ flexGrow: 1, minWidth: '120px' }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>Scope Type</label>
                  <CustomSelect 
                    value={filterType} 
                    onChange={(e) => setFilterType(e.target.value)}
                    options={[
                      { value: 'ALL', label: 'All Scopes' },
                      { value: 'INDIVIDUAL', label: 'Individual' },
                      { value: 'SECTION', label: 'Section-wise' },
                      { value: 'YEAR', label: 'Year-wise' },
                      { value: 'DEPARTMENT', label: 'Department-wide' }
                    ]}
                  />
                </div>

              </div>
            </div>
          )}

          {/* Exam Schedules List */}
          <div className="glass-card">
            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={20} /> Scheduled Exams ({filteredExams.length})
            </h3>

            {filteredExams.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <ShieldAlert size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
                <div>No exam schedules found.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {filteredExams.map((exam) => (
                  <div 
                    key={exam.id} 
                    style={{ 
                      padding: '20px', 
                      background: 'rgba(255, 255, 255, 0.01)', 
                      border: '1px solid var(--border-glow)', 
                      borderRadius: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      transition: 'transform 0.2s',
                      cursor: 'default'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                  >
                    {/* Top Row: Title and Status Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
                          {exam.subject.name}
                        </h4>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {exam.subject.code} | Credits: {exam.subject.credits} | Sem {exam.subject.semester}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span className={`badge ${getStatusBadge(exam.status)}`}>
                          {exam.status}
                        </span>
                        {/* Scope Indicator Badge */}
                        <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)' }}>
                          {exam.assignmentType}
                        </span>
                      </div>
                    </div>

                    {/* Middle Row: Schedule Info */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', background: 'rgba(255,255,255,0.01)', padding: '12px', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                        <Calendar size={16} style={{ color: 'var(--primary)' }} />
                        <span>{formatDateStr(exam.examDate)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                        <Clock size={16} style={{ color: 'var(--primary)' }} />
                        <span>{formatTime12Hour(exam.examTime)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                        <MapPin size={16} style={{ color: 'var(--accent)' }} />
                        <span>Hall: <strong>{exam.hallNumber}</strong></span>
                      </div>
                    </div>

                    {/* Bottom Row: Scope Info and Actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
                      <div>
                        {exam.assignmentType === 'INDIVIDUAL' && (
                          <span>Assigned to Student: <strong>{exam.student?.name} ({exam.student?.registerNumber})</strong></span>
                        )}
                        {exam.assignmentType === 'SECTION' && (
                          <span>Assigned to: <strong>Year {exam.studyYear} - Section {exam.section}</strong></span>
                        )}
                        {exam.assignmentType === 'YEAR' && (
                          <span>Assigned to: <strong>Year {exam.studyYear} (All Sections)</strong></span>
                        )}
                        {exam.assignmentType === 'DEPARTMENT' && (
                          <span>Assigned to: <strong>All students in {exam.department?.code}</strong></span>
                        )}
                        <span style={{ marginLeft: '16px' }}>Uploaded by: {exam.uploadedBy?.name}</span>
                      </div>

                      {/* Action buttons (Staff/HOD/Admin) */}
                      {user.role !== 'STUDENT' && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '6px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => openEdit(exam)}
                          >
                            <Edit size={14} /> Reschedule
                          </button>
                          
                          {/* HOD/Admin full delete, Staff can only mark Cancelled via edit status */}
                          {(user.role === 'HOD' || user.role === 'ADMIN') && (
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '6px 12px', fontSize: '13px', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '4px' }}
                              onClick={() => handleDelete(exam.id)}
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Scheduling Form (Staff/HOD/Admin only) */}
        {user.role !== 'STUDENT' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass-card">
              <h2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PlusCircle size={22} style={{ color: 'var(--primary)' }} /> Schedule Exam
              </h2>

              {createError && (
                 <div className="alert-banner alert-banner-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                   <AlertCircle size={20} />
                   <span>{createError}</span>
                 </div>
               )}
               {createSuccess && (
                 <div className="alert-banner alert-banner-success" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                   <CheckCircle size={20} />
                   <span>{createSuccess}</span>
                 </div>
               )}

              <form onSubmit={handleCreate}>
                
                {/* Admin only: Select Department */}
                {user.role === 'ADMIN' && (
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <CustomSelect 
                      value={targetDeptId} 
                      onChange={(e) => setTargetDeptId(e.target.value)}
                      options={departments.map(d => ({ value: d.id.toString(), label: d.name }))}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <CustomSelect 
                    value={selectedSub} 
                    onChange={(e) => setSelectedSub(e.target.value)}
                    options={subjects.map(s => ({
                      value: s.id.toString(),
                      label: `${s.name} (${s.code}) - Sem ${s.semester}`
                    }))}
                  />
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <div className="form-group" style={{ flexGrow: 1 }}>
                    <label className="form-label">Exam Date</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      value={examDate} 
                      min={getTodayDateString()}
                      onChange={(e) => setExamDate(e.target.value)} 
                      onClick={(e) => { 
                        try { e.target.showPicker(); } catch (err) {} 
                        const today = getTodayDateString();
                        if (examDate < today) {
                          setExamDate(today);
                        }
                      }}
                      required 
                    />
                  </div>
                  <div className="form-group" style={{ flexGrow: 1 }}>
                    <label className="form-label">Time Slot</label>
                    <TimeDropdownPicker 
                      value={examTime} 
                      onChange={(e) => setExamTime(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Hall Number</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="LH 301 / ECE LAB" 
                    value={hallNumber} 
                    onChange={(e) => setHallNumber(e.target.value)} 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Assignment Scope</label>
                  <CustomSelect 
                    value={assignmentType} 
                    onChange={(e) => setAssignmentType(e.target.value)}
                    options={[
                      { value: 'DEPARTMENT', label: 'Department-wide (All Students)' },
                      { value: 'YEAR', label: 'Year-wise (All sections of study year)' },
                      { value: 'SECTION', label: 'Section-wise (Specific section of study year)' },
                      { value: 'INDIVIDUAL', label: 'Individual Student' }
                    ]}
                  />
                </div>

                {/* Conditional scope inputs */}
                {(assignmentType === 'YEAR' || assignmentType === 'SECTION') && (
                  <div className="form-group">
                    <label className="form-label">Study Year</label>
                    <CustomSelect 
                      value={selectedYear} 
                      onChange={(e) => setSelectedYear(e.target.value)}
                      options={[
                        { value: '1', label: 'Year 1' },
                        { value: '2', label: 'Year 2' },
                        { value: '3', label: 'Year 3' },
                        { value: '4', label: 'Year 4' }
                      ]}
                    />
                  </div>
                )}

                {assignmentType === 'SECTION' && (
                  <div className="form-group">
                    <label className="form-label">Section Code</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. A, B, C" 
                      value={section} 
                      onChange={(e) => setSection(e.target.value)} 
                      required 
                    />
                  </div>
                )}

                {assignmentType === 'INDIVIDUAL' && (
                  <div className="form-group">
                    <label className="form-label">Select Student</label>
                    <CustomSelect 
                      value={selectedStudent} 
                      onChange={(e) => setSelectedStudent(e.target.value)}
                      options={students.map(s => ({
                        value: s.id.toString(),
                        label: `${s.name} (${s.registerNumber}) - Yr ${s.year}${s.section ? ` Sec ${s.section}` : ''}`
                      }))}
                    />
                  </div>
                )}

                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ width: '100%', marginTop: '16px' }}
                  disabled={saving}
                >
                  {saving ? 'Scheduling...' : 'Set Exam Schedule'}
                </button>

              </form>
            </div>

            {/* Simple Analytics Card for HOD/Admin */}
            {(user.role === 'HOD' || user.role === 'ADMIN') && (
              <div className="glass-card">
                <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BarChart2 size={18} /> Coverage Analytics
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Department Scope:</span>
                    <strong style={{ color: 'var(--primary)' }}>{typeBreakdown['DEPARTMENT'] || 0}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Year Scope:</span>
                    <strong style={{ color: 'var(--primary)' }}>{typeBreakdown['YEAR'] || 0}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Section Scope:</span>
                    <strong style={{ color: 'var(--primary)' }}>{typeBreakdown['SECTION'] || 0}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Individual Scope:</span>
                    <strong style={{ color: 'var(--primary)' }}>{typeBreakdown['INDIVIDUAL'] || 0}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* EDIT MODAL */}
      {editingExam && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', zIndex: 100, justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
          <div className="glass-card" style={{ width: '400px', background: 'var(--bg-surface-solid)', maxHeight: '90dvh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Edit size={20} style={{ color: 'var(--primary)' }} /> Edit Exam Schedule
            </h3>

            {editError && (
               <div className="alert-banner alert-banner-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                 <AlertCircle size={20} />
                 <span>{editError}</span>
               </div>
             )}

            <form onSubmit={handleUpdate}>
              
              <div className="form-group">
                <label className="form-label">Subject</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={`${editingExam.subject?.name} (${editingExam.subject?.code})`} 
                  disabled 
                  style={{ opacity: 0.8 }} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Exam Date</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={editDate} 
                  min={getTodayDateString()}
                  onChange={(e) => setEditDate(e.target.value)} 
                  onClick={(e) => { 
                    try { e.target.showPicker(); } catch (err) {} 
                    const today = getTodayDateString();
                    if (editDate < today) {
                      setEditDate(today);
                    }
                  }}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Time Slot</label>
                <TimeDropdownPicker 
                  value={editTime} 
                  onChange={(e) => setEditTime(e.target.value)} 
                  isEdit={true}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Hall Number</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={editHall} 
                  onChange={(e) => setEditHall(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Status</label>
                <CustomSelect
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  options={[
                    { value: 'UPCOMING', label: 'Upcoming' },
                    { value: 'COMPLETED', label: 'Completed' },
                    { value: 'CANCELLED', label: 'Cancelled' }
                  ]}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" className="btn btn-primary" style={{ flexGrow: 1 }} disabled={updating}>
                  {updating ? 'Updating...' : 'Save Changes'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingExam(null)}>Cancel</button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ExamScheduleManager;
