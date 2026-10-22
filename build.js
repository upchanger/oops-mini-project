const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src', 'main', 'resources', 'static');
const destDir = path.join(__dirname, 'public');

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

fs.cpSync(srcDir, destDir, { recursive: true });
console.log('✅ Successfully copied static assets from src/main/resources/static to /public for Vercel deployment.');
