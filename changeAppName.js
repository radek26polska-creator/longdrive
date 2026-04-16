// changeAppName.js
const fs = require('fs');
const path = require('path');

const oldName = 'LongDrive';
const newName = 'LongDrvie'; // tutaj wpisz docelową nazwę

const rootDir = process.cwd(); // katalog, w którym uruchamiasz skrypt

// Rozszerzenia plików, które będziemy modyfikować (tekstowe)
const extensions = ['.js', '.jsx', '.json', '.html', '.css', '.md', '.txt', '.yml', '.yaml', '.xml'];

function shouldProcess(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return extensions.includes(ext);
}

function replaceInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(oldName)) {
      const newContent = content.split(oldName).join(newName);
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`Updated: ${filePath}`);
    }
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err.message);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      // pomiń katalog node_modules i .git
      if (file !== 'node_modules' && file !== '.git') {
        walkDir(fullPath);
      }
    } else if (shouldProcess(fullPath)) {
      replaceInFile(fullPath);
    }
  }
}

console.log(`Starting rename from "${oldName}" to "${newName}" in ${rootDir}`);
walkDir(rootDir);
console.log('Done.');