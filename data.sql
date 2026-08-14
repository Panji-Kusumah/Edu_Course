CREATE DATABASE edu_course CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE edu_course;

CREATE TABLE users (
  user_id INT UNSIGNED AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NULL,
  password VARCHAR(255) NULL,
  role ENUM('student','tutor','admin') NOT NULL DEFAULT 'student',
  auth_provider ENUM('local','google') NOT NULL DEFAULT 'local',
  google_id VARCHAR(255) NULL,
  batch VARCHAR(50) NULL,
  photo VARCHAR(255) NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_phone (phone),
  UNIQUE KEY uq_users_google_id (google_id)
) ENGINE=InnoDB;

CREATE TABLE tutors (
  tutor_id INT UNSIGNED AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  title VARCHAR(150) NULL,
  bio TEXT,
  expertise VARCHAR(150),
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (tutor_id)
) ENGINE=InnoDB;

CREATE TABLE categories (
  category_id INT UNSIGNED AUTO_INCREMENT,
  category_name VARCHAR(100) NOT NULL,
  slug VARCHAR(120) NOT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (category_id),
  UNIQUE KEY uq_categories_slug (slug)
) ENGINE=InnoDB;

CREATE TABLE classes (
  class_id INT UNSIGNED AUTO_INCREMENT,
  tutor_id INT UNSIGNED NOT NULL,
  category_id INT UNSIGNED NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_percent TINYINT UNSIGNED NOT NULL DEFAULT 0,
  level ENUM('beginner','intermediate','advanced') DEFAULT 'beginner',
  thumbnail VARCHAR(255),
  language VARCHAR(50) NOT NULL DEFAULT 'Indonesia',
  includes_certificate TINYINT(1) NOT NULL DEFAULT 1,
  status ENUM('draft','published','archived') DEFAULT 'draft',
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  PRIMARY KEY (class_id),
  KEY idx_classes_tutor (tutor_id),
  KEY idx_classes_category (category_id),
  KEY idx_classes_status_level (status, level),
  KEY idx_classes_status_created (status, created_at),
  FULLTEXT KEY ft_classes_search (title, description),
  CONSTRAINT chk_classes_price CHECK (price >= 0),
  CONSTRAINT chk_classes_discount CHECK (discount_percent BETWEEN 0 AND 100),
  CONSTRAINT fk_classes_tutor FOREIGN KEY (tutor_id) REFERENCES tutors(tutor_id),
  CONSTRAINT fk_classes_category FOREIGN KEY (category_id) REFERENCES categories(category_id)
) ENGINE=InnoDB;

CREATE TABLE modules (
  module_id INT UNSIGNED AUTO_INCREMENT,
  class_id INT UNSIGNED NOT NULL,
  module_title VARCHAR(150) NOT NULL,
  sequence INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (module_id),
  KEY idx_modules_class_seq (class_id, sequence),
  CONSTRAINT fk_modules_class FOREIGN KEY (class_id) REFERENCES classes(class_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE materials (
  material_id INT UNSIGNED AUTO_INCREMENT,
  module_id INT UNSIGNED NOT NULL,
  material_type ENUM('rangkuman','video','quiz') NOT NULL,
  title VARCHAR(150) NOT NULL,
  content TEXT NULL,
  video_url VARCHAR(255) NULL,
  duration INT NULL,
  sequence INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (material_id),
  KEY idx_materials_module_type (module_id, material_type),
  CONSTRAINT fk_materials_module FOREIGN KEY (module_id) REFERENCES modules(module_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE orders (
  order_id INT UNSIGNED AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  total_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  admin_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
  status ENUM('pending','paid','cancelled','refunded') DEFAULT 'pending',
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (order_id),
  KEY idx_orders_user_status (user_id, status),
  CONSTRAINT chk_orders_money CHECK (total_price >= 0 AND admin_fee >= 0),
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB;

CREATE TABLE order_details (
  order_detail_id INT UNSIGNED AUTO_INCREMENT,
  order_id INT UNSIGNED NOT NULL,
  class_id INT UNSIGNED NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (order_detail_id),
  UNIQUE KEY uq_order_details_order_class (order_id, class_id),
  KEY idx_order_details_class (class_id),
  CONSTRAINT fk_od_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
  CONSTRAINT fk_od_class FOREIGN KEY (class_id) REFERENCES classes(class_id)
) ENGINE=InnoDB;

CREATE TABLE payments (
  payment_id INT UNSIGNED AUTO_INCREMENT,
  order_id INT UNSIGNED NOT NULL,
  payment_method ENUM('bank_transfer','ewallet','credit_card') NOT NULL,
  payment_provider VARCHAR(50) NULL,
  status ENUM('pending','success','failed','expired') DEFAULT 'pending',
  amount DECIMAL(12,2) NOT NULL,
  proof_url VARCHAR(255) NULL,
  paid_at TIMESTAMP NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (payment_id),
  UNIQUE KEY uq_payments_order (order_id),
  KEY idx_payments_status (status),
  CONSTRAINT chk_payments_amount CHECK (amount >= 0),
  CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(order_id)
) ENGINE=InnoDB;

CREATE TABLE enrollments (
  enrollment_id INT UNSIGNED AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  class_id INT UNSIGNED NOT NULL,
  order_id INT UNSIGNED NOT NULL,
  progress TINYINT UNSIGNED DEFAULT 0,
  status ENUM('active','completed','dropped') DEFAULT 'active',
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (enrollment_id),
  UNIQUE KEY uq_enrollments_user_class (user_id, class_id),
  KEY idx_enrollments_class (class_id),
  KEY idx_enrollments_order (order_id),
  CONSTRAINT chk_enroll_progress CHECK (progress BETWEEN 0 AND 100),
  CONSTRAINT fk_enroll_user FOREIGN KEY (user_id) REFERENCES users(user_id),
  CONSTRAINT fk_enroll_class FOREIGN KEY (class_id) REFERENCES classes(class_id),
  CONSTRAINT fk_enroll_order FOREIGN KEY (order_id) REFERENCES orders(order_id)
) ENGINE=InnoDB;

CREATE TABLE pretests (
  pretest_id INT UNSIGNED AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  class_id INT UNSIGNED NOT NULL,
  score INT NOT NULL DEFAULT 0,
  total_questions INT NOT NULL,
  correct_answers INT NOT NULL,
  taken_at TIMESTAMP NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (pretest_id),
  KEY idx_pretests_user_class (user_id, class_id),
  KEY idx_pretests_class (class_id),
  CONSTRAINT chk_pretest_score CHECK (score BETWEEN 0 AND 100),
  CONSTRAINT fk_pretest_user FOREIGN KEY (user_id) REFERENCES users(user_id),
  CONSTRAINT fk_pretest_class FOREIGN KEY (class_id) REFERENCES classes(class_id)
) ENGINE=InnoDB;

CREATE TABLE reviews (
  review_id INT UNSIGNED AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  class_id INT UNSIGNED NOT NULL,
  rating DECIMAL(2,1) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (review_id),
  UNIQUE KEY uq_reviews_user_class (user_id, class_id),
  KEY idx_reviews_class_rating (class_id, rating),
  CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT fk_review_user FOREIGN KEY (user_id) REFERENCES users(user_id),
  CONSTRAINT fk_review_class FOREIGN KEY (class_id) REFERENCES classes(class_id)
) ENGINE=InnoDB;


INSERT INTO users (user_id, name, email, phone, password, role, auth_provider, google_id, batch) VALUES
(1, 'Budi Santoso', 'budi@student.com', '081200000001', '$2b$10$dummyhash', 'student', 'local', NULL, 'Batch 2');

INSERT INTO categories (category_id, category_name, slug) VALUES
(1, 'Web Development', 'web-development'), (2, 'Data Science', 'data-science'),
(3, 'Desain', 'desain'), (4, 'Pemasaran', 'pemasaran'),
(5, 'Bisnis', 'bisnis'), (6, 'Pengembangan Diri', 'pengembangan-diri');

INSERT INTO tutors (tutor_id, name, title, bio, expertise) VALUES
(1, 'Rina Wijaya', 'Backend Engineer di GoTo', 'Praktisi industri 5+ tahun.', 'Node.js'),
(2, 'Bima Arya', 'Backend Engineer di Traveloka', 'Praktisi industri 5+ tahun.', 'REST API'),
(3, 'Sari Rahma', 'Product Designer di Ruangguru', 'Praktisi industri 5+ tahun.', 'UI/UX'),
(4, 'Raka Aditya', 'UX Researcher di Tokopedia', 'Praktisi riset 4+ tahun.', 'UX Research'),
(5, 'Hendra Gunawan', 'Senior Go Developer di Grab', 'Praktisi industri 6+ tahun.', 'Microservices'),
(6, 'Dimas Prakoso', 'Frontend Engineer di Traveloka', 'Praktisi industri 5+ tahun.', 'React'),
(7, 'Nadia Puspita', 'Frontend Developer di Tokopedia', 'Praktisi industri 4+ tahun.', 'Vue'),
(8, 'Andi Firmansyah', 'Database Engineer di DANA', 'Spesialis database production.', 'MySQL'),
(9, 'Fitri Handayani', 'DevOps Engineer di Shopee', 'Praktisi infrastruktur 5+ tahun.', 'Docker'),
(10, 'Bagus Wicaksono', 'Software Architect di GoTo', 'Praktisi industri 8+ tahun.', 'Clean Architecture'),
(11, 'Maya Anggraini', 'Data Analyst di DANA', 'Praktisi analitik 5+ tahun.', 'SQL'),
(12, 'Rizky Ramadhan', 'Data Scientist di Blibli', 'Praktisi data science 4+ tahun.', 'Python'),
(13, 'Laila Fitriani', 'Data Analyst di Tokopedia', 'Praktisi analitik 4+ tahun.', 'Pandas'),
(14, 'Yoga Pratama', 'ML Engineer di GoTo', 'Praktisi machine learning 5+ tahun.', 'Machine Learning'),
(15, 'Dewi Lestari', 'Statistician di BPS', 'Praktisi statistik 7+ tahun.', 'Statistik'),
(16, 'Intan Permata', 'Product Designer di Gojek', 'Praktisi desain 5+ tahun.', 'Figma'),
(17, 'Panji Kusumah', 'Golang Engineer di Tokopedia', 'Aktif di open source Golang.', 'Golang'),
(18, 'Alya Nurjanah', 'Design System Lead di Ruangguru', 'Praktisi desain 6+ tahun.', 'Design System'),
(19, 'Fajar Hidayat', 'Visual Designer di Kompas', 'Praktisi desain grafis 7+ tahun.', 'Tipografi'),
(20, 'Sinta Dewi', 'Digital Marketing Lead di Shopee', 'Menangani 50+ campaign.', 'Digital Marketing'),
(21, 'Bayu Segara', 'SEO Specialist di Tokopedia', 'Praktisi SEO 5+ tahun.', 'SEO'),
(22, 'Rina Marlina', 'Paid Ads Specialist di Meta', 'Praktisi ads 4+ tahun.', 'Meta Ads'),
(23, 'Doni Saputra', 'Marketing Analyst di Google', 'Praktisi marketing 5+ tahun.', 'Google Ads'),
(24, 'Clara Wibowo', 'Senior Copywriter di Ogilvy', 'Praktisi copywriting 6+ tahun.', 'Copywriting'),
(25, 'Jenna Ortega', 'Senior Accountant di Gojek', 'Praktisi audit 6+ tahun.', 'Audit'),
(26, 'Hendro Purnomo', 'Financial Analyst di Deloitte', 'Praktisi finansial 5+ tahun.', 'Financial Analysis'),
(27, 'Ratna Kusuma', 'Excel Expert di PwC', 'Praktisi bisnis 7+ tahun.', 'Excel'),
(28, 'Agus Salim', 'Agile Coach di EY', 'Praktisi manajemen proyek 6+ tahun.', 'Agile'),
(29, 'Dian Paramita', 'Auditor di KAP', 'Praktisi akuntansi 5+ tahun.', 'Akuntansi'),
(30, 'Putri Ayu', 'Public Speaking Coach', 'Trainer soft-skill 7+ tahun.', 'Public Speaking'),
(31, 'Kevin Pratama', 'Career Coach', 'Trainer karier 5+ tahun.', 'Personal Branding'),
(32, 'Lina Kartika', 'Productivity Coach', 'Trainer produktivitas 6+ tahun.', 'Time Management'),
(33, 'Arif Rahman', 'Management Consultant', 'Praktisi strategi 7+ tahun.', 'Problem Solving'),
(34, 'Sekar Arum', 'Communication Coach', 'Trainer komunikasi 6+ tahun.', 'Komunikasi'),
(35, 'Adit Nugroho', 'Senior Frontend di Gojek', 'Praktisi frontend 6+ tahun.', 'TypeScript'),
(36, 'Rudi Hartanta', 'Fullstack Engineer di Shopee', 'Praktisi fullstack 5+ tahun.', 'Next.js'),
(37, 'Gilang Ramadhan', 'Go Developer di Tokopedia', 'Praktisi Golang 4+ tahun.', 'Gin'),
(38, 'Eko Prasetyo', 'QA Engineer di GoTo', 'Praktisi testing 5+ tahun.', 'Testing'),
(39, 'Wahyu Hidayat', 'DevOps Engineer di DANA', 'Praktisi CI/CD 5+ tahun.', 'CI/CD'),
(40, 'Tania Wijaya', 'UI Engineer di Ruangguru', 'Praktisi frontend 4+ tahun.', 'Tailwind'),
(41, 'Sonny Kusuma', 'Senior Backend di Bukalapak', 'Praktisi backend 7+ tahun.', 'Redis'),
(42, 'Bramantyo Adi', 'SRE di GoTo', 'Praktisi infrastruktur 6+ tahun.', 'Kubernetes'),
(43, 'Farhan Maulana', 'Mobile Developer di Grab', 'Praktisi mobile 5+ tahun.', 'Flutter'),
(44, 'Sella Puspita', 'Analytics Lead di DANA', 'Praktisi analitik 6+ tahun.', 'Python'),
(45, 'Citra Lestari', 'Product Designer di Gojek', 'Praktisi desain 5+ tahun.', 'Portofolio'),
(46, 'Vino Ardiansyah', 'Growth Marketer di Shopee', 'Praktisi growth 5+ tahun.', 'Growth'),
(47, 'Ridwan Hakim', 'Leadership Coach', 'Trainer leadership 8+ tahun.', 'Negosiasi'),
(48, 'Ayu Wulandari', 'Mindfulness Coach', 'Trainer wellbeing 6+ tahun.', 'Wellbeing'),
(49, 'Sarah Simanjuntak', 'Audit Manager di EY', 'Praktisi audit 8+ tahun.', 'Interview Prep'),
(50, 'Galih Prakosa', 'Backend Engineer di DANA', 'Praktisi backend 5+ tahun.', 'Realtime');

INSERT INTO classes (class_id, tutor_id, category_id, title, description, price, discount_percent, level, thumbnail, status) VALUES
(1, 1, 1, 'Node.js Fundamental', 'Belajar Node.js dari nol hingga membuat server.', 150000, 50, 'beginner', 'node.jpg', 'published'),
(2, 2, 1, 'Express & REST API', 'Membangun REST API profesional dengan Express.', 200000, 50, 'intermediate', 'express.jpg', 'published'),
(3, 3, 3, 'UI/UX Designer & Product Manager', 'Gapai karier impianmu sebagai UI/UX Designer & PM.', 500000, 50, 'beginner', 'uiux.jpg', 'published'),
(4, 4, 1, 'Golang Dasar: From Zero to Hero', 'Fundamental Go: syntax, struct, dan concurrency dasar.', 250000, 25, 'beginner', 'golang.jpg', 'published'),
(5, 5, 1, 'Golang Microservices & gRPC', 'Bangun microservices production-ready dengan Go.', 400000, 0, 'advanced', 'micro.jpg', 'published'),
(6, 6, 1, 'React Dasar untuk Pemula', 'Component, state, dan hooks dari nol.', 200000, 25, 'beginner', 'react.jpg', 'published'),
(7, 7, 1, 'Vue.js 3 Composition API', 'Membangun SPA modern dengan Vue 3.', 225000, 0, 'intermediate', 'vue.jpg', 'published'),
(8, 8, 1, 'MySQL & Database Design', 'Model data, normalisasi, dan indexing praktis.', 175000, 25, 'beginner', 'mysql.jpg', 'published'),
(9, 9, 1, 'Docker untuk Developer', 'Containerization dari development sampai deploy.', 200000, 0, 'intermediate', 'docker.jpg', 'published'),
(10, 10, 1, 'Clean Architecture dengan Golang', 'Struktur project Go yang scalable dan testable.', 350000, 25, 'advanced', 'clean.jpg', 'published'),
(11, 11, 2, 'SQL untuk Data Analysis', 'Query, join, dan window function untuk analis.', 200000, 50, 'beginner', 'sqldata.jpg', 'published'),
(12, 12, 2, 'Python Dasar untuk Data Science', 'Python dari nol untuk olah data.', 225000, 25, 'beginner', 'py.jpg', 'published'),
(13, 13, 2, 'Pandas & Visualisasi Data', 'EDA dengan Pandas dan Matplotlib.', 250000, 0, 'intermediate', 'pandas.jpg', 'published'),
(14, 14, 2, 'Machine Learning untuk Pemula', 'Regresi, klasifikasi, dan evaluasi model.', 350000, 25, 'intermediate', 'ml.jpg', 'published'),
(15, 15, 2, 'Statistik Dasar untuk Analis', 'Probabilitas dan uji hipotesis.', 150000, 0, 'beginner', 'stat.jpg', 'draft'),
(16, 16, 3, 'Figma dari Nol sampai Mahir', 'Auto layout, component, dan prototyping.', 200000, 50, 'beginner', 'figma.jpg', 'published'),
(17, 17, 3, 'Desain Interaksi & Wireframing', 'User flow, wireframe, dan usability testing.', 275000, 0, 'intermediate', 'wire.jpg', 'published'),
(18, 18, 3, 'Design System Praktis', 'Membangun design system yang konsisten.', 300000, 25, 'advanced', 'ds.jpg', 'published'),
(19, 19, 3, 'Tipografi & Layout', 'Prinsip visual desain modern.', 150000, 0, 'beginner', 'typo.jpg', 'published'),
(20, 20, 4, 'Digital Marketing Fundamentals', 'Channel, funnel, dan metrik pemasaran.', 200000, 50, 'beginner', 'dm.jpg', 'published'),
(21, 21, 4, 'SEO & Content Marketing', 'Riset keyword dan strategi konten.', 250000, 25, 'intermediate', 'seo.jpg', 'published'),
(22, 22, 4, 'Meta Ads untuk Pemula', 'Setup campaign Facebook dan Instagram Ads.', 225000, 0, 'beginner', 'meta.jpg', 'published'),
(23, 23, 4, 'Google Ads & Analytics', 'Measure dan optimasi campaign.', 275000, 25, 'intermediate', 'gads.jpg', 'published'),
(24, 24, 4, 'Copywriting yang Menjual', 'Teknik menulis copy yang konversif.', 175000, 50, 'beginner', 'copy.jpg', 'published'),
(25, 25, 5, 'Big 4 Auditor Financial Analyst', 'Transformasi karier bersama instruktur profesional.', 300000, 0, 'intermediate', 'audit.jpg', 'published'),
(26, 26, 5, 'Analisis Laporan Keuangan', 'Membaca neraca, laba rugi, dan cashflow.', 275000, 25, 'intermediate', 'lapkeu.jpg', 'published'),
(27, 27, 5, 'Excel untuk Bisnis', 'Pivot table, formula, dan dashboard.', 150000, 50, 'beginner', 'excel.jpg', 'published'),
(28, 28, 5, 'Manajemen Proyek dengan Agile', 'Scrum, kanban, dan sprint planning.', 250000, 0, 'intermediate', 'agile.jpg', 'published'),
(29, 29, 5, 'Dasar-dasar Akuntansi', 'Jurnal, buku besar, hingga trial balance.', 175000, 25, 'beginner', 'akun.jpg', 'published'),
(30, 30, 6, 'Public Speaking Mastery', 'Berbicara percaya diri di depan umum.', 200000, 50, 'beginner', 'speak.jpg', 'published'),
(31, 31, 6, 'Personal Branding di LinkedIn', 'Optimasi profil dan konten profesional.', 150000, 25, 'beginner', 'linkedin.jpg', 'published'),
(32, 32, 6, 'Manajemen Waktu & Produktivitas', 'Prioritas, deep work, dan habit.', 150000, 0, 'beginner', 'time.jpg', 'published'),
(33, 33, 6, 'Critical Thinking & Problem Solving', 'Framework berpikir terstruktur.', 225000, 25, 'intermediate', 'think.jpg', 'published'),
(34, 34, 6, 'Komunikasi Efektif di Kantor', 'Feedback, negosiasi harian, dan email.', 175000, 0, 'beginner', 'comm.jpg', 'draft'),
(35, 35, 1, 'TypeScript Essential', 'Type system untuk aplikasi JS yang aman.', 225000, 25, 'intermediate', 'ts.jpg', 'published'),
(36, 36, 1, 'Next.js Fullstack', 'SSR, routing, dan API route.', 300000, 0, 'advanced', 'next.jpg', 'published'),
(37, 37, 1, 'REST API dengan Gin', 'Framework Gin untuk API cepat dan ringan.', 275000, 25, 'intermediate', 'gin.jpg', 'published'),
(38, 38, 1, 'Unit Testing di Node.js', 'Jest dan Supertest untuk API yang andal.', 200000, 0, 'intermediate', 'test.jpg', 'published'),
(39, 39, 1, 'CI/CD dengan GitHub Actions', 'Automasi build, test, dan deploy.', 225000, 25, 'intermediate', 'cicd.jpg', 'published'),
(40, 40, 1, 'Tailwind CSS Praktis', 'Styling cepat dan konsisten.', 150000, 50, 'beginner', 'tail.jpg', 'published'),
(41, 41, 1, 'Redis & Caching Strategy', 'Percepat aplikasi dengan caching.', 250000, 0, 'advanced', 'redis.jpg', 'published'),
(42, 42, 1, 'Kubernetes untuk Pemula', 'Orkestrasi container dasar.', 300000, 25, 'intermediate', 'k8s.jpg', 'published'),
(43, 43, 1, 'Flutter Dasar', 'Aplikasi mobile cross-platform.', 275000, 0, 'beginner', 'flutter.jpg', 'published'),
(44, 44, 2, 'Excel ke Python untuk Analis', 'Otomasi laporan dari spreadsheet.', 200000, 25, 'intermediate', 'xpy.jpg', 'published'),
(45, 45, 3, 'Portofolio UI/UX yang Dilirik Recruiter', 'Studi kasus dan presentasi portofolio.', 250000, 50, 'intermediate', 'porto.jpg', 'published'),
(46, 46, 4, 'Growth Marketing & Funnel', 'AARRR dan eksperimen growth.', 300000, 0, 'advanced', 'growth.jpg', 'published'),
(47, 47, 5, 'Negosiasi & Leadership', 'Memimpin tim dan negosiasi efektif.', 275000, 25, 'intermediate', 'lead.jpg', 'published'),
(48, 48, 6, 'Mindfulness & Work-Life Balance', 'Kelola stres dan fokus kerja.', 150000, 0, 'beginner', 'mind.jpg', 'published'),
(49, 49, 5, 'Persiapan Interview Big 4', 'Simulasi case study dan technical.', 250000, 50, 'intermediate', 'intv.jpg', 'published'),
(50, 50, 1, 'Realtime App dengan Socket.IO', 'Chat dan notifikasi realtime dengan Node.js.', 275000, 25, 'intermediate', 'socket.jpg', 'draft');

-- Kelas gratis (Rp 0)
UPDATE classes SET price = 0, discount_percent = 0 WHERE class_id IN (19, 24, 30, 32, 40, 48);

INSERT INTO modules (module_id, class_id, module_title, sequence) VALUES
(1, 3, 'Introduction to UX Design', 1),
(2, 3, 'Universal & Inclusive Design', 2),
(3, 1, 'Pengenalan Node.js', 1);

INSERT INTO materials (material_id, module_id, material_type, title, content, video_url, duration, sequence) VALUES
(1, 1, 'video', 'The basics of user experience design', NULL, 'https://youtube.com/watch?v=ux001', 12, 1),
(2, 1, 'video', 'Jobs in the field of user experience', NULL, 'https://youtube.com/watch?v=ux002', 12, 2),
(3, 1, 'rangkuman', 'Ringkasan UX Foundations', 'Desain UX fokus pada interaksi...', NULL, NULL, 3),
(4, 1, 'quiz', 'Ujian Akhir: UX Foundations', '{"q1":"UX adalah..."}', NULL, NULL, 4),
(5, 3, 'video', 'Instalasi Node.js', NULL, 'https://youtube.com/watch?v=node01', 12, 1);

-- Demo transaksi: Budi beli 2 kelas (lunas) + 1 kelas (pending)
INSERT INTO orders (order_id, user_id, total_price, admin_fee, status) VALUES
(1, 1, 182000, 7000, 'paid'),
(2, 1, 257000, 7000, 'pending');

INSERT INTO order_details (order_detail_id, order_id, class_id, price) VALUES
(1, 1, 1, 75000), (2, 1, 2, 100000), (3, 2, 3, 250000);

INSERT INTO payments (payment_id, order_id, payment_method, payment_provider, status, amount, proof_url, paid_at) VALUES
(1, 1, 'ewallet', 'Dana', 'success', 182000, NULL, '2026-08-13 10:00:00'),
(2, 2, 'bank_transfer', 'BCA', 'pending', 257000, NULL, NULL);

INSERT INTO enrollments (user_id, class_id, order_id, progress, status) VALUES
(1, 1, 1, 25, 'active'), (1, 2, 1, 0, 'active');

INSERT INTO pretests (user_id, class_id, score, total_questions, correct_answers, taken_at) VALUES
(1, 3, 70, 10, 7, '2026-08-13 09:30:00');

INSERT INTO reviews (user_id, class_id, rating, comment) VALUES
(1, 3, 3.5, 'Materi enak dipahami, tutor asik!');


CREATE OR REPLACE VIEW v_course_cards AS
SELECT c.class_id, c.title, c.thumbnail, c.price, c.discount_percent,
       c.level, c.status, c.created_at,
       t.name AS tutor_name, t.title AS tutor_title,
       cat.category_name,
       IFNULL(r.avg_rating, 0)   AS avg_rating,
       IFNULL(r.total_review, 0) AS total_review
FROM classes c
JOIN tutors t       ON t.tutor_id = c.tutor_id
JOIN categories cat ON cat.category_id = c.category_id
LEFT JOIN (
  SELECT class_id, AVG(rating) AS avg_rating, COUNT(*) AS total_review
  FROM reviews GROUP BY class_id
) r ON r.class_id = c.class_id
WHERE c.deleted_at IS NULL;

CREATE USER IF NOT EXISTS 'edu_app'@'localhost' IDENTIFIED BY 'EduApp#2026!';
GRANT SELECT, INSERT, UPDATE, DELETE ON edu_course.* TO 'edu_app'@'localhost';
FLUSH PRIVILEGES;