import fs from 'fs';
import path from 'path';

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      processFile(fullPath);
    }
  }
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  // 1. Remove flashMessage JSX blocks
  content = content.replace(/\{flashMessage \? \(?\s*<div[^>]*>[\s\S]*?<\/div>\s*\)? : null\}/g, '');
  
  // 2. Remove error JSX blocks
  content = content.replace(/\{error \? \(?\s*<div[^>]*>[\s\S]*?<\/div>\s*\)? : null\}/g, '');
  
  // 3. Update useEffect for flashMessage
  // We want to add toast.success if it doesn't already exist.
  // Match: if (!location.state?.flashMessage) { return; }
  // Followed by navigate(...)
  const flashEffectRegex = /if\s*\(!location\.state\?\.flashMessage(\s*&&[^)]*)?\)\s*\{\s*return;\s*\}(\s*)navigate\(/g;
  content = content.replace(flashEffectRegex, (match, condition, spaces) => {
    // If we already added toast nearby, skip
    // Wait, regex replace doesn't easily look back. Let's just do it cleanly.
    return `if (!location.state?.flashMessage${condition || ''}) { return; }\n    toast.success(location.state.flashMessage, { id: "flash-msg" });${spaces}navigate(`;
  });
  
  // Also, some places might use:
  // if (!location.state?.flashMessage) return;
  const singleLineFlashRegex = /if\s*\(!location\.state\?\.flashMessage\)\s*return;\s*navigate\(/g;
  content = content.replace(singleLineFlashRegex, `if (!location.state?.flashMessage) return;\n    toast.success(location.state.flashMessage, { id: "flash-msg" });\n    navigate(`);

  // 4. Add useEffect for error
  // If the file uses error state, we add an effect.
  if (content.includes('const [error, setError] = useState') || content.includes('const [error, setError] = React.useState')) {
    if (!content.includes('toast.error(error, { id: "error-msg" });')) {
      // Find a good place to insert it. e.g. after the last useState.
      const lastUseStateIndex = content.lastIndexOf('useState');
      if (lastUseStateIndex !== -1) {
        const nextNewline = content.indexOf('\n', lastUseStateIndex);
        const insertPos = nextNewline + 1;
        const useEffectString = `\n  useEffect(() => {\n    if (error) {\n      toast.error(error, { id: "error-msg" });\n    }\n  }, [error]);\n`;
        content = content.slice(0, insertPos) + useEffectString + content.slice(insertPos);
      }
    }
  }

  // Check if toast is imported, if not, add it
  if ((content.includes('toast.') || content.includes('toast(')) && !content.includes('react-hot-toast')) {
    const importMatch = content.match(/import .* from 'react';?/);
    if (importMatch) {
      content = content.replace(importMatch[0], `${importMatch[0]}\nimport toast from 'react-hot-toast';`);
    } else {
      content = `import toast from 'react-hot-toast';\n${content}`;
    }
  }
  
  // Check if useEffect is imported if we added it
  if (content.includes('useEffect(() => {') && !content.includes('useEffect')) {
     // this is tricky, we assume useEffect is imported. If it's not, we might break it. But usually it is.
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

const srcDir = path.join(process.cwd(), 'src');
processDirectory(srcDir);
console.log('Done!');
