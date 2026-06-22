-- Seed Departments
INSERT INTO departments (id, name, code) VALUES 
(1, 'Computer Science and Engineering', 'CSE'),
(2, 'Electronics and Communication Engineering', 'ECE');

-- Seed Users (Password is 'password' BCrypt hashed: $2a$10$JxLj0pInJT4NHob3r9pBwuCfZjozCSbaWlAB/O89I/zoB0skcnqiO)
INSERT INTO users (id, name, email, phone, password_hash, role, department_id, study_year, register_number, staff_id_code, is_active, created_at) VALUES
-- Admin
(1, 'System Administrator', 'admin@portal.edu', '9876543210', '$2a$10$JxLj0pInJT4NHob3r9pBwuCfZjozCSbaWlAB/O89I/zoB0skcnqiO', 'ADMIN', NULL, NULL, NULL, 'ADM001', TRUE, CURRENT_TIMESTAMP),
-- HOD for CSE
(2, 'Dr. Sarah Connor', 'hod.cse@portal.edu', '9876543211', '$2a$10$JxLj0pInJT4NHob3r9pBwuCfZjozCSbaWlAB/O89I/zoB0skcnqiO', 'HOD', 1, NULL, NULL, 'HODCSE01', TRUE, CURRENT_TIMESTAMP),
-- Staff for CSE Year 2
(3, 'Prof. Alan Turing', 'staff.cse2@portal.edu', '9876543212', '$2a$10$JxLj0pInJT4NHob3r9pBwuCfZjozCSbaWlAB/O89I/zoB0skcnqiO', 'STAFF', 1, 2, NULL, 'STFCSE02', TRUE, CURRENT_TIMESTAMP),
-- Student 1 (CSE, Year 2)
(4, 'Grace Hopper', 'student.cse2@portal.edu', '9876543213', '$2a$10$JxLj0pInJT4NHob3r9pBwuCfZjozCSbaWlAB/O89I/zoB0skcnqiO', 'STUDENT', 1, 2, 'REG2024CSE001', NULL, TRUE, CURRENT_TIMESTAMP),
-- Student 2 (CSE, Year 3)
(5, 'Ada Lovelace', 'student.cse3@portal.edu', '9876543214', '$2a$10$JxLj0pInJT4NHob3r9pBwuCfZjozCSbaWlAB/O89I/zoB0skcnqiO', 'STUDENT', 1, 3, 'REG2023CSE001', NULL, TRUE, CURRENT_TIMESTAMP);

-- Seed Subjects
INSERT INTO subjects (id, name, code, department_id, semester, credits) VALUES
(1, 'Data Structures and Algorithms', 'CSE301', 1, 3, 4),
(2, 'Database Management Systems', 'CSE401', 1, 4, 4),
(3, 'Operating Systems', 'CSE402', 1, 4, 3),
(4, 'Computer Networks', 'CSE403', 1, 4, 4);

-- Seed Staff Assignments
INSERT INTO staff_assignments (id, staff_id, department_id, year_assigned, subject_id) VALUES
(1, 3, 1, 2, 2), -- Turing handles CSE Year 2 DBMS
(2, 3, 1, 2, 3); -- Turing handles CSE Year 2 OS

-- Seed Attendance records for Grace Hopper (Student 4)
INSERT INTO attendance (id, student_id, subject_id, class_date, status, marked_by) VALUES
(1, 4, 2, '2026-06-01', 'PRESENT', 3),
(2, 4, 2, '2026-06-02', 'PRESENT', 3),
(3, 4, 2, '2026-06-03', 'ABSENT', 3),
(4, 4, 2, '2026-06-04', 'PRESENT', 3),
(5, 4, 2, '2026-06-05', 'PRESENT', 3),
(6, 4, 3, '2026-06-01', 'PRESENT', 3),
(7, 4, 3, '2026-06-02', 'PRESENT', 3),
(8, 4, 3, '2026-06-03', 'PRESENT', 3),
(9, 4, 3, '2026-06-04', 'OD', 3),
(10, 4, 3, '2026-06-05', 'PRESENT', 3);

-- Seed Assessments (Assignments and Exams)
INSERT INTO assessments (id, subject_id, type, sub_type, title, description, due_date, exam_time, hall_number, max_marks, uploaded_by, department_id, study_year) VALUES
(1, 2, 'ASSIGNMENT', 'ASSIGNMENT', 'SQL Query Lab Exercise', 'Complete the SQL questions on Joins and Subqueries.', '2026-06-25', NULL, NULL, 10, 3, 1, 2),
(2, 3, 'ASSIGNMENT', 'ASSIGNMENT', 'CPU Scheduling Program', 'Implement SJF and Round Robin CPU scheduling in C/Java.', '2026-06-28', NULL, NULL, 10, 3, 1, 2),
(3, 2, 'EXAM', 'CAT1', 'DBMS CAT 1 Exam', 'Unit 1 & Unit 2 exam', '2026-06-01', '09:30:00', 'LH 301', 50, 3, 1, 2),
(4, 2, 'EXAM', 'CAT2', 'DBMS CAT 2 Exam', 'Unit 3 & Unit 4 exam', '2026-06-15', '09:30:00', 'LH 301', 50, 3, 1, 2),
(5, 3, 'EXAM', 'CAT1', 'OS CAT 1 Exam', 'Unit 1 & Unit 2 exam', '2026-06-02', '14:00:00', 'LH 302', 50, 3, 1, 2),
(6, 3, 'EXAM', 'CAT2', 'OS CAT 2 Exam', 'Unit 3 & Unit 4 exam', '2026-06-16', '14:00:00', 'LH 302', 50, 3, 1, 2);

-- Seed Assessment Records (Marks and Submissions)
INSERT INTO assessment_records (id, assessment_id, student_id, file_url, submitted_at, scored_marks, status, graded_by, graded_at) VALUES
(1, 3, 4, NULL, NULL, 45.00, 'GRADED', 3, CURRENT_TIMESTAMP),
(2, 4, 4, NULL, NULL, 42.50, 'GRADED', 3, CURRENT_TIMESTAMP),
(3, 5, 4, NULL, NULL, 48.00, 'GRADED', 3, CURRENT_TIMESTAMP),
(4, 6, 4, NULL, NULL, 46.00, 'GRADED', 3, CURRENT_TIMESTAMP);

-- Seed Semester Results for Semester 3 (already passed)
INSERT INTO semester_results (id, student_id, semester, subject_id, grade, grade_point, credits, is_arrear, result_status, published, published_at) VALUES
(1, 4, 3, 1, 'A+', 9.00, 4, FALSE, 'PASS', TRUE, CURRENT_TIMESTAMP);

-- Seed CGPA Summary for Semester 3
INSERT INTO cgpa_summary (id, student_id, semester, sgpa, cgpa, total_credits, calculated_at) VALUES
(1, 4, 3, 9.00, 9.00, 4, CURRENT_TIMESTAMP);

-- Seed Fee Structure
INSERT INTO fee_structure (id, department_id, study_year, fee_type, amount, due_date, academic_year) VALUES
(1, 1, 2, 'Tuition Fee', 85000.00, '2026-07-15', '2026-2027'),
(2, 1, 2, 'Hostel Fee', 45000.00, '2026-07-20', '2026-2027'),
(3, 1, 2, 'Exam Fee', 2500.00, '2026-06-25', '2026-2027');

-- Seed Fee Payments
INSERT INTO fee_payments (id, student_id, fee_structure_id, amount_paid, payment_mode, payment_date, receipt_number, transaction_ref, status, receipt_url) VALUES
(1, 4, 1, 85000.00, 'ONLINE', '2026-06-10', 'REC2026001', 'TXN9988776655', 'PAID', '/api/student/fees/receipt/REC2026001');



-- Seed Notifications
INSERT INTO notifications (id, user_id, type, title, message, reference_id, is_read, send_at, created_at) VALUES
(1, 4, 'GENERAL', 'Welcome to the Academic Portal', 'You can now view fees, results, and attendance.', NULL, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 4, 'ASSIGNMENT', 'New Assignment: SQL Query Lab Exercise', 'Due date is 2026-06-25.', 1, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
