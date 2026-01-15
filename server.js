const express = require('express');
const cookieParser = require('cookie-parser');
const { createClient } = require('redis');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:8080';

app.use(cookieParser());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const redisClient = createClient({ 
    url: REDIS_URL,
    socket: { reconnectStrategy: (retries) => Math.min(retries * 50, 2000) }
});

redisClient.on('error', (err) => console.error('Redis Client Error:', err));
redisClient.connect().then(() => console.log('Connected to Redis at:', REDIS_URL));

async function checkUserStatus(req, res, next) {
    const sessionToken = req.cookies['session_token'];
    if (!sessionToken) {
        req.userState = { status: 'Unknown' };
        return next();
    }
    try {
        const data = await redisClient.get(sessionToken);
        if (!data) {
            req.userState = { status: 'Unknown' };
        } else {
            req.userState = JSON.parse(data);
            req.sessionToken = sessionToken;
        }
    } catch (err) {
        req.userState = { status: 'Unknown' };
    }
    next();
}

app.get('/', checkUserStatus, (req, res) => {
    if (req.userState.status === 'Authorized') {
        return res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', checkUserStatus, async (req, res) => {
    const { type } = req.query;
    if (!type) return res.redirect('/');

    let sessionToken = req.sessionToken || uuidv4();
    const loginToken = uuidv4();

    const sessionData = { 
        status: 'Anonymous', 
        login_token: loginToken 
    };
    
    try {
        // 1. Сохраняем в Redis
        await redisClient.set(sessionToken, JSON.stringify(sessionData), { EX: 600 });
        
        // 2. Устанавливаем куку
        res.cookie('session_token', sessionToken, { httpOnly: true, path: '/' });

        // 3. Формируем URL и отправляем запрос в Go
        // replace(/\/$/, "") убирает лишний слэш в конце, если он есть в AUTH_SERVICE_URL
        const targetUrl = `${AUTH_SERVICE_URL.replace(/\/$/, "")}/auth/request`;
        console.log(`ATTEMPTING REQUEST TO: ${targetUrl}`);

        const response = await axios.post(targetUrl, 
            new URLSearchParams({
                provider: type,
                login_token: loginToken
            }).toString(), 
            {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            }
        );
        
        console.log("Auth Service response data:", response.data);
        res.json(response.data);

    } catch (err) {
        // Выводим максимум деталей, чтобы понять причину 404
        console.error('Login Error details:', err.response ? err.response.data : err.message);
        res.status(500).json({ 
            error: 'Auth Service Error', 
            details: err.message,
            go_status: err.response ? err.response.status : "No Response"
        });
    }
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Web Client started on http://localhost:${PORT}`);
});