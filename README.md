# 🐧 Edu Course API

A robust and clean RESTful API for EduCourse—an online learning platform backend. Built using Node.js (ES Modules), Express 5, and MySQL 9, this project focuses on strict schema validation, predictable error handling, and clean CRUD architecture.

Manages courses, categories, tutors, and enrollments with tight relational constraints and structured validation payloads.

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-3068B7?style=for-the-badge&logo=zod&logoColor=white)

---

##  Key Features

###  Clean Layered Architecture
Strict separation of concerns to ensure maintainability and testability:
`Routes` ➔ `Controllers` ➔ `Services` ➔ `Repositories` ➔ `Database`

### 🛡️ Robust Data Validation
Request payloads (`body`, `params`, `query`) are strictly validated using **Zod** schemas before reaching the business logic, preventing invalid data from corrupting the database.

###  Advanced MySQL Database Design
- **12 Relational Tables** with strict `InnoDB` engine and `utf8mb4_unicode_ci`.
- **Foreign Keys** with `ON DELETE CASCADE` for automatic orphaned data cleanup.
- **CHECK Constraints** to enforce business rules at the database level.
- **Soft Deletes** (`deleted_at`) implemented for critical entities like Users and Classes.
- **Performance Indexes**: Single, Composite, Unique, and `FULLTEXT` indexes for optimized search.
- **Database Views** (`v_course_cards`) to encapsulate complex `JOIN` queries for read-heavy frontend operations.
- **Least Privilege Principle**: Application connects via a restricted MySQL user (`edu_app`) with only `SELECT, INSERT, UPDATE, DELETE` privileges.

###  Centralized Error Handling
A global error middleware catches and formats errors consistently. It intelligently maps MySQL specific errors to standard HTTP status codes:
- `ER_DUP_ENTRY` ➔ `409 Conflict`
- `ER_NO_REFERENCED_ROW` ➔ `400 Bad Request`
- `ER_ROW_IS_REFERENCED` ➔ `409 Conflict`
- `ER_CHECK_CONSTRAINT_VIOLATED` ➔ `422 Unprocessable Entity`

###  Standardized JSON Responses
All endpoints return a predictable, uniform JSON structure:
```json
{
  "success": true,
  "message": "Courses retrieved successfully",
  "data": [ ... ],
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

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/course` | Get paginated list of courses (Supports filters: `status`, `level`, `category_id`) |
| `GET` | `/course/:id` | Get detailed information of a specific course |
| `POST` | `/course` | Create a new course (Requires validated JSON body) |
| `PATCH` | `/course/:id` | Partially update an existing course |
| `PUT` | `/course/:id` | Fully update an existing course |
| `DELETE` | `/course/:id` | Soft delete a course (Add `?hard=true` for permanent deletion) |

---

## 🐧Tech Stack

- **Runtime:** Node.js (ES Modules)
- **Framework:** Express.js
- **Database:** MySQL 9+ (`mysql2` with named placeholders)
- **Validation:** Zod
- **Security:** Helmet, CORS
- **Logging:** Morgan
- **Environment:** dotenv

---

## 📁 Project Structure

```text
BE_EDU_COURSE/
├── src/
│   ├── config/          # Database pool & environment variables
│   ├── controllers/     # HTTP request handling & response formatting
│   ├── middlewares/     # Global error handler & Zod validation
│   ├── repositories/    # Direct database queries & SQL logic
│   ├── routes/          # API routing & endpoint definitions
│   ├── services/        # Business logic & data transformation
│   ├── utils/           # Helpers (pagination, AppError, asyncHandler)
│   └── app.js           # Express app initialization
├── .env.example         # Environment variables template
├── .gitignore
├── package.json
├── server.js            # Entry point & graceful shutdown logic
└── edu_course_final.sql # Database schema and seed data
```

---

##  Getting Started (Local Setup)

### Prerequisites
- Node.js (v18 or higher)
- MySQL Server (v8.0 or higher)
- Git

### Clone the Repository
```powershell
git clone <repository-url>
cd BE_EDU_COURSE
```

### Install Dependencies
```powershell
npm install
```

### Setup Database
1. Login to your MySQL server and create the database and restricted user:
   ```sql
   CREATE DATABASE edu_course CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'edu_app'@'localhost' IDENTIFIED BY 'your_secure_password';
   GRANT SELECT, INSERT, UPDATE, DELETE ON edu_course.* TO 'edu_app'@'localhost';
   FLUSH PRIVILEGES;
   ```
2. Import the schema and seed data:
   ```powershell
   mysql -u root -p edu_course < edu_course_final.sql
   ```

### Configure Environment Variables
Copy the `.env.example` file to `.env` and update the values:
```powershell
cp .env.example .env
```
Edit `.env`:
```env
PORT=3000
NODE_ENV=development

# Database Config
DB_HOST=localhost
DB_PORT=3306
DB_USER=edu_app
DB_PASSWORD=your_secure_password
DB_NAME=edu_course

# Security
CORS_ORIGIN=http://localhost:3000
```

###  Run the Server
```powershell
# Development mode with auto-restart (if nodemon is installed)
npm run dev

# Production/Standard mode
npm start
```
The API will be available at `http://localhost:3000`.

---

##  Testing with Postman

1. Import the API endpoints into Postman.
2. Ensure your `Content-Type` header is set to `application/json` for `POST` and `PUT/PATCH` requests.
3. Test pagination and filtering: 
   `GET http://localhost:3000/api/v1/course?page=1&limit=5&status=published&level=beginner`
4. Test soft delete vs hard delete:
   `DELETE http://localhost:3000/api/v1/course/1` (Soft delete)
   `DELETE http://localhost:3000/api/v1/course/1?hard=true` (Hard delete)

---

##  License

This project is created for educational and portfolio purposes.
---

> *Async...*  
> *Asynchronous...*  
> *Promise pending...*  
> *Life mysterious.*