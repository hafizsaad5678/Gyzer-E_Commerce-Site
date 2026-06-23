const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

const replacement = "bg-secondary hover:bg-copper text-foreground hover:text-copper-foreground transition-colors";

walkDir('./src', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let original = content;
    
    // Replace bg-primary for buttons (ones that have px-)
    content = content.replace(/bg-primary([^"'{`]*?px-[0-9]+)/g, `${replacement}$1`);
    content = content.replace(/(px-[0-9]+[^"'{`]*?)bg-primary/g, `$1${replacement}`);

    // Remove text-primary-foreground
    content = content.replace(/text-primary-foreground/g, '');
    
    // Remove hover:opacity-90
    content = content.replace(/hover:opacity-90/g, '');
    
    // Remove hover:bg-primary/90
    content = content.replace(/hover:bg-primary\/90/g, '');

    // Clean up multiple spaces
    content = content.replace(/  +/g, ' ');

    if (content !== original) {
      fs.writeFileSync(filePath, content);
      console.log('Updated', filePath);
    }
  }
});
