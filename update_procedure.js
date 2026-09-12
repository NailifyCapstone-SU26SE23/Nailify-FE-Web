import fs from 'fs';

const filePath = 'src/features/admin/procedures-management/pages/ProceduresManagementPage.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1
content = content.replace(
  /const \[selectedStatus, setSelectedStatus\] = useState\(""\);\s*const \[selectedRequired, setSelectedRequired\] = useState\(""\);/g,
  `const [selectedStatus, setSelectedStatus] = useState("");\n  const [selectedProcedureType, setSelectedProcedureType] = useState("");\n  const [selectedRequired, setSelectedRequired] = useState("");`
);

// 2
content = content.replace(
  /pageIndex: metaData\.currentPage,\s*pageSize: metaData\.pageSize,\s*\}\);/g,
  `pageIndex: metaData.currentPage,\n          pageSize: metaData.pageSize,\n          status: selectedStatus,\n          procedureType: selectedProcedureType,\n        });`
);
content = content.replace(
  /\}, \[metaData\.currentPage, metaData\.pageSize\]\);/g,
  `}, [metaData.currentPage, metaData.pageSize, selectedStatus, selectedProcedureType]);`
);

// 3
content = content.replace(
  /const filteredProcedures = useMemo\(\(\) => \{\s*return procedures\.filter\(\(procedure\) => \{\s*const normalizedStatus = String\(procedure\.status \|\| ""\)\.toLowerCase\(\);\s*const matchesQuery =\s*!debouncedQuery \|\|\s*String\(procedure\.name \|\| ""\)\.toLowerCase\(\)\.includes\(debouncedQuery\) \|\|\s*String\(procedure\.description \|\| ""\)\.toLowerCase\(\)\.includes\(debouncedQuery\);\s*const matchesStatus = !selectedStatus \|\| normalizedStatus === selectedStatus\.toLowerCase\(\);\s*const matchesRequired =\s*!selectedRequired \|\|\s*\(selectedRequired === "required" \? procedure\.isRequired : !procedure\.isRequired\);\s*return matchesQuery && matchesStatus && matchesRequired;\s*\}\);\s*\}, \[debouncedQuery, procedures, selectedRequired, selectedStatus\]\);/g,
  `const filteredProcedures = useMemo(() => {\n    return procedures.filter((procedure) => {\n      const matchesQuery =\n        !debouncedQuery ||\n        String(procedure.name || "").toLowerCase().includes(debouncedQuery) ||\n        String(procedure.description || "").toLowerCase().includes(debouncedQuery);\n      const matchesRequired =\n        !selectedRequired ||\n        (selectedRequired === "required" ? procedure.isRequired : !procedure.isRequired);\n\n      return matchesQuery && matchesRequired;\n    });\n  }, [debouncedQuery, procedures, selectedRequired]);`
);

// 4
content = content.replace(
  /\], \[navigate, t\],\s*\);/g,
  `], [navigate, t, language],\n  );`
);

// 5
content = content.replace(
  /\{\s*title: t\("adminProcedures\.required"\),\s*dataIndex: "isRequired",\s*key: "isRequired",\s*sorter: \(a, b\) => \(a\.isRequired === b\.isRequired \? 0 : a\.isRequired \? -1 : 1\),\s*render: \(value\) => <ProcedureRequiredBadge isRequired=\{value\} \/>,\s*\},/g,
  `{\n        title: t("adminProcedures.required"),\n        dataIndex: "isRequired",\n        key: "isRequired",\n        sorter: (a, b) => (a.isRequired === b.isRequired ? 0 : a.isRequired ? -1 : 1),\n        render: (value) => <ProcedureRequiredBadge isRequired={value} />,\n      },\n      {\n        title: language === "vi" ? "Loại" : "Type",\n        dataIndex: "procedureType",\n        key: "procedureType",\n        sorter: (a, b) => (a.procedureType || "").localeCompare(b.procedureType || ""),\n        render: (value) => (\n          <span className={\`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold \${value === 'Common' ? 'bg-[#e0f2fe] text-[#0284c7]' : 'bg-[#fef3c7] text-[#d97706]'}\`}>\n            {value === 'Common' ? (language === "vi" ? "Chung" : "Common") : (language === "vi" ? "Riêng" : "Model Specific")}\n          </span>\n        ),\n      },\n      {\n        title: language === "vi" ? "Bước chính" : "Main Step",\n        dataIndex: "isMainStep",\n        key: "isMainStep",\n        sorter: (a, b) => (a.isMainStep === b.isMainStep ? 0 : a.isMainStep ? -1 : 1),\n        render: (value) => (\n          <span className={\`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold \${value ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#f3f4f6] text-[#4b5563]'}\`}>\n             {value ? (language === "vi" ? "Bước chính" : "Main") : (language === "vi" ? "Bước phụ" : "Sub")}\n          </span>\n        ),\n      },`
);

// 6
content = content.replace(
  /<select\s*value=\{selectedStatus\}\s*onChange=\{\(event\) => setSelectedStatus\(event\.target\.value\)\}/g,
  `<select\n              value={selectedProcedureType}\n              onChange={(event) => {\n                setSelectedProcedureType(event.target.value);\n                setMetaData((current) => ({ ...current, currentPage: 1 }));\n              }}\n              className="h-10 rounded-full border border-[#f4d7e5] bg-[#fffafc] px-4 text-sm text-[#5b4658] outline-none focus:border-[#ea4f93]"\n            >\n              <option value="">{language === "vi" ? "Tất cả loại" : "All Types"}</option>\n              <option value="Common">{language === "vi" ? "Chung" : "Common"}</option>\n              <option value="ModelSpecific">{language === "vi" ? "Riêng" : "Model Specific"}</option>\n            </select>\n\n            <select\n              value={selectedStatus}\n              onChange={(event) => {\n                setSelectedStatus(event.target.value);\n                setMetaData((current) => ({ ...current, currentPage: 1 }));\n              }}`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Update completed');
