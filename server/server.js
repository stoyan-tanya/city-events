// Налаштування локального Express-сервера для обробки запитів до подій Афіші
const express = require('express');
const app = express();

const events = require('./events.json');

app.use(express.static('..'));

app.get('/api/events', (req, res) => {
    res.json(events);
})

app.get('/api/events/:id', (req, res) => {
    const event = events.find((i) => String(i.id) === req.params.id);
    if (!event) return res.status(404).json({error: 'No such event'});
    res.json(event);
})

app.listen(3000, () => {
    console.log('Сервер запущено на http://localhost:3000 ');
})