<?php
session_start();
if(!isset($_SESSION['user'])){
    header('Location: login.php');
    exit;
}
?>

<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<title>Панель</title>
<style>
body{margin:0;display:flex;font-family:Montserrat;background:#0e1a12;color:#fff;}
.sidebar{width:260px;background:#142219;padding:30px;}
.sidebar a{display:block;color:#9fd8a8;margin:10px 0;text-decoration:none;}
.main{flex:1;padding:40px;}
.card{background:#1b2b1f;padding:20px;border-radius:10px;margin-bottom:20px;transition:.3s;}
.card:hover{transform:translateY(-5px);}
</style>
</head>
<body>
<div class="sidebar">
<h2>ОмАЭиП</h2>
<a href="logout.php">Выйти</a>
</div>
<div class="main">
<h1>Добро пожаловать, <?= $_SESSION['user'] ?></h1>
<div class="card">Отчетность</div>
<div class="card">Успеваемость</div>
<div class="card">Мероприятия</div>
</div>
</body>
</html>