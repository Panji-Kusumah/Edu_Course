# 🐧 Edu Course API

A robust and clean RESTful API for EduCourse—an online learning platform backend. Built using Node.js (ES Modules), Express 5, Prisma ORM, and MySQL 9.

Originally built with raw `mysql2` queries, this project underwent a comprehensive **brownfield migration** to Prisma ORM, alongside the addition of a full Authentication module (JWT + Email Verification) and secure File Uploads. It focuses on strict schema validation, predictable error handling, and clean CRUD architecture.

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-3068B7?style=for-the-badge&logo=zod&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

---

##  Key Features

###  Clean Layered Architecture
Strict separation of concerns to ensure maintainability and testability:
`Routes` ➔ `Controllers` ➔ `Services` ➔ `Repositories` ➔ `Prisma / Database`

###  Authentication & Security
- **Stateless Auth:** JWT-based authentication with secure `bcrypt` password hashing.
- **Email Verification:** UUID token generation and transactional email delivery via Nodemailer (Ethereal for dev, Gmail SMTP for prod).
- **Route Protection:** Middleware guards (`verifyToken`) and Role-Based Access Control (`requireRole`).

### 🛡️ Robust Data Validation
Request payloads (`body`, `params`, `query`) are strictly validated using **Zod** schemas before reaching the business logic, preventing invalid data from corrupting the database.

###  Advanced Database Design & CQRS-lite
- **12 Relational Tables** with strict `InnoDB` engine and `utf8mb4_unicode_ci`.
- **Foreign Keys** with `ON DELETE CASCADE` / `RESTRICT` for relational integrity.
- **CHECK Constraints** to enforce business rules at the database level.
- **Soft Deletes** (`deleted_at`) implemented for critical entities like Users and Classes.
- **CQRS-lite Pattern:**
  - *Reads (List):* Optimized using MySQL Views (`v_course_cards`) with `$queryRawUnsafe` for complex aggregations (e.g., average ratings).
  - *Writes & Detail Reads:* Handled via Prisma Client for safe nested relational queries (`include`).
- **Least Privilege Principle:** Application connects via a restricted MySQL user (`edu_app`).

###  Centralized Error Handling
A global error middleware catches and formats errors consistently, mapping ORM/DB errors to standard HTTP status codes:
- **Zod Validation** ➔ `400 Bad Request` (with field-level details)
- **Prisma `P2002`** (Unique Constraint) ➔ `409 Conflict`
- **Prisma `P2003`** (Foreign Key) ➔ `400 Bad Request`
- **Legacy MySQL `ER_DUP_ENTRY`** ➔ `409 Conflict`
- **Legacy MySQL `ER_NO_REFERENCED_ROW`** ➔ `400 Bad Request`

###  Secure File Uploads
- Image uploads handled via **Multer** with strict MIME-type validation (JPEG, PNG, GIF, WebP) and 5MB size limit.
- Static file serving for uploaded assets via `express.static`.

###  Standardized JSON Responses
All endpoints return a predictable, uniform JSON structure:

```json
{
  "success": true,
  "message": "Courses retrieved successfully",
  "data": [],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalItems": 50,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

---

##  API Endpoints

Base URL: `/api/v1`

### Authentication

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/register` | Register a new user & send verification email |
| `GET` | `/verify-email` | Verify email via UUID token |
| `POST` | `/login` | Authenticate user & return JWT |
| `GET` | `/me` | Get authenticated user profile (Protected) |

### Courses

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/course` | Paginated list (Supports: `search`, `sortBy`, `status`, `level`, `category_id`, `topic`) |
| `GET` | `/course/:id` | Detailed course with nested modules, materials, and reviews |
| `POST` | `/course` | Create a new course |
| `PATCH` | `/course/:id` | Partially update an existing course |
| `PUT` | `/course/:id` | Fully update an existing course |
| `DELETE` | `/course/:id` | Soft delete (Add `?hard=true` for permanent deletion) |

### Utilities

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/upload` | Upload image file (Protected, `multipart/form-data`) |
| `GET` | `/health` | API & Database health check |

---

## 🐧 Tech Stack

- **Runtime:** Node.js (ES Modules)
- **Framework:** Express.js 5
- **ORM:** Prisma ORM v5
- **Database:** MySQL 9+
- **Validation:** Zod
- **Auth:** jsonwebtoken (JWT), bcrypt
- **Email:** Nodemailer
- **Upload:** Multer
- **Security:** Helmet, CORS
- **Logging:** Winston, Morgan
- **Environment:** dotenv

---

## 📁 Project Structure

```text
BE_EDU_COURSE/
├── prisma/              # Prisma schema & migrations
├── src/
│   ├── config/          # Prisma client, Nodemailer, env setup
│   ├── controllers/     # HTTP request handling & response formatting
│   ├── middlewares/     # Auth guards, error handler, upload, Zod validation
│   ├── repositories/    # Data access layer (Prisma & Raw SQL)
│   ├── routes/          # API routing & endpoint definitions
│   ├── services/        # Business logic & data transformation
│   ├── utils/           # Helpers (AppError, hash, jwt, logger, respond)
│   └── app.js           # Express app initialization
├── uploads/             # Static storage for uploaded files
├── .env.example         # Environment variables template
├── .gitignore
├── package.json
├── server.js            # Entry point & graceful shutdown logic
└── edu_course_final.sql # Database schema, views, and seed data
```

---

## 🛠️ Getting Started (Local Setup)

### Prerequisites
- Node.js >= 20.x
- MySQL Server 8.x / 9.x
- Git

### 1. Clone & Install
```bash
git clone <repository-url>
cd BE_EDU_COURSE
npm install
```

### 2. Setup Database
```sql
CREATE DATABASE edu_course CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'edu_app'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON edu_course.* TO 'edu_app'@'localhost';
FLUSH PRIVILEGES;
```
```bash
mysql -u root -p edu_course < edu_course_final.sql
npx prisma generate
```

### 3. Configure Environment
```bash
cp .env.example .env
```
```env
NODE_ENV=development
PORT=3000
DATABASE_URL="mysql://edu_app:your_secure_password@localhost:3306/edu_course"
JWT_SECRET="your_super_secret_random_string"
JWT_EXPIRES_IN="1d"
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM="EduCourse <noreply@educourse.com>"
APP_URL=http://localhost:3000
CORS_ORIGIN=
```

### 4. Run the Server
```bash
npm run dev
```
The API will be available at `http://localhost:3000`.

---

##  Master Test Plan (Postman)

**Persiapan:** MySQL running + seed data terisi, `.env` terkonfigurasi, server berjalan (`npm run dev`). Simpan JWT hasil login ke Postman Environment sebagai `{{token}}`.

### Phase 1 — Sanity & Health

| No | Request | Expected | Result |
| :--- | :--- | :--- | :--- |
| 1.1 | `GET /` | 200 OK | ☐ |
| 1.2 | `GET /api/v1/health` | 200 OK | ☐ |

### Phase 2 — Authentication

| No | Request | Expected | Result |
| :--- | :--- | :--- | :--- |
| 2.1 | `POST /register` (body valid) | 201 Created + email verifikasi terkirim | ☐ |
| 2.2 | `POST /register` (email sama) | 409 Email already registered | ☐ |
| 2.3 | `POST /register` (body invalid) | 400 validation failed + `details` | ☐ |
| 2.4 | `GET /verify-email?token=valid` | 200 Email Verified Successfully | ☐ |
| 2.5 | `GET /verify-email?token=palsu` | 400 Invalid Verification Token | ☐ |
| 2.6 | `POST /login` (valid) | 200 + JWT token **(simpan!)** | ☐ |
| 2.7 | `POST /login` (password salah) | 401 Invalid email or password | ☐ |
| 2.8 | `GET /me` (tanpa token) | 401 Access denied | ☐ |
| 2.9 | `GET /me` (Bearer token) | 200 user profile | ☐ |

### Phase 3 — Course Module

| No | Request | Expected | Result |
| :--- | :--- | :--- | :--- |
| 3.1 | `GET /course` | 200 + `meta.pagination` | ☐ |
| 3.2 | `GET /course?status=published&level=beginner&category_id=1` | 200 hanya data match | ☐ |
| 3.3 | `GET /course?search=golang&sortBy=price_asc` | 200 terfilter + urut harga naik | ☐ |
| 3.4 | `GET /course?topic=Data` | 200 category_name mengandung "Data" | ☐ |
| 3.5 | `GET /course/3` | 200 nested: tutors, categories, modules→materials, reviews | ☐ |
| 3.6 | `GET /course/9999` | 404 Course not found | ☐ |
| 3.7 | `POST /course` (body invalid) | 400 validation failed | ☐ |
| 3.8 | `POST /course` (tutor_id 9999) | 400 Related data not found (P2003) | ☐ |
| 3.9 | `PATCH /course/1` `{"price":175000}` | 200 harga terupdate | ☐ |
| 3.10 | `DELETE /course/2` | 200 soft delete; `GET /course/2` → 404 | ☐ |
| 3.11 | `DELETE /course/50?hard=true` | 200 hard delete permanen | ☐ |

### Phase 4 — Upload Module

| No | Request | Expected | Result |
| :--- | :--- | :--- | :--- |
| 4.1 | `POST /upload` (tanpa token) | 401 Unauthorized | ☐ |
| 4.2 | `POST /upload` (file .txt/.pdf) | 400 Invalid file type | ☐ |
| 4.3 | `POST /upload` (file .jpg) | 200 + `url` & `filename` | ☐ |
| 4.4 | Buka `url` hasil 4.3 di browser | Gambar tampil | ☐ |

---

## 📄 License

This project is created for educational and portfolio purposes.

---

> *Async...*  
> *Asynchronous...*  
> *Promise pending...*  
> *Life mysterious.*