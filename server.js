const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

// Kinukuha ang password mula sa Environment Variables ng Render
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

app.get('/login-script', (req, res) => {
    const userPass = req.headers['x-access-password'];

    // 1. I-check kung tama ang password mula sa Lua Header
    if (!userPass || userPass !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: "Unauthorized access" });
    }

    // 2. Basahin ang main.core
    const filePath = path.join(__dirname, 'main.core');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: "Failed to read script file" });
        }

        // 3. I-convert ang raw script papuntang Base64
        const base64Script = Buffer.from(data).toString('base64');

        // 4. Ipadala ang Base64 string
        res.type('text/plain').send(base64Script);
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
