
const fs = require("fs");
const file = "src/features/manager/bookings/pages/ManagerBookingDetailPage.jsx";
let content = fs.readFileSync(file, "utf8");

const badRegex = /const totalActualDuration = Math\.round\(\(maxEnd - minStart\) \/ 60000\);[\s\n]*if \(actualStartTimes\.length > 0 && actualEndTimes\.length > 0\) \{[\s\n]*const minStart = new Date\(Math\.min\(\.\.\.actualStartTimes\)\);[\s\n]*const maxEnd = new Date\(Math\.max\(\.\.\.actualEndTimes\)\);/;

if (content.match(badRegex)) {
  content = content.replace(badRegex, `if (actualStartTimes.length > 0 && actualEndTimes.length > 0) {
                const minStart = new Date(Math.min(...actualStartTimes));
                const maxEnd = new Date(Math.max(...actualEndTimes));
                const totalActualDuration = Math.round((maxEnd - minStart) / 60000);`);
}

fs.writeFileSync(file, content);
console.log("Fixed scoping issue");

