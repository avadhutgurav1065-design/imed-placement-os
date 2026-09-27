const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./app', function(filePath) {
  if (filePath.endsWith('page.tsx') || filePath.endsWith('layout.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    if (content.includes('export const metadata') && (content.includes('viewport:') || content.includes('themeColor:'))) {
      const themeColorMatch = content.match(/themeColor:\s*['"][^'"]+['"],?/);
      const viewportMatch = content.match(/viewport:\s*\{[^}]+\},?/);
      
      let themeColor = '';
      let viewportBody = '';
      
      if (themeColorMatch) {
        themeColor = themeColorMatch[0];
        content = content.replace(themeColorMatch[0], '');
        modified = true;
      }
      
      if (viewportMatch) {
        viewportBody = viewportMatch[0].replace('viewport:', '').trim().slice(1, -1).trim(); 
        if (viewportBody.endsWith(',')) viewportBody = viewportBody.slice(0, -1);
        content = content.replace(viewportMatch[0], '');
        modified = true;
      }
      
      if (modified) {
        let viewportExport = '\nexport const viewport = {\n';
        if (themeColor) viewportExport += '  ' + themeColor + '\n';
        if (viewportBody) viewportExport += '  ' + viewportBody + '\n';
        viewportExport += '};\n';
        
        content = content + viewportExport;
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed:', filePath);
      }
    }
  }
});
