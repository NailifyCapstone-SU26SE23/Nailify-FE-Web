
const fs = require("fs");
const file = "src/features/manager/staff-artist-management/pages/StaffUpdatePage.jsx";
let content = fs.readFileSync(file, "utf8");

// Add role to formData initialization
content = content.replace(
  /salonId: "",[\s\n]*avatarUrl: "",[\s\n]*imageFile: null,/,
  \`salonId: "",
      role: "Staff_Artist",
      avatarUrl: "",
      imageFile: null,\`
);

// Add role to mockData assignment
content = content.replace(
  /salonId: "",[\s\n]*avatarUrl: "",[\s\n]*imageFile: null,[\s\n]*skillRatings: defaultRatings/,
  \`salonId: "",
              role: "Staff_Artist",
              avatarUrl: "",
              imageFile: null,
              skillRatings: defaultRatings\`
);

// Add role to userData assignment
content = content.replace(
  /salonId,[\s\n]*avatarUrl,[\s\n]*imageFile: null,[\s\n]*skillRatings,/,
  \`salonId,
            role: userData?.role || artistData?.role || "Staff_Artist",
            avatarUrl,
            imageFile: null,
            skillRatings,\`
);

// Update updatePayload
content = content.replace(
  /const updatePayload = \{[\s\n]*email: formData\.email,[\s\n]*firstName: formData\.firstName,[\s\n]*lastName: formData\.lastName,[\s\n]*phone: formData\.phone,[\s\n]*status: formData\.status,[\s\n]*salonId: formData\.salonId,[\s\n]*\};/,
  \`const updatePayload = {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          status: formData.status,
          salonId: formData.salonId,
          role: formData.role || "Staff_Artist",
          avatarUrl: formData.avatarUrl,
        };\`
);

fs.writeFileSync(file, content);
console.log("Updated StaffUpdatePage.jsx");

