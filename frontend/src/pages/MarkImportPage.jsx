import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { createWorker } from 'tesseract.js';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import CustomSelect from '../components/common/CustomSelect';
import { 
  UploadCloud, FileSpreadsheet, FileText, CheckCircle, AlertTriangle, 
  Trash2, Settings, AlertCircle, Calendar, RefreshCw, Save, Edit2, Check
} from 'lucide-react';

// Validation Schema using Zod
const markRecordSchema = z.object({
  registerNumber: z.string().min(1, 'Register Number is required'),
  subjectCode: z.string().min(1, 'Subject Code is required'),
  internalMark: z.number().min(0).max(100).optional(),
  grade: z.string().optional()
});

const MarkImportPage = () => {
  const { user, authenticatedFetch } = useAuth();
  const fileInputRef = useRef(null);

  // Core States
  const [fileName, setFileName] = useState('');
  const [importType, setImportType] = useState('INTERNAL'); // INTERNAL or SEMESTER
  const [assessmentType, setAssessmentType] = useState('CAT1'); // CAT1, CAT2, MODEL
  const [referenceData, setReferenceData] = useState({ students: [], subjects: [], assessments: [] });
  const [parsedRecords, setParsedRecords] = useState([]);
  const [history, setHistory] = useState([]);
  
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

  // Fetch Reference Data & History
  const loadData = async () => {
    setLoadingRef(true);
    try {
      const refRes = await authenticatedFetch('/api/marks/import/reference-data');
      if (refRes.ok) {
        const refData = await refRes.json();
        setReferenceData(refData);
      }
      
      const histRes = await authenticatedFetch('/api/marks/import/history');
      if (histRes.ok) {
        const histData = await histRes.json();
        setHistory(histData);
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

  // Smart Matching Logic
  const performSmartMatchAndValidation = (rawRows) => {
    // Expected header matching
    // Look at first row or keys to match fields
    if (rawRows.length === 0) return [];

    const headers = Object.keys(rawRows[0]).map(h => h.toLowerCase().trim().replace(/[\s_-]+/g, ''));
    
    // Find column indexes
    let regIndex = -1;
    let nameIndex = -1;
    let subCodeIndex = -1;
    let internalMarkIndex = -1;
    let gradeIndex = -1;

    const matchedHeaders = Object.keys(rawRows[0]);
    matchedHeaders.forEach((header, idx) => {
      const normalized = header.toLowerCase().trim().replace(/[\s_-]+/g, '');
      if (normalized.includes('reg') || normalized.includes('roll') || normalized.includes('studentcode') || normalized.includes('number')) {
        regIndex = idx;
      } else if (normalized.includes('name') || normalized.includes('studentname')) {
        nameIndex = idx;
      } else if (normalized.includes('subjectcode') || normalized.includes('subcode') || normalized.includes('subjectid')) {
        subCodeIndex = idx;
      } else if (normalized.includes('internal') || normalized.includes('mark') || normalized.includes('score') || normalized.includes('int')) {
        internalMarkIndex = idx;
      } else if (normalized.includes('grade') || normalized.includes('result')) {
        gradeIndex = idx;
      }
    });

    // Fallback indexes if headers not clear
    if (regIndex === -1) regIndex = 0;
    if (subCodeIndex === -1) subCodeIndex = Math.min(2, matchedHeaders.length - 1);
    if (internalMarkIndex === -1) internalMarkIndex = Math.min(3, matchedHeaders.length - 1);

    const studentsMap = new Map(referenceData.students.map(s => [s.registerNumber.toUpperCase(), s]));
    const subjectsMap = new Map(referenceData.subjects.map(s => [s.code.toUpperCase(), s]));

    return rawRows.map((row, idx) => {
      const values = Object.values(row);
      
      const rawReg = values[regIndex]?.toString().trim() || '';
      const rawSub = values[subCodeIndex]?.toString().trim() || '';
      const rawInternal = values[internalMarkIndex]?.toString().trim() || '0';
      const rawGrade = values[gradeIndex]?.toString().trim() || 'C';

      // Cross-match student and subject
      const student = studentsMap.get(rawReg.toUpperCase());
      const subject = subjectsMap.get(rawSub.toUpperCase());

      const record = {
        registerNumber: rawReg,
        studentName: student ? student.name : 'Unknown Student',
        subjectCode: rawSub,
        subjectName: subject ? subject.name : 'Unknown Subject',
        internalMark: parseFloat(rawInternal) || 0,
        grade: rawGrade,
        isValid: true,
        errors: [],
        isDuplicate: false
      };

      // Run Validations
      if (!student) {
        record.isValid = false;
        record.errors.push('Student not found in your assigned roster');
      }
      if (!subject) {
        record.isValid = false;
        record.errors.push('Subject code is invalid or unassigned');
      }

      if (importType === 'INTERNAL') {
        const mark = parseFloat(rawInternal);
        if (isNaN(mark) || mark < 0 || mark > 100) {
          record.isValid = false;
          record.errors.push('Internal marks must be a number between 0 and 100');
        }
      } else {
        const validGrades = ['O', 'A+', 'A', 'B+', 'B', 'C', 'U', 'RA', 'F', 'AB'];
        if (!validGrades.includes(rawGrade.toUpperCase())) {
          record.isValid = false;
          record.errors.push('Grade must be O, A+, A, B+, B, C, U, RA, F, or AB');
        }
      }

      return record;
    });
  };

  // File Processor
  const processFile = async (file) => {
    setFileName(file.name);
    setProcessing(true);
    setUploadProgress(10);
    setError('');
    setSuccess('');

    try {
      const extension = file.name.split('.').pop().toLowerCase();
      let rawRows = [];

      if (extension === 'xlsx' || extension === 'xls') {
        // Excel Reading
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        setUploadProgress(50);
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        rawRows = XLSX.utils.sheet_to_json(sheet);
        setUploadProgress(80);
      } 
      else if (extension === 'csv') {
        // CSV Reading
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
      else if (extension === 'docx') {
        // Word tables reading
        const buffer = await file.arrayBuffer();
        setUploadProgress(40);
        const convertResult = await mammoth.convertToHtml({ arrayBuffer: buffer });
        setUploadProgress(70);
        
        // Extract tables from HTML
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
      else if (extension === 'png' || extension === 'jpg' || extension === 'jpeg' || extension === 'pdf') {
        // Run OCR or Scanned PDF
        setUploadProgress(30);
        let imageSrc = '';
        
        if (extension === 'pdf') {
          // Fallback or warning: PDF needs text rendering or image conversion.
          // Tesseract cannot parse PDF directly; warn that scanned PDFs should be exported as images, 
          // or we try parsing PDF text contents if it is a text PDF.
          const text = await file.text();
          // Extract text matching RegNum / Subject / Mark using Regex from PDF text stream
          const regex = /([2-9][0-9][A-Z]{2}[0-9]{3})\s+([A-Z0-9]{4,8})\s+([0-9]{1,3})/gi;
          let match;
          const extractedRows = [];
          while ((match = regex.exec(text)) !== null) {
            extractedRows.push({
              "Register Number": match[1],
              "Subject Code": match[2],
              "Internal Mark": match[3]
            });
          }
          
          if (extractedRows.length > 0) {
            rawRows = extractedRows;
            setUploadProgress(90);
          } else {
            throw new Error("Could not extract clean text from PDF directly. If it is a scanned document, please convert pages to PNG/JPG images first.");
          }
        } else {
          // Image OCR processing
          const reader = new FileReader();
          reader.onload = async () => {
            try {
              imageSrc = reader.result;
              const worker = await createWorker('eng');
              setUploadProgress(60);
              const { data: { text } } = await worker.recognize(imageSrc);
              await worker.terminate();
              
              // Simple regex parser on OCR text
              // E.g. search for rows like: 21CS001 CS8501 88
              const lines = text.split('\n');
              const extractedRows = [];
              const rowRegex = /([2-9][0-9][A-Z]{2}[0-9]{3,4})[\s,]+([A-Z0-9]{4,8})[\s,]+([0-9]{1,3})([\s,]+([A-Z\+]+))?/i;
              
              lines.forEach(line => {
                const match = line.match(rowRegex);
                if (match) {
                  extractedRows.push({
                    "Register Number": match[1],
                    "Subject Code": match[2],
                    "Internal Mark": match[3],
                    "Grade": match[5] || 'C'
                  });
                }
              });
              
              if (extractedRows.length === 0) {
                // Try simple space splits
                lines.forEach(line => {
                  const parts = line.split(/\s+/).filter(Boolean);
                  if (parts.length >= 3) {
                    extractedRows.push({
                      "Register Number": parts[0],
                      "Subject Code": parts[1],
                      "Internal Mark": parts[2],
                      "Grade": parts[3] || 'C'
                    });
                  }
                });
              }

              setParsedRecords(performSmartMatchAndValidation(extractedRows));
              setUploadProgress(100);
              setProcessing(false);
            } catch (ocrErr) {
              console.error(ocrErr);
              setError("OCR Extraction failed. Make sure the text is clearly readable.");
              setProcessing(false);
            }
          };
          reader.readAsDataURL(file);
          return; // Reader onload will finish it
        }
      } else {
        throw new Error('Unsupported file extension. Please upload CSV, Excel, Word, or Image files.');
      }

      const formatted = performSmartMatchAndValidation(rawRows);
      setParsedRecords(formatted);
      setUploadProgress(100);
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred during file parsing.');
    } finally {
      setProcessing(false);
    }
  };

  // Revalidate Records
  const revalidateRecords = (recordsToValidate = parsedRecords) => {
    const studentsMap = new Map(referenceData.students.map(s => [s.registerNumber.toUpperCase(), s]));
    const subjectsMap = new Map(referenceData.subjects.map(s => [s.code.toUpperCase(), s]));

    const updated = recordsToValidate.map((rec) => {
      const student = studentsMap.get(rec.registerNumber.toUpperCase());
      const subject = subjectsMap.get(rec.subjectCode.toUpperCase());
      
      const record = {
        ...rec,
        studentName: student ? student.name : 'Unknown Student',
        subjectName: subject ? subject.name : 'Unknown Subject',
        isValid: true,
        errors: []
      };

      if (!student) {
        record.isValid = false;
        record.errors.push('Student not found in your assigned roster');
      }
      if (!subject) {
        record.isValid = false;
        record.errors.push('Subject code is invalid or unassigned');
      }

      if (importType === 'INTERNAL') {
        const mark = parseFloat(rec.internalMark);
        if (isNaN(mark) || mark < 0 || mark > 100) {
          record.isValid = false;
          record.errors.push('Internal marks must be a number between 0 and 100');
        }
      } else {
        const validGrades = ['O', 'A+', 'A', 'B+', 'B', 'C', 'U', 'RA', 'F', 'AB'];
        if (!validGrades.includes((rec.grade || '').toUpperCase())) {
          record.isValid = false;
          record.errors.push('Grade must be O, A+, A, B+, B, C, U, RA, F, or AB');
        }
      }
      return record;
    });

    setParsedRecords(updated);
  };

  // Inline Edits
  const startEdit = (index, rec) => {
    setEditingIndex(index);
    setEditValues({
      registerNumber: rec.registerNumber,
      subjectCode: rec.subjectCode,
      internalMark: rec.internalMark,
      grade: rec.grade
    });
  };

  const saveEdit = (index) => {
    const updated = [...parsedRecords];
    updated[index] = {
      ...updated[index],
      ...editValues
    };
    setEditingIndex(-1);
    revalidateRecords(updated);
  };

  const deleteRow = (index) => {
    const updated = parsedRecords.filter((_, idx) => idx !== index);
    setParsedRecords(updated);
  };

  // Bulk Import
  const handleImport = async () => {
    const validRows = parsedRecords.filter(r => r.isValid);
    if (validRows.length === 0) {
      setError('There are no valid records to import.');
      return;
    }

    setImporting(true);
    setError('');
    setSuccess('');

    try {
      const response = await authenticatedFetch('/api/marks/import/bulk', {
        method: 'POST',
        body: JSON.stringify({
          fileName,
          importType,
          records: validRows.map(r => ({
            registerNumber: r.registerNumber,
            subjectCode: r.subjectCode,
            assessmentType: importType === 'INTERNAL' ? assessmentType : 'SEMESTER',
            internalMark: r.internalMark,
            grade: r.grade,
            action: 'UPDATE' // Default behavior: overwrite/update
          }))
        })
      });

      const result = await response.json();
      if (response.ok) {
        setSuccess(`Marks imported successfully! Imported: ${result.recordsImported}, Failed: ${result.failedRecords}`);
        setParsedRecords([]);
        setFileName('');
        loadData(); // Reload history logs
      } else {
        setError(result.error || 'Failed to import marks.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred during bulk import.');
    } finally {
      setImporting(false);
    }
  };

  // Stats Calculations
  const totalCount = parsedRecords.length;
  const validCount = parsedRecords.filter(r => r.isValid).length;
  const invalidCount = totalCount - validCount;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', width: '100%' }}>
      
      {/* Alert Messages */}
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

      {/* Main Upload Control Panel */}
      <div className="glass-card">
        <h2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UploadCloud size={24} style={{ color: 'var(--primary)' }} /> Mark Import & Auto Entry
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Upload class marksheets in Excel, DOCX, CSV, PDF, or image formats. The system will scan, validate against student rosters, and bulk import records directly.
        </p>

        <div style={{ display: 'flex', gap: '20px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ width: '200px' }}>
            <label className="form-label">Marks Target Scope</label>
            <CustomSelect
              value={importType}
              onChange={(e) => {
                setImportType(e.target.value);
                setParsedRecords([]);
              }}
              options={[
                { value: 'INTERNAL', label: 'Internal Term Marks' },
                { value: 'SEMESTER', label: 'Semester Exam Grades' }
              ]}
            />
          </div>

          {importType === 'INTERNAL' && (
            <div className="form-group" style={{ width: '200px' }}>
              <label className="form-label">Assessment Module</label>
              <CustomSelect
                value={assessmentType}
                onChange={(e) => setAssessmentType(e.target.value)}
                options={[
                  { value: 'CAT1', label: 'CAT 1' },
                  { value: 'CAT2', label: 'CAT 2' },
                  { value: 'MODEL', label: 'MODEL Exam' }
                ]}
              />
            </div>
          )}
        </div>

        {/* Drag & Drop File Container */}
        <div
          className={`file-drop-zone ${dragActive ? 'active' : ''}`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current.click()}
          style={{
            border: '2px dashed var(--border)',
            borderRadius: '8px',
            padding: '40px 20px',
            textAlign: 'center',
            background: dragActive ? 'rgba(99, 102, 241, 0.04)' : 'rgba(255,255,255,0.01)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            position: 'relative'
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            accept=".csv, .xlsx, .xls, .docx, .pdf, .png, .jpg, .jpeg"
            style={{ display: 'none' }}
          />
          <UploadCloud size={48} style={{ color: 'var(--primary)', opacity: 0.7, marginBottom: '16px' }} />
          {processing ? (
            <div>
              <p style={{ fontWeight: '500' }}>Extracting data sheet: {uploadProgress}%</p>
              <div style={{ width: '200px', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', margin: '8px auto', overflow: 'hidden' }}>
                <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.2s ease' }}></div>
              </div>
            </div>
          ) : (
            <div>
              <p style={{ fontWeight: '500', margin: 0 }}>Drag and drop files here, or click to browse</p>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                Supports Excel, Word, CSV, PDF, and Images (OCR enabled)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Preview Section */}
      {parsedRecords.length > 0 && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileSpreadsheet size={20} /> Marksheet Preview
            </h3>
            
            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setParsedRecords([])}
                style={{ padding: '8px 16px' }}
              >
                Clear Preview
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleImport}
                disabled={importing || validCount === 0}
                style={{ padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                {importing ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                Import Valid Marks ({validCount})
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{totalCount}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>Total Records</div>
            </div>
            <div style={{ padding: '12px', background: 'rgba(74, 222, 128, 0.05)', borderRadius: '6px', border: '1px solid rgba(74, 222, 128, 0.1)', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--success)' }}>{validCount}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>Valid Records</div>
            </div>
            <div style={{ padding: '12px', background: 'rgba(248, 113, 113, 0.05)', borderRadius: '6px', border: '1px solid rgba(248, 113, 113, 0.1)', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--danger)' }}>{invalidCount}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>Invalid Records</div>
            </div>
          </div>

          {/* Table Container */}
          <div style={{ overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
            <table className="portal-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Register Number</th>
                  <th>Student Name</th>
                  <th>Subject Code</th>
                  <th>Subject Name</th>
                  <th>{importType === 'INTERNAL' ? 'Internal Marks' : 'Grade'}</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {parsedRecords.map((rec, index) => {
                  const isEditing = editingIndex === index;
                  return (
                    <tr key={index} style={{ background: !rec.isValid ? 'rgba(248, 113, 113, 0.02)' : '' }}>
                      <td>{index + 1}</td>
                      <td>
                        {isEditing ? (
                          <input 
                            type="text" 
                            className="form-control" 
                            style={{ padding: '4px 8px', fontSize: '13px' }} 
                            value={editValues.registerNumber} 
                            onChange={(e) => setEditValues({ ...editValues, registerNumber: e.target.value })} 
                          />
                        ) : (
                          <span style={{ fontWeight: '500' }}>{rec.registerNumber}</span>
                        )}
                      </td>
                      <td>
                        <span style={{ opacity: rec.studentName.includes('Unknown') ? 0.5 : 1 }}>
                          {rec.studentName}
                        </span>
                      </td>
                      <td>
                        {isEditing ? (
                          <input 
                            type="text" 
                            className="form-control" 
                            style={{ padding: '4px 8px', fontSize: '13px' }} 
                            value={editValues.subjectCode} 
                            onChange={(e) => setEditValues({ ...editValues, subjectCode: e.target.value })} 
                          />
                        ) : (
                          <span>{rec.subjectCode}</span>
                        )}
                      </td>
                      <td>
                        <span style={{ opacity: rec.subjectName.includes('Unknown') ? 0.5 : 1 }}>
                          {rec.subjectName}
                        </span>
                      </td>
                      <td>
                        {isEditing ? (
                          importType === 'INTERNAL' ? (
                            <input 
                              type="number" 
                              className="form-control" 
                              style={{ padding: '4px 8px', fontSize: '13px' }} 
                              value={editValues.internalMark} 
                              onChange={(e) => setEditValues({ ...editValues, internalMark: parseFloat(e.target.value) || 0 })} 
                            />
                          ) : (
                            <input 
                              type="text" 
                              className="form-control" 
                              style={{ padding: '4px 8px', fontSize: '13px' }} 
                              value={editValues.grade} 
                              onChange={(e) => setEditValues({ ...editValues, grade: e.target.value })} 
                            />
                          )
                        ) : (
                          <span style={{ fontWeight: 'bold' }}>
                            {importType === 'INTERNAL' ? rec.internalMark : rec.grade}
                          </span>
                        )}
                      </td>
                      <td>
                        {rec.isValid ? (
                          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={12} /> Valid
                          </span>
                        ) : (
                          <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }} title={rec.errors.join(', ')}>
                            <AlertTriangle size={12} /> Error
                          </span>
                        )}
                        {!rec.isValid && (
                          <div style={{ fontSize: '11px', color: 'var(--danger)', marginTop: '4px' }}>
                            {rec.errors[0]}
                          </div>
                        )}
                      </td>
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

      {/* History Section */}
      <div className="glass-card">
        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={20} /> Upload History Logs
        </h3>
        
        {loadingRef ? (
          <div>Loading logs...</div>
        ) : history.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', opacity: 0.5 }}>
            No upload history found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="portal-table">
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Uploaded By</th>
                  <th>Department</th>
                  <th>Upload Time</th>
                  <th>Imported Records</th>
                  <th>Failed Records</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontWeight: '500' }}>{log.fileName}</td>
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
        )}
      </div>

    </div>
  );
};

export default MarkImportPage;
