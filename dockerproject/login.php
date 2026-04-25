<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Куратор.План — Вход</title>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;500;700&display=swap" rel="stylesheet">
    <style>
        body{margin:0;font-family:Montserrat;overflow:hidden}
        .wrapper{display:flex;height:100vh}
        .left{width:40%;background:#0c1f16;color:#fff;padding:60px;display:flex;flex-direction:column;justify-content:center}
        .left h1{font-size:42px}
        .right{width:60%;position:relative}
        video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:brightness(0.85)}
        .blur{position:absolute;inset:0;backdrop-filter:blur(0px);transition:.3s}
        .card{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;padding:30px;border-radius:20px;width:320px}
        .group{margin-top:20px;position:relative}
        input{width:100%;padding:14px;border:none;background:#eee;border-radius:10px}
        label{position:absolute;left:14px;top:14px;transition:.3s;color:#666}
        input:focus+label, input:not(:placeholder-shown)+label{top:-8px;font-size:12px;background:#fff;padding:0 5px}
        .btn{margin-top:15px;width:100%;padding:14px;border:none;background:#6bcf7f;border-radius:12px;cursor:pointer}
    </style>
</head>
<body>
<div class="wrapper">
    <div class="left">
        <h1>Куратор.План</h1>
        <p>Автоматизация воспитательной работы</p>
    </div>
    <div class="right">
        <video autoplay muted loop>
            <source src="video/forest.mp4" type="video/mp4">
        </video>
        <div class="blur" id="blur"></div>
        <div class="card">
            <h2>Вход</h2>
            <div class="group">
                <input id="login" placeholder=" ">
                <label>Логин</label>
            </div>
            <div class="group">
                <input id="password" type="password" placeholder=" ">
                <label>Пароль</label>
            </div>
            <button class="btn" onclick="login()">Войти</button>
        </div>
    </div>
</div>
<script>
const blur = document.getElementById('blur');
document.querySelectorAll('input').forEach(i => {
    i.addEventListener('focus', () => blur.style.backdropFilter = 'blur(20px)');
    i.addEventListener('blur', () => {
        setTimeout(() => {
            if (!document.activeElement || !document.activeElement.matches('input'))
                blur.style.backdropFilter = 'blur(0px)';
        }, 0);
    });
});
async function login() {
    const login = document.getElementById('login').value.trim();
    const password = document.getElementById('password').value;
    try {
        const res = await fetch('api.php?action=login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({login, password})
        });
        const text = await res.text();
        alert('Ответ сервера:\n' + text);
        const data = JSON.parse(text);
        if (data.token) {
            localStorage.setItem('token', data.token);
            location = 'dashboard.php';
        } else {
            alert('Ошибка входа: ' + JSON.stringify(data.debug || data.error));
        }
    } catch(e) {
        alert('Сервер недоступен: ' + e.message);
    }
}
</script>
</body>
</html>