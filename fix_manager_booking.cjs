
const fs = require("fs");
const file = "src/features/manager/bookings/pages/ManagerBookingDetailPage.jsx";
let content = fs.readFileSync(file, "utf8");

if (!content.includes("fetchBookingProceduresByBookingItemId")) {
  const importIndex = content.lastIndexOf("import ");
  const nextLine = content.indexOf("\n", importIndex) + 1;
  content = content.slice(0, nextLine) + "import { fetchBookingProceduresByBookingItemId } from \"../services/bookingProceduresService\";\n" + content.slice(nextLine);
}

const loadBookingRegex = /const mappedBooking = mapBooking\(rawBooking\);[\s\n]*setBooking\(mappedBooking\);/;
if (content.match(loadBookingRegex) && !content.includes("actualTimeStr")) {
  content = content.replace(loadBookingRegex, `const mappedBooking = mapBooking(rawBooking);

      // Fetch actual times if ServiceCompleted
      if (mappedBooking.status === "ServiceCompleted" || mappedBooking.status === "Ðã hoàn thành d?ch v?" || rawBooking.status === "ServiceCompleted") {
        try {
          if (mappedBooking.bookingItems && mappedBooking.bookingItems.length > 0) {
            let allProcedures = [];
            for (const item of mappedBooking.bookingItems) {
              const itemId = item.id || item.bookingItemId;
              if (itemId) {
                const procedures = await fetchBookingProceduresByBookingItemId(itemId);
                if (procedures && Array.isArray(procedures)) {
                   allProcedures = allProcedures.concat(procedures);
                }
              }
            }

            if (allProcedures.length > 0) {
              const actualStartTimes = allProcedures
                .filter(p => p.actualStartTime)
                .map(p => new Date(\`1970-01-01T\${p.actualStartTime}Z\`).getTime())
                .filter(time => !isNaN(time));
                
              const actualEndTimes = allProcedures
                .filter(p => p.actualEndTime)
                .map(p => new Date(\`1970-01-01T\${p.actualEndTime}Z\`).getTime())
                .filter(time => !isNaN(time));
                
              const totalActualDuration = allProcedures.reduce((sum, p) => sum + (p.duration || 0), 0);
              
              if (actualStartTimes.length > 0 && actualEndTimes.length > 0) {
                const minStart = new Date(Math.min(...actualStartTimes));
                const maxEnd = new Date(Math.max(...actualEndTimes));
                
                const formatTimeOnly = (date) => {
                   const h = String(date.getUTCHours()).padStart(2, "0");
                   const m = String(date.getUTCMinutes()).padStart(2, "0");
                   return \`\${h}:\${m}\`;
                };
                
                mappedBooking.actualTimeStr = \`\${formatTimeOnly(minStart)} - \${formatTimeOnly(maxEnd)}\`;
                mappedBooking.actualDuration = totalActualDuration;
              }
            }
          }
        } catch (e) {
          console.warn("Failed to fetch booking procedures for actual times:", e);
        }
      }

      setBooking(mappedBooking);`);
}

const renderRegex = /<div className="rounded-2xl border border-\[#F3E2EC\] bg-\[#FFFDFE\] p-4 shadow-2xs">[\s\n]*<p className="text-\[10px\] font-bold uppercase tracking-wider text-\[#9E8497\] mb-1">\{language === "vi" \? "Th?i gian" : "Time"\}<\/p>[\s\n]*<div className="flex items-center gap-2 text-sm font-semibold text-\[#2B182B\]">[\s\n]*<Clock3 size=\{15\} className="text-\[#E84F93\] shrink-0" \/>[\s\n]*<span>\{booking\?.time\}<\/span>[\s\n]*<\/div>[\s\n]*<\/div>[\s\n]*<div className="rounded-2xl border border-\[#F3E2EC\] bg-\[#FFFDFE\] p-4 shadow-2xs">[\s\n]*<p className="text-\[10px\] font-bold uppercase tracking-wider text-\[#9E8497\] mb-1">\{language === "vi" \? "Th?i lu?ng" : "Duration"\}<\/p>[\s\n]*<div className="flex items-center gap-2 text-sm font-semibold text-\[#2B182B\]">[\s\n]*<Clock3 size=\{15\} className="text-\[#E84F93\] shrink-0" \/>[\s\n]*<span>\{formatDuration\(booking\?.totalDuration, language\)\}<\/span>[\s\n]*<\/div>[\s\n]*<\/div>/;

if (content.match(renderRegex)) {
  content = content.replace(renderRegex, `<div className="rounded-2xl border border-[#F3E2EC] bg-[#FFFDFE] p-4 shadow-2xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#9E8497] mb-1">{language === "vi" ? "Th?i gian" : "Time"}</p>
                <div className="flex items-center gap-2 text-sm font-semibold text-[#2B182B]">
                  <Clock3 size={15} className="text-[#E84F93] shrink-0" />
                  <span>{booking?.actualTimeStr || booking?.time}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-[#F3E2EC] bg-[#FFFDFE] p-4 shadow-2xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#9E8497] mb-1">{language === "vi" ? "Th?i lu?ng" : "Duration"}</p>
                <div className="flex items-center gap-2 text-sm font-semibold text-[#2B182B]">
                  <Clock3 size={15} className="text-[#E84F93] shrink-0" />
                  <span>{booking?.actualDuration ? formatDurationMinutes(booking.actualDuration, language) : formatDuration(booking?.totalDuration, language)}</span>
                </div>
              </div>`);
}

fs.writeFileSync(file, content);
console.log("Updated ManagerBookingDetailPage.jsx");

