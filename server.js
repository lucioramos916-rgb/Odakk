const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

async function translateText(text, sourceLang, targetLang) {
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
        const response = await fetch(url);
        const data = await response.json();
        return data[0][0][0];
    } catch (error) {
        console.error("Error traduciendo:", error);
        return text;
    }
}

io.on('connection', (socket) => {
    console.log('¡Un dispositivo se ha conectado!');

    socket.on('chat message', async (data) => {
        const { user, text } = data;
        const userName = user.trim().toLowerCase();
        
        let sourceLang, targetLang;
        if (userName === 'lucio') {
            sourceLang = 'en';
            targetLang = 'es';
        } else {
            sourceLang = 'es';
            targetLang = 'en';
        }

        const translatedText = await translateText(text, sourceLang, targetLang);

        const finalMessage = {
            user: data.user,
            text_es: sourceLang === 'es' ? text : translatedText,
            text_en: sourceLang === 'en' ? text : translatedText
        };

        io.emit('chat message', finalMessage);
    });

    // --- AGREGAS ESTO AQUÍ ABAJO ---
    socket.on('typing', (data) => {
        socket.broadcast.emit('typing', data);
    });

    socket.on('stop typing', (data) => {
        socket.broadcast.emit('stop typing', data);
    });
    // --------------------------------
});

// AQUÍ ESTÁ EL CAMBIO CLAVE PARA RENDER:
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});