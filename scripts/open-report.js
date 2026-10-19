// Opens the Stryker HTML report in the default browser (macOS, Windows, Linux).
const { exec } = require('child_process');
const path = require('path');
const file = path.join(__dirname, '..', 'reports', process.argv[2] || 'mutation', 'mutation.html');
const cmd = process.platform === 'win32' ? `start "" "${file}"` : process.platform === 'darwin' ? `open "${file}"` : `xdg-open "${file}"`;
exec(cmd, (err) => { if (err) console.log(`Open this file in your browser: ${file}`); });
