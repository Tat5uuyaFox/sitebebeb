/**
 * js/api.js
 * Базовый HTTP-клиент и глобальные переменные приложения.
 * Все модули импортируют отсюда функцию api() и notify().
 */

// ── Редирект на логин, если нет токена ──────────────────────────────────────
const token = localStorage.getItem('token');
if (!token) window.location = 'login.php';

// ── Глобальное состояние (читается другими модулями) ─────────────────────────
let currentRole    = '';
let currentUserId  = 0;
let currentPlanId  = null;
let fullReportData = {};

/**
 * Универсальная обёртка над fetch → api.php.
 * @param {string} action  — значение параметра ?action=
 * @param {string} method  — HTTP-метод (GET / POST)
 * @param {object|null} body — тело запроса (будет сериализовано в JSON)
 * @returns {Promise<any>}
 */
async function api(action, method = 'GET', body = null) {
    const headers = {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
    };
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch('api.php?action=' + action, opts);
    return res.json();
}
