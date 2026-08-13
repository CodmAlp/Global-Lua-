const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

// Mock Database ng mga VIP Keys (Sa totoong deployment, pwede itong i-connect sa Database)
// Format: "KEY_NAME": { hwid: "SAVED_HWID_OR_NULL", expiry: "YYYY-MM-DD" }
let keysDatabase = {
    "akinto": { hwid: null, expiry: "2026-12-31" },
    "vip-sample-key": { hwid: null, expiry: "2026-12-31" }
};

// Simple XOR Cipher para sa Payload Security
function simpleEncrypt(text, secretKey) {
    let result = '';
    for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(text.charCodeAt(i) ^ secretKey.charCodeAt(i % secretKey.length));
    }
    return Buffer.from(result).toString('base64');
}

app.post('/verify-and-get-script', (req, res) => {
    const { userKey, userHwid } = req.body;
    const clientAuthToken = req.headers['x-access-password'];
    const SERVER_SECRET = process.env.ADMIN_PASSWORD;

    // 1. Check Server Auth Password
    if (!clientAuthToken || clientAuthToken !== SERVER_SECRET) {
        return res.status(401).json({ status: "error", message: "Unauthorized Request" });
    }

    // 2. Check kung umiiral ang Key
    const keyData = keysDatabase[userKey];
    if (!keyData) {
        return res.status(403).json({ status: "error", message: "Invalid License Key!" });
    }

    // 3. Check Expiration Date
    const today = new Date().toISOString().split('T')[0];
    if (keyData.expiry < today) {
        return res.status(403).json({ status: "error", message: "Key Expired!" });
    }

    // 4. Check HWID Binding (Device Lock)
    if (keyData.hwid === null) {
        // I-bind ang HWID sa kauna-unahang paggamit
        keyData.hwid = userHwid;
    } else if (keyData.hwid !== userHwid) {
        // Kapag magkaiba ang HWID sa naka-save
        return res.status(403).json({ status: "error", message: "Key Already Used On Another Device!" });
    }

    // 5. KAPAG VALID LAHAT: Basahin ang script at i-encrypt bago ipadala
    const filePath = path.join(__dirname, 'main.core');
    fs.readFile(filePath, 'utf8', (err, rawScript) => {
        if (err) {
            return res.status(500).json({ status: "error", message: "Server Script Error" });
        }

        // Encrypt the script payload using the key as secret
        const encryptedPayload = simpleEncrypt(rawScript, userKey);

        return res.json({
            status: "success",
            payload: encryptedPayload
        });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
