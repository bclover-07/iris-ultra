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

  // Colors to target
  const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'pink', 'indigo', 'orange', 'amber', 'emerald', 'teal', 'cyan', 'sky', 'rose'];

  // Replace bg-{color}-{shade} with bg-{color}-{shade} dark:bg-brutalist-black
  colors.forEach(color => {
    const regex = new RegExp(`\\bbg-${color}-(\\d{2,3})\\b(?!\\s+dark:bg-brutalist-black)`, 'g');
    content = content.replace(regex, `bg-${color}-$1 dark:bg-brutalist-black`);
    
    // Also replace text-{color}-{shade} if they are inside a dark mode component? 
    // The user explicitly said: "colour full cards in dark mode make them dark and for text make them white".
    // text-white is already handled by text-brutal-text for the most part, but let's aggressively flip text colors to text-brutal-text in dark mode if they are colored.
    const textRegex = new RegExp(`\\btext-${color}-(\\d{2,3})\\b(?!\\s+dark:text-brutal-text)`, 'g');
    content = content.replace(textRegex, `text-${color}-$1 dark:text-brutal-text`);
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated colorful bgs in: ${filePath}`);
  }
}

walkDir(srcDir, processFile);
console.log('Done!');
