
const fs = require("fs");
const path = require("path");

const filesToUpdate = [
  "src/features/admin/chair-management/pages/ChairManagementPage.jsx",
  "src/features/admin/components-management/pages/ComponentDetailPage.jsx",
  "src/features/admin/components-management/pages/ComponentsManagementPage.jsx",
  "src/features/admin/nail-shapes-management/pages/NailShapeDetailPage.jsx",
  "src/features/admin/nail-shapes-management/pages/NailShapesManagementPage.jsx",
  "src/features/admin/nail-surfaces-management/pages/NailSurfaceDetailPage.jsx",
  "src/features/admin/nail-surfaces-management/pages/NailSurfacesManagementPage.jsx",
  "src/features/admin/procedures-management/pages/ProcedureDetailPage.jsx",
  "src/features/admin/procedures-management/pages/ProceduresManagementPage.jsx",
  "src/features/admin/promotion-management/pages/PromotionDetailPage.jsx",
  "src/features/admin/promotion-management/pages/PromotionsManagementPage.jsx",
  "src/features/admin/service-pricing-management/pages/ServicePricingManagementPage.jsx",
  "src/features/admin/skill-types-management/pages/SkillTypeDetailPage.jsx",
  "src/features/admin/skill-types-management/pages/SkillTypesManagementPage.jsx",
  "src/features/admin/staff-management/pages/StaffManagementPage.jsx",
  "src/features/admin/staff-management/pages/StaffUpdatePage.jsx",
  "src/features/admin/category-types-management/pages/CategoryTypeDetailPage.jsx",
  "src/features/admin/category-types-management/pages/CategoryTypesManagementPage.jsx",
  "src/features/core/auth/pages/profilePage.jsx"
];

const styleRegex = /\$\{([a-zA-Z0-9_?.\[\]]+)\s*===\s*["\x27]Active["\x27]\s*\?\s*["\x27][^"\x27]+["\x27]\s*:\s*["\x27][^"\x27]+["\x27][\s\r\n]*\}/g;
const labelRegex = /\{language\s*===\s*["\x27]vi["\x27][\s\r\n]*\?[\s\r\n]*\(\s*([a-zA-Z0-9_?.\[\]]+)\s*===\s*["\x27]Active["\x27]\s*\?[\s\r\n]*["\x27][^"\x27]+["\x27]\s*:[\s\r\n]*["\x27][^"\x27]+["\x27]\s*\)[\s\r\n]*:[\s\r\n]*\1(?:\s*\|\|\s*["\x27][^"\x27]*["\x27])?\}/g;

for (const f of filesToUpdate) {
  if (!fs.existsSync(f)) {
      console.log("File not found: " + f);
      continue;
  }
  let content = fs.readFileSync(f, "utf8");
  let modified = false;
  
  if (content.match(labelRegex)) {
    content = content.replace(labelRegex, (match, varName) => {
      return `{BASIC_STATUS[${varName}]?.[language] || ${varName}}`;
    });
    modified = true;
  }
  
  if (content.match(styleRegex)) {
    content = content.replace(styleRegex, (match, varName) => {
      return `\${BASIC_STATUS[${varName}]?.tone || "bg-gray-100 text-gray-600 border border-gray-200"}`;
    });
    modified = true;
  }

  if (modified) {
    if (!content.includes("BASIC_STATUS")) {
      let relativePath = path.relative(path.dirname(f), "src/shared/utils/statusFormatters.js").replace(/\\/g, "/");
      if (!relativePath.startsWith(".")) relativePath = "./" + relativePath;
      if (relativePath.endsWith(".js")) relativePath = relativePath.slice(0, -3);
      
      const importStmt = `import { BASIC_STATUS } from "${relativePath}";\n`;
      const lastImportIndex = content.lastIndexOf("import ");
      if (lastImportIndex !== -1) {
        const nextLine = content.indexOf("\n", lastImportIndex) + 1;
        content = content.slice(0, nextLine) + importStmt + content.slice(nextLine);
      } else {
        content = importStmt + content;
      }
    }
    fs.writeFileSync(f, content, "utf8");
    console.log("Updated: " + f);
  }
}
console.log("Done");

