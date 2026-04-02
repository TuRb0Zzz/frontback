const socket = io('http://localhost:3001');

const STORAGE_KEY = 'notes';
const VAPID_PUBLIC_KEY = 'BJP0Sl52L3llJiO9cay13rL22fsKqVMctsphWZ7xTcyzZ52BVehW-fe5ewLdmIeiOX7ZtIQKUBy230tzw2m4tNo';

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

async function subscribeToPush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
        await fetch('http://localhost:3001/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscription)
        });
        console.log('Подписка на push отправлена');
    } catch (err) {
        console.error('Ошибка подписки на push:', err);
    }
}

async function unsubscribeFromPush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
            await fetch('http://localhost:3001/unsubscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ endpoint: subscription.endpoint })
            });
            await subscription.unsubscribe();
            console.log('Отписка выполнена');
        }
    } catch (err) {
        console.error('Ошибка отписки:', err);
    }
}

function setActiveButton(activeId) {
    const homeBtn = document.getElementById('home-btn');
    const aboutBtn = document.getElementById('about-btn');
    if (homeBtn && aboutBtn) {
        homeBtn.classList.remove('active');
        aboutBtn.classList.remove('active');
        const activeBtn = document.getElementById(activeId);
        if (activeBtn) activeBtn.classList.add('active');
    }
}

function showHome() {
    const contentDiv = document.getElementById('app-content');
    if (!contentDiv) return;
    
    contentDiv.innerHTML = `
        <div class="home-content">
            <form id="note-form">
                <input type="text" id="note-input" placeholder="Введите заметку" required>
                <button type="submit">Добавить</button>
            </form>
            <ul id="notes-list"></ul>
        </div>
    `;
    initNotes();
}

function showAbout() {
    const contentDiv = document.getElementById('app-content');
    if (!contentDiv) return;
    
    contentDiv.innerHTML = `
        <div class="about-content">
            <h2>О приложении</h2>
            <p>Заметки с офлайн-доступом</p>
            <p>Создал: Николаев Е.А</p>
        </div>
    `;
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #111;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 1000;
        font-size: 14px;
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

function initNotes() {
    const form = document.getElementById('note-form');
    const input = document.getElementById('note-input');
    const list = document.getElementById('notes-list');
    
    if (!form) return;
    
    function loadNotes() {
        const notes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        
        if (notes.length === 0) {
            list.innerHTML = '<div class="empty-message">Нет заметок</div>';
            return;
        }
        
        list.innerHTML = notes.map((note, index) => `
            <li class="note-item">
                <span class="note-text">${escapeHtml(note)}</span>
                <button class="delete-btn" data-index="${index}">Удалить</button>
            </li>
        `).join('');
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(btn.dataset.index);
                deleteNote(index);
            });
        });
    }
    
    function addNote(text) {
        if (!text.trim()) return;
        
        const notes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        notes.push(text.trim());
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
        loadNotes();
        
        socket.emit('newTask', { text: text.trim(), timestamp: new Date().toISOString() });
    }
    
    function deleteNote(index) {
        const notes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        notes.splice(index, 1);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
        loadNotes();
    }
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (text) {
            addNote(text);
            input.value = '';
            input.focus();
        }
    });
    
    loadNotes();
}

socket.on('taskAdded', (task) => {
    console.log('Новая задача от другого клиента:', task);
    showNotification(`Новая заметка: ${task.text}`);
    
    const notes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const exists = notes.some(note => note === task.text);
    if (!exists && task.text) {
        notes.push(task.text);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
        if (document.getElementById('notes-list')) {
            const list = document.getElementById('notes-list');
            if (list) {
                const currentNotes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
                if (currentNotes.length === 0) {
                    list.innerHTML = '<div class="empty-message">Нет заметок</div>';
                } else {
                    list.innerHTML = currentNotes.map((note, index) => `
                        <li class="note-item">
                            <span class="note-text">${escapeHtml(note)}</span>
                            <button class="delete-btn" data-index="${index}">Удалить</button>
                        </li>
                    `).join('');
                    
                    document.querySelectorAll('.delete-btn').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            const idx = parseInt(btn.dataset.index);
                            const notesArr = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
                            notesArr.splice(idx, 1);
                            localStorage.setItem(STORAGE_KEY, JSON.stringify(notesArr));
                            location.reload();
                        });
                    });
                }
            }
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const homeBtn = document.getElementById('home-btn');
    const aboutBtn = document.getElementById('about-btn');
    const enableBtn = document.getElementById('enable-push');
    const disableBtn = document.getElementById('disable-push');
    
    if (homeBtn) {
        homeBtn.addEventListener('click', () => {
            setActiveButton('home-btn');
            showHome();
        });
    }
    
    if (aboutBtn) {
        aboutBtn.addEventListener('click', () => {
            setActiveButton('about-btn');
            showAbout();
        });
    }
    
    if (enableBtn) {
        enableBtn.addEventListener('click', async () => {
            if (Notification.permission === 'denied') {
                alert('Уведомления запрещены. Разрешите их в настройках браузера.');
                return;
            }
            if (Notification.permission === 'default') {
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') {
                    alert('Необходимо разрешить уведомления.');
                    return;
                }
            }
            await subscribeToPush();
            enableBtn.style.display = 'none';
            disableBtn.style.display = 'inline-block';
        });
    }
    
    if (disableBtn) {
        disableBtn.addEventListener('click', async () => {
            await unsubscribeFromPush();
            disableBtn.style.display = 'none';
            enableBtn.style.display = 'inline-block';
        });
    }
    
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(async (registration) => {
                console.log('Service Worker registered');
                const subscription = await registration.pushManager.getSubscription();
                if (subscription && enableBtn && disableBtn) {
                    enableBtn.style.display = 'none';
                    disableBtn.style.display = 'inline-block';
                }
            })
            .catch((err) => console.error('SW registration failed:', err));
    }
    
    showHome();
});