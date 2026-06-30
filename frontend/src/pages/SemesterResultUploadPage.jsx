import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { useAuth } from '../context/AuthContext';
import CustomSelect from '../components/common/CustomSelect';
import { 
  UploadCloud, FileSpreadsheet, CheckCircle, AlertTriangle, 
  Trash2, AlertCircle, Calendar, RefreshCw, Save, Edit2, Check, Download,
  Settings, Info
} from 'lucide-react';

const SemesterResultUploadPage = () => {
  const { user, authenticatedFetch } = useAuth();
  const fileInputRef = useRef(null);

  // Core States
  const [fileName, setFileName] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('1');
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [targetDeptId, setTargetDeptId] = useState(
    user?.role === 'HOD' && user?.departmentId ? user.departmentId.toString() : ''
  );
  const [departments, setDepartments] = useState([]);
  const [validationError, setValidationError] = useState('');
  const [referenceData, setReferenceData] = useState({ students: [], subjects: [], assessments: [], existingResults: [] });
  const [parsedRecords, setParsedRecords] = useState([]);
  const [history, setHistory] = useState([]);

  const importType = 'SEMESTER';
  const assessmentType = 'Semester Examination';
  
  // Loading & UI States
  const [loadingRef, setLoadingRef] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Drag Over state
  const [dragActive, setDragActive] = useState(false);

  // Editing Row State
  const [editingIndex, setEditingIndex] = useState(-1);
  const [editValues, setEditValues] = useState({});

  // Selected History Log for Detail View
  const [selectedHistoryLog, setSelectedHistoryLog] = useState(null);
  const [filterDetailsType, setFilterDetailsType] = useState('all');

  // Preview and History Filter States
  const [previewFilter, setPreviewFilter] = useState('all');
  const [historyFilter, setHistoryFilter] = useState('all');

  // Fuzzy Header Mapping Alias Dictionary
  const headerAliases = {
    registerNumber: ['regno', 'rollno', 'studentcode', 'studentid', 'studentnumber', 'regnumber', 'registernumber', 'register', 'student', 'regno.'],
    studentName: ['studentname', 'name', 'fullname', 'fname', 'sname'],
    departmentName: ['department', 'departmentname', 'dept', 'deptname', 'department_name', 'dept_name', 'college', 'branch'],
    subjectCode: ['subjectcode', 'subcode', 'subjectid', 'coursecode', 'subjectcode', 'sub_code', 'subject_code'],
    subjectName: ['subjectname', 'coursename', 'subname', 'subject_name'],
    internalMarks: ['internal', 'internalmarks', 'internalmark', 'intmark', 'internal_marks', 'int_marks'],
    externalMarks: ['external', 'externalmarks', 'externalmark', 'extmark', 'external_marks', 'ext_marks'],
    totalMarks: ['totalmarks', 'totalmark', 'totmark', 'total_marks', 'total'],
    grade: ['grade', 'lettergrade', 'classgrade'],
    percentage: ['percentage', 'pct', 'percent', 'percentage_score'],
    resultStatus: ['resultstatus', 'result_status', 'passfail', 'status', 'result']
  };

  // Fetch Reference Data, Departments & History
  const loadData = async () => {
    setLoadingRef(true);
    try {
      // Fetch departments
      const deptRes = await authenticatedFetch('/api/admin/departments');
      if (deptRes.ok) {
        const deptData = await deptRes.json();
        setDepartments(deptData);
        // Default target department — HOD is pre-set from state initializer, admin defaults to first
        if (user.role !== 'HOD' && deptData.length > 0) {
          setTargetDeptId(prev => prev || deptData[0].id.toString());
        }
      }

      const refRes = await authenticatedFetch('/api/marks/import/reference-data');
      if (refRes.ok) {
        const refData = await refRes.json();
        setReferenceData(refData);
      }
      
      const histRes = await authenticatedFetch('/api/marks/import/history');
      if (histRes.ok) {
        const histData = await histRes.json();
        // Filter history to only show Semester Results uploads
        const semHist = histData.filter(log => log.assessmentType === 'Semester Examination');
        setHistory(semHist);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load system references or history logs.');
    } finally {
      setLoadingRef(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Drag Handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // CSV Simple string parser
  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/);
    return lines.map(line => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    }).filter(row => row.length > 0 && row.some(cell => cell !== ''));
  };

  // Smart Fuzzy Column Mapping Logic
  const performSmartMatchAndValidation = (rawRows, deptId = targetDeptId, semId = selectedSemester) => {
    if (rawRows.length === 0) return [];

    const rawHeaders = Object.keys(rawRows[0]);
    const headerMapping = {};

    const mapHeader = (rawHeader) => {
      const normalized = rawHeader.toLowerCase().trim().replace(/[\s_-]+/g, '');
      // Exact match first
      for (const [key, aliasList] of Object.entries(headerAliases)) {
        if (aliasList.includes(normalized)) {
          return key;
        }
      }
      // Partial match fallback
      for (const [key, aliasList] of Object.entries(headerAliases)) {
        if (aliasList.some(alias => normalized.includes(alias))) {
          return key;
        }
      }
      return null;
    };

    rawHeaders.forEach(h => {
      const mapped = mapHeader(h);
      if (mapped && !headerMapping[mapped]) { // first match wins
        headerMapping[mapped] = h;
      }
    });

    const getVal = (row, key, defaultValue = '') => {
      const rawHeader = headerMapping[key];
      if (rawHeader !== undefined) {
        return row[rawHeader]?.toString().trim() ?? defaultValue;
      }
      const normalizedKey = key.toLowerCase();
      const matchedKey = Object.keys(row).find(k => k.toLowerCase().replace(/[\s_-]+/g, '').includes(normalizedKey));
      if (matchedKey) {
        return row[matchedKey]?.toString().trim() ?? defaultValue;
      }
      return defaultValue;
    };

    const studentsMap = new Map(referenceData.students.map(s => [s.registerNumber.toUpperCase(), s]));
    const subjectsMap = new Map(referenceData.subjects.map(s => [s.code.toUpperCase(), s]));
    const existingInDB = new Set(
      referenceData.existingResults?.map(r => `${r.studentRegisterNumber.toUpperCase()}-${r.subjectCode.toUpperCase()}`) || []
    );

    const seenInFile = new Set();
    const targetDeptIdNum = parseInt(deptId);
    const targetSemNum = parseInt(semId);

    return rawRows.map((row) => {
      const rawReg = getVal(row, 'registerNumber', '');
      const rawName = getVal(row, 'studentName', '');
      const rawDeptName = getVal(row, 'departmentName', '');
      const rawSub = getVal(row, 'subjectCode', '');
      const rawSubName = getVal(row, 'subjectName', '');
      const rawInternal = getVal(row, 'internalMarks', '');
      const rawExternal = getVal(row, 'externalMarks', '');
      const rawTotal = getVal(row, 'totalMarks', '');
      const rawGrade = getVal(row, 'grade', '');
      const rawPct = getVal(row, 'percentage', '');
      const rawStatus = getVal(row, 'resultStatus', '');

      const student = studentsMap.get(rawReg.toUpperCase());
      const subject = subjectsMap.get(rawSub.toUpperCase());

      const recordKey = `${rawReg.toUpperCase()}-${rawSub.toUpperCase()}`;
      const isDuplicate = seenInFile.has(recordKey);
      seenInFile.add(recordKey);

      const isUpdate = existingInDB.has(recordKey);

      const record = {
        registerNumber: rawReg,
        studentName: student ? student.name : (rawName || 'Unknown Student'),
        // CSV department takes priority, then DB lookup
        departmentName: rawDeptName || (student ? (student.departmentName || 'N/A') : 'N/A'),
        subjectCode: rawSub,
        subjectName: subject ? subject.name : (rawSubName || 'Unknown Subject'),
        internalMarks: rawInternal,
        externalMarks: rawExternal,
        totalMarks: rawTotal,
        percentage: rawPct,
        grade: rawGrade,
        resultStatus: rawStatus,
        isValid: true,
        errors: [],
        isDuplicate,
        isUpdate
      };

      // Validations
      if (!rawReg) {
        record.isValid = false;
        record.errors.push('Register Number is missing');
      } else if (!student) {
        record.isValid = false;
        record.errors.push('Student not found in database');
      } else if (!isNaN(targetDeptIdNum) && student.departmentId !== targetDeptIdNum) {
        record.isValid = false;
        record.errors.push(`Student is from "${student.departmentName || 'dept ' + student.departmentId}", not the selected department`);
      }

      if (!rawSub) {
        record.isValid = false;
        record.errors.push('Subject Code is missing');
      } else if (!subject) {
        record.isValid = false;
        record.errors.push('Subject Code is invalid or not found');
      } else {
        if (!isNaN(targetSemNum) && subject.semester !== targetSemNum) {
          record.isValid = false;
          record.errors.push(`Subject "${rawSub}" is in Semester ${subject.semester} — please select Semester ${subject.semester} in the dropdown`);
        }
        if (!isNaN(targetDeptIdNum) && subject.departmentId !== targetDeptIdNum) {
          record.isValid = false;
          record.errors.push(`Subject "${rawSub}" belongs to a different department`);
        }
      }

      // Check marks range
      if (rawInternal !== '') {
        const val = parseFloat(rawInternal);
        if (isNaN(val) || val < 0 || val > 100) {
          record.isValid = false;
          record.errors.push('Internal marks must be a number between 0 and 100');
        }
      }
      if (rawExternal !== '') {
        const val = parseFloat(rawExternal);
        if (isNaN(val) || val < 0 || val > 100) {
          record.isValid = false;
          record.errors.push('External marks must be a number between 0 and 100');
        }
      }
      if (rawTotal !== '') {
        const val = parseFloat(rawTotal);
        if (isNaN(val) || val < 0 || val > 200) {
          record.isValid = false;
          record.errors.push('Total marks must be a number between 0 and 200');
        }
      }

      // Check Grade format
      if (rawGrade) {
        const validGrades = ['O', 'A+', 'A', 'B+', 'B', 'C', 'U', 'RA', 'F', 'AB'];
        if (!validGrades.includes(rawGrade.trim().toUpperCase())) {
          record.isValid = false;
          record.errors.push(`Grade "${rawGrade}" is invalid — valid grades: O, A+, A, B+, B, C, U, RA, F, AB`);
        }
      }

      return record;
    });
  };

  // File Processor
  const processFile = async (file) => {
    if (!targetDeptId) {
      setError('Please wait — department data is still loading. Try again in a moment.');
      return;
    }

    setFileName(file.name);
    setProcessing(true);
    setUploadProgress(10);
    setError('');
    setSuccess('');

    try {
      const extension = file.name.split('.').pop().toLowerCase();
      let rawRows = [];

      if (extension === 'xlsx' || extension === 'xls') {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        setUploadProgress(50);
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        rawRows = XLSX.utils.sheet_to_json(sheet);
        setUploadProgress(80);
      } 
      else if (extension === 'csv') {
        const text = await file.text();
        setUploadProgress(50);
        const rows = parseCSV(text);
        if (rows.length > 0) {
          const headers = rows[0];
          rawRows = rows.slice(1).map(row => {
            const obj = {};
            headers.forEach((h, index) => {
              obj[h] = row[index] || '';
            });
            return obj;
          });
        }
        setUploadProgress(80);
      } 
      else if (extension === 'docx' || extension === 'doc') {
        const buffer = await file.arrayBuffer();
        setUploadProgress(40);
        const convertResult = await mammoth.convertToHtml({ arrayBuffer: buffer });
        setUploadProgress(70);
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(convertResult.value, 'text/html');
        const rows = Array.from(doc.querySelectorAll('tr'));
        
        if (rows.length > 0) {
          const headers = Array.from(rows[0].querySelectorAll('td, th')).map(cell => cell.textContent.trim());
          rawRows = rows.slice(1).map(row => {
            const cells = Array.from(row.querySelectorAll('td'));
            const obj = {};
            headers.forEach((h, index) => {
              obj[h] = cells[index]?.textContent.trim() || '';
            });
            return obj;
          });
        }
        setUploadProgress(90);
      } 
      else if (extension === 'pdf') {
        setUploadProgress(30);
        const text = await file.text();
        const regex = /([2-9][0-9][A-Z]{2}[0-9]{3,4})[\s,]+([A-Z0-9]{4,8})[\s,]+([0-9]{1,3})([\s,]+([0-9]{1,3}))?([\s,]+([0-9]{1,3}))?/gi;
        let match;
        const extractedRows = [];
        while ((match = regex.exec(text)) !== null) {
          extractedRows.push({
            "Register Number": match[1],
            "Subject Code": match[2],
            "Internal Mark": match[3] || '',
            "External Mark": match[4] || '',
            "Total Mark": match[5] || ''
          });
        }
        
        if (extractedRows.length > 0) {
          rawRows = extractedRows;
          setUploadProgress(90);
        } else {
          throw new Error("Could not extract clean text from PDF directly. If this is a scanned document, please convert to image/Excel.");
        }
      } else {
        throw new Error('Unsupported file extension. Please upload CSV, Excel, Word, or PDF files.');
      }

      // Filter out truly empty rows
      rawRows = rawRows.filter(row => Object.values(row).some(v => v !== '' && v !== null && v !== undefined));

      const formatted = performSmartMatchAndValidation(rawRows, targetDeptId, selectedSemester);
      setParsedRecords(formatted);
      setUploadProgress(100);
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred during file parsing.');
    } finally {
      setProcessing(false);
    }
  };

  // Revalidate Records (after inline edit or delete)
  const revalidateRecords = (recordsToValidate = parsedRecords, deptId = targetDeptId, semId = selectedSemester) => {
    const studentsMap = new Map(referenceData.students.map(s => [s.registerNumber.toUpperCase(), s]));
    const subjectsMap = new Map(referenceData.subjects.map(s => [s.code.toUpperCase(), s]));
    const existingInDB = new Set(
      referenceData.existingResults?.map(r => `${r.studentRegisterNumber.toUpperCase()}-${r.subjectCode.toUpperCase()}`) || []
    );

    const seenInFile = new Set();
    const targetDeptIdNum = parseInt(deptId);
    const targetSemNum = parseInt(semId);

    const updated = recordsToValidate.map((rec) => {
      const student = studentsMap.get(rec.registerNumber?.toUpperCase() || '');
      const subject = subjectsMap.get(rec.subjectCode?.toUpperCase() || '');
      
      const recordKey = `${(rec.registerNumber || '').toUpperCase()}-${(rec.subjectCode || '').toUpperCase()}`;
      const isDuplicate = seenInFile.has(recordKey);
      seenInFile.add(recordKey);
      
      const isUpdate = existingInDB.has(recordKey);

      const record = {
        ...rec,
        studentName: student ? student.name : (rec.studentName || 'Unknown Student'),
        // Preserve CSV departmentName if present, then try DB, then keep existing
        departmentName: rec.departmentName || (student ? (student.departmentName || 'N/A') : 'N/A'),
        subjectName: subject ? subject.name : (rec.subjectName || 'Unknown Subject'),
        isValid: true,
        errors: [],
        isDuplicate,
        isUpdate
      };

      if (!rec.registerNumber) {
        record.isValid = false;
        record.errors.push('Register Number is missing');
      } else if (!student) {
        record.isValid = false;
        record.errors.push('Student not found in database');
      } else if (!isNaN(targetDeptIdNum) && student.departmentId !== targetDeptIdNum) {
        record.isValid = false;
        record.errors.push(`Student is from "${student.departmentName || 'dept ' + student.departmentId}", not the selected department`);
      }

      if (!rec.subjectCode) {
        record.isValid = false;
        record.errors.push('Subject Code is missing');
      } else if (!subject) {
        record.isValid = false;
        record.errors.push('Subject Code is invalid or not found');
      } else {
        if (!isNaN(targetSemNum) && subject.semester !== targetSemNum) {
          record.isValid = false;
          record.errors.push(`Subject "${rec.subjectCode}" is in Semester ${subject.semester} — please select Semester ${subject.semester}`);
        }
        if (!isNaN(targetDeptIdNum) && subject.departmentId !== targetDeptIdNum) {
          record.isValid = false;
          record.errors.push(`Subject "${rec.subjectCode}" belongs to a different department`);
        }
      }

      if (rec.internalMarks !== '' && rec.internalMarks !== null && rec.internalMarks !== undefined) {
        const val = parseFloat(rec.internalMarks);
        if (isNaN(val) || val < 0 || val > 100) {
          record.isValid = false;
          record.errors.push('Internal marks must be between 0 and 100');
        }
      }
      if (rec.externalMarks !== '' && rec.externalMarks !== null && rec.externalMarks !== undefined) {
        const val = parseFloat(rec.externalMarks);
        if (isNaN(val) || val < 0 || val > 100) {
          record.isValid = false;
          record.errors.push('External marks must be between 0 and 100');
        }
      }
      if (rec.totalMarks !== '' && rec.totalMarks !== null && rec.totalMarks !== undefined) {
        const val = parseFloat(rec.totalMarks);
        if (isNaN(val) || val < 0 || val > 200) {
          record.isValid = false;
          record.errors.push('Total marks must be between 0 and 200');
        }
      }

      if (rec.grade) {
        const validGrades = ['O', 'A+', 'A', 'B+', 'B', 'C', 'U', 'RA', 'F', 'AB'];
        if (!validGrades.includes(rec.grade.toString().trim().toUpperCase())) {
          record.isValid = false;
          record.errors.push(`Grade "${rec.grade}" is invalid — valid: O, A+, A, B+, B, C, U, RA, F, AB`);
        }
      }

      return record;
    });

    setParsedRecords(updated);
  };

  // Save parsed changes inline
  const startEdit = (index, record) => {
    setEditingIndex(index);
    setEditValues({ ...record });
  };

  const saveEdit = (index) => {
    const updated = [...parsedRecords];
    updated[index] = { ...editValues };
    setEditingIndex(-1);
    revalidateRecords(updated, targetDeptId, selectedSemester);
  };

  const deleteRow = (index) => {
    const updated = parsedRecords.filter((_, idx) => idx !== index);
    revalidateRecords(updated, targetDeptId, selectedSemester);
  };

  // Normalize resultStatus to backend enum values
  const normalizeStatus = (s) => {
    if (!s) return '';
    const upper = s.toString().toUpperCase().trim();
    if (['PASS', 'PASSED', 'P'].includes(upper)) return 'PASS';
    if (['ARREAR', 'FAIL', 'FAILED', 'F', 'RA'].includes(upper)) return 'ARREAR';
    if (['WITHHELD', 'HELD', 'WH'].includes(upper)) return 'WITHHELD';
    return upper;
  };

  // Submit parsed draft records to the database
  const handleImport = async () => {
    setImporting(true);
    setError('');
    setSuccess('');
    setValidationError('');

    try {
      const response = await authenticatedFetch('/api/marks/import/bulk', {
        method: 'POST',
        body: JSON.stringify({
          fileName,
          importType,
          assessmentType,
          records: parsedRecords.map(r => ({
            registerNumber: r.registerNumber,
            subjectCode: r.subjectCode,
            internalMarks: r.internalMarks,
            externalMarks: r.externalMarks,
            totalMarks: r.totalMarks,
            percentage: r.percentage,
            grade: r.grade ? r.grade.toString().toUpperCase().trim() : '',
            resultStatus: normalizeStatus(r.resultStatus),
            action: r.isValid ? 'UPDATE' : 'SKIP'
          }))
        })
      });

      const result = await response.json();
      if (response.ok) {
        setSuccess(`Semester results uploaded as DRAFT! Imported: ${result.recordsImported}, Skipped: ${result.failedRecords}. Go to 'Publish Results' to make them visible to students.`);
        setParsedRecords([]);
        setFileName('');
        loadData(); // Refresh history logs
      } else {
        setError(result.error || 'Failed to upload semester results.');
      }
    } catch (err) {
      console.error(err);
      setError('A network error occurred. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  // Download Error CSV Report
  const downloadErrorReport = () => {
    const invalidRows = parsedRecords.filter(r => !r.isValid);
    if (invalidRows.length === 0) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Row Number,Register Number,Subject Code,Internal,External,Total,Grade,Errors\n";

    invalidRows.forEach((r, idx) => {
      const errorsStr = `"${r.errors.join('; ')}"`;
      csvContent += `${idx + 1},${r.registerNumber || ''},${r.subjectCode || ''},${r.internalMarks || ''},${r.externalMarks || ''},${r.totalMarks || ''},${r.grade || ''},${errorsStr}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `semester_import_errors_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalCount = parsedRecords.length;
  const validCount = parsedRecords.filter(r => r.isValid).length;
  const invalidCount = parsedRecords.filter(r => !r.isValid).length;
  const duplicateCount = parsedRecords.filter(r => r.isDuplicate).length;
  const updateCount = parsedRecords.filter(r => r.isValid && r.isUpdate).length;

  // ── History Detail View ───────────────────────────────────────────────────────
  if (selectedHistoryLog) {
    let details = [];
    try {
      if (selectedHistoryLog.importDetails) {
        details = JSON.parse(selectedHistoryLog.importDetails);
      }
    } catch (e) {
      console.error(e);
    }

    const isFailedRecord = (r) => {
      if (r.importStatus === 'FAILED') return true;
      if (r.importStatus === 'SUCCESS' || r.importStatus === 'SKIPPED') return false;
      return selectedHistoryLog.status === 'FAILED';
    };

    const failedDetails = details.filter(isFailedRecord);
    const successDetails = details.filter(r => !isFailedRecord(r));
    const displayedDetails = filterDetailsType === 'failed'
      ? failedDetails
      : filterDetailsType === 'success'
        ? successDetails
        : details;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
        <div>
          <button 
            className="btn btn-secondary" 
            onClick={() => setSelectedHistoryLog(null)}
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--primary)',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            ← Back to Upload Logs
          </button>
        </div>

        <div className="glass-card">
          <h2 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileSpreadsheet size={24} style={{ color: 'var(--primary)' }} /> Semester Upload Details
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Detailed records imported from <strong>{selectedHistoryLog.fileName}</strong> on {new Date(selectedHistoryLog.uploadTime).toLocaleString()}.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px', background: 'rgba(255,255,255,0.01)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Assessment Target</span>
              <div style={{ fontWeight: '600', fontSize: '15px', marginTop: '4px', color: 'var(--primary)' }}>
                Semester Examination Results (Draft)
              </div>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Uploaded By</span>
              <div style={{ fontWeight: '600', fontSize: '15px', marginTop: '4px' }}>{selectedHistoryLog.uploadedBy?.name}</div>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Department Scope</span>
              <div style={{ fontWeight: '600', fontSize: '15px', marginTop: '4px' }}>{selectedHistoryLog.department?.name || 'Global'}</div>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Upload Timestamp</span>
              <div style={{ fontWeight: '600', fontSize: '15px', marginTop: '4px' }}>{new Date(selectedHistoryLog.uploadTime).toLocaleString()}</div>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Import Statistics</span>
              <div style={{ fontWeight: '600', color: 'var(--success)', marginTop: '4px' }}>
                {selectedHistoryLog.recordsImported} Success Rows
              </div>
              <div style={{ fontWeight: '600', color: selectedHistoryLog.failedRecords > 0 ? 'var(--danger)' : 'var(--text-secondary)' }}>
                {selectedHistoryLog.failedRecords} Failed / Skipped Rows
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <h3 style={{ margin: 0 }}>Uploaded Data Records</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['all', 'success', 'failed'].map(type => (
                <button
                  key={type}
                  type="button"
                  className="btn"
                  style={{
                    padding: '6px 12px',
                    fontSize: '13px',
                    fontWeight: '500',
                    background: filterDetailsType === type
                      ? (type === 'success' ? 'var(--success)' : type === 'failed' ? 'var(--danger)' : 'var(--primary)')
                      : 'rgba(255,255,255,0.02)',
                    color: filterDetailsType === type ? '#fff'
                      : (type === 'success' ? 'var(--success)' : type === 'failed' ? 'var(--danger)' : 'var(--text-secondary)'),
                    border: `1px solid ${type === 'success' ? 'rgba(74,222,128,0.2)' : type === 'failed' ? 'rgba(248,113,113,0.2)' : 'var(--border)'}`,
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                  onClick={() => setFilterDetailsType(type)}
                >
                  {type === 'all' ? `All (${details.length})` : type === 'success' ? `Success (${successDetails.length})` : `Failed / Skipped (${failedDetails.length})`}
                </button>
              ))}
            </div>
          </div>

          {details.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>
              No detailed log records are stored for this session.
            </div>
          ) : displayedDetails.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', opacity: 0.5, border: '1px dashed var(--border)', borderRadius: '6px' }}>
              No records matching the selected filter found.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="portal-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Register Number</th>
                    <th>Subject Code</th>
                    <th>Internal</th>
                    <th>External</th>
                    <th>Total</th>
                    <th>Grade</th>
                    <th>%</th>
                    <th>Result</th>
                    <th>Import Status</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedDetails.map((rec, i) => (
                    <tr key={i} style={{ background: isFailedRecord(rec) ? 'rgba(248, 113, 113, 0.02)' : '' }}>
                      <td>{i + 1}</td>
                      <td><span style={{ fontWeight: '500' }}>{rec.registerNumber}</span></td>
                      <td>{rec.subjectCode}</td>
                      <td>{rec.internalMarks ?? rec.internalMark ?? '-'}</td>
                      <td>{rec.externalMarks ?? '-'}</td>
                      <td>{rec.totalMarks ?? '-'}</td>
                      <td><span style={{ fontWeight: 'bold' }}>{rec.grade ?? '-'}</span></td>
                      <td>{rec.percentage ? `${rec.percentage}%` : '-'}</td>
                      <td>
                        {rec.resultStatus ? (
                          <span className={`badge ${rec.resultStatus.toUpperCase() === 'PASS' ? 'badge-success' : 'badge-danger'}`}>
                            {rec.resultStatus}
                          </span>
                        ) : (
                          <span style={{ opacity: 0.2 }}>-</span>
                        )}
                      </td>
                      <td style={{ minWidth: '120px' }}>
                        {rec.importStatus === 'FAILED' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                              <AlertTriangle size={12} /> Failed
                            </span>
                            {rec.errorMessage && (
                              <span style={{ fontSize: '11px', color: 'var(--danger)', maxWidth: '200px', whiteSpace: 'normal', wordBreak: 'break-word', display: 'inline-block' }}>
                                {rec.errorMessage}
                              </span>
                            )}
                          </div>
                        ) : rec.importStatus === 'SKIPPED' ? (
                          <span className="badge badge-pending" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <AlertCircle size={12} /> Skipped
                          </span>
                        ) : (
                          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={12} /> Success
                          </span>
                        )}
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
  }

  // ── Main Upload View ──────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileSpreadsheet size={28} style={{ color: 'var(--primary)' }} /> Semester Result Upload
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '14px' }}>
            Upload semester examination results in bulk. Results are saved as Draft until published.
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="alert-banner alert-banner-info" style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px' }}>
        <Info size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ display: 'block', marginBottom: '4px' }}>Draft Mode Active</strong>
          <span style={{ fontSize: '13px', lineHeight: '1.5' }}>
            All semester results uploaded here will be stored as drafts. They will <strong>NOT</strong> be visible to students or reflected in CGPA calculations until you publish them from the <strong>Publish Results</strong> page.
          </span>
        </div>
      </div>

      {error && (
        <div className="alert-banner alert-banner-danger" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert-banner alert-banner-success" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={20} />
          <span>{success}</span>
        </div>
      )}

      {/* UPLOAD PANEL (Only shown when no file has been parsed yet) */}
      {parsedRecords.length === 0 && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            {/* Department Selection */}
            <div className="form-group" style={{ margin: 0, width: '280px' }}>
              <label className="form-label">Target Department <span style={{ color: 'var(--danger)' }}>*</span></label>
              <CustomSelect
                value={targetDeptId}
                onChange={(e) => setTargetDeptId(e.target.value)}
                disabled={user.role === 'HOD'}
                options={departments.map(d => ({ value: d.id.toString(), label: d.name }))}
              />
              {user.role === 'HOD' && (
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                  Locked to your department
                </span>
              )}
            </div>

            {/* Semester Selection */}
            <div className="form-group" style={{ margin: 0, width: '180px' }}>
              <label className="form-label">Semester <span style={{ color: 'var(--danger)' }}>*</span></label>
              <CustomSelect
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
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

            {/* Academic Year Selection */}
            <div className="form-group" style={{ margin: 0, width: '200px' }}>
              <label className="form-label">Academic Year <span style={{ color: 'var(--danger)' }}>*</span></label>
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
          </div>

          {/* Drag and Drop Dropzone */}
          <div 
            className={`dropzone ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed var(--border)',
              borderRadius: '8px',
              padding: '40px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragActive ? 'rgba(var(--primary-rgb), 0.05)' : 'rgba(255,255,255,0.01)',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px'
            }}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileChange}
              accept=".csv, .xlsx, .xls, .docx, .doc, .pdf"
            />
            <UploadCloud size={48} style={{ color: 'var(--primary)', opacity: 0.8 }} />
            <div>
              <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                Drag and drop your marksheet file here
              </span>
              <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Supports Excel (.xlsx, .xls), CSV (.csv), Word (.docx, .doc) or PDF (.pdf)
              </span>
            </div>
          </div>

          {processing && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                <span>Processing &amp; parsing file...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.2s ease' }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* PREVIEW TABLE */}
      {parsedRecords.length > 0 && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileSpreadsheet size={20} /> Semester Result Import Preview
            </h3>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              {invalidCount > 0 && (
                <button 
                  className="btn btn-secondary" 
                  onClick={downloadErrorReport}
                  style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)' }}
                >
                  <Download size={16} /> Download Error Report ({invalidCount})
                </button>
              )}
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  setParsedRecords([]);
                  setFileName('');
                  setError('');
                  setSuccess('');
                }}
                style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                ← Back to Upload
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleImport}
                disabled={importing || validCount === 0}
                style={{ padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                {importing ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                Upload Draft ({validCount} Valid Rows)
              </button>
            </div>
          </div>

          {/* Metadata Card */}
          <div className="glass-card" style={{ background: 'rgba(255,255,255,0.01)', padding: '20px', marginBottom: '24px', border: '1px solid var(--border)' }}>
            <h4 style={{ marginBottom: '16px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings size={18} /> Pre-Import Metadata Verification
            </h4>

            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', fontSize: '13px', border: '1px solid var(--border)' }}>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Target Department:</span>{' '}
                <strong>{departments.find(d => d.id.toString() === targetDeptId)?.name || (targetDeptId ? `Dept ID ${targetDeptId}` : 'N/A')}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Target Semester:</span>{' '}
                <strong>Semester {selectedSemester}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Academic Year:</span>{' '}
                <strong>{academicYear}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Detected Subjects:</span>{' '}
                <strong style={{ color: 'var(--primary)' }}>
                  {[...new Set(parsedRecords.map(r => r.subjectCode).filter(Boolean))].join(', ') || 'N/A'}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Total Rows:</span>{' '}
                <strong>{parsedRecords.length}</strong>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{totalCount}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>Total Rows</div>
            </div>
            <div style={{ padding: '12px', background: 'rgba(74, 222, 128, 0.05)', borderRadius: '6px', border: '1px solid rgba(74, 222, 128, 0.1)', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--success)' }}>{validCount}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>Valid Rows</div>
            </div>
            <div style={{ padding: '12px', background: 'rgba(248, 113, 113, 0.05)', borderRadius: '6px', border: '1px solid rgba(248, 113, 113, 0.1)', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--danger)' }}>{invalidCount}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>Invalid Rows</div>
            </div>
            <div style={{ padding: '12px', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.1)', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--warning)' }}>{duplicateCount}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>Duplicates</div>
            </div>
            <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '6px', border: '1px solid rgba(59, 130, 246, 0.1)', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--primary)' }}>{updateCount}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>Will Update</div>
            </div>
          </div>
          
          {/* Preview Filter Buttons */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {[
              { key: 'all', label: `All (${totalCount})`, color: 'var(--primary)', border: 'var(--border)' },
              { key: 'valid', label: `Valid (${validCount})`, color: 'var(--success)', border: 'rgba(74,222,128,0.2)' },
              { key: 'invalid', label: `Invalid (${invalidCount})`, color: 'var(--danger)', border: 'rgba(248,113,113,0.2)' }
            ].map(({ key, label, color, border }) => (
              <button
                key={key}
                type="button"
                className="btn"
                style={{
                  padding: '6px 12px',
                  fontSize: '13px',
                  fontWeight: '500',
                  background: previewFilter === key ? color : 'rgba(255,255,255,0.02)',
                  color: previewFilter === key ? '#fff' : color,
                  border: `1px solid ${border}`,
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                onClick={() => setPreviewFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
            <table className="portal-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Register Number</th>
                  <th>Student Name</th>
                  <th>Department</th>
                  <th>Subject Code</th>
                  <th>Subject Name</th>
                  <th>Internal</th>
                  <th>External</th>
                  <th>Total</th>
                  <th>Grade</th>
                  <th>%</th>
                  <th>Result</th>
                  <th>Validation</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {parsedRecords
                  .map((rec, idx) => ({ ...rec, originalIndex: idx }))
                  .filter(rec => {
                    if (previewFilter === 'valid') return rec.isValid;
                    if (previewFilter === 'invalid') return !rec.isValid;
                    return true;
                  })
                  .map((rec) => {
                    const index = rec.originalIndex;
                    const isEditing = editingIndex === index;
                  return (
                    <tr key={index} style={{ background: !rec.isValid ? 'rgba(248, 113, 113, 0.02)' : '', borderLeft: rec.isUpdate ? '3px solid var(--primary)' : '' }}>
                      <td>{index + 1}</td>
                      
                      {/* Register Number */}
                      <td>
                        {isEditing ? (
                          <input 
                            type="text" 
                            className="form-control" 
                            style={{ padding: '4px 8px', fontSize: '13px' }} 
                            value={editValues.registerNumber || ''} 
                            onChange={(e) => setEditValues({ ...editValues, registerNumber: e.target.value })} 
                          />
                        ) : (
                          <span style={{ fontWeight: '500' }}>{rec.registerNumber || <span style={{ opacity: 0.3 }}>N/A</span>}</span>
                        )}
                      </td>
                      
                      {/* Student Name */}
                      <td>{rec.studentName}</td>

                      {/* Department */}
                      <td>
                        <span className="badge badge-secondary" style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                          {rec.departmentName}
                        </span>
                      </td>
                      
                      {/* Subject Code */}
                      <td>
                        {isEditing ? (
                          <input 
                            type="text" 
                            className="form-control" 
                            style={{ padding: '4px 8px', fontSize: '13px' }} 
                            value={editValues.subjectCode || ''} 
                            onChange={(e) => setEditValues({ ...editValues, subjectCode: e.target.value })} 
                          />
                        ) : (
                          <span>{rec.subjectCode || <span style={{ opacity: 0.3 }}>N/A</span>}</span>
                        )}
                      </td>
                      
                      {/* Subject Name */}
                      <td>{rec.subjectName}</td>
                      
                      {/* Internal Marks */}
                      <td>
                        {isEditing ? (
                          <input 
                            type="number" 
                            className="form-control" 
                            style={{ padding: '4px 8px', fontSize: '13px', width: '60px' }} 
                            value={editValues.internalMarks ?? ''} 
                            onChange={(e) => setEditValues({ ...editValues, internalMarks: e.target.value })} 
                          />
                        ) : (
                          <span>{rec.internalMarks !== '' && rec.internalMarks !== undefined ? rec.internalMarks : <span style={{ opacity: 0.2 }}>-</span>}</span>
                        )}
                      </td>
                      
                      {/* External Marks */}
                      <td>
                        {isEditing ? (
                          <input 
                            type="number" 
                            className="form-control" 
                            style={{ padding: '4px 8px', fontSize: '13px', width: '60px' }} 
                            value={editValues.externalMarks ?? ''} 
                            onChange={(e) => setEditValues({ ...editValues, externalMarks: e.target.value })} 
                          />
                        ) : (
                          <span>{rec.externalMarks !== '' && rec.externalMarks !== undefined ? rec.externalMarks : <span style={{ opacity: 0.2 }}>-</span>}</span>
                        )}
                      </td>
                      
                      {/* Total Marks */}
                      <td>
                        {isEditing ? (
                          <input 
                            type="number" 
                            className="form-control" 
                            style={{ padding: '4px 8px', fontSize: '13px', width: '60px' }} 
                            value={editValues.totalMarks ?? ''} 
                            onChange={(e) => setEditValues({ ...editValues, totalMarks: e.target.value })} 
                          />
                        ) : (
                          <span>{rec.totalMarks !== '' && rec.totalMarks !== undefined ? rec.totalMarks : <span style={{ opacity: 0.2 }}>-</span>}</span>
                        )}
                      </td>

                      {/* Grade */}
                      <td>
                        {isEditing ? (
                          <input 
                            type="text" 
                            className="form-control" 
                            style={{ padding: '4px 8px', fontSize: '13px', width: '60px', textTransform: 'uppercase' }} 
                            value={editValues.grade ?? ''} 
                            placeholder="O/A+/B+"
                            onChange={(e) => setEditValues({ ...editValues, grade: e.target.value.toUpperCase() })} 
                          />
                        ) : (
                          <span style={{ fontWeight: 'bold' }}>{rec.grade || <span style={{ opacity: 0.2 }}>-</span>}</span>
                        )}
                      </td>

                      {/* Percentage */}
                      <td>
                        {isEditing ? (
                          <input 
                            type="number" 
                            className="form-control" 
                            style={{ padding: '4px 8px', fontSize: '13px', width: '65px' }} 
                            value={editValues.percentage ?? ''} 
                            onChange={(e) => setEditValues({ ...editValues, percentage: e.target.value })} 
                          />
                        ) : (
                          <span>{rec.percentage ? `${rec.percentage}%` : <span style={{ opacity: 0.2 }}>-</span>}</span>
                        )}
                      </td>

                      {/* Result Status */}
                      <td>
                        {isEditing ? (
                          <select
                            className="form-control"
                            style={{ padding: '4px 8px', fontSize: '13px', width: '90px' }}
                            value={normalizeStatus(editValues.resultStatus)}
                            onChange={(e) => setEditValues({ ...editValues, resultStatus: e.target.value })}
                          >
                            <option value="">--</option>
                            <option value="PASS">PASS</option>
                            <option value="ARREAR">ARREAR</option>
                            <option value="WITHHELD">WITHHELD</option>
                          </select>
                        ) : (
                          <span>
                            {rec.resultStatus ? (
                              <span className={`badge ${normalizeStatus(rec.resultStatus) === 'PASS' ? 'badge-success' : 'badge-danger'}`}>
                                {normalizeStatus(rec.resultStatus)}
                              </span>
                            ) : (
                              <span style={{ opacity: 0.2 }}>-</span>
                            )}
                          </span>
                        )}
                      </td>

                      {/* Validation Status */}
                      <td>
                        {rec.isValid ? (
                          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={12} /> Valid {rec.isUpdate && '(Update)'}
                          </span>
                        ) : (
                          <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }} title={rec.errors.join(', ')}>
                            <AlertTriangle size={12} /> Error
                          </span>
                        )}
                        {rec.isDuplicate && (
                          <span className="badge badge-pending" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: '4px' }}>
                            Duplicate
                          </span>
                        )}
                        {!rec.isValid && (
                          <div style={{ fontSize: '11px', color: 'var(--danger)', marginTop: '4px', maxWidth: '220px' }}>
                            {rec.errors.map((e, i) => <div key={i}>• {e}</div>)}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          {isEditing ? (
                            <>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '4px 8px', color: 'var(--success)' }} 
                                onClick={() => saveEdit(index)}
                              >
                                <Check size={14} />
                              </button>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '4px 8px' }} 
                                onClick={() => setEditingIndex(-1)}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '4px 8px' }} 
                                onClick={() => startEdit(index, rec)}
                              >
                                <Edit2 size={14} />
                              </button>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '4px 8px', color: 'var(--danger)' }} 
                                onClick={() => deleteRow(index)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* History logs */}
      <div className="glass-card">
        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={20} /> Upload History Logs (Semester Exams)
        </h3>
        
        {loadingRef ? (
          <div style={{ padding: '20px', textAlign: 'center', opacity: 0.5 }}>Loading logs...</div>
        ) : history.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', opacity: 0.5 }}>
            No semester results upload history found.
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {[
                { key: 'all', label: `All (${history.length})`, color: 'var(--primary)', border: 'var(--border)' },
                { key: 'success', label: `Success (${history.filter(l => l.status === 'SUCCESS').length})`, color: 'var(--success)', border: 'rgba(74,222,128,0.2)' },
                { key: 'failed', label: `Failed (${history.filter(l => l.status === 'FAILED' || l.status === 'WARNING').length})`, color: 'var(--danger)', border: 'rgba(248,113,113,0.2)' }
              ].map(({ key, label, color, border }) => (
                <button
                  key={key}
                  type="button"
                  className="btn"
                  style={{
                    padding: '6px 12px',
                    fontSize: '13px',
                    fontWeight: '500',
                    background: historyFilter === key ? color : 'rgba(255,255,255,0.02)',
                    color: historyFilter === key ? '#fff' : color,
                    border: `1px solid ${border}`,
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                  onClick={() => setHistoryFilter(key)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="portal-table">
                <thead>
                  <tr>
                    <th>File Name</th>
                    <th>Assessment Scope</th>
                    <th>Uploaded By</th>
                    <th>Department</th>
                    <th>Upload Time</th>
                    <th>Imported</th>
                    <th>Failed / Skipped</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history
                    .filter(log => {
                      if (historyFilter === 'success') return log.status === 'SUCCESS';
                      if (historyFilter === 'failed') return log.status === 'FAILED' || log.status === 'WARNING';
                      return true;
                    })
                    .map((log) => (
                      <tr key={log.id} onClick={() => {
                        setSelectedHistoryLog(log);
                        setFilterDetailsType(log.failedRecords > 0 ? 'failed' : 'all');
                      }} style={{ cursor: 'pointer' }} title="Click to view details">
                        <td style={{ fontWeight: '500', color: 'var(--primary)' }}>{log.fileName}</td>
                        <td style={{ fontWeight: '500' }}>Semester Examination Results</td>
                        <td>{log.uploadedBy?.name}</td>
                        <td>{log.department?.name || 'Global'}</td>
                        <td>{new Date(log.uploadTime).toLocaleString()}</td>
                        <td style={{ color: 'var(--success)', fontWeight: '600' }}>{log.recordsImported}</td>
                        <td style={{ color: log.failedRecords > 0 ? 'var(--danger)' : '', fontWeight: '600' }}>{log.failedRecords}</td>
                        <td>
                          {log.status === 'SUCCESS' ? (
                            <span className="badge badge-success">Success</span>
                          ) : log.status === 'WARNING' ? (
                            <span className="badge badge-pending">Warning</span>
                          ) : (
                            <span className="badge badge-danger">Failed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default SemesterResultUploadPage;
