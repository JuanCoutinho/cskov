/**
 * CSkov - Servidor Multiplayer
 * Usa: ws (nativo do sistema) + http (built-in Node.js)
 * Para rodar: node server.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('/usr/share/nodejs/ws/index.js');

const PORT = 3000;
const PUBLIC_DIR = __dirname;

// --- Servidor HTTP para servir os arquivos do jogo ---
const httpServer = http.createServer((req, res) => {
    let filePath = path.join(PUBLIC_DIR, req.url === '/' ? 'index.html' : req.url);

    // Segurança básica: não sair do diretório
    if (!filePath.startsWith(PUBLIC_DIR)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    const extMap = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.mp3': 'audio/mpeg',
        '.json': 'application/json',
        '.png': 'image/png',
    };

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('Not Found: ' + req.url);
            return;
        }
        const ext = path.extname(filePath);
        const mime = extMap[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': mime });
        res.end(data);
    });
});

// --- Servidor WebSocket ---
const wss = new WebSocket.Server({ server: httpServer });

// Estado compartilhado do servidor
const players = new Map(); // socketId -> playerData
let nextId = 1;

function broadcast(data, exceptId = null) {
    const msg = JSON.stringify(data);
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN && client.playerId !== exceptId) {
            client.send(msg);
        }
    });
}

wss.on('connection', (ws) => {
    const id = 'p' + (nextId++);
    ws.playerId = id;

    console.log(`[+] Jogador conectou: ${id} | Total: ${wss.clients.size}`);

    // Manda pro novo jogador seu ID + lista de jogadores existentes
    ws.send(JSON.stringify({
        type: 'WELCOME',
        id: id,
        players: Array.from(players.values())
    }));

    // Avisa todos os outros que um novo jogador entrou
    broadcast({ type: 'PLAYER_JOINED', id: id }, id);

    ws.on('message', (rawMsg) => {
        let data;
        try { data = JSON.parse(rawMsg); } catch (e) { return; }
        data.id = id; // garante que o id é o correto

        switch (data.type) {
            case 'PLAYER_UPDATE':
                // Atualiza posição/estado do jogador
                players.set(id, {
                    id,
                    x: data.x,
                    y: data.y,
                    angle: data.angle,
                    hp: data.hp,
                    faction: data.faction,
                    color: data.color,
                    name: data.name || id,
                    weapon: data.weapon,
                    stanceSide: data.stanceSide,
                    gunLength: data.gunLength,
                });
                broadcast(data, id);
                break;

            case 'BULLET':
                // Propaga bala do jogador para todos
                broadcast(data, id);
                break;

            case 'PLAYER_DIED':
                players.delete(id);
                broadcast(data, id);
                break;

            case 'CHAT':
                // Chat rápido entre jogadores
                broadcast({ type: 'CHAT', id, name: data.name || id, msg: data.msg });
                break;
        }
    });

    ws.on('close', () => {
        console.log(`[-] Jogador desconectou: ${id} | Total: ${wss.clients.size - 1}`);
        players.delete(id);
        broadcast({ type: 'PLAYER_LEFT', id: id });
    });

    ws.on('error', (err) => {
        console.error(`Erro no socket ${id}:`, err.message);
    });
});

httpServer.listen(PORT, '0.0.0.0', () => {
    console.log('╔════════════════════════════════════════╗');
    console.log('║       CSkov - Servidor Multiplayer     ║');
    console.log('╠════════════════════════════════════════╣');
    console.log(`║  Local:   http://localhost:${PORT}         ║`);
    console.log(`║  Rede:    http://<seu-ip>:${PORT}          ║`);
    console.log('║  Abra o link no navegador pra jogar!   ║');
    console.log('╚════════════════════════════════════════╝');
    console.log('');
    console.log('Seu IP na rede local:');

    // Mostra o IP da rede local
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                console.log(`  -> http://${net.address}:${PORT}`);
            }
        }
    }
});
