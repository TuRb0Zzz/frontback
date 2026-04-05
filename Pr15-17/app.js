const socket = io('http://localhost:3001');
const STORAGE_KEY = 'notes';
const VAPID_PUBLIC_KEY = 'BJP0Sl52L3llJiO9cay13rL22fsKqVMctsphWZ7xTcyzZ52BVehW-fe5ewLdmIeiOX7ZtIQKUBy230tzw2m4tNo';

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

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
            <h2>Новая заметка</h2>
            <form id="note-form" class="form-group">
                <input type="text" id="note-input" placeholder="Введите заметку" required>
                
                <div class="checkbox-group">
                    <input type="checkbox" id="enable-reminder">
                    <label for="enable-reminder">Установить напоминание</label>
                </div>
                
                <div id="reminder-fields" style="display: none;">
                    <input type="datetime-local" id="reminder-time">
                </div>
                
                <button type="submit" class="btn-primary">Добавить</button>
            </form>
            
            <h2>Список заметок</h2>
            <ul id="notes-list"></ul>
        </div>
    `;
    
    const checkbox = document.getElementById('enable-reminder');
    const reminderFields = document.getElementById('reminder-fields');
    
    if (checkbox && reminderFields) {
        checkbox.addEventListener('change', (e) => {
            reminderFields.style.display = e.target.checked ? 'block' : 'none';
        });
    }
    
    initNotes();
}

function showAbout() {
    const contentDiv = document.getElementById('app-content');
    if (!contentDiv) return;
    
    contentDiv.innerHTML = `
        <div class="about-content">
            <h2>О приложении</h2>
            <p>Версия 2.0.0</p>
            <p>Заметки с напоминаниями</p>
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

function renderNotesList() {
    const list = document.getElementById('notes-list');
    if (!list) return;
    
    const notes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    
    if (notes.length === 0) {
        list.innerHTML = '<div class="empty-message">Нет заметок</div>';
        return;
    }
    
    list.innerHTML = notes.map((note, index) => {
        let reminderHtml = '';
        if (note.reminder) {
            const date = new Date(note.reminder);
            reminderHtml = `<small class="note-reminder">Напоминание: ${date.toLocaleString()}</small>`;
        }
        return `
            <li class="note-item" data-id="${note.id}">
                <span class="note-text">${escapeHtml(note.text)}</span>
                ${reminderHtml}
                <button class="delete-btn" data-index="${index}">Удалить</button>
            </li>
        `;
    }).join('');
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(btn.dataset.index);
            const notesArr = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            notesArr.splice(index, 1);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(notesArr));
            renderNotesList();
        });
    });
}

function initNotes() {
    const form = document.getElementById('note-form');
    const input = document.getElementById('note-input');
    const checkbox = document.getElementById('enable-reminder');
    const reminderTime = document.getElementById('reminder-time');
    
    let nextId = Date.now();
    
    function addNote(text, reminderTimeMs = null) {
        if (!text.trim()) return;
        
        const notes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const newNote = {
            id: nextId++,
            text: text.trim(),
            reminder: reminderTimeMs
        };
        notes.push(newNote);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
        renderNotesList();
        
        socket.emit('newTask', { text: text.trim(), timestamp: new Date().toISOString() });
        
        if (reminderTimeMs) {
            socket.emit('newReminder', {
                id: newNote.id,
                text: text.trim(),
                reminderTime: reminderTimeMs
            });
            showNotification(`Напоминание установлено на ${new Date(reminderTimeMs).toLocaleString()}`);
        }
    }
    
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = input.value.trim();
            
            if (text) {
                let reminderTimeMs = null;
                
                if (checkbox && checkbox.checked) {
                    const timeStr = reminderTime.value;
                    if (timeStr) {
                        reminderTimeMs = new Date(timeStr).getTime();
                        if (reminderTimeMs <= Date.now()) {
                            showNotification('Время напоминания должно быть в будущем');
                            return;
                        }
                    } else {
                        showNotification('Выберите время напоминания');
                        return;
                    }
                }
                
                addNote(text, reminderTimeMs);
                input.value = '';
                if (checkbox) checkbox.checked = false;
                if (reminderTime) reminderTime.value = '';
                const reminderFields = document.getElementById('reminder-fields');
                if (reminderFields) reminderFields.style.display = 'none';
                input.focus();
            }
        });
    }
    
    renderNotesList();
}

socket.on('taskAdded', (task) => {
    console.log('Новая задача от другого клиента:', task);
    showNotification(`Новая заметка: ${task.text}`);
    
    const notes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const exists = notes.some(note => note.text === task.text);
    if (!exists && task.text) {
        const newNote = {
            id: Date.now(),
            text: task.text,
            reminder: null
        };
        notes.push(newNote);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
        renderNotesList();
    }
});

if (navigator.serviceWorker) {
    navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SNOOZE_REMINDER') {
            const { reminderId } = event.data;
            
            const notes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            const noteIndex = notes.findIndex(note => note.id === reminderId);
            
            if (noteIndex !== -1) {
                const currentTime = notes[noteIndex].reminder;
                const newTime = currentTime + (5 * 60 * 1000);
                notes[noteIndex].reminder = newTime;
                localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
                
                renderNotesList();
                showNotification(`Напоминание отложено на 5 минут. Новое время: ${new Date(newTime).toLocaleString()}`);
            }
        }
    });
}

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
                console.log('Service Worker зарегистрирован');
                const subscription = await registration.pushManager.getSubscription();
                if (subscription && enableBtn && disableBtn) {
                    enableBtn.style.display = 'none';
                    disableBtn.style.display = 'inline-block';
                }
            })
            .catch((err) => console.error('Ошибка регистрации SW:', err));
    }
    
    showHome();
});