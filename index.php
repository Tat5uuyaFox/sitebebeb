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
<title>Кабинет</title>
<style>
body{margin:0;display:flex;font-family:Montserrat;background:#6f9775;color:#fff;}

.sidebar{width:260px;background:#4d6a52;padding:30px;}
.sidebar button{display:block;width:100%;margin:10px 0;padding:10px;background:#fff;color:#4d6a52;border:none;cursor:pointer;}

.main{flex:1;padding:40px;}
.section{display:none;}
.section.active{display:block;}

.card{background:#fff;color:#000;padding:20px;border-radius:10px;margin:10px 0;}
</style>
</head>
<body>

<div class="sidebar">
<h2>Меню</h2>
<button onclick="show('reports')">Отчетность</button>
<button onclick="show('students')">Успеваемость</button>
<button onclick="show('events')">Мероприятия</button>
<a href="logout.php"><button>Выйти</button></a>
</div>

<div class="main">
<h1>Добро пожаловать, <?= $_SESSION['user'] ?></h1>

<div id="reports" class="section active">
<div class="card">Создание отчетов</div>
</div>

<div id="students" class="section">
<div class="card">Список студентов</div>
</div>

<div id="events" class="section">
<div class="card">Список мероприятий</div>
</div>

</div>

<script>
function show(id){
 document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
 document.getElementById(id).classList.add('active');
}
</script>

</body>
</html>
