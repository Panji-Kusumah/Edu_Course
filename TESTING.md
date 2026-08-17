# Master Test Plan — Edu Course API (Postman)

Dokumen ini berisi skenario testing manual API **Edu Course API** menggunakan Postman. Testing mencakup 4 fase utama untuk memastikan seluruh alur bisnis berjalan dengan benar setelah migrasi ke Prisma ORM dan penambahan modul baru.

**Cakupan Testing:**
1. Sanity & Health Check
2. Authentication (Register, Email Verification, JWT, Protected Routes)
3. Course Module (Advanced Query, Nested Relations, CRUD, Soft/Hard Delete)
4. Upload Module (Multer, Auth Guard, Static Files)

---

## 📋 Informasi Test

| Item | Value |
|---|---|
| Base URL | `http://localhost:3000/api/v1` |
| Method Testing | Manual Postman |
| Database | MySQL `edu_course` (via Prisma ORM) |
| Environment | Windows / PowerShell |

---

## 🛠 Persiapan Sebelum Testing

1. Pastikan MySQL sudah running dan database `edu_course` terisi data dummy (seed).
2. Pastikan file `.env` sudah dikonfigurasi (`DATABASE_URL`, `JWT_SECRET`, `SMTP_*`).
3. Jalankan server: `npm run dev`
4. Buka Postman. **Tips:** Gunakan fitur *Environments* di Postman untuk menyimpan variabel `{{token}}` agar tidak perlu copy-paste manual setiap kali login.

---

#  Phase 1: Sanity & Health

## Test 1.1 — Root Endpoint
- **Request:** `GET http://localhost:3000/`
- **Expected:** `200 OK`, response HTML atau JSON selamat datang.

## Test 1.2 — Health Check
- **Request:** `GET http://localhost:3000/api/v1/health`
- **Expected:** `200 OK`, response berisi status database dan uptime.

---

#  Phase 2: Authentication

## Test 2.1 — Register Success
- **Request:** `POST http://localhost:3000/api/v1/register`
- **Body:** `{"fullname": "Test User", "username": "testuser1", "email": "test@test.com", "password": "rahasia123"}`
- **Expected:** `201 Created`, message `"User registered successfully"`. (Cek terminal untuk Email Preview URL).

## Test 2.2 — Register Duplicate Email
- **Request:** `POST http://localhost:3000/api/v1/register` (Kirim ulang request 2.1)
- **Expected:** `409 Conflict`, message `"Email already registered"`.

## Test 2.3 — Register Validation Error
- **Request:** `POST http://localhost:3000/api/v1/register`
- **Body:** `{"fullname": "Te", "email": "bukan-email", "password": "123"}`
- **Expected:** `400 Bad Request`, message `"Request validation failed"`, ada array `details`.

## Test 2.4 — Verify Email
- **Request:** `GET http://localhost:3000/api/v1/verify-email?token=[paste_token_dari_email]`
- **Expected:** `200 OK`, message `"Email Verified Successfully"`.

## Test 2.5 — Verify Email Invalid Token
- **Request:** `GET http://localhost:3000/api/v1/verify-email?token=token-palsu`
- **Expected:** `400 Bad Request`, message `"Invalid Verification Token"`.

## Test 2.6 — Login Success
- **Request:** `POST http://localhost:3000/api/v1/login`
- **Body:** `{"email": "test@test.com", "password": "rahasia123"}`
- **Expected:** `200 OK`, response berisi `token` JWT. **(Simpan token ini untuk Phase 4!)**

## Test 2.7 — Login Failed (Wrong Password)
- **Request:** `POST http://localhost:3000/api/v1/login`
- **Body:** `{"email": "test@test.com", "password": "passwordsalah"}`
- **Expected:** `401 Unauthorized`, message `"Invalid email or password"`.

## Test 2.8 — Get Profile (No Token)
- **Request:** `GET http://localhost:3000/api/v1/me` (Tanpa Header Authorization)
- **Expected:** `401 Unauthorized`, message `"Access denied. No token provided..."`.

## Test 2.9 — Get Profile (With Token)
- **Request:** `GET http://localhost:3000/api/v1/me`
- **Headers:** `Authorization: Bearer [paste_token_dari_2.6]`
- **Expected:** `200 OK`, response berisi data `user_id`, `email`, `role`.

---

#  Phase 3: Course Module

## Test 3.1 — Get All Courses (Default)
- **Request:** `GET http://localhost:3000/api/v1/course`
- **Expected:** `200 OK`, data array + `meta.pagination`.

## Test 3.2 — Filter Regression (Status, Level, Category)
- **Request:** `GET http://localhost:3000/api/v1/course?status=published&level=beginner&category_id=1`
- **Expected:** `200 OK`, hanya course yang match ketiga filter tersebut.

## Test 3.3 — Search & Sort
- **Request:** `GET http://localhost:3000/api/v1/course?search=golang&sortBy=price_asc`
- **Expected:** `200 OK`, hanya course mengandung "golang", diurutkan dari harga termurah.

## Test 3.4 — Filter by Topic
- **Request:** `GET http://localhost:3000/api/v1/course?topic=Data`
- **Expected:** `200 OK`, hanya course dengan `category_name` mengandung "Data".

## Test 3.5 — Get Course Detail (Nested Relations)
- **Request:** `GET http://localhost:3000/api/v1/course/3`
- **Expected:** `200 OK`, data berisi `tutors`, `categories`, `modules` (dengan `materials`), dan `reviews`.

## Test 3.6 — Get Course Not Found
- **Request:** `GET http://localhost:3000/api/v1/course/9999`
- **Expected:** `404 Not Found`, message `"Course not found"`.

## Test 3.7 — Create Course (Validation Error)
- **Request:** `POST http://localhost:3000/api/v1/course`
- **Body:** `{"title": "Ab"}`
- **Expected:** `400 Bad Request`, message `"Request validation failed"`.

## Test 3.8 — Create Course (FK Error / Prisma P2003)
- **Request:** `POST http://localhost:3000/api/v1/course`
- **Body:** `{"tutor_id": 9999, "category_id": 1, "title": "Course Hantu", "price": 100000}`
- **Expected:** `400 Bad Request`, message `"Related data not found or invalid"`.

## Test 3.9 — Update Course (PATCH)
- **Request:** `PATCH http://localhost:3000/api/v1/course/1`
- **Body:** `{"price": 175000}`
- **Expected:** `200 OK`, harga terupdate.

## Test 3.10 — Soft Delete Course
- **Request:** `DELETE http://localhost:3000/api/v1/course/2`
- **Expected:** `200 OK`, message `"Course has been moved to trash"`, `hard_deleted: false`.
- **Verifikasi:** `GET /api/v1/course/2` harus return `404`.

## Test 3.11 — Hard Delete Course
- **Request:** `DELETE http://localhost:3000/api/v1/course/50?hard=true`
- **Expected:** `200 OK`, message `"Course deleted permanently"`, `hard_deleted: true`.

---

#  Phase 4: Upload Module

*Gunakan token dari Test 2.6 di tab Authorization (Bearer Token).*

## Test 4.1 — Upload Without Token
- **Request:** `POST http://localhost:3000/api/v1/upload` (Tanpa Auth)
- **Body:** `form-data`, key `image` (tipe File), pilih gambar.
- **Expected:** `401 Unauthorized`.

## Test 4.2 — Upload Invalid File Type
- **Request:** `POST http://localhost:3000/api/v1/upload` (Dengan Auth)
- **Body:** `form-data`, key `image` (tipe File), pilih file `.txt` atau `.pdf`.
- **Expected:** `400 Bad Request`, message `"Invalid file type..."`.

## Test 4.3 — Upload Success
- **Request:** `POST http://localhost:3000/api/v1/upload` (Dengan Auth)
- **Body:** `form-data`, key `image` (tipe File), pilih file `.jpg` atau `.png`.
- **Expected:** `200 OK`, response berisi `url` dan `filename`.

## Test 4.4 — Access Static File
- **Request:** Buka `url` dari response Test 4.3 di Browser.
- **Expected:** Gambar tampil di browser.

---

#  Hasil Akhir Testing

| Phase | No | Test Case | Result |
|---|---|---|---|
| **1. Sanity** | 1.1 | Root Endpoint | ☐ PASS ☐ FAIL |
| | 1.2 | Health Check | ☐ PASS ☐ FAIL |
| **2. Auth** | 2.1 | Register Success | ☐ PASS ☐ FAIL |
| | 2.2 | Register Duplicate | ☐ PASS ☐ FAIL |
| | 2.3 | Register Validation | ☐ PASS ☐ FAIL |
| | 2.4 | Verify Email | ☐ PASS ☐ FAIL |
| | 2.5 | Verify Invalid Token | ☐ PASS ☐ FAIL |
| | 2.6 | Login Success | ☐ PASS ☐ FAIL |
| | 2.7 | Login Failed | ☐ PASS ☐ FAIL |
| | 2.8 | Get Profile (No Token) | ☐ PASS ☐ FAIL |
| | 2.9 | Get Profile (With Token) | ☐ PASS ☐ FAIL |
| **3. Course** | 3.1 | Get All Courses | ☐ PASS ☐ FAIL |
| | 3.2 | Filter Regression | ☐ PASS ☐ FAIL |
| | 3.3 | Search & Sort | ☐ PASS ☐ FAIL |
| | 3.4 | Filter by Topic | ☐ PASS ☐ FAIL |
| | 3.5 | Get Detail (Nested) | ☐ PASS ☐ FAIL |
| | 3.6 | Get Not Found | ☐ PASS ☐ FAIL |
| | 3.7 | Create Validation | ☐ PASS ☐ FAIL |
| | 3.8 | Create FK Error | ☐ PASS ☐ FAIL |
| | 3.9 | Update PATCH | ☐ PASS ☐ FAIL |
| | 3.10| Soft Delete | ☐ PASS ☐ FAIL |
| | 3.11| Hard Delete | ☐ PASS ☐ FAIL |
| **4. Upload** | 4.1 | Upload No Token | ☐ PASS ☐ FAIL |
| | 4.2 | Upload Invalid File | ☐ PASS ☐ FAIL |
| | 4.3 | Upload Success | ☐ PASS ☐ FAIL |
| | 4.4 | Access Static File | ☐ PASS ☐ FAIL |