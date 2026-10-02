
const fs = require("fs");
const file = "src/features/admin/nail-shapes-management/pages/NailShapesManagementPage.jsx";
let content = fs.readFileSync(file, "utf8");

const styleRegex = /\$\{([a-zA-Z0-9_?.\[\]]+)\s*===\s*["\x27]Active["\x27]\s*\?\s*["\x27][^"\x27]+["\x27]\s*:\s*["\x27][^"\x27]+["\x27][\s\n]*\}/g;
const labelRegex = /\{language\s*===\s*["\x27]vi["\x27][\s\n]*\?[\s\n]*\(\s*([a-zA-Z0-9_?.\[\]]+)\s*===\s*["\x27]Active["\x27]\s*\?[\s\n]*["\x27][^"\x27]+["\x27]\s*:[\s\n]*["\x27][^"\x27]+["\x27]\s*\)[\s\n]*:[\s\n]*\1(?:\s*\|\|\s*["\x27][^"\x27]*["\x27])?\}/g;

let matches = content.match(styleRegex);
console.log("Style matches:", matches);

let labelMatches = content.match(labelRegex);
console.log("Label matches:", labelMatches);

