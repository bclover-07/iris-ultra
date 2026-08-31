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

  // Replace border-black with border-brutal-border (since brutal-border maps to var(--brutal-border))
  // Wait, I mapped it as 'brutal-border', so the class would be border-brutal-border.
  // Actually, wait, let's just use `border-[var(--brutal-border)]` to be safe and avoid tailwind compilation issues if it misses the new config temporarily, or better:
  // Since I added `brutal-border: 'var(--brutal-border, #111111)'` to colors, the border class is `border-brutal-border`.
  // Wait, I mapped it to colors. So `border-brutal-border` works. But let's just use `border-[var(--brutal-border)]`.
  // It's safer. Same for shadows. Wait, I added `shadow-brutal-sm` to boxShadow, so that works perfectly.

  // Shadow replacements
  // Match shadow-[2px_2px_0_rgba(17,17,17,1)], shadow-[2px_2px_0_#000], etc.
  content = content.replace(/shadow-\[1px_1px_0_(rgba\([^)]+\)|#[0-9a-fA-F]+|#000|black)\]/g, 'shadow-brutal-sm');
  content = content.replace(/shadow-\[2px_2px_0_(rgba\([^)]+\)|#[0-9a-fA-F]+|#000|black)\]/g, 'shadow-brutal-sm');
  content = content.replace(/shadow-\[3px_3px_0_(rgba\([^)]+\)|#[0-9a-fA-F]+|#000|black)\]/g, 'shadow-brutal-sm-hover');
  content = content.replace(/shadow-\[4px_4px_0_(rgba\([^)]+\)|#[0-9a-fA-F]+|#000|black)\]/g, 'shadow-brutal-md');
  content = content.replace(/shadow-\[6px_6px_0_(rgba\([^)]+\)|#[0-9a-fA-F]+|#000|black)\]/g, 'shadow-brutal-lg');
  content = content.replace(/shadow-\[8px_8px_0_(rgba\([^)]+\)|#[0-9a-fA-F]+|#000|black)\]/g, 'shadow-brutal-xl');
  content = content.replace(/shadow-\[10px_10px_0_(rgba\([^)]+\)|#[0-9a-fA-F]+|#000|black)\]/g, 'shadow-brutal-lg-hover');
  content = content.replace(/shadow-\[12px_12px_0_(rgba\([^)]+\)|#[0-9a-fA-F]+|#000|black)\]/g, 'shadow-brutal-xl-hover');
  
  // Also replace some common hardcoded ones like shadow-[0_4px_0_rgba(17,17,17,1)]
  content = content.replace(/shadow-\[0_4px_0_(rgba\([^)]+\)|#[0-9a-fA-F]+|#000|black)\]/g, 'shadow-brutal-md');

  // Replace border-black with border-[var(--brutal-border)]
  content = content.replace(/\bborder-black\b/g, 'border-brutal-border');
  
  // Replace text-black with text-brutal-text
  content = content.replace(/\btext-black\b/g, 'text-brutal-text');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

walkDir(srcDir, processFile);
console.log('Done!');
