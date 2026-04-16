const fs = require("fs");
const path = require("path");

const ROOT_DIR = "./src";
const OUTPUT_FILE = "PROJECT_FULL_ANALYSIS.txt";

const IGNORE_DIRS = ["node_modules", "dist", ".git"];
const VALID_EXT = [".js", ".jsx", ".ts", ".tsx"];

// ====== ZBIERANIE PLIKÓW ======
function walk(dir, files = []) {
  const list = fs.readdirSync(dir);

  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!IGNORE_DIRS.includes(file)) {
        walk(fullPath, files);
      }
    } else {
      if (VALID_EXT.includes(path.extname(file))) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

// ====== IMPORTY ======
function getImports(content) {
  const regex = /import\s+(.*?)\s+from\s+['"](.*?)['"]/g;
  let match;
  const imports = [];

  while ((match = regex.exec(content))) {
    imports.push(match[2]);
  }

  return imports;
}

// ====== FUNKCJE ======
function getFunctions(content) {
  const regex = /(function\s+\w+|const\s+\w+\s*=\s*\(?.*?\)?\s*=>)/g;
  return content.match(regex) || [];
}

// ====== KOMPONENTY REACT ======
function getComponents(content) {
  const regex = /const\s+([A-Z][A-Za-z0-9]*)\s*=\s*\(/g;
  let match;
  const components = [];

  while ((match = regex.exec(content))) {
    components.push(match[1]);
  }

  return components;
}

// ====== EXPORTY ======
function getExports(content) {
  return content
    .split("\n")
    .filter(line => line.includes("export"))
    .join("\n");
}

// ====== CZYSZCZENIE KODU ======
function cleanCode(content) {
  return content
    .replace(/<[^>]*>/g, "") // usuń JSX
    .replace(/\{[^}]*\}/g, "") // usuń JSX expressions
    .replace(/\/\/.*$/gm, "") // usuń komentarze
    .split("\n")
    .filter(line => line.trim() !== "")
    .slice(0, 40)
    .join("\n");
}

// ====== ANALIZA PLIKU ======
function analyzeFile(filePath, allFiles) {
  try {
    const content = fs.readFileSync(filePath, "utf8");

    const imports = getImports(content);
    const functions = getFunctions(content);
    const components = getComponents(content);
    const exports = getExports(content);

    const internalDeps = imports.filter(i =>
      allFiles.some(f => f.includes(i))
    );

    return `
====================================
PLIK: ${filePath}

--- KOMPONENTY ---
${components.join("\n") || "brak"}

--- FUNKCJE ---
${functions.join("\n") || "brak"}

--- IMPORTY ---
${imports.join("\n") || "brak"}

--- ZALEŻNOŚCI WEWNĘTRZNE ---
${internalDeps.join("\n") || "brak"}

--- EXPORTY ---
${exports || "brak"}

--- SKRÓT LOGIKI ---
${cleanCode(content)}

====================================
`;
  } catch (err) {
    return `BŁĄD: ${filePath}\n`;
  }
}

// ====== MAPA PROJEKTU ======
function buildTree(files) {
  return files.map(f => f.replace(ROOT_DIR, "")).join("\n");
}

// ====== START ======
function run() {
  console.log("🚀 Analiza PRO MAX...");

  const files = walk(ROOT_DIR);

  let output = `
########## MAPA PROJEKTU ##########
${buildTree(files)}

########## ANALIZA PLIKÓW ##########
`;

  for (const file of files) {
    output += analyzeFile(file, files);
  }

  fs.writeFileSync(OUTPUT_FILE, output);

  console.log("✅ GOTOWE!");
  console.log("Plik:", OUTPUT_FILE);
}

run();