
<?php
session_start();
if(isset($_SESSION['user'])){
    header('Location: index.php');
    exit;
}

$pdo = new PDO("mysql:host=localhost;dbname=app;charset=utf8","root","");
$error="";

if($_SERVER['REQUEST_METHOD']==='POST'){
    $stmt=$pdo->prepare("SELECT * FROM users WHERE login=?");
    $stmt->execute([$_POST['login']]);
    $user=$stmt->fetch();

    if($user && password_verify($_POST['password'],$user['password'])){
        $_SESSION['user']=$user['login'];
        header('Location: index.php');
        exit;
    } else {
        $error="Неверный логин или пароль";
    }
}
?>

<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ОмАЭиП</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;500;700&display=swap" rel="stylesheet">

<style>
*{margin:0;padding:0;box-sizing:border-box;font-family:'Montserrat',sans-serif;}
body{overflow:hidden;background:#0b1510;color:#fff;}

.container{display:flex;height:100vh;}

/* LEFT PANEL */
.left{
  width:35%;
  background:linear-gradient(180deg,#1c2d20,#0f1a13);
  padding:60px;
  display:flex;
  flex-direction:column;
  justify-content:center;
}

.left h1{font-size:42px;margin-bottom:10px;}
.left p{opacity:.7;margin-bottom:30px;}

.btn{
  padding:12px;
  background:#2e5d3a;
  border:none;
  color:#fff;
  border-radius:8px;
  cursor:pointer;
  transition:.3s;
}
.btn:hover{transform:translateX(6px);background:#3f7d4f;}

/* RIGHT SCROLL */
.right{
  width:65%;
  overflow-y:auto;
  height:100vh;
  scroll-behavior:smooth;
}

.hero{
  height:100vh;
  background:url('https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?q=80&w=1174&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D') center/cover;
  display:flex;
  justify-content:center;
  align-items:center;
  position:relative;
}

.login-card{
  background:#fff;
  color:#000;
  padding:30px;
  border-radius:16px;
  text-align:center;
  box-shadow:0 20px 60px rgba(0,0,0,0.6);
  transition:.4s;
}

.login-card:hover{transform:scale(1.05) translateY(-10px);} 

.login-card img{width:140px;border-radius:10px;margin-bottom:15px;}

.login-card button{
  background:#2f5d3a;
  color:#fff;
  border:none;
  padding:10px 20px;
  border-radius:6px;
  cursor:pointer;
  transition:.3s;
}
.login-card button:hover{background:#24492d;}

/* FEATURES */
.features{
  padding:60px;
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(250px,1fr));
  gap:20px;
  background:#0e1a12;
}

.feature{
  background:#18261c;
  padding:25px;
  border-radius:12px;
  transition:.3s;
}

.feature:hover{
  transform:translateY(-8px);
  background:#213628;
}

.feature h3{color:#7fd18b;margin-bottom:10px;}


@keyframes fall{
  to{
    transform:translateY(110vh) rotate(360deg);
  }
}
</style>
</head>
<body>

<div class="container">

<div class="left">
<h1>ОмАЭиП</h1>
<p>Платформа для кураторов</p>
</div>

<div class="right">

<section class="hero">
<form class="login-card" method="POST">
<img src="https://avatars.mds.yandex.net/get-altay/10385418/2a0000018d8d2e936030b1f7fe1aa0575f3b/M_height">

<?php if($error): ?><div style="color:red;margin-bottom:10px"><?= $error ?></div><?php endif; ?>

<input name="login" placeholder="Логин" required style="margin:10px 0;padding:10px;width:100%">
<input type="password" name="password" placeholder="Пароль" required style="margin:10px 0;padding:10px;width:100%">

<button>Войти</button>
</form>
</section>

<section class="features">
<div class="feature"><h3>Отчетность</h3><p>Формирование отчетов</p></div>
<div class="feature"><h3>Успеваемость</h3><p>Контроль оценок</p></div>
<div class="feature"><h3>Мероприятия</h3><p>Учет активности</p></div>
<div class="feature"><h3>Аналитика</h3><p>Статистика и графики</p></div>
</section>

</div>
</div>

<script>
// листья
for(let i=0;i<15;i++){
 let leaf=document.createElement('div');
 leaf.className='leaf';
 leaf.style.left=Math.random()*100+'vw';
 leaf.style.animationDuration=(5+Math.random()*10)+'s';
 document.body.appendChild(leaf);
}
</script>

</body>
</html>
