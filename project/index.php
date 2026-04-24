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
body{
  margin:0;
  font-family:Montserrat;
  color:#fff;
  display:flex;
  background:url('https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1600') center/cover fixed;
}

/* затемнение + глубина */
body::before{
  content:"";
  position:fixed;
  inset:0;
  background:rgba(10,20,14,0.75);
  backdrop-filter:blur(4px);
  z-index:-1;
}

.sidebar{
 width:240px;background:#1c2d20;padding:20px;
}

.sidebar button{
 width:100%;margin:10px 0;padding:12px;
 background:#fff;border:none;border-radius:8px;
 cursor:pointer;transition:.3s;
}
.sidebar button:hover{background:#d4ffd8;}

.main{flex:1;padding:30px;}

/* SEARCH */
.search{
 width:100%;padding:12px;border-radius:10px;border:none;
 margin-bottom:20px;
}

/* TABLE UI */
.table-container{
 background:#fff;
 border-radius:16px;
 overflow:hidden;
 box-shadow:0 10px 40px rgba(0,0,0,0.3);
}

table{
 width:100%;
 border-collapse:collapse;
 color:#000;
}

thead{
 background:#f5f5f5;
 position:sticky;
 top:0;
}

th{
 text-align:left;
 padding:15px;
 font-weight:600;
}

td{
 padding:15px;}

.table-container{
 background:rgba(255,255,255,0.95);
 border-radius:16px;
 overflow:hidden;
 box-shadow:0 20px 60px rgba(0,0,0,0.5);
 backdrop-filter:blur(10px);
}

/* строки */
tr{
 transition:.25s;
}

tr:hover{
 background:#dfffe5;
 transform:scale(1.01);
}

/* заголовок */
thead{
 background:#f1f5f2;
 font-weight:600;
}

.actions button{
 margin-right:5px;
 border:none;
 padding:6px 10px;
 border-radius:6px;
 cursor:pointer;
}

.delete{background:#ff6b6b;color:#fff;}
.edit{background:#6bcf7f;color:#fff;}

/* MODAL */
.modal{
 position:fixed;
 inset:0;
 background:rgba(0,0,0,0.6);
 display:none;
 justify-content:center;
 align-items:center;
}

.modal.active{display:flex;}

.modal{
 position:fixed;
 inset:0;
 background:rgba(0,0,0,0.7);
 backdrop-filter:blur(8px);

 display:none;
 justify-content:center;
 align-items:center;
}

.modal-box{
 background:#fff;
 padding:25px;
 border-radius:14px;
 width:320px;

 animation:fadeUp .3s ease;
}

@keyframes fadeUp{
 from{opacity:0; transform:translateY(30px);}
 to{opacity:1; transform:translateY(0);}
}
.pagination{
 display:flex;
 gap:10px;
 margin-top:25px;
}

.pagination a{
 padding:10px 14px;
 border-radius:10px;
 background:rgba(255,255,255,0.15);
 color:#fff;
 text-decoration:none;
 transition:.3s;
}

.pagination a:hover{
 background:#6bcf7f;
 color:#000;
}

.pagination a.active{
 background:#6bcf7f;
 color:#000;
 box-shadow:0 0 15px rgba(107,207,127,0.6);
}
body::after{
 content:"";
 position:fixed;
 inset:0;
 background:url('https://grainy-gradients.vercel.app/noise.svg');
 opacity:.07;
 pointer-events:none;
}

</style>
</head>
<body>

<div class="sidebar">
<h3><?= $_SESSION['user'] ?></h3>

<button onclick="openModal()">Добавить студента</button>
<a href="login.php"><button>Главная</button></a>
<a href="logout.php"><button>Выйти</button></a>
</div>

<div class="main">

<input class="search" placeholder="Поиск..." onkeyup="searchTable(this.value)">

<div class="table-container">
<table id="table">
<thead>
<tr>
<th>ID</th><th>Имя</th><th>Группа</th><th>Оценка</th><th></th>
</tr>
</thead>

<tbody>
<?php foreach($students as $s): ?>
<tr>
<td><?= $s['id'] ?></td>
<td><?= $s['name'] ?></td>
<td><?= $s['group_name'] ?></td>
<td><?= $s['grade'] ?></td>
<td class="actions">
<a href="?delete=<?= $s['id'] ?>"><button class="delete">Удалить</button></a>
<button class="edit" onclick="edit(<?= $s['id'] ?>,'<?= $s['name'] ?>','<?= $s['group_name'] ?>','<?= $s['grade'] ?>')">Ред</button>
</td>
</tr>
<?php endforeach; ?>
</tbody>

</table>
</div>

</div>

<!-- MODAL -->
<div class="modal" id="modal">
<div class="modal-box">

<form method="POST">
<input type="hidden" name="id" id="id">

<input name="name" id="name" placeholder="Имя"><br><br>
<input name="group" id="group" placeholder="Группа"><br><br>
<input name="grade" id="grade" placeholder="Оценка"><br><br>

<button name="add" id="addBtn">Добавить</button>
<button name="edit" id="editBtn" style="display:none;">Сохранить</button>
</form>

</div>
</div>

<script>
function openModal(){
 document.getElementById('modal').classList.add('active');
}

function edit(id,name,group,grade){
 openModal();
 document.getElementById('id').value=id;
 document.getElementById('name').value=name;
 document.getElementById('group').value=group;
 document.getElementById('grade').value=grade;
 document.getElementById('addBtn').style.display='none';
 document.getElementById('editBtn').style.display='block';
}

function searchTable(value){
 let rows=document.querySelectorAll('#table tbody tr');
 value=value.toLowerCase();

 rows.forEach(row=>{
  row.style.display=row.innerText.toLowerCase().includes(value)?'':'none';
 });
}
</script>

</body>
</html>