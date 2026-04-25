<?php
$pdo = new PDO("mysql:host=db;dbname=app;charset=utf8mb4", "root", "root");
$hash = password_hash('curator123', PASSWORD_DEFAULT);
$pdo->exec("UPDATE users SET password = '$hash' WHERE login = 'admin'");
echo "Пароль для admin обновлён. Новый хеш: $hash";