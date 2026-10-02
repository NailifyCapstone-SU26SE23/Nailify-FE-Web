
const fs = require("fs");
const file = "src/features/admin/promotion-management/pages/PromotionDetailPage.jsx";
let content = fs.readFileSync(file, "utf8");

if (!content.includes("BASIC_STATUS")) {
  const importIndex = content.lastIndexOf("import ");
  const nextLine = content.indexOf("\n", importIndex) + 1;
  content = content.slice(0, nextLine) + "import { BASIC_STATUS } from \"../../../../shared/utils/statusFormatters\";\n" + content.slice(nextLine);
  fs.writeFileSync(file, content);
}
console.log("Done");

