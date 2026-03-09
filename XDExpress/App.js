const http = require('http');
const url = require('url');

class App {
    constructor() {
        this.routes = {
            GET: [],
            POST: [],
            PUT: [],
            PATCH: [],
            DELETE: [],
        };
        this.middlewares = [];
    }

    // Регистрация middleware
    use(mw) {
        this.middlewares.push(mw);
    }

    // Регистрация маршрутов
    register(method, path, handler) {
        this.routes[method].push({ path, handler });
    }

    get(path, handler) {
        this.register('GET', path, handler);
    }
    post(path, handler) {
        this.register('POST', path, handler);
    }
    put(path, handler) {
        this.register('PUT', path, handler);
    }
    patch(path, handler) {
        this.register('PATCH', path, handler);
    }
    delete(path, handler) {
        this.register('DELETE', path, handler);
    }

    // Парсинг параметров пути, например /users/:id
    matchRoute(method, pathname) {
        const routes = this.routes[method] || [];
        for (const route of routes) {
            const params = {};
            const routeParts = route.path.split('/').filter(Boolean);
            const pathParts = pathname.split('/').filter(Boolean);
            if (routeParts.length !== pathParts.length) continue;

            let matched = true;
            for (let i = 0; i < routeParts.length; i++) {
                if (routeParts[i].startsWith(':')) {
                    const paramName = routeParts[i].slice(1);
                    params[paramName] = decodeURIComponent(pathParts[i]);
                } else if (routeParts[i] !== pathParts[i]) {
                    matched = false;
                    break;
                }
            }
            if (matched) {
                return { handler: route.handler, params };
            }
        }
        return null;
    }

    // Парсинг query string в объект
    parseQuery(queryString) {
        const query = {};
        if (!queryString) return query;
        queryString.split('&').forEach(pair => {
            const [key, value = ''] = pair.split('=');
            query[decodeURIComponent(key)] = decodeURIComponent(value);
        });
        return query;
    }

    // Чтение тела запроса (JSON)
    async parseBody(req) {
        return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', () => {
                if (body) {
                    try {
                        const contentType = req.headers['content-type'] || '';
                        if (contentType.includes('application/json')) {
                            resolve(JSON.parse(body));
                        } else if (contentType.includes('application/x-www-form-urlencoded')) {
                            const parsed = {};
                            body.split('&').forEach(pair => {
                                const [k, v] = pair.split('=');
                                parsed[decodeURIComponent(k)] = decodeURIComponent(v || '');
                            });
                            resolve(parsed);
                        } else {
                            resolve(body);
                        }
                    } catch (e) {
                        reject(e);
                    }
                } else {
                    resolve(null);
                }
            });
            req.on('error', err => reject(err));
        });
    }

    // Обработка запроса
    async handleRequest(req, res) {
        try {
            const parsedUrl = url.parse(req.url);
            const method = req.method.toUpperCase();
            const routeMatch = this.matchRoute(method, parsedUrl.pathname);

            // Расширяем req
            req.params = routeMatch ? routeMatch.params : {};
            req.query = this.parseQuery(parsedUrl.query);
            req.body = null;

            // Расширяем res
            res.statusCode = 200;
            res.status = function (code) {
                this.statusCode = code;
                return this;
            };
            res.send = function (data) {
                if (typeof data === 'object') {
                    this.setHeader('Content-Type', 'text/plain; charset=utf-8');
                    this.end(String(data));
                } else {
                    this.setHeader('Content-Type', 'text/plain; charset=utf-8');
                    this.end(data);
                }
            };
            res.json = function (obj) {
                this.setHeader('Content-Type', 'application/json; charset=utf-8');
                this.end(JSON.stringify(obj));
            };

            // Парсим тело, если есть
            if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
                req.body = await this.parseBody(req);
            }

            // Цепочка middleware + маршрут
            let idx = 0;
            const allHandlers = [...this.middlewares];
            if (routeMatch) allHandlers.push(routeMatch.handler);

            if (allHandlers.length === 0) {
                res.status(404).send('Not Found');
                return;
            }

            const next = (err) => {
                if (err) {
                    // Обработка ошибки
                    res.status(500).json({ error: err.message || 'Internal Server Error' });
                    return;
                }
                const handler = allHandlers[idx++];
                if (!handler) return;
                try {
                    // Если middleware с 3 аргументами - это обработчик ошибок, пропускаем
                    if (handler.length === 4) {
                        next();
                    } else {
                        handler(req, res, next);
                    }
                } catch (e) {
                    next(e);
                }
            };

            next();

        } catch (err) {
            res.status(500).json({ error: err.message || 'Internal Server Error' });
        }
    }

    listen(port, callback) {
        const server = http.createServer(this.handleRequest.bind(this));
        server.listen(port, callback);
    }
}

// Пример использования:

// const app = new App();

// app.use((req, res, next) => {
//   console.log(`${req.method} ${req.url}`);
//   next();
// });

// app.get('/hello/:name', (req, res) => {
//   res.json({ message: `Hello, ${req.params.name}!`, query: req.query });
// });

// app.post('/data', (req, res) => {
//   res.json({ received: req.body });
// });

// app.listen(3000, () => {
//   console.log('Server started on port 3000');
// });

module.exports = App;
