const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const loginChromePassword = "kristtine12213"; 

// Helper function para basahin ang login.core
function getLoginLuaScript() {
    try {
        return fs.readFileSync(path.join(__dirname, 'main.core'), 'utf8');
    } catch (err) {
        console.error("Error reading login.core:", err);
        return 'print("Error: login.core not found!")';
    }
}

// Handler para sa root domain (/)
app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/plain');
    res.send('Login Server is running active!');
});

// Endpoint para sa login script
app.all('/login-script', (req, res) => {
    const userAgent = req.headers['user-agent'] || '';
    const userKey = req.query.key || req.body.key;
    const loginLuaScript = getLoginLuaScript();

    if (userAgent.includes('Mozilla') || userAgent.includes('Chrome') || userAgent.includes('AppleWebKit')) {
        if (userKey === loginChromePassword) {
            res.setHeader('Content-Type', 'text/plain');
            return res.send(loginLuaScript);
        }

        res.setHeader('Content-Type', 'text/html');
        return res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Protected Login Script</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    body { background: #121212; color: #fff; font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                    .card { background: #1e1e1e; padding: 25px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.5); width: 300px; text-align: center; }
                    input { width: 90%; padding: 10px; margin: 10px 0; border: 1px solid #333; border-radius: 5px; background: #2a2a2a; color: #fff; }
                    button { width: 100%; padding: 10px; background: #0088ff; border: none; border-radius: 5px; color: #fff; font-weight: bold; cursor: pointer; }
                    .error { color: #ff4444; font-size: 14px; margin-bottom: 10px; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h2>Login Script Password</h2>
                    ${userKey ? '<div class="error">Maling Password!</div>' : ''}
                    <form method="POST">
                        <input type="password" name="key" placeholder="Password" required autocomplete="off">
                        <button type="submit">Submit</button>
                    </form>
                </div>
            </body>
            </html>
        `);
    }

    res.setHeader('Content-Type', 'text/plain');
    res.send(loginLuaScript);
});

app.listen(PORT, () => {
    console.log('Login Server is running on port ' + PORT);
});
