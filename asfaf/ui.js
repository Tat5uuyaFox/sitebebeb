/**
 * js/ui.js
 * Вспомогательные UI-функции: тост, модалки, переключение секций, blur.
 */

// ── Toast-уведомление ─────────────────────────────────────────────────────────
function notify(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2000);
}

// ── Модальные окна ────────────────────────────────────────────────────────────
function openModal(id)  { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

function closeModuleModal()    { closeModal('moduleModal'); }
function closeLibraryModal()   { closeModal('libraryModal'); }
function closeReportModal()    { closeModal('reportModal'); }
function closeDayEventsModal() { closeModal('dayEventsModal'); }

// ── Боковая панель: blur при наведении ───────────────────────────────────────
function setupBlur() {
    document.querySelectorAll('.sidebar-btn').forEach(btn => {
        btn.addEventListener('mouseenter', () =>
            document.getElementById('blurOverlay').classList.add('active'));
        btn.addEventListener('mouseleave', () =>
            document.getElementById('blurOverlay').classList.remove('active'));
    });
}

// ── Переключение секций ───────────────────────────────────────────────────────
function showSection(id) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');

    document.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');

    // Ленивая загрузка секций
    if      (id === 'plan')    loadPlanSection();
    else if (id === 'journal') loadJournalSection();
    else if (id === 'report')  loadReportSection();
    else if (id === 'grades')  loadDnevnikSection();
    else if (id === 'summary') loadSummarySection();
    else if (id === 'admin')   loadAdminSection();
}
