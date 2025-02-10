// Import module yang diperlukan
const makeWASocket = require("@whiskeysockets/baileys").default;
const { useMultiFileAuthState } = require("@whiskeysockets/baileys");
const express = require("express");
const qrcode = require("qrcode-terminal");

// Inisialisasi aplikasi Express
const app = express();
app.use(express.json());

// Fungsi untuk memulai bot WhatsApp
async function startBot() {
    // Membuat state autentikasi (akan tersimpan di folder "auth_info")
    const { state, saveCreds } = await useMultiFileAuthState("auth_info");

    // Membuat koneksi WhatsApp dengan Baileys
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true // Akan menampilkan QR code di log
    });

    // Simpan kredensial setiap kali ada update
    sock.ev.on("creds.update", saveCreds);

    // Monitor status koneksi
    sock.ev.on("connection.update", (update) => {
        const { connection, qr } = update;
        if (qr) {
            // Tampilkan QR code di terminal
            qrcode.generate(qr, { small: true });
        }
        if (connection === "open") {
            console.log("✅ Bot WhatsApp Berhasil Terhubung!");
        } else if (connection === "close") {
            console.log("❌ Koneksi terputus, mencoba menyambung ulang...");
            startBot(); // Restart bot jika koneksi terputus
        }
    });

    // API endpoint untuk mengirim pesan WhatsApp
    app.post("/send-wa", async (req, res) => {
        const { nomor, pesan } = req.body;
        try {
            // Format nomor: misalnya "6281234567890"
            await sock.sendMessage(nomor + "@s.whatsapp.net", { text: pesan });
            res.json({ success: true, message: "Pesan terkirim!" });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    return sock;
}

// Mulai bot
startBot();

// Jalankan server Express pada port 3000
app.listen(3000, () => {
    console.log("🚀 Server berjalan di port 3000");
});
