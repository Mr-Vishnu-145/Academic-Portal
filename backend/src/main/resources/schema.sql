-- Academic Portal DDL Schema (MySQL and H2 Compatible)

-- Drop tables in reverse order of dependencies
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS fee_payments;
DROP TABLE IF EXISTS fee_structure;
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS assessment_records;
DROP TABLE IF EXISTS assessments;
DROP TABLE IF EXISTS cgpa_summary;
DROP TABLE IF EXISTS semester_results;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS staff_assignments;

-- Drop old legacy tables if they exist to clear foreign keys
DROP TABLE IF EXISTS internal_marks;
DROP TABLE IF EXISTS assignment_submissions;
DROP TABLE IF EXISTS exam_schedule;
DROP TABLE IF EXISTS assignments;
DROP TABLE IF EXISTS arrears;

DROP TABLE IF EXISTS subjects;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS departments;

-- ============ CORE ============

CREATE TABLE departments (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  name            VARCHAR(100) NOT NULL,
  code            VARCHAR(20) NOT NULL UNIQUE
);

CREATE TABLE users (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  name            VARCHAR(100) NOT NULL,
  email           VARCHAR(100) UNIQUE NOT NULL,
  phone           VARCHAR(15),
  password_hash   VARCHAR(255) NOT NULL,
  role            VARCHAR(20) NOT NULL, -- STUDENT, STAFF, HOD, ADMIN
  department_id   INT,
  study_year      INT NULL,              -- only for students: 1, 2, 3, 4
  register_number VARCHAR(20) UNIQUE NULL, -- students only
  staff_id_code   VARCHAR(20) UNIQUE NULL, -- staff/hod only
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE subjects (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  name            VARCHAR(100) NOT NULL,
  code            VARCHAR(20) NOT NULL UNIQUE,
  department_id   INT NOT NULL,
  semester        INT NOT NULL,
  credits         INT NOT NULL,
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE staff_assignments (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  staff_id        INT NOT NULL,
  department_id   INT NOT NULL,
  year_assigned   INT NOT NULL,                   -- which year staff handles
  subject_id      INT NOT NULL,
  FOREIGN KEY (staff_id) REFERENCES users(id),
  FOREIGN KEY (department_id) REFERENCES departments(id),
  FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

-- ============ ATTENDANCE ============

CREATE TABLE attendance (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  student_id      INT NOT NULL,
  subject_id      INT NOT NULL,
  class_date      DATE NOT NULL,
  status          VARCHAR(20) NOT NULL, -- PRESENT, ABSENT, OD, MEDICAL
  marked_by       INT NOT NULL,   -- staff user id
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (subject_id) REFERENCES subjects(id),
  FOREIGN KEY (marked_by) REFERENCES users(id)
);

-- ============ MARKS / CGPA / RESULTS ============

CREATE TABLE assessments (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  subject_id      INT NOT NULL,
  type            VARCHAR(20) NOT NULL, -- EXAM, ASSIGNMENT
  sub_type        VARCHAR(20) NOT NULL, -- CAT1, CAT2, MODEL, SEMESTER, ARREAR, HOMEWORK, etc.
  title           VARCHAR(200) NOT NULL,
  description     TEXT,
  due_date        DATE NOT NULL,
  exam_time       TIME NULL,
  hall_number     VARCHAR(20) NULL,
  max_marks       INT NOT NULL,
  uploaded_by     INT NOT NULL,
  department_id   INT NOT NULL,
  study_year      INT NOT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subject_id) REFERENCES subjects(id),
  FOREIGN KEY (uploaded_by) REFERENCES users(id),
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE assessment_records (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  assessment_id   INT NOT NULL,
  student_id      INT NOT NULL,
  file_url        VARCHAR(255) NULL,
  submitted_at    TIMESTAMP NULL,
  scored_marks    DECIMAL(5,2) NULL,
  status          VARCHAR(20) NOT NULL, -- PENDING, SUBMITTED, LATE, ABSENT, GRADED
  graded_by       INT NULL,
  graded_at       TIMESTAMP NULL,
  FOREIGN KEY (assessment_id) REFERENCES assessments(id),
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (graded_by) REFERENCES users(id),
  CONSTRAINT unique_assessment_student UNIQUE (assessment_id, student_id)
);

CREATE TABLE semester_results (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  student_id      INT NOT NULL,
  semester        INT NOT NULL,
  subject_id      INT NOT NULL,
  grade           VARCHAR(5) NOT NULL,             -- O, A+, A, B+, etc.
  grade_point     DECIMAL(3,2) NOT NULL,
  credits         INT NOT NULL,
  is_arrear       BOOLEAN DEFAULT FALSE,
  result_status   VARCHAR(20) NOT NULL, -- PASS, ARREAR, WITHHELD
  published       BOOLEAN DEFAULT FALSE,   -- result visible to student?
  published_at    TIMESTAMP NULL,
  arrear_exam_date DATE NULL,
  arrear_status   VARCHAR(20) NULL,
  cleared_semester INT NULL,
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

CREATE TABLE cgpa_summary (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  student_id      INT NOT NULL,
  semester        INT NOT NULL,
  sgpa            DECIMAL(4,2) NOT NULL,
  cgpa            DECIMAL(4,2) NOT NULL,
  total_credits   INT NOT NULL,
  calculated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id)
);



CREATE TABLE documents (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  student_id      INT NOT NULL,
  doc_type        VARCHAR(20) NOT NULL, -- MARKSHEET, CERTIFICATE, TC, OTHER
  semester        INT NULL,
  file_url        VARCHAR(255) NOT NULL,
  uploaded_by     INT NOT NULL,   -- staff/admin
  uploaded_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);



-- ============ FEES ============

CREATE TABLE fee_structure (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  department_id   INT NOT NULL,
  study_year      INT NOT NULL,
  fee_type        VARCHAR(100) NOT NULL,     -- tuition, hostel, exam
  amount          DECIMAL(10,2) NOT NULL,
  due_date        DATE NOT NULL,
  academic_year   VARCHAR(20) NOT NULL,
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE fee_payments (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  student_id      INT NOT NULL,
  fee_structure_id INT NOT NULL,
  amount_paid     DECIMAL(10,2) NOT NULL,
  payment_mode    VARCHAR(20) NOT NULL, -- CASH, UPI, DD, ONLINE
  payment_date    DATE NOT NULL,
  receipt_number  VARCHAR(50) UNIQUE NOT NULL,
  transaction_ref VARCHAR(100),
  status          VARCHAR(20) NOT NULL, -- PAID, PENDING, PARTIAL
  receipt_url     VARCHAR(255),
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (fee_structure_id) REFERENCES fee_structure(id)
);

-- ============ NOTIFICATIONS ============

CREATE TABLE notifications (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  user_id         INT NOT NULL,
  type            VARCHAR(20) NOT NULL, -- ASSIGNMENT, EXAM, FEE, RESULT, GENERAL
  title           VARCHAR(200) NOT NULL,
  message         TEXT NOT NULL,
  reference_id    INT,             -- id of assignment/exam/fee etc
  is_read         BOOLEAN DEFAULT FALSE,
  send_at         TIMESTAMP NOT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============ INDEXES ============
CREATE INDEX idx_users_role_dept ON users(role, department_id);
CREATE INDEX idx_attendance_student_date ON attendance(student_id, class_date);
CREATE INDEX idx_assessments_dept_year_type ON assessments(department_id, study_year, type);
CREATE INDEX idx_assessments_subject_type ON assessments(subject_id, type);
CREATE INDEX idx_assessment_records_student ON assessment_records(student_id);
CREATE INDEX idx_results_student_semester ON semester_results(student_id, semester);
CREATE INDEX idx_cgpa_student_semester ON cgpa_summary(student_id, semester);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read);
