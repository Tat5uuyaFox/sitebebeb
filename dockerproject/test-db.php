<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
try {
    $pdo = new PDO("mysql:host=db;dbname=app;charset=utf8mb4", "root", "root");
    echo "OK: connected to DB<br>";
    $users = $pdo->query("SELECT login FROM users")->fetchAll(PDO::FETCH_ASSOC);
    echo "Users found: " . count($users) . "<br>";
    foreach ($users as $u) echo $u['login'] . "<br>";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}