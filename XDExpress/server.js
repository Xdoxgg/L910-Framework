const http = require('http');
const fs = require('fs');
const url = require('url');

const PORT = 3000;

const server = http.createServer((req, res) => {
    const myURL = new URL(req.url, `http://${req.headers.host}`);
    const pathname = myURL.pathname;

    const method = req.method;

    if (method === 'GET' && pathname === '/') {
        fs.readFile('../pages/index.html', 'utf8', (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('Ошибка сервера при чтении файла');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(data);
        });
    } else if (method === 'GET' && pathname === '/api/data') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        const data = { message: "Это ответ API", timestamp: Date.now() };
        res.end(JSON.stringify(data));
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404: Ресурс не найден');
    }
});

module.exports = server;
