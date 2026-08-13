const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

// Secret Auth Header Password
const SERVER_SECRET = process.env.ADMIN_PASSWORD;

// Database ng VIP Keys (Pwede mong dagdagan o baguhin dito)
// Format: "KEY": { hwid: null (auto-binds sa unang gamit), expiry: "YYYY-MM-DD" }
let keysDatabase = {
    "VIP-SLIDER-2026": { hwid: null, expiry: "2026-12-31" },
    "AKINTO-FREE-KEY": { hwid: null, expiry: "2026-12-31" },
    "TESTKEY123":      { hwid: null, expiry: "2026-12-31" }
};

// Custom XOR Encryption Algorithm
function encryptXOR(text, secretKey) {
    let result = '';
    for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(text.charCodeAt(i) ^ secretKey.charCodeAt(i % secretKey.length));
    }
    return Buffer.from(result).toString('base64');
}

app.post('/verify-and-get-script', (req, res) => {
    const { userKey, userHwid } = req.body;
    const clientAuthToken = req.headers['x-access-password'];

    // 1. Validate App Header Password
    if (!clientAuthToken || clientAuthToken !== SERVER_SECRET) {
        return res.status(401).json({ status: "error", message: "Unauthorized Request!" });
    }

    // 2. Validate Key existence
    const keyData = keysDatabase[userKey];
    if (!keyData) {
        return res.status(403).json({ status: "error", message: "Invalid VIP Key!" });
    }

    // 3. Validate Expiration
    const today = new Date().toISOString().split('T')[0];
    if (keyData.expiry < today) {
        return res.status(403).json({ status: "error", message: "VIP Key Expired!" });
    }

    // 4. HWID Binding / Lock to Device
    if (keyData.hwid === null) {
        keyData.hwid = userHwid; // I-lock sa device na ito
    } else if (keyData.hwid !== userHwid) {
        return res.status(403).json({ status: "error", message: "Key already used on another device!" });
    }

    // 5. Encrypt main.core using userKey
    const filePath = path.join(__dirname, 'main.core');
    fs.readFile(filePath, 'utf8', (err, rawScript) => {
        if (err) {
            return res.status(500).json({ status: "error", message: "Failed to read core script." });
        }

        const encryptedPayload = encryptXOR(rawScript, userKey);

        return res.json({
            status: "success",
            payload: encryptedPayload
        });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`SECURE VIP Server running on port ${PORT}`);
});
