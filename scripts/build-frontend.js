const fs = require('fs');
const path = require('path');

const source = path.resolve(__dirname, '../KIDS-EDUVERSE-Final');
const output = path.resolve(__dirname, '../public');
fs.mkdirSync(output, { recursive: true });

for (const entry of ['index.html', 'css', 'js', 'assets']) {
  const from = path.join(source, entry);
  if (fs.existsSync(from)) fs.cpSync(from, path.join(output, entry), { recursive: true, force: true });
}

console.log('Copied the frontend into public/ for Vercel static hosting.');
