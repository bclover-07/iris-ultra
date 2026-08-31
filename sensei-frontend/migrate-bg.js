const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function processFile(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Replace bg-white with bg-white dark:bg-brutalist-black
  // Use negative lookahead to prevent duplicating dark:bg-brutalist-black
  content = content.replace(/\bbg-white\b(?!\s+dark:bg-brutalist-black|\/)/g, 'bg-white dark:bg-brutalist-black');
  
  // Replace bg-white/X with bg-white/X dark:bg-brutalist-black/X
  content = content.replace(/\bbg-white\/(\d+)\b(?!\s+dark:bg-brutalist-black\/\1)/g, 'bg-white/$1 dark:bg-brutalist-black/$1');

  // Replace bg-[#FAF6EE] and similar with bg-[#FAF6EE] dark:bg-brutalist-black
  content = content.replace(/\bbg-\[#FAF6EE\]\b(?!\s+dark:bg-brutalist-black)/g, 'bg-[#FAF6EE] dark:bg-brutalist-black');
  content = content.replace(/\bbg-\[#FFFCF4\]\b(?!\s+dark:bg-brutalist-black)/g, 'bg-[#FFFCF4] dark:bg-brutalist-black');
  content = content.replace(/\bbg-\[#FFFDF5\]\b(?!\s+dark:bg-brutalist-black)/g, 'bg-[#FFFDF5] dark:bg-brutalist-black');
  
  // Also fix any missed `bg-white` inside strings or template literals carefully
  // But word boundaries `\b` generally handle that safely within tailwind strings.
  
  // Wait, there's `bg-white/60` which is already handled above.

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

walkDir(srcDir, processFile);
console.log('Done!');
