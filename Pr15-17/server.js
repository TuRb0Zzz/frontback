const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const webpush = require('web-push');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const vapidKeys = {
    publicKey: 'BJP0Sl52L3llJiO9cay13rL22fsKqVMctsphWZ7xTcyzZ52BVehW-fe5ewLdmIeiOX7ZtIQKUBy230tzw2m4tNo',
    privateKey: 'JnndQEeLrslP7IpOnyP9vC88KtrxwO6t3oNDuiq_5jk'
};

webpush.setVapidDetails(
    'mailto:your-email@example.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, './')));

let subscriptions = [];
const reminders = new Map();

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log('Клиент подключён:', socket.id);

    socket.on('newTask', (task) => {
        console.log('Новая задача:', task);
        io.emit('taskAdded', task);
        
        const payload = JSON.stringify({
            title: 'Новая заметка',
            body: task.text
        });
        
        subscriptions.forEach(sub => {
            webpush.sendNotification(sub, payload).catch(err => {
                console.error('Push error:', err);
            });
        });
    });

    socket.on('newReminder', (reminder) => {
        console.log('Новое напоминание:', reminder);
        const { id, text, reminderTime } = reminder;
        const delay = reminderTime - Date.now();
        
        if (delay <= 0) return;
        
        const timeoutId = setTimeout(() => {
            const payload = JSON.stringify({
                title: 'Напоминание',
                body: text,
                reminderId: id
            });
            
            subscriptions.forEach(sub => {
                webpush.sendNotification(sub, payload).catch(err => {
                    console.error('Push error:', err);
                });
            });
            
            reminders.delete(id);
        }, delay);
        
        reminders.set(id, { timeoutId, text, reminderTime });
    });

    socket.on('disconnect', () => {
        console.log('Клиент отключён:', socket.id);
    });
});

app.post('/subscribe', (req, res) => {
    subscriptions.push(req.body);
    console.log('Новая подписка, всего:', subscriptions.length);
    res.status(201).json({ message: 'Подписка сохранена' });
});

app.post('/unsubscribe', (req, res) => {
    const { endpoint } = req.body;
    subscriptions = subscriptions.filter(sub => sub.endpoint !== endpoint);
    console.log('Подписка удалена, осталось:', subscriptions.length);
    res.status(200).json({ message: 'Подписка удалена' });
});

app.post('/snooze', (req, res) => {
    const reminderId = parseInt(req.query.reminderId, 10);
    
    if (!reminderId || !reminders.has(reminderId)) {
        return res.status(400).json({ error: 'Напоминание не найдено' });
    }
    
    const reminder = reminders.get(reminderId);
    clearTimeout(reminder.timeoutId);
    
    const newDelay = 5 * 60 * 1000;
    const newReminderTime = Date.now() + newDelay;
    
    const newTimeoutId = setTimeout(() => {
        const payload = JSON.stringify({
            title: 'Напоминание (отложено)',
            body: reminder.text,
            reminderId: reminderId
        });
        
        subscriptions.forEach(sub => {
            webpush.sendNotification(sub, payload).catch(err => {
                console.error('Push error:', err);
            });
        });
        
        reminders.delete(reminderId);
    }, newDelay);
    
    reminders.set(reminderId, {
        timeoutId: newTimeoutId,
        text: reminder.text,
        reminderTime: newReminderTime
    });
    
    res.status(200).json({ 
        message: 'Напоминание отложено на 5 минут',
        reminderId: reminderId,
        newReminderTime: newReminderTime
    });
});

app.get('/get-reminders', (req, res) => {
    const remindersObj = {};
    reminders.forEach((value, key) => {
        remindersObj[key] = value.reminderTime;
    });
    res.json(remindersObj);
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});