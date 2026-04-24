<?php
session_start();

if(isset($_SESSION['user'])){
    header('Location: index.php');
    exit;
}
?>

<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<title>ОмАЭиП</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&display=swap" rel="stylesheet">

<style>
*{margin:0;padding:0;box-sizing:border-box;font-family:Montserrat;}

body{
  margin:0;
  font-family:Montserrat;
  color:#fff;
  display:flex;
  background:url('https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1600') center/cover fixed;
}
body::before{
  content:"";
  position:fixed;
  inset:0;
  background:rgba(10,20,14,0.75);
  backdrop-filter:blur(4px);
  z-index:-1;
}

/* ===== LEFT (фиксированная) ===== */
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
 font-size:42px;
 font-weight:700;
 margin-top:20px;
 opacity:0;
 animation:fadeUp 1.4s ease forwards;
}

/* NAV */
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
.sidebar button{
 width:100%;
 margin:10px 0;
 padding:12px;
 border:none;
 border-radius:10px;

 background:rgba(255,255,255,0.1);
 color:#fff;

 cursor:pointer;
 transition:.3s;
}

.sidebar button:hover{
 background:#6bcf7f;
 color:#000;
 transform:translateX(5px);
}

.nav a{
 cursor:pointer;
 transition:.3s;
 text-decoration:none;
 color:#333;
}

.nav a:hover{
 color:#4d6a52;
}

/* ===== RIGHT (скролл) ===== */
.right{
 width:60%;
 overflow-y:auto;
 scroll-behavior:smooth;
}

/* HERO */
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
 background:rgba(0,0,0,0.35);
}

/* LOGIN CARD */
.card{
 position:relative;
 background:rgba(255,255,255,0.95);
 backdrop-filter:blur(20px);
 border-radius:20px;
 padding:30px;
 text-align:center;
 box-shadow:0 30px 80px rgba(0,0,0,0.7);
 animation:fadeUp 1s ease forwards;
}

.card img{
 width:260px;
 border-radius:14px;
 margin-bottom:15px;
}

.card input{
 width:100%;
 padding:12px;
 margin:8px 0;
 border-radius:8px;
 border:none;
}

.card button{
 margin-top:15px;
 font-size:20px;
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
 left:0;
 bottom:-5px;
 width:0;
 height:3px;
 background:#4d6a52;
 transition:.3s;
}

.card button:hover::after{
 width:100%;
}

/* FEATURES */
.features{
 background:#5a6f3b;
 padding:80px;
}

.features h2{
 font-size:40px;
 margin-bottom:40px;
}

.item{
 display:flex;
 justify-content:space-between;
 align-items:center;
 margin:40px 0;
 opacity:0;
 transform:translateY(40px);
 transition:1s;
}

.item.visible{
 opacity:1;
 transform:translateY(0);
}

.item span{
 font-size:60px;
 opacity:.3;
}

.item img{
 width:140px;
 border-radius:40px;
 transition:.4s;
}

.item:hover img{
 transform:scale(1.1);
}

/* MOUNTAINS */
.mountains{
 height:200px;
 background:#5a6f3b;
}

.mountains svg{
 width:100%;
 height:100%;
}

/* NOISE */
body::after{
 content:"";
 position:fixed;
 inset:0;
 background:url('https://grainy-gradients.vercel.app/noise.svg');
 opacity:.06;
 pointer-events:none;
}

/* ANIM */
@keyframes fadeUp{
 from{opacity:0;transform:translateY(40px);}
 to{opacity:1;transform:translateY(0);}
}
</style>
</head>
<body>

<div class="left">

<div class="nav">
<a href="https://omacademy.ru" target="_blank">О нас</a>
</div>

<h1>ОмАЭиП</h1>
<p>Платформа для кураторов</p>

</div>

<div class="right">

<!-- HERO -->
<section class="hero">
<form class="card" method="POST">

<img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=400">

<?php if($error): ?>
<div style="color:red"><?= $error ?></div>
<?php endif; ?>

<input name="login" placeholder="Логин" required>
<input type="password" name="password" placeholder="Пароль" required>

<button>Войти</button>

</form>
</section>

<!-- FEATURES -->
<section class="features">
<h2>Новые возможности</h2>

<div class="item">
<span>01</span>
<div>Отслеживание мероприятий</div>
<img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400">
</div>

<div class="item">
<span>02</span>
<div>Формирование отчетности</div>
<img src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400">
</div>

</section>

<!-- MOUNTAINS -->
<div class="mountains">
<svg viewBox="0 0 1440 200">
<path d="M0,120 C150,80 300,160 450,120 C600,80 750,140 900,110 C1050,80 1200,150 1440,110 L1440,200 L0,200 Z"
fill="#e6dfcf"></path>
</svg>
</div>

</div>

<script>
// появление блоков
const items=document.querySelectorAll('.item');

const obs=new IntersectionObserver(entries=>{
 entries.forEach(e=>{
  if(e.isIntersecting){
   e.target.classList.add('visible');
  }
 });
});

items.forEach(i=>obs.observe(i));
</script>

</body>
</html>