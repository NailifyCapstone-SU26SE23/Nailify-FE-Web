import fs from 'fs';

const filePath = 'src/features/admin/procedures-management/pages/ProcedureDetailPage.jsx';
let content = fs.readFileSync(filePath, 'utf8');

const regex = /<section className="rounded-\[24px\] border border-rose-50 bg-white\/80 p-6 shadow-\[0_24px_60px_rgba\(226,93,143,0\.1\)\] backdrop-blur">[\s\S]*?<\/section>/;

const newUI = `<section className="rounded-[24px] border border-rose-50 bg-white/90 p-8 shadow-[0_24px_60px_rgba(226,93,143,0.08)] backdrop-blur">
            <h2 className="mb-8 flex items-center gap-3 text-[22px] font-bold text-slate-800">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#eb5b92] to-[#cf3d74] text-white shadow-lg shadow-rose-200">
                <FileText size={18} />
              </div>
              {t("adminProcedures.procedureInformation")}
            </h2>

            <div className="grid gap-6">
              <div className="grid gap-6 md:grid-cols-2">
                <label className="space-y-2.5 md:col-span-2">
                  <span className="text-[13px] font-bold text-slate-700">{t("adminProcedures.procedureName")}</span>
                  <div className={\`flex items-center gap-2 rounded-2xl border \${isEditing ? 'border-rose-300 bg-white shadow-[0_4px_20px_rgba(226,93,143,0.08)]' : 'border-rose-100 bg-[#fff8fb]'} px-4 py-3.5 transition-all\`}>
                    <ClipboardList size={16} className={\`shrink-0 \${isEditing ? 'text-rose-500' : 'text-rose-300'}\`} />
                    <input
                      type="text"
                      value={draft?.name || ""}
                      onChange={(event) => handleFieldChange("name", event.target.value)}
                      disabled={!isEditing}
                      className="w-full bg-transparent text-[14px] font-medium text-slate-800 outline-none disabled:cursor-default"
                    />
                  </div>
                </label>

                <label className="space-y-2.5 md:col-span-2">
                  <span className="text-[13px] font-bold text-slate-700">{t("adminProcedures.description")}</span>
                  <div className={\`flex items-start gap-2 rounded-2xl border \${isEditing ? 'border-rose-300 bg-white shadow-[0_4px_20px_rgba(226,93,143,0.08)]' : 'border-rose-100 bg-[#fff8fb]'} px-4 py-3.5 transition-all\`}>
                    <FileText size={16} className={\`mt-0.5 shrink-0 \${isEditing ? 'text-rose-500' : 'text-rose-300'}\`} />
                    <textarea
                      rows={4}
                      value={draft?.description || ""}
                      onChange={(event) => handleFieldChange("description", event.target.value)}
                      disabled={!isEditing}
                      className="w-full resize-none bg-transparent text-[14px] font-medium text-slate-800 outline-none disabled:cursor-default"
                    />
                  </div>
                </label>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <label className="space-y-2.5">
                  <span className="text-[13px] font-bold text-slate-700">{language === "vi" ? "Loại quy trình" : "Procedure Type"}</span>
                  <div className={\`flex items-center gap-2 rounded-2xl border \${isEditing ? 'border-rose-300 bg-white shadow-[0_4px_20px_rgba(226,93,143,0.08)]' : 'border-rose-100 bg-[#fff8fb]'} px-4 py-3.5 transition-all\`}>
                    <ListTree size={16} className={\`shrink-0 \${isEditing ? 'text-rose-500' : 'text-rose-300'}\`} />
                    <select
                      value={draft?.procedureType || "Common"}
                      onChange={(event) => handleFieldChange("procedureType", event.target.value)}
                      disabled={!isEditing}
                      className="w-full bg-transparent text-[14px] font-medium text-slate-800 outline-none disabled:cursor-default"
                    >
                      <option value="Common">{language === "vi" ? "Chung" : "Common"}</option>
                      <option value="ModelSpecific">{language === "vi" ? "Riêng theo mẫu" : "Model Specific"}</option>
                    </select>
                  </div>
                </label>

                <label className="space-y-2.5">
                  <span className="text-[13px] font-bold text-slate-700">{language === "vi" ? "Loại bước" : "Step Type"}</span>
                  <div className={\`flex items-center gap-2 rounded-2xl border \${isEditing ? 'border-rose-300 bg-white shadow-[0_4px_20px_rgba(226,93,143,0.08)]' : 'border-rose-100 bg-[#fff8fb]'} px-4 py-3.5 transition-all\`}>
                    <Sparkles size={16} className={\`shrink-0 \${isEditing ? 'text-rose-500' : 'text-rose-300'}\`} />
                    <select
                      value={draft?.isMainStep ? "true" : "false"}
                      onChange={(event) => handleFieldChange("isMainStep", event.target.value === "true")}
                      disabled={!isEditing}
                      className="w-full bg-transparent text-[14px] font-medium text-slate-800 outline-none disabled:cursor-default"
                    >
                      <option value="true">{language === "vi" ? "Bước chính" : "Main Step"}</option>
                      <option value="false">{language === "vi" ? "Bước phụ" : "Sub Step"}</option>
                    </select>
                  </div>
                </label>

                <label className="space-y-2.5">
                  <span className="text-[13px] font-bold text-slate-700">{t("adminProcedures.duration")} (phút)</span>
                  <div className={\`flex items-center gap-2 rounded-2xl border \${isEditing ? 'border-rose-300 bg-white shadow-[0_4px_20px_rgba(226,93,143,0.08)]' : 'border-rose-100 bg-[#fff8fb]'} px-4 py-3.5 transition-all\`}>
                    <Clock3 size={16} className={\`shrink-0 \${isEditing ? 'text-rose-500' : 'text-rose-300'}\`} />
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={draft?.duration || ""}
                      onChange={(event) => handleFieldChange("duration", event.target.value)}
                      disabled={!isEditing}
                      className="w-full bg-transparent text-[14px] font-medium text-slate-800 outline-none disabled:cursor-default"
                    />
                  </div>
                </label>

                <label className="space-y-2.5">
                  <span className="text-[13px] font-bold text-slate-700">{t("adminProcedures.requirement")}</span>
                  <div className={\`flex items-center gap-2 rounded-2xl border \${isEditing ? 'border-rose-300 bg-white shadow-[0_4px_20px_rgba(226,93,143,0.08)]' : 'border-rose-100 bg-[#fff8fb]'} px-4 py-3.5 transition-all\`}>
                    <ShieldCheck size={16} className={\`shrink-0 \${isEditing ? 'text-rose-500' : 'text-rose-300'}\`} />
                    <select
                      value={draft?.isRequired ? "true" : "false"}
                      onChange={(event) => handleFieldChange("isRequired", event.target.value === "true")}
                      disabled={!isEditing}
                      className="w-full bg-transparent text-[14px] font-medium text-slate-800 outline-none disabled:cursor-default"
                    >
                      <option value="true">{t("adminProcedures.required")}</option>
                      <option value="false">{t("adminProcedures.optional")}</option>
                    </select>
                  </div>
                </label>

                <label className="space-y-2.5 md:col-span-2">
                  <span className="text-[13px] font-bold text-slate-700">{t("adminProcedures.status")}</span>
                  <div className={\`flex items-center gap-2 rounded-2xl border \${isEditing ? 'border-rose-300 bg-white shadow-[0_4px_20px_rgba(226,93,143,0.08)]' : 'border-rose-100 bg-[#fff8fb]'} px-4 py-3.5 transition-all\`}>
                    <ShieldCheck size={16} className={\`shrink-0 \${isEditing ? 'text-rose-500' : 'text-rose-300'}\`} />
                    <select
                      value={draft?.status || PROCEDURE_STATUS_OPTIONS[0]}
                      onChange={(event) => handleFieldChange("status", event.target.value)}
                      disabled={!isEditing}
                      className="w-full bg-transparent text-[14px] font-medium text-slate-800 outline-none disabled:cursor-default"
                    >
                      {PROCEDURE_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status === 'Active' ? (language === 'vi' ? 'Hoạt động' : 'Active') : (language === 'vi' ? 'Ngưng hoạt động' : 'Inactive')}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>
              </div>
            </div>
          </section>`;

if (regex.test(content)) {
  content = content.replace(regex, newUI);
  console.log("UI updated.");
} else {
  console.log("UI block not found! Reverting...");
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Update completed');
