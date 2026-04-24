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
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&display=swap" rel="stylesheet">

<style>
*{margin:0;padding:0;box-sizing:border-box;font-family:Montserrat;}

body{background:#0b1510;color:#fff;overflow:hidden;}

.container{display:flex;height:100vh;}

/* LEFT */
.left{
 width:40%;
 background:linear-gradient(160deg,#6f9775,#4d6a52);
 padding:60px;
 position:relative;
 display:flex;
 flex-direction:column;
 justify-content:center;
}

.left h1{
 font-size:70px;
 font-weight:900;
 animation:fadeUp 1s ease forwards;
}

.left p{
 font-size:48px;
 font-weight:800;
 margin-top:20px;
 opacity:0;
 animation:fadeUp 1.5s ease forwards;
}

.nav{
 position:absolute;
 top:20px;
 left:50%;
 transform:translateX(-50%);
 background:rgba(255,255,255,0.9);
 backdrop-filter:blur(10px);
 border-radius:40px;
 padding:10px 25px;
 color:#333;
 display:flex;
 gap:20px;
}

.nav a{cursor:pointer;transition:.3s;}
.nav a:hover{color:#6f9775;}

/* RIGHT */
.right{
 width:60%;
 overflow-y:auto;
 scroll-behavior:smooth;
}

.hero{
 height:100vh;
 background:url('https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1600') center/cover;
 display:flex;
 justify-content:center;
 align-items:center;
 position:relative;
}

.hero::after{
 content:"";
 position:absolute;
 inset:0;
 background:rgba(0,0,0,0.25);
}

.card{
 position:relative;
 background:rgba(255,255,255,0.95);
 backdrop-filter:blur(20px);
 border-radius:20px;
 padding:25px;
 text-align:center;
 box-shadow:0 30px 80px rgba(0,0,0,0.7);
 transform:translateY(40px);
 opacity:0;
 animation:fadeUp 1s ease forwards;
}

.card:hover{
 transform:translateY(-10px) scale(1.05);
}

.card img{
 width:260px;
 border-radius:14px;
}

.card button{
 margin-top:20px;
 font-size:28px;
 font-weight:700;
 background:none;
 border:none;
 color:#4d6a52;
 cursor:pointer;
 position:relative;
}

.card button::after{
 content:"";
 position:absolute;
 left:0;bottom:-5px;
 width:0;height:3px;
 background:#4d6a52;
 transition:.3s;
}

.card button:hover::after{width:100%;}

/* FEATURES */
.features{
 background:#5a6f3b;
 padding:80px;
}

.features h2{
 font-size:42px;
 margin-bottom:40px;
}

.item{
 display:flex;
 justify-content:space-between;
 align-items:center;
 margin:40px 0;
 border-top:1px dashed rgba(255,255,255,0.3);
 padding-top:20px;
 opacity:0;
 transform:translateY(40px);
 transition:1s;
}

.item.visible{
 opacity:1;
 transform:translateY(0);
}

.item span{
 font-size:70px;
 opacity:.3;
}

/* mountains */
.mountains{
 height:200px;
 background:#e6dfcf;
 clip-path:polygon(0 60%,10% 50%,20% 55%,30% 40%,40% 45%,50% 35%,60% 50%,70% 45%,80% 55%,90% 40%,100% 60%,100% 100%,0 100%);
}

/* grain overlay */
body::before{
 content:"";
 position:fixed;
 inset:0;
 background:url('https://grainy-gradients.vercel.app/noise.svg');
 opacity:.08;
 pointer-events:none;
}

/* animations */
@keyframes fadeUp{
 from{opacity:0;transform:translateY(40px);} 
 to{opacity:1;transform:translateY(0);} 
}

</style>
</head>
<body>

<div class="container">

<div class="left">
<div class="nav"><a>Главная</a><a>О нас</a><a>Вход</a></div>
<h1>ОмАЭиП</h1>
<p>Платформа для кураторов</p>
</div>

<div class="right">

<section class="hero">
<form class="card" method="POST">
<img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=400">

<?php if($error): ?><div style="color:red"><?= $error ?></div><?php endif; ?>

<input name="login" placeholder="Логин" required style="margin:10px 0;padding:10px;width:100%">
<input type="password" name="password" placeholder="Пароль" required style="margin:10px 0;padding:10px;width:100%">

<button>Войти</button>
</form>
</section>

<section class="features">
<h2>Новые возможности</h2>

<div class="item"> <span>01</span> Отслеживание мероприятий </div>
<div class="item"> <span>02</span> Формирование отчетности </div>

</section>

<div class="mountains"></div>

</div>
</div>

<script>
// появление блоков
const items=document.querySelectorAll('.item');
const obs=new IntersectionObserver(entries=>{
 entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible');});
});
items.forEach(i=>obs.observe(i));

// параллакс
window.addEventListener('scroll',()=>{
 let y=window.scrollY;
 document.querySelector('.hero').style.backgroundPosition=`center ${y*0.3}px`;
});
</script>

</body>
</html>
