
const fs = require("fs");
const file = "src/features/manager/bookings/pages/ManagerBookingDetailPage.jsx";
let content = fs.readFileSync(file, "utf8");

const regex = /const totalActualDuration = allProcedures\.reduce\(\(sum, p\) => sum \+ \(p\.duration \|\| 0\), 0\);/;

if (content.match(regex)) {
  content = content.replace(regex, `const minStart = new Date(Math.min(...actualStartTimes));
                const maxEnd = new Date(Math.max(...actualEndTimes));
                const totalActualDuration = Math.round((maxEnd - minStart) / 60000);`);
}

const minStartRegex = /const minStart = new Date\(Math\.min\(\.\.\.actualStartTimes\)\);[\s\n]*const maxEnd = new Date\(Math\.max\(\.\.\.actualEndTimes\)\);/;
if (content.match(minStartRegex)) {
  content = content.replace(minStartRegex, "");
}

fs.writeFileSync(file, content);
console.log("Updated ManagerBookingDetailPage.jsx");

