import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Profile from '../pages/Profile';
import ExamScheduleManager from '../pages/ExamScheduleManager';
import { 
  CheckCircle, XCircle, AlertCircle, FileText, Download, Play, 
  CreditCard, BookOpen, Clock, Calendar, CheckSquare, Award
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

  const getHeaderInfo = (pathname) => {
    const path = pathname.toLowerCase().replace(/\/$/, '');
    if (path.endsWith('/dashboard')) {
      return {
        title: 'Dashboard',
        subtitle: `Welcome back, ${user?.name}! Here is your academic overview.`
      };
    }
    if (path.endsWith('/profile')) {
      return {
        title: 'My Profile',
        subtitle: 'View and manage your student profile details.'
      };
    }
    if (path.endsWith('/fees')) {
      return {
        title: 'Fees & Invoices',
        subtitle: 'Track your term fee schedule, pending payments, and payment history.'
      };
    }
    if (path.endsWith('/marks')) {
      return {
        title: 'Marks & CGPA',
        subtitle: 'Track your internal test marks and overall CGPA progress.'
      };
    }
    if (path.endsWith('/results')) {
      return {
        title: 'Published Results',
        subtitle: 'View your published semester end exam grades.'
      };
    }
    if (path.endsWith('/attendance')) {
      return {
        title: 'Attendance Tracker',
        subtitle: 'Monitor your daily and subject-wise class attendance.'
      };
    }
    if (path.endsWith('/assignments')) {
      return {
        title: 'Assignments',
        subtitle: 'Review and upload files for your course assignments.'
      };
    }
    if (path.endsWith('/exams')) {
      return {
        title: 'Exam Schedule',
        subtitle: 'View exam schedules, locations, and halls.'
      };
    }
    if (path.endsWith('/documents')) {
      return {
        title: 'Academic Records',
        subtitle: 'Access your transcripts, certificates, and academic documents.'
      };
    }
    if (path.endsWith('/notifications')) {
      return {
        title: 'Notifications',
        subtitle: 'Stay updated with portal announcements.'
      };
    }
    return {
      title: 'Academic Portal',
      subtitle: `Welcome back, ${user?.name}`
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
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Student | {user?.departmentCode} - Year {user?.year}</div>
            </div>
            <div className="avatar">{user?.name ? user.name.charAt(0) : 'S'}</div>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
};

// 1. Dashboard Page
const StudentDashboard = () => {
  const { authenticatedFetch } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authenticatedFetch('/api/student/dashboard')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch student stats');
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
          <div className="stat-icon stat-icon-primary"><CheckSquare size={24} /></div>
          <div>
            <div className="stat-number">{stats?.attendancePercentage}%</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Attendance Rate</div>
          </div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon stat-icon-accent"><Award size={24} /></div>
          <div>
            <div className="stat-number">{stats?.cgpa}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Current CGPA</div>
          </div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon stat-icon-success"><BookOpen size={24} /></div>
          <div>
            <div className="stat-number">{stats?.pendingAssignmentsCount}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Class Assignments</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
        <div className="glass-card">
          <h3 style={{ marginBottom: '16px' }}>Upcoming Schedule</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px solid var(--border-glow)' }}>
            <Calendar size={32} style={{ color: 'var(--primary)' }} />
            <div>
              <div style={{ fontWeight: '600' }}>Next Scheduled Exam</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{stats?.nextExam || 'No upcoming exams'}</div>
            </div>
          </div>
        </div>
        
        <div className="glass-card">
          <h3 style={{ marginBottom: '16px' }}>Quick Links</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Link to="/student/fees" className="btn btn-secondary" style={{ padding: '16px' }}>Fee Summary</Link>
            <Link to="/student/marks" className="btn btn-secondary" style={{ padding: '16px' }}>Marks & CGPA</Link>
            <Link to="/student/attendance" className="btn btn-secondary" style={{ padding: '16px' }}>Attendance Log</Link>
            <Link to="/student/assignments" className="btn btn-secondary" style={{ padding: '16px' }}>Assignments</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// 2. Fees Page
const FeesPage = () => {
  const { authenticatedFetch } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payModal, setPayModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState('ONLINE');
  const [txRef, setTxRef] = useState('');

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
    }
  };

  if (loading) return <div>Loading fees summary...</div>;

  return (
    <>
      <div className="glass-card">
        <h2 style={{ marginBottom: '24px' }}>Invoices & Fee Structure</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '32px' }}>
          <div style={{ padding: '20px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px solid var(--border-glow)' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Total Fee Invoiced</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>INR {summary?.totalDue}</div>
          </div>
          <div style={{ padding: '20px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
            <div style={{ fontSize: '13px', color: 'var(--success)' }}>Total Fee Paid</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--success)' }}>INR {summary?.totalPaid}</div>
          </div>
          <div style={{ padding: '20px', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.1)' }}>
            <div style={{ fontSize: '13px', color: 'var(--warning)' }}>Total Fee Pending</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--warning)' }}>INR {summary?.totalPending}</div>
          </div>
        </div>

        <h3 style={{ marginBottom: '16px' }}>Pending Payments</h3>
        {summary?.pendingFees?.length === 0 ? (
          <div style={{ padding: '16px', color: 'var(--text-secondary)', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', marginBottom: '32px' }}>No pending invoices.</div>
        ) : (
          <div className="table-container" style={{ marginBottom: '32px' }}>
            <table className="portal-table">
              <thead>
                <tr>
                  <th>Fee Type</th>
                  <th>Total Cost</th>
                  <th>Amount Paid</th>
                  <th>Remaining</th>
                  <th>Due Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {summary?.pendingFees?.map((fee) => (
                  <tr key={fee.feeId}>
                    <td style={{ fontWeight: '600' }}>{fee.feeType}</td>
                    <td>INR {fee.amount}</td>
                    <td>INR {fee.amountPaid}</td>
                    <td style={{ color: 'var(--warning)', fontWeight: '600' }}>INR {fee.remaining}</td>
                    <td>{fee.dueDate}</td>
                    <td>
                      <button className="btn btn-primary" style={{ padding: '6px 16px', fontSize: '13px' }} onClick={() => openPay(fee)}>Pay Now</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <h3 style={{ marginBottom: '16px' }}>Paid History & Receipts</h3>
        <div className="table-container">
          <table className="portal-table">
            <thead>
              <tr>
                <th>Fee Type</th>
                <th>Amount Paid</th>
                <th>Payment Date</th>
                <th>Receipt No</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {summary?.paidFees?.map((fee) => (
                <tr key={fee.feeId}>
                  <td style={{ fontWeight: '600' }}>{fee.feeType}</td>
                  <td>INR {fee.amountPaid}</td>
                  <td>{fee.paymentDate}</td>
                  <td>{fee.receiptNumber}</td>
                  <td>
                    <a
                      href={fee.receiptUrl}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '13px', display: 'inline-flex', gap: '6px' }}
                      download
                    >
                      <Download size={14} /> Download
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {payModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', zIndex: 100, justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
          <div className="glass-card" style={{ width: '400px', background: 'var(--bg-surface-solid)', maxHeight: '90dvh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '20px' }}>Make Fee Payment</h3>
            <form onSubmit={handlePay}>
              <div className="form-group">
                <label className="form-label">Fee Type</label>
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
                    { value: 'ONLINE', label: 'ONLINE / UPI' },
                    { value: 'CASH', label: 'CASH' },
                    { value: 'DD', label: 'Demand Draft' }
                  ]}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Transaction Reference (Optional)</label>
                <input type="text" className="form-control" placeholder="TXNXXXXXXXX" value={txRef} onChange={(e) => setTxRef(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" className="btn btn-primary" style={{ flexGrow: 1 }}>Submit</button>
                <button type="button" className="btn btn-secondary" onClick={() => setPayModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

// 3. Marks & CGPA Page
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

  if (loading) return <div>Loading grades...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="glass-card">
        <h2 style={{ marginBottom: '24px' }}>GPA & CGPA Progress Tracker</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', alignItems: 'center' }}>
          <div style={{ flexGrow: 1, minWidth: '300px' }}>
            <h3 style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Semester-wise GPA Performance</h3>
            <div className="custom-chart-bar-container">
              {gpaData?.semesters?.map((sem) => (
                <div className="custom-chart-bar-col" key={sem.id}>
                  <div 
                    className="custom-chart-bar" 
                    style={{ height: `${(Number(sem.sgpa || 0) / 10.0) * 100}%` }}
                    data-value={typeof sem.sgpa === 'number' ? sem.sgpa.toFixed(2) : (sem.sgpa ? Number(sem.sgpa).toFixed(2) : '0.00')}
                  ></div>
                  <div className="custom-chart-label">Sem {sem.semester}</div>
                </div>
              ))}
            </div>
          </div>
          
          <div style={{ padding: '32px', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '16px', border: '1px solid rgba(99, 102, 241, 0.1)', textAlign: 'center', width: '220px' }}>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Overall CGPA</div>
            <div style={{ fontSize: '64px', fontWeight: '800', color: 'var(--primary)', lineHeight: 1 }}>
              {typeof gpaData?.overallCgpa === 'number' 
                ? gpaData.overallCgpa.toFixed(2) 
                : (gpaData?.overallCgpa ? Number(gpaData.overallCgpa).toFixed(2) : '0.00')}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Scale: 0.00 - 10.00</div>
          </div>
        </div>
      </div>

      <div className="glass-card">
        <h2>Internal Assessment Grades</h2>
        <div className="table-container">
          <table className="portal-table">
            <thead>
              <tr>
                <th>Subject Name</th>
                <th>Subject Code</th>
                <th>Assessment</th>
                <th>Max Marks</th>
                <th>Scored Marks</th>
              </tr>
            </thead>
            <tbody>
              {internalMarks.map((m) => (
                <tr key={m.id}>
                  <td style={{ fontWeight: '600' }}>{m.subject.name}</td>
                  <td>{m.subject.code}</td>
                  <td>{m.assessmentType}</td>
                  <td>{m.maxMarks}</td>
                  <td style={{ fontWeight: '700', color: 'var(--primary)' }}>{m.scoredMarks}</td>
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

  if (loading) return <div>Loading published results...</div>;

  // Group results by semester
  const resultsBySemester = {};
  results.forEach(r => {
    const sem = r.semester;
    if (!resultsBySemester[sem]) {
      resultsBySemester[sem] = [];
    }
    resultsBySemester[sem].push(r);
  });

  const semestersList = Object.keys(resultsBySemester).sort((a, b) => b - a); // descending order

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
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .header h1 { margin: 0; font-size: 26px; }
            .header p { margin: 5px 0 0; color: #666; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px; }
            .info-item { font-size: 14px; }
            .info-item strong { color: #111; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: 600; }
            .footer { display: flex; justify-content: space-between; margin-top: 50px; font-size: 14px; border-top: 1px solid #ddd; padding-top: 20px; }
            .gpa-box { display: flex; gap: 30px; background: #f9f9f9; padding: 15px; border-radius: 6px; border: 1px solid #eee; margin-bottom: 30px; font-weight: 600; }
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
                  <td style="font-weight: bold;">${r.grade}</td>
                  <td><span style="color: ${r.resultStatus === 'PASS' ? 'green' : 'red'}; font-weight: 600;">${r.resultStatus}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="gpa-box">
            <div>SEMESTER SGPA: <span style="color: #4f46e5;">${semGpa}</span></div>
            <div>OVERALL CGPA: <span style="color: #4f46e5;">${cgpa}</span></div>
          </div>

          <div class="footer">
            <div>Date of Issue: ${new Date().toLocaleDateString()}</div>
            <div>Controller of Examinations</div>
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {semestersList.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glow)', borderRadius: '8px', color: 'var(--text-secondary)', textAlign: 'center' }}>
          <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>Semester Results</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--warning)' }}>Results Not Published Yet</div>
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
                  <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <span>SGPA: <strong style={{ color: 'var(--primary)' }}>{semGpa}</strong></span>
                    <span>CGPA: <strong style={{ color: 'var(--primary)' }}>{cgpa}</strong></span>
                  </div>
                </div>
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}
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
                      <th>Grade</th>
                      <th>Grade Point</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {semResults.map((r) => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: '600' }}>{r.subject?.code || r.subjectCode}</td>
                        <td>{r.subject?.name || r.subjectName}</td>
                        <td>{r.credits}</td>
                        <td style={{ fontWeight: '700', color: 'var(--accent)' }}>{r.grade}</td>
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

// 5. Attendance Page
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

  if (loading) return <div>Loading attendance logs...</div>;

  // Group attendance
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
        <h2 style={{ marginBottom: '24px' }}>Subject-wise Attendance Tracker</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {Object.values(grouped).map(sub => {
            const total = sub.present + sub.absent + sub.od + sub.medical;
            const rate = total > 0 ? ((sub.present + sub.od) * 100 / total).toFixed(1) : '100.0';
            return (
              <div key={sub.code} style={{ padding: '20px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-glow)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div>
                    <span style={{ fontWeight: '600' }}>{sub.subject}</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', marginLeft: '12px' }}>{sub.code}</span>
                  </div>
                  <div style={{ fontWeight: '700', color: parseFloat(rate) >= 75 ? 'var(--success)' : 'var(--danger)' }}>{rate}%</div>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${rate}%`, background: 'var(--primary)' }}></div>
                </div>
                <div style={{ display: 'flex', gap: '20px', marginTop: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <div>Present: <span style={{ color: 'var(--success)', fontWeight: '600' }}>{sub.present}</span></div>
                  <div>Absent: <span style={{ color: 'var(--danger)', fontWeight: '600' }}>{sub.absent}</span></div>
                  <div>On Duty (OD): <span style={{ color: 'var(--accent)', fontWeight: '600' }}>{sub.od}</span></div>
                  <div>Medical: <span style={{ color: 'var(--warning)', fontWeight: '600' }}>{sub.medical}</span></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass-card">
        <h2>Detailed History Log</h2>
        <div className="table-container">
          <table className="portal-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Subject Code</th>
                <th>Subject Name</th>
                <th>Status</th>
                <th>Marked By</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id}>
                  <td>{r.classDate}</td>
                  <td>{r.subject.code}</td>
                  <td style={{ fontWeight: '600' }}>{r.subject.name}</td>
                  <td>
                    <span className={`badge ${r.status === 'PRESENT' ? 'badge-success' : r.status === 'ABSENT' ? 'badge-danger' : r.status === 'OD' ? 'badge-success' : 'badge-pending'}`}>
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
    setSubmitModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
        setFileUrl('');
        fetchAsg();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div>Loading assignments...</div>;

  return (
    <>
      <div className="glass-card">
        <h2 style={{ marginBottom: '24px' }}>Course Assignments</h2>
        <div className="table-container">
          <table className="portal-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Subject</th>
                <th>Due Date</th>
                <th>Max Marks</th>
                <th>Upload Date / Submission</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((asg) => (
                <tr key={asg.id}>
                  <td style={{ fontWeight: '600' }}>
                    <div>{asg.title}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '400' }}>{asg.description}</div>
                  </td>
                  <td>{asg.subject.name}</td>
                  <td style={{ color: 'var(--warning)', fontWeight: '600' }}>{asg.dueDate}</td>
                  <td>{asg.maxMarks}</td>
                  <td>No submission yet</td>
                  <td>
                    <button className="btn btn-primary" style={{ padding: '6px 16px', fontSize: '13px' }} onClick={() => openSubmit(asg)}>Upload</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {submitModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', zIndex: 100, justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
          <div className="glass-card" style={{ width: '400px', background: 'var(--bg-surface-solid)', maxHeight: '90dvh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '20px' }}>Upload Submission</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Assignment Title</label>
                <input type="text" className="form-control" value={selectedAsg?.title} disabled />
              </div>
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Submission Link / Document URL</label>
                <input type="text" className="form-control" placeholder="https://drive.google.com/..." value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" className="btn btn-primary" style={{ flexGrow: 1 }}>Submit</button>
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

  if (loading) return <div>Loading exam schedules...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="glass-card">
        <h2 style={{ marginBottom: '24px' }}>Semester Exam Schedule</h2>
        <div className="table-container">
          <table className="portal-table">
            <thead>
              <tr>
                <th>Subject Code</th>
                <th>Subject Name</th>
                <th>Exam Category</th>
                <th>Date</th>
                <th>Time</th>
                <th>Hall Number</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: '600' }}>{s.subject.code}</td>
                  <td>{s.subject.name}</td>
                  <td>{s.examType}</td>
                  <td>{s.examDate}</td>
                  <td>{formatTime12Hour(s.examTime)}</td>
                  <td>{s.hallNumber}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-card">
        <h2 style={{ marginBottom: '24px' }}>Arrear Papers Log</h2>
        {arrears.length === 0 ? (
          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glow)', borderRadius: '8px', color: 'var(--text-secondary)' }}>
            No pending or cleared arrears on your record. Clear academic history!
          </div>
        ) : (
          <div className="table-container">
            <table className="portal-table">
              <thead>
                <tr>
                  <th>Subject Code</th>
                  <th>Subject Name</th>
                  <th>Original Semester</th>
                  <th>Exam Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {arrears.map((a) => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: '600' }}>{a.subject.code}</td>
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

  if (loading) return <div>Loading academic files...</div>;

  return (
    <div className="glass-card">
      <h2 style={{ marginBottom: '24px' }}>Academic Records & Certifications</h2>
      <div className="table-container">
        <table className="portal-table">
          <thead>
            <tr>
              <th>Document Name / Type</th>
              <th>Semester Associated</th>
              <th>Upload Timestamp</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((doc) => (
              <tr key={doc.id}>
                <td style={{ fontWeight: '600' }}>{doc.docType}</td>
                <td>{doc.semester ? 'Semester ' + doc.semester : 'All Semesters'}</td>
                <td>{doc.uploadedAt}</td>
                <td>
                  <a href={doc.fileUrl} target="_blank" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }}>
                    View File
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

  if (loading) return <div>Loading notifications...</div>;

  return (
    <div className="glass-card">
      <h2 style={{ marginBottom: '24px' }}>Inbox Announcements</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {notifs.map((n) => (
          <div 
            key={n.id} 
            style={{ 
              padding: '20px', 
              background: n.isRead ? 'rgba(255, 255, 255, 0.01)' : 'rgba(99, 102, 241, 0.04)', 
              border: n.isRead ? '1px solid var(--border-glow)' : '1px solid rgba(99, 102, 241, 0.2)', 
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className={`badge ${n.type === 'FEE' ? 'badge-pending' : n.type === 'EXAM' ? 'badge-danger' : 'badge-success'}`}>{n.type}</span>
                <span style={{ fontWeight: '600', color: n.isRead ? 'var(--text-secondary)' : 'var(--text-primary)' }}>{n.title}</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '6px' }}>{n.message}</p>
            </div>
            
            {!n.isRead && (
              <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => markAsRead(n.id)}>
                Mark Read
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
