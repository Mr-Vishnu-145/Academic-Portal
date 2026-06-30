# 🎓 Academic Portal

A modern, premium, and feature-rich Academic Management System built with a robust Spring Boot backend and a stunning, responsive React frontend.

---

## 🚀 Key Features

*   **Role-Based Access Control (RBAC):** Customized dashboards and permissions for **Administrators**, **Heads of Department (HOD)**, **Staff/Faculty**, and **Students**.
*   **Real-time Features:** Live notifications and instant faculty/student directory sync utilizing **WebSockets** and **STOMP**.
*   **Mark Import & OCR Engine:** Automatic extraction and parsing of student grades from uploaded files (`.docx`, `.xlsx`, `.csv`, `.pdf` and images) using **Mammoth**, **SheetJS**, and **Tesseract OCR**.
*   **Exam Schedule Tracker:** Dynamic timetable manager mapping halls, times, and subject requirements.
*   **Grade Publishing & GPA Engine:** Automated GPA & CGPA recalculation engine when HOD approves and publishes draft grades.
*   **Finance & Fee Portal:** Integrated fee structure setup, secure payment processing simulation, and PDF receipt downloads.

---

## 🛠️ Tech Stack

### Backend
*   **Core:** Java 21, Spring Boot 3.2.5
*   **Security:** Spring Security, JWT (JSON Web Tokens)
*   **Database:** MySQL 8, Spring Data JPA, Hibernate
*   **Real-Time:** Spring WebSocket, STOMP Messaging

### Frontend
*   **Core:** React 18, Vite, React Router DOM 6
*   **Styling:** Modern Vanilla CSS (curated HSL palettes, dark mode, glassmorphism, responsive grid layouts)
*   **Icons:** Lucide React
*   **Parsing/OCR:** Tesseract.js, Mammoth.js, SheetJS (XLSX)

---

## ⚙️ Setup & Configuration

### 1. Environment Variables

Both the backend and frontend support configuration via `.env` files. 

#### Backend (`backend/.env`)
Copy `backend/.env.example` to `backend/.env` and configure:
```env
PORT=8080
DB_URL=jdbc:mysql://localhost:3306/academic_portal?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
DB_USERNAME=root
DB_PASSWORD=your_mysql_password
JWT_SECRET=your_custom_256_bit_jwt_secret_key
JWT_EXPIRATION=86400000
```

#### Frontend (`frontend/.env`)
Copy `frontend/.env.example` to `frontend/.env` and configure:
```env
VITE_PORT=5173
VITE_API_TARGET=http://localhost:8080
```

---

## 🏃 How to Run the Application

### Prerequisites
*   Java 21 JDK installed
*   Node.js (v18+) installed
*   MySQL Server running

### Step 1: Start the Backend
1. Navigate to the `backend` directory.
2. Run the Spring Boot application:
   ```bash
   mvn spring-boot:run
   ```
   *The database schema will automatically initialize and seed default records on first boot.*

### Step 2: Start the Frontend
1. Navigate to the `frontend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔑 Default Credentials

All seeded accounts share the default password: **`password`**

| Role | Username / Email | Staff ID / Reg No | Description |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@portal.edu` | `ADM001` | Full system control, user registry, fee structure setup. |
| **HOD** | `hod.cse@portal.edu` | `HODCSE01` | CSE Department statistics, staff transfers, result publishing. |
| **Staff** | `staff.cse2@portal.edu` | `STFCSE02` | Attendance marking, internal marks entry, exam scheduler. |
| **Student** | `student.cse2@portal.edu` | `REG2024CSE001` | Grace Hopper (CSE Year 2) — GPA dashboard, marksheet download. |
| **Student** | `student.cse3@portal.edu` | `REG2023CSE001` | Ada Lovelace (CSE Year 3) — GPA dashboard, marksheet download. |
