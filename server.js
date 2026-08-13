const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

// Kunin ang secrets mula sa Environment Variables ng hosting (Render)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

app.get('/login-script', (req, res) => {
    const userPass = req.headers['x-access-password'];

    // I-validate ang password
    if (!userPass || userPass !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: "Unauthorized access" });
    }

    const filePath = path.join(__dirname, 'main.core');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: "Failed to read script file" });
        }
        res.type('text/plain').send(data);
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
