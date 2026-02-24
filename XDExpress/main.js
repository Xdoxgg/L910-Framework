require('dotenv').config({ path: '../.env' });

const port = process.env.SERVER_PORT || 3000;
const server = require('./server');

server.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});
