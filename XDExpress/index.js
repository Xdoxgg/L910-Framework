const http = require('http');
const fs = require('fs').promises;
const { URL } = require('url');

const POOLS_FILE = './XDExpress/pools.json';
const SWIMMERS_FILE = './XDExpress/swimmers.json';

function parseJSONBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => (body += chunk));
        req.on('end', () => {
            if (!body) return resolve(null);
            try {
                resolve(JSON.parse(body));
            } catch (e) {
                reject(new Error('Invalid JSON'));
            }
        });
    });
}

async function readData(file) {
    try {
        const data = await fs.readFile(file, 'utf8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

async function writeData(file, data) {
    await fs.writeFile(file, JSON.stringify(data, null, 2));
}

function sendJSON(res, status, data) {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}

function sendText(res, status, text) {
    res.writeHead(status, { 'Content-Type': 'text/plain' });
    res.end(text);
}

function getIdFromPath(path) {
    const parts = path.split('/');
    return parts.length > 2 ? parts[2] : null;
}

async function handlePools(req, res, method, id) {
    let pools = await readData(POOLS_FILE);

    if (method === 'GET' && !id) {
        // GET /pools
        return sendJSON(res, 200, pools);
    }

    if (method === 'GET' && id) {
        // GET /pools/:id
        const pool = pools.find(p => p.id === +id);
        if (!pool) return sendText(res, 404, 'Pool not found');
        return sendJSON(res, 200, pool);
    }

    if (method === 'POST') {
        // POST /pools
        try {
            const body = await parseJSONBody(req);
            if (!body || !body.name || !body.type || !body.length || !body.width || !body.depth) {
                return sendText(res, 400, 'Missing required pool fields');
            }
            const newPool = {
                id: pools.length ? pools[pools.length - 1].id + 1 : 1,
                name: body.name,
                type: body.type,
                length: body.length,
                width: body.width,
                depth: body.depth,
            };
            pools.push(newPool);
            await writeData(POOLS_FILE, pools);
            return sendJSON(res, 201, newPool);
        } catch (e) {
            return sendText(res, 400, e.message);
        }
    }

    if ((method === 'PUT' || method === 'PATCH') && id) {
        // PUT /pools/:id или PATCH /pools/:id
        const index = pools.findIndex(p => p.id === +id);
        if (index === -1) return sendText(res, 404, 'Pool not found');

        try {
            const body = await parseJSONBody(req);
            if (!body) return sendText(res, 400, 'Empty body');

            if (method === 'PUT') {
                // Полное обновление — все поля обязательны
                if (!body.name || !body.type || !body.length || !body.width || !body.depth) {
                    return sendText(res, 400, 'Missing required pool fields');
                }
                pools[index] = { id: +id, ...body };
            } else {
                // PATCH — частичное обновление (не идемпотентно)
                pools[index] = { ...pools[index], ...body };
            }
            await writeData(POOLS_FILE, pools);
            return sendJSON(res, 200, pools[index]);
        } catch (e) {
            return sendText(res, 400, e.message);
        }
    }

    if (method === 'DELETE' && id) {
        // DELETE /pools/:id
        const index = pools.findIndex(p => p.id === +id);
        if (index === -1) return sendText(res, 404, 'Pool not found');
        pools.splice(index, 1);
        await writeData(POOLS_FILE, pools);
        res.writeHead(204);
        return res.end();
    }

    sendText(res, 405, 'Method Not Allowed');
}

async function handleSwimmers(req, res, method, id) {
    let swimmers = await readData(SWIMMERS_FILE);
    let pools = await readData(POOLS_FILE);

    if (method === 'GET' && !id) {
        // GET /swimmers
        return sendJSON(res, 200, swimmers);
    }

    if (method === 'GET' && id) {
        // GET /swimmers/:id
        const swimmer = swimmers.find(s => s.id === +id);
        if (!swimmer) return sendText(res, 404, 'Swimmer not found');
        return sendJSON(res, 200, swimmer);
    }

    if (method === 'POST') {
        // POST /swimmers
        try {
            const body = await parseJSONBody(req);
            if (!body || !body.name || !body.age || !body.level || !body.poolId) {
                return sendText(res, 400, 'Missing required swimmer fields');
            }
            if (!pools.find(p => p.id === +body.poolId)) {
                return sendText(res, 400, 'Invalid poolId');
            }
            const newSwimmer = {
                id: swimmers.length ? swimmers[swimmers.length - 1].id + 1 : 1,
                name: body.name,
                age: body.age,
                level: body.level,
                poolId: body.poolId,
            };
            swimmers.push(newSwimmer);
            await writeData(SWIMMERS_FILE, swimmers);
            return sendJSON(res, 201, newSwimmer);
        } catch (e) {
            return sendText(res, 400, e.message);
        }
    }

    if ((method === 'PUT' || method === 'PATCH') && id) {
        // PUT /swimmers/:id или PATCH /swimmers/:id
        const index = swimmers.findIndex(s => s.id === +id);
        if (index === -1) return sendText(res, 404, 'Swimmer not found');

        try {
            const body = await parseJSONBody(req);
            if (!body) return sendText(res, 400, 'Empty body');

            if (body.poolId && !pools.find(p => p.id === +body.poolId)) {
                return sendText(res, 400, 'Invalid poolId');
            }

            if (method === 'PUT') {
                if (!body.name || !body.age || !body.level || !body.poolId) {
                    return sendText(res, 400, 'Missing required swimmer fields');
                }
                swimmers[index] = { id: +id, ...body };
            } else {
                swimmers[index] = { ...swimmers[index], ...body };
            }
            await writeData(SWIMMERS_FILE, swimmers);
            return sendJSON(res, 200, swimmers[index]);
        } catch (e) {
            return sendText(res, 400, e.message);
        }
    }

    if (method === 'DELETE' && id) {
        // DELETE /swimmers/:id
        const index = swimmers.findIndex(s => s.id === +id);
        if (index === -1) return sendText(res, 404, 'Swimmer not found');
        swimmers.splice(index, 1);
        await writeData(SWIMMERS_FILE, swimmers);
        res.writeHead(204);
        return res.end();
    }

    sendText(res, 405, 'Method Not Allowed');
}

const server = http.createServer(async (req, res) => {
    try {
        const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
        const pathname = parsedUrl.pathname;
        const method = req.method.toUpperCase();

        if (pathname.startsWith('/pools')) {
            const id = getIdFromPath(pathname);
            await handlePools(req, res, method, id);
        } else if (pathname.startsWith('/swimmers')) {
            const id = getIdFromPath(pathname);
            await handleSwimmers(req, res, method, id);
        } else {
            sendText(res, 404, 'Not Found');
        }
    } catch (err) {
        sendText(res, 500, 'Internal Server Error');
    }
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
