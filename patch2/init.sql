DROP TABLE IF EXISTS plan_rows, plans, social_passports, events, templates, reports, full_reports, action_logs, users;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    login VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('curator', 'organizer', 'admin') DEFAULT 'curator',
    full_name VARCHAR(100),
    email VARCHAR(100),
    dnevnik_token VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO users (login, password, role, full_name) VALUES
('curator', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'curator', 'Иван Петров'),
('organizer', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'organizer', 'Мария Орг'),
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'Админ Системы');

CREATE TABLE plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    group_name VARCHAR(20),
    year VARCHAR(9),
    description TEXT,
    goals TEXT,
    status ENUM('draft', 'ready', 'submitted') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE plan_rows (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plan_id INT NOT NULL,
    module VARCHAR(200),
    deadline VARCHAR(50),
    responsible VARCHAR(50),
    participants VARCHAR(100),
    direction VARCHAR(50),
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200),
    date DATE,
    status ENUM('planned', 'conducted', 'postponed', 'cancelled') DEFAULT 'planned',
    direction VARCHAR(50),
    participants INT DEFAULT 0,
    success ENUM('good','bad','neutral') DEFAULT 'neutral',
    comment TEXT,
    user_id INT,
    plan_row_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_row_id) REFERENCES plan_rows(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE social_passports (
    user_id INT PRIMARY KEY,
    content TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200),
    module VARCHAR(100),
    date DATE,
    responsible VARCHAR(100),
    direction VARCHAR(50),
    user VARCHAR(50),
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE full_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    period VARCHAR(9),
    self_analysis TEXT,
    group_evaluation TEXT,
    success_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_report (user_id, period),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE action_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Демо-план куратора (корректный русский текст)
INSERT INTO plans (user_id, group_name, year, description, goals, status) VALUES
(1, 'ПО-41', '2025-2026', 'Цель: всестороннее развитие личности', 'Основные направления: гражданское, патриотическое, физическое', 'draft');

INSERT INTO plan_rows (plan_id, module, deadline, responsible, participants, direction) VALUES
(1, 'Кураторский час «Права и обязанности»', '2025-09-05', 'curator', '25', 'Гражданское'),
(1, 'Спортивный праздник', '2025-10-20', 'curator', '50', 'Физическое'),
(1, 'Экологическая акция', '2026-04-15', 'curator', '30', 'Экологическое');

INSERT INTO events (title, date, status, direction, participants, user_id, plan_row_id) VALUES
('Кураторский час «Права и обязанности»', '2025-09-05', 'planned', 'Гражданское', 25, 1, 1),
('Спортивный праздник', '2025-10-20', 'planned', 'Физическое', 50, 1, 2),
('Экологическая акция', '2026-04-15', 'planned', 'Экологическое', 30, 1, 3);