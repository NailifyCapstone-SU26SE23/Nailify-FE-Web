
const fs = require("fs");
const file = "src/features/admin/promotion-management/pages/PromotionsManagementPage.jsx";
let content = fs.readFileSync(file, "utf8");

const regex = /function PromotionStatusBadge\(\{ promotion, language \}\) \{[\s\S]*?return \([\s\S]*?<\/span>\s*\);\s*\}/;
content = content.replace(regex, `function PromotionStatusBadge({ promotion, language }) {
  const normalizedStatus = String(promotion?.status || (promotion?.isActive ? "Active" : "Inactive"));
  const statusObj = BASIC_STATUS[normalizedStatus] || BASIC_STATUS.Inactive;

  return (
    <span className={\`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold \${statusObj.tone}\`}>
      {statusObj[language]}
    </span>
  );
}`);

if (!content.includes("BASIC_STATUS")) {
  const importIndex = content.lastIndexOf("import ");
  const nextLine = content.indexOf("\n", importIndex) + 1;
  content = content.slice(0, nextLine) + "import { BASIC_STATUS } from \"../../../../shared/utils/statusFormatters\";\n" + content.slice(nextLine);
}

fs.writeFileSync(file, content);
console.log("Updated PromotionsManagementPage.jsx");

