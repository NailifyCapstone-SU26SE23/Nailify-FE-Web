const fs = require('fs');
const path = require('path');

function walk(dir) {
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      walk(filePath);
    } else if (filePath.endsWith('.jsx')) {
      let content = fs.readFileSync(filePath, 'utf8');
      let originalContent = content;
      
      if (content.includes('toast.error(error, { id: "error-msg" });')) {
        // Remove the existing wrongly placed useEffect
        let newContent = content.replace(/\s*useEffect\(\(\) => \{\s*if \(error\) \{\s*toast\.error\(error, \{ id: "error-msg" \}\);\s*\}\s*\}, \[error\]\);\n?/g, '\n');
        
        // Insert it right after the declaration
        const regex = /(const \[error, setError\] = (?:React\.)?useState\([^)]*\);)/g;
        newContent = newContent.replace(regex, '$1\n  useEffect(() => {\n    if (error) {\n      toast.error(error, { id: "error-msg" });\n    }\n  }, [error]);\n');
        
        if (content !== newContent) {
          fs.writeFileSync(filePath, newContent, 'utf8');
          console.log('Fixed:', filePath);
        }
      }
    }
  });
}

walk('src');
console.log('Done');
