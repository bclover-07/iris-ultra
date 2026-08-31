const fs = require('fs');
const path = require('path');

const replaceRules = [
  // Mobile replacements
  { regex: /AppColors\.senseiYellow/g, replacement: 'AppColors.brutalistCyan' },
  { regex: /AppColors\.comicYellow/g, replacement: 'AppColors.brutalistCyan' },
  { regex: /AppColors\.comicPink/g, replacement: 'AppColors.brutalistCyan' },
  { regex: /AppColors\.brutalistYellow/g, replacement: 'AppColors.brutalistCyan' },
  { regex: /AppColors\.brutalistPink/g, replacement: 'AppColors.brutalistCyan' },
  { regex: /Color\(0xFFFEF9C3\)/g, replacement: 'AppColors.brutalBg' },
  // Frontend replacements
  { regex: /var\(--brutalist-yellow\)/g, replacement: 'var(--brutalist-cyan)' },
  { regex: /var\(--brutalist-pink\)/g, replacement: 'var(--brutalist-cyan)' },
  { regex: /var\(--brutalist-green\)/g, replacement: 'var(--brutalist-cyan)' },
  { regex: /var\(--brutalist-purple\)/g, replacement: 'var(--brutalist-cyan)' },
  { regex: /var\(--brutalist-red\)/g, replacement: 'var(--brutalist-cyan)' },
  { regex: /bg-yellow-500/g, replacement: 'bg-[var(--brutalist-cyan)]' },
  { regex: /bg-red-500/g, replacement: 'bg-white' },
  { regex: /hover:bg-red-500/g, replacement: 'hover:bg-[var(--brutalist-cyan)]' },
  { regex: /bg-yellow-50/g, replacement: 'bg-cyan-50' },
  { regex: /bg-blue-50/g, replacement: 'bg-cyan-50' },
  { regex: /bg-amber-50/g, replacement: 'bg-cyan-50' },
  { regex: /bg-orange-50/g, replacement: 'bg-cyan-50' },
];

function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else {
      if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.dart') || fullPath.endsWith('.css')) {
        let content = fs.readFileSync(fullPath, 'utf8');
        let modified = false;
        
        for (const rule of replaceRules) {
          if (content.match(rule.regex)) {
            content = content.replace(rule.regex, rule.replacement);
            modified = true;
          }
        }
        
        if (modified) {
          fs.writeFileSync(fullPath, content, 'utf8');
          console.log(`Updated ${fullPath}`);
        }
      }
    }
  }
}

// Process frontend teacher pages
processDirectory(path.join(__dirname, 'sensei-frontend', 'src', 'app', 'teacher'));
processDirectory(path.join(__dirname, 'sensei-frontend', 'src', 'components', 'teacher'));

// Process mobile app teacher pages
processDirectory(path.join(__dirname, 'sensei_mobile', 'lib', 'screens', 'teacher'));

console.log("Done.");
