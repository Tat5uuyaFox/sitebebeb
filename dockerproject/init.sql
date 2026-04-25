-- Удаляем старые таблицы (осторожно!)
DROP TABLE IF EXISTS plan_rows, plans, social_passports, events, templates, reports, users;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    login VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('curator', 'organizer', 'admin') DEFAULT 'curator',
    full_name VARCHAR(100),
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Тестовые пользователи (пароль у всех: curator123, password123, admin123)
INSERT INTO users (login, password, role, full_name) VALUES
('curator', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'curator', 'Иван Петров'),
('organizer', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'organizer', 'Мария Организатор'),
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'Админ Системы');

CREATE TABLE plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    group_name VARCHAR(20),
    year VARCHAR(9),
    status ENUM('draft', 'ready', 'submitted') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE plan_rows (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plan_id INT NOT NULL,
    module VARCHAR(100),
    deadline VARCHAR(50),
    responsible VARCHAR(50),
    participants VARCHAR(100),
    direction VARCHAR(50),
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE
);

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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE social_passports (
    user_id INT PRIMARY KEY,
    content TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user VARCHAR(50),
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user VARCHAR(50),
    text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Пример плана для куратора (user_id=1)
INSERT INTO plans (user_id, group_name, year, status) VALUES (1, 'ПО-41', '2025-2026', 'draft');
INSERT INTO plan_rows (plan_id, module, deadline, responsible, participants, direction) VALUES
(1, 'Кураторский час «Права и обязанности»', '05.09.2025', 'Иван Петров', 'ПО-41', 'Гражданское'),
(1, 'Спортивный праздник', '20.10.2025', 'Иван Петров', 'ПО-41', 'Физическое'),
(1, 'Экологическая акция', '15.04.2026', 'Иван Петров', 'ПО-41', 'Экологическое');

-- Несколько мероприятий
INSERT INTO events (title, date, status, direction, participants, user_id) VALUES
('Кураторский час «Права и обязанности»', '2025-09-05', 'planned', 'Гражданское', 25, 1),
('Спортивный праздник', '2025-10-20', 'planned', 'Физическое', 50, 1);