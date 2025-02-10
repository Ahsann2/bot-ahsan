const { makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const express = require('express');
const QRCode = require('qrcode');
const fs = require('fs');
const P = require('pino');

(async () => {
    const app = express();
    const port = process.env.PORT || 3000; // Port default untuk Railway

    const { state, saveCreds } = await useMultiFileAuthState('./auth');
    const sock = makeWASocket({
        auth: state,
        logger: P({ level: 'silent' }),
        browser: ["Railway Bot", "Chrome", "1.0"],
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, qr } = update;

        if (qr) {
            console.log("Menerima QR Code, membuat link...");
            const qrImage = await QRCode.toDataURL(qr); // Mengubah QR ke base64
            fs.writeFileSync('./qr.html', `<img src="${qrImage}" alt="QR Code">`); // Simpan file HTML dengan QR

            // Buat route untuk menampilkan QR
            app.get('/', (req, res) => {
                res.sendFile(__dirname + '/qr.html');
            });

            console.log(`QR Code tersedia di http://localhost:${port}`);
        }

        if (connection === 'open') {
            console.log('Bot berhasil terhubung ke WhatsApp!');
        }
    });

    app.listen(port, () => {
        console.log(`Server berjalan di port ${port}`);
    });
})();
