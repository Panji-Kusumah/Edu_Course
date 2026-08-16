#  Testing Postman — Edu Course API

Dokumen ini berisi skenario testing manual API **Edu Course API** menggunakan Postman.

Testing dilakukan untuk memastikan endpoint berikut berjalan:

- List course dengan pagination dan filter
- Detail course
- Create course
- Update course dengan `PATCH` dan `PUT`
- Soft delete
- Hard delete
- Validasi error
- Penanganan 404

---

##  Informasi Test

| Item | Value |
|---|---|
| Base URL | `http://localhost:3000/api/v1` |
| Module | Course |
| Method Testing | Manual Postman |
| Database | MySQL `edu_course` |
| Environment | Windows / PowerShell |

---

##  Persiapan Sebelum Testing

1. Pastikan MySQL sudah running.
2. Pastikan database `edu_course` sudah di-import.
3. Jalankan server:

```bash
npm run dev
```

atau:

```bash
node server.js
```

4. Pastikan server berjalan di:

```txt
http://localhost:3000
```

5. Buka Postman.
6. Testing dilakukan manual tanpa environment variable.

---

## 📋 Ringkasan Test

| No | Test Case | Method | URL | Expected Status |
|---|---|---|---|---|
| 1 | Get all courses | GET | `/course` | 200 |
| 2 | Get courses with pagination | GET | `/course?page=2&limit=5` | 200 |
| 3 | Get courses with filter | GET | `/course?status=published&level=beginner` | 200 |
| 4 | Get course by ID | GET | `/course/1` | 200 |
| 5 | Get course not found | GET | `/course/9999` | 404 |
| 6 | Create course valid | POST | `/course` | 201 |
| 7 | Create course invalid | POST | `/course` | 400 |
| 8 | Update course partial | PATCH | `/course/:id` | 200 |
| 9 | Update course full | PUT | `/course/:id` | 200 |
| 10 | Soft delete course | DELETE | `/course/:id` | 200 |
| 11 | Get deleted course | GET | `/course/:id` | 404 |
| 12 | Hard delete course | DELETE | `/course/:id?hard=true` | 200 |

---

# 🧾 Detail Test

---

## Test 1 — Get All Courses

### Request

```http
GET http://localhost:3000/api/v1/course
```

### Expected Status

```txt
200 OK
```

### Expected Response

```json
{
  "success": true,
  "message": "Daftar course berhasil diambil",
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

### Checklist

- [ ] Status 200
- [ ] `success: true`
- [ ] `data` berupa array
- [ ] `meta.pagination` muncul

---

## Test 2 — Get Courses with Pagination

### Request

```http
GET http://localhost:3000/api/v1/course?page=2&limit=5
```

### Expected Status

```txt
200 OK
```

### Expected Behavior

- API mengembalikan maksimal 5 data.
- Pagination menunjukkan halaman 2.

### Expected Response

```json
{
  "success": true,
  "message": "Daftar course berhasil diambil",
  "data": [],
  "meta": {
    "pagination": {
      "page": 2,
      "limit": 5,
      "totalItems": 50,
      "totalPages": 10,
      "hasNextPage": true,
      "hasPreviousPage": true
    }
  }
}
```

### Checklist

- [ ] Status 200
- [ ] Jumlah data maksimal 5
- [ ] `meta.pagination.page` = 2
- [ ] `meta.pagination.limit` = 5

---

## Test 3 — Get Courses with Filter

### Request

```http
GET http://localhost:3000/api/v1/course?status=published&level=beginner
```

### Expected Status

```txt
200 OK
```

### Expected Behavior

Semua course yang返回 hanya yang memiliki:

```json
"status": "published"
```

dan:

```json
"level": "beginner"
```

### Checklist

- [ ] Status 200
- [ ] Semua data memiliki `status: "published"`
- [ ] Semua data memiliki `level: "beginner"`

---

## Test 4 — Get Course by ID

### Request

```http
GET http://localhost:3000/api/v1/course/1
```

### Expected Status

```txt
200 OK
```

### Expected Response

```json
{
  "success": true,
  "message": "Detail course berhasil diambil",
  "data": {}
}
```

### Checklist

- [ ] Status 200
- [ ] Detail course muncul
- [ ] ID sesuai dengan parameter

---

## Test 5 — Get Course Not Found

### Request

```http
GET http://localhost:3000/api/v1/course/9999
```

### Expected Status

```txt
404 Not Found
```

### Expected Response

```json
{
  "success": false,
  "message": "Course tidak ditemukan"
}
```

### Checklist

- [ ] Status 404
- [ ] `success: false`
- [ ] Message error sesuai

---

# ➕ Create Course

---

## Test 6 — Create Course Valid

### Request

```http
POST http://localhost:3000/api/v1/course
```

### Header

```txt
Content-Type: application/json
```

### Body

```json
{
  "title": "Postman Manual Test",
  "category_id": 1,
  "tutor_id": 1,
  "level": "beginner",
  "status": "published",
  "price": 0,
  "discount_percent": 0,
  "thumbnail": "postman-test.jpg"
}
```

### Expected Status

```txt
201 Created
```

### Expected Response

```json
{
  "success": true,
  "message": "Course berhasil dibuat",
  "data": {}
}
```

### Checklist

- [ ] Status 201
- [ ] `success: true`
- [ ] Data course baru muncul
- [ ] Catat ID course baru untuk test update/delete

---

## Test 7 — Create Course Invalid

### Request

```http
POST http://localhost:3000/api/v1/course
```

### Header

```txt
Content-Type: application/json
```

### Body

```json
{
  "price": -100
}
```

### Expected Status

```txt
400 Bad Request
```

### Expected Response

```json
{
  "success": false,
  "message": "Validasi request gagal",
  "details": []
}
```

### Checklist

- [ ] Status 400
- [ ] `success: false`
- [ ] Ada pesan validasi

---

#  Update Course

Ganti `:id` dengan ID course yang baru dibuat pada Test 6.

Contoh:

```txt
http://localhost:3000/api/v1/course/51
```

---

## Test 8 — Update Course Partial dengan PATCH

### Request

```http
PATCH http://localhost:3000/api/v1/course/51
```

### Header

```txt
Content-Type: application/json
```

### Body

```json
{
  "price": 99999,
  "status": "draft"
}
```

### Expected Status

```txt
200 OK
```

### Expected Response

```json
{
  "success": true,
  "message": "Course berhasil diperbarui",
  "data": {}
}
```

### Checklist

- [ ] Status 200
- [ ] Hanya field yang dikirim yang berubah
- [ ] Data course ter-update

---

## Test 9 — Update Course Full dengan PUT

### Request

```http
PUT http://localhost:3000/api/v1/course/51
```

### Header

```txt
Content-Type: application/json
```

### Body

```json
{
  "title": "Postman Manual Test Updated",
  "category_id": 1,
  "tutor_id": 1,
  "level": "intermediate",
  "status": "published",
  "price": 150000,
  "discount_percent": 10,
  "thumbnail": "postman-test-updated.jpg"
}
```

### Expected Status

```txt
200 OK
```

### Expected Response

```json
{
  "success": true,
  "message": "Course berhasil diperbarui",
  "data": {}
}
```

### Checklist

- [ ] Status 200
- [ ] Data course ter-update penuh
- [ ] Response sesuai format standar

---

#  Delete Course

---

## Test 10 — Soft Delete Course

### Request

```http
DELETE http://localhost:3000/api/v1/course/51
```

### Expected Status

```txt
200 OK
```

### Expected Response

```json
{
  "success": true,
  "message": "Course berhasil dihapus sementara",
  "data": {
    "id": 51,
    "hard": false
  }
}
```

### Checklist

- [ ] Status 200
- [ ] Message soft delete muncul
- [ ] `hard: false`

### Verifikasi Database

Jalankan di MySQL:

```sql
SELECT class_id, deleted_at
FROM classes
WHERE class_id = 51;
```

Jika soft delete berhasil, kolom `deleted_at` harus berisi timestamp, bukan `NULL`.

---

## Test 11 — Get Deleted Course

### Request

```http
GET http://localhost:3000/api/v1/course/51
```

### Expected Status

```txt
404 Not Found
```

### Expected Response

```json
{
  "success": false,
  "message": "Course tidak ditemukan"
}
```

### Checklist

- [ ] Status 404
- [ ] Course yang sudah soft delete tidak muncul di API

---

## Test 12 — Hard Delete Course

### Request

```http
DELETE http://localhost:3000/api/v1/course/51?hard=true
```

### Expected Status

```txt
200 OK
```

### Expected Response

```json
{
  "success": true,
  "message": "Course berhasil dihapus permanen",
  "data": {
    "id": 51,
    "hard": true
  }
}
```

### Checklist

- [ ] Status 200
- [ ] Message hard delete muncul
- [ ] `hard: true`

### Verifikasi Database

Jalankan di MySQL:

```sql
SELECT *
FROM classes
WHERE class_id = 51;
```

Jika hard delete berhasil, data harus benar-benar hilang.

---

#  Catatan Penting

Jika `POST /course` gagal dengan status `400`, perhatikan bagian:

```json
"details"
```

Kemungkinan penyebab:

- Nama kolom tabel berbeda.
- Ada field wajib yang belum dikirim.
- Value tidak sesuai constraint database.
- Foreign key `category_id` atau `tutor_id` tidak valid.

Cek struktur tabel jika perlu:

```sql
DESCRIBE classes;
```

---

# 📸 Bukti Testing untuk Portofolio

Disarankan menyimpan bukti berikut:

- Screenshot request Postman.
- Screenshot response JSON.
- Screenshot status code.
- Screenshot hasil query MySQL untuk soft delete dan hard delete.
- Export Postman collection jika diperlukan.

Struktur folder bukti:

```txt
docs/
├── postman/
│   ├── 01-get-all-courses.png
│   ├── 02-get-pagination.png
│   ├── 03-get-filter.png
│   ├── 04-get-detail.png
│   ├── 05-get-not-found.png
│   ├── 06-create-valid.png
│   ├── 07-create-invalid.png
│   ├── 08-patch.png
│   ├── 09-put.png
│   ├── 10-soft-delete.png
│   ├── 11-get-deleted.png
│   └── 12-hard-delete.png
```

---

# ✅ Hasil Akhir Testing

| No | Test Case | Result |
|---|---|---|
| 1 | Get all courses | ☐ PASS ☐ FAIL |
| 2 | Get courses with pagination | ☐ PASS ☐ FAIL |
| 3 | Get courses with filter | ☐ PASS ☐ FAIL |
| 4 | Get course by ID | ☐ PASS ☐ FAIL |
| 5 | Get course not found | ☐ PASS ☐ FAIL |
| 6 | Create course valid | ☐ PASS ☐ FAIL |
| 7 | Create course invalid | ☐ PASS ☐ FAIL |
| 8 | Patch course | ☐ PASS ☐ FAIL |
| 9 | Put course | ☐ PASS ☐ FAIL |
| 10 | Soft delete course | ☐ PASS ☐ FAIL |
| 11 | Get deleted course | ☐ PASS ☐ FAIL |
| 12 | Hard delete course | ☐ PASS ☐ FAIL |