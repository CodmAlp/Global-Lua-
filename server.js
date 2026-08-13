const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Helper function para basahin ang main.core
function getLoginLuaScript() {
  try {
    return fs.readFileSync(path.join(__dirname, 'main.core'), 'utf8');
  } catch (err) {
    console.error("Error reading main.core:", err);
    return 'print("Error: Script not found!")';
  }
}

// Handler para sa root domain (/)
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.send('Server is running active!');
});

// Endpoint para sa Lua script
app.all('/login-script', (req, res) => {
  const userAgent = (req.headers['user-agent'] || '').toLowerCase();

  // Harang sa mga browsers (Chrome, Mozilla, Safari, Edge, Opera)
  const isBrowser = userAgent.includes('mozilla') || 
                    userAgent.includes('chrome') || 
                    userAgent.includes('safari') || 
                    userAgent.includes('applewebkit');

  if (isBrowser) {
    // Kapag browser ang nag-open, Access Denied o 404 display lang (walang HTML form)
    res.setHeader('Content-Type', 'text/plain');
    return res.status(403).send('');
  }

  // Kapag galing sa game/executor (non-browser), direktang ibibigay ang script
  res.setHeader('Content-Type', 'text/plain');
  return res.send(getLoginLuaScript());
});

app.listen(PORT, () => {
  console.log('Server is running on port ' + PORT);
});
