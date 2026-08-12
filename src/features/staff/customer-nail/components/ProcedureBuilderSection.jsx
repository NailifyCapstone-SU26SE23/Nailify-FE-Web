import React, { useState, useEffect, useMemo } from "react";
import { Button, Modal, Input, InputNumber, Select, Tooltip } from "antd";
import {
  Plus,
  Trash2,
  Layers,
  Sparkles,
  Clock,
  PlusCircle,
  GripVertical,
  Zap,
  ShieldCheck,
  Palette,
  Lock
} from "lucide-react";
import { fetchProcedures } from '../../../manager/customer-nail/services/customerNailsService';
import { useLanguage } from '../../../../shared/hooks/useLanguage';


export function ProcedureBuilderSection({ nail, procedures = [], setProcedures, onSyncStats, onApplyToQuote, readOnly = false }) {
  const { language } = useLanguage();
  const [dbProcedures, setDbProcedures] = useState([]);
  const [loadingProcedures, setLoadingProcedures] = useState(false);
  const [selectedDbProcedureId, setSelectedDbProcedureId] = useState(null);

  // Drag & Drop State with Section Scope
  const [draggedItem, setDraggedItem] = useState(null); // { section: 'common'|'model', localIndex: number }
  const [dragOverItem, setDragOverItem] = useState(null);

  // Custom step modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customStepName, setCustomStepName] = useState("");
  const [customStepDuration, setCustomStepDuration] = useState(15);
  const [customStepNote, setCustomStepNote] = useState("");

  // Load DB Procedures & Initialize Template dynamically from API
  useEffect(() => {
    async function loadProcedures() {
      setLoadingProcedures(true);
      try {
        // Fetch specific categories via API query parameters instead of filtering client-side
        const [commonList, modelList] = await Promise.all([
          fetchProcedures({ procedureType: "Common", pageSize: 10 }),
          fetchProcedures({ procedureType: "ModelSpecific", pageSize: 10 })
        ]);

        // Save combined list for DB dropdown selection
        setDbProcedures([...commonList, ...modelList]);

        // Auto-generate template combining DB Common Procedures + Custom/Model Procedures
        if ((!procedures || procedures.length === 0) && nail) {
          // 1. Take ALL common steps from the Common API response
          const commonSteps = commonList.map((p, idx) => ({
            id: `step-common-${p.procedureId || p.id || idx}-${Date.now()}`,
            procedureId: p.procedureId || p.id,
            name: p.name || p.procedureName,
            estimatedMinutes: p.activeDuration || p.duration || p.estimatedMinutes || 10,
            stepOrder: idx + 1,
            isCommon: true,
            isCustomStep: false,
            procedureType: "Common",
            note: p.description || "Bước quy trình chung (Salon Standard)",
          }));

          // 2. Model-Specific Procedures - Take at most 2 items
          let modelSpecificSteps = [];

          const assignedProcedures = nail.nailProcedures || nail.customerNailProcedures || [];
          if (assignedProcedures.length > 0) {
            modelSpecificSteps = assignedProcedures.map((np, idx) => {
              const originalProc = modelList.find(m => m.procedureId === np.procedureId) || commonList.find(m => m.procedureId === np.procedureId);

              return {
                id: `step-model-db-${np.procedureId || idx}-${Date.now()}`,
                procedureId: np.procedureId || np.procedure?.procedureId,
                name: np.procedureName || np.procedure?.name || np.name,
                estimatedMinutes: np.procedureDuration || np.procedure?.activeDuration || np.procedure?.duration || np.estimatedMinutes || originalProc?.activeDuration || originalProc?.duration || 15,
                stepOrder: commonSteps.length + idx + 1,
                isCommon: false,
                isCustomStep: np.isCustomStep || false,
                procedureType: np.isCustomStep ? "ArtistCustom" : "ModelSpecific",
                note: np.note || np.procedureDescription || np.procedure?.description || "Bước kỹ thuật riêng gán theo mẫu nail",
              };
            });
          } else if (modelList.length > 0) {
            // Take at most 2 items from the ModelSpecific API response
            modelSpecificSteps = modelList.slice(0, 2).map((p, idx) => ({
              id: `step-model-${p.procedureId || p.id || idx}-${Date.now()}`,
              procedureId: p.procedureId || p.id,
              name: p.name || p.procedureName,
              estimatedMinutes: p.activeDuration || p.duration || p.estimatedMinutes || 15,
              stepOrder: commonSteps.length + idx + 1,
              isCommon: false,
              isCustomStep: false,
              procedureType: "ModelSpecific",
              note: p.description || "Kỹ thuật riêng tượng trưng lấy từ DB",
            }));
          } else {
            // Fallback dynamically constructing 2 symbolic steps from nail specs
            const shapeName = nail.nailShape?.name || "Almond";
            const surfaceName = nail.nailSurface?.name || "Glossy Finish";

            modelSpecificSteps = [
              {
                id: `step-model-shape-${Date.now()}`,
                procedureId: null,
                name: `Tạo phom & Mài dũa móng (${shapeName})`,
                estimatedMinutes: nail.nailShape?.duration || 15,
                stepOrder: commonSteps.length + 1,
                isCommon: false,
                isCustomStep: false,
                procedureType: "ModelSpecific",
                note: `Định hình phom dáng ${shapeName}`,
              },
              {
                id: `step-model-surface-${Date.now()}`,
                procedureId: null,
                name: `Sơn phủ màu & Tạo hiệu ứng (${surfaceName})`,
                estimatedMinutes: nail.nailSurface?.duration || 20,
                stepOrder: commonSteps.length + 2,
                isCommon: false,
                isCustomStep: false,
                procedureType: "ModelSpecific",
                note: `Phủ lớp sơn hiệu ứng ${surfaceName}`,
              },
            ];
          }

          const combined = [...commonSteps, ...modelSpecificSteps].map((step, index) => ({
            ...step,
            stepOrder: index + 1,
          }));

          setProcedures(combined);
        }
      } catch (err) {
        console.error("Error loading DB procedures:", err);
      } finally {
        setLoadingProcedures(false);
      }
    }
    loadProcedures();
  }, [nail?.customerNailId]);

  // Sync total duration whenever procedures change
  const totalDuration = useMemo(() => {
    return procedures.reduce((sum, p) => sum + (Number(p.estimatedMinutes) || 0), 0);
  }, [procedures]);

  useEffect(() => {
    if (onSyncStats) {
      onSyncStats({ totalDuration });
    }
  }, [totalDuration, onSyncStats]);

  // Separate procedures into Common vs Model Specific lists
  const commonProceduresList = useMemo(() => {
    return procedures.filter(p => p.isCommon === true);
  }, [procedures]);

  const modelProceduresList = useMemo(() => {
    return procedures.filter(p => p.isCommon !== true);
  }, [procedures]);

  // Drag and Drop Event Handlers (Section Isolated)
  const handleDragStart = (e, section, localIndex) => {
    setDraggedItem({ section, localIndex });
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, section, localIndex) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.section !== section) {
      e.dataTransfer.dropEffect = "none";
      return;
    }
    e.dataTransfer.dropEffect = "move";
    if (!dragOverItem || dragOverItem.section !== section || dragOverItem.localIndex !== localIndex) {
      setDragOverItem({ section, localIndex });
    }
  };

  const handleDrop = (e, section, dropLocalIndex) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.section !== section) {
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }

    const { localIndex: dragLocalIndex } = draggedItem;
    if (dragLocalIndex === dropLocalIndex) {
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }

    if (section === "common") {
      const updatedCommon = [...commonProceduresList];
      const [moved] = updatedCommon.splice(dragLocalIndex, 1);
      updatedCommon.splice(dropLocalIndex, 0, moved);

      const reorderedAll = [...updatedCommon, ...modelProceduresList].map((p, idx) => ({
        ...p,
        stepOrder: idx + 1,
      }));
      setProcedures(reorderedAll);
    } else {
      const updatedModel = [...modelProceduresList];
      const [moved] = updatedModel.splice(dragLocalIndex, 1);
      updatedModel.splice(dropLocalIndex, 0, moved);

      const reorderedAll = [...commonProceduresList, ...updatedModel].map((p, idx) => ({
        ...p,
        stepOrder: idx + 1,
      }));
      setProcedures(reorderedAll);
    }

    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  // Add DB procedure
  const handleAddDbProcedure = (procedureId) => {
    const found = dbProcedures.find(p => String(p.procedureId || p.id) === String(procedureId));
    if (!found) return;

    const isCommon = found.procedureType === 1 || found.procedureType === "Common" || found.isMainStep;

    const newStep = {
      id: `step-db-${found.procedureId || found.id}-${Date.now()}`,
      procedureId: found.procedureId || found.id,
      name: found.name || found.procedureName,
      estimatedMinutes: found.activeDuration || found.duration || found.estimatedMinutes || 15,
      stepOrder: procedures.length + 1,
      isCommon: isCommon,
      isCustomStep: false,
      procedureType: isCommon ? "Common" : "ModelSpecific",
      note: found.description || "Bước chọn bổ sung từ thư viện DB",
    };

    if (isCommon) {
      const updatedAll = [...commonProceduresList, newStep, ...modelProceduresList].map((p, idx) => ({
        ...p,
        stepOrder: idx + 1,
      }));
      setProcedures(updatedAll);
    } else {
      const updatedAll = [...commonProceduresList, ...modelProceduresList, newStep].map((p, idx) => ({
        ...p,
        stepOrder: idx + 1,
      }));
      setProcedures(updatedAll);
    }

    setSelectedDbProcedureId(null);
  };

  // Add Custom Step (Appends to Model Specific section)
  const handleAddCustomStep = () => {
    if (!customStepName.trim()) return;

    const newStep = {
      id: `step-custom-${Date.now()}`,
      procedureId: null,
      name: customStepName.trim(),
      estimatedMinutes: Number(customStepDuration) || 10,
      stepOrder: procedures.length + 1,
      isCommon: false,
      isCustomStep: true,
      procedureType: "ArtistCustom",
      note: customStepNote.trim() || "Bước kỹ thuật bổ sung do Thợ chỉ định",
    };

    const updatedAll = [...commonProceduresList, ...modelProceduresList, newStep].map((p, idx) => ({
      ...p,
      stepOrder: idx + 1,
    }));

    setProcedures(updatedAll);
    setCustomStepName("");
    setCustomStepDuration(15);
    setCustomStepNote("");
    setIsModalOpen(false);
  };

  // Remove step
  const handleRemoveStep = (targetId) => {
    const filtered = procedures.filter(p => p.id !== targetId);
    const reordered = filtered.map((p, idx) => ({
      ...p,
      stepOrder: idx + 1,
    }));
    setProcedures(reordered);
  };

  // Edit step duration
  const handleUpdateStepDuration = (targetId, value) => {
    const updated = procedures.map(p => {
      if (p.id === targetId) {
        return { ...p, estimatedMinutes: value };
      }
      return p;
    });
    setProcedures(updated);
  };

  // Render individual step card
  const renderStepCard = (step, section, localIndex, globalStepNumber) => {
    const isBeingDragged = draggedItem?.section === section && draggedItem?.localIndex === localIndex;
    const isTargetDrop = dragOverItem?.section === section && dragOverItem?.localIndex === localIndex && !isBeingDragged;
    const isCommon = section === "common";

    return (
      <div
        key={step.id || `${section}-${localIndex}`}
        draggable={!readOnly}
        onDragStart={(e) => handleDragStart(e, section, localIndex)}
        onDragOver={(e) => handleDragOver(e, section, localIndex)}
        onDrop={(e) => handleDrop(e, section, localIndex)}
        onDragEnd={handleDragEnd}
        className={`group relative rounded-2xl border p-3.5 transition-all duration-300 ${isBeingDragged
          ? "opacity-40 scale-[0.98] border-dashed border-[#ea4f93] bg-[#fff0f6]"
          : isTargetDrop
            ? "border-[#ea4f93] ring-4 ring-[#ea4f93]/20 bg-[#fff5f9] scale-[1.01] shadow-lg"
            : readOnly
              ? "border-gray-200 bg-gray-50/50 opacity-80"
              : isCommon
                ? "border-[#a7f3d0] bg-white hover:border-[#34d399] hover:shadow-[0_8px_20px_rgba(16,185,129,0.08)]"
                : step.isCustomStep
                  ? "border-[#e9d5ff] bg-gradient-to-r from-[#faf5ff] to-white hover:border-[#a855f7]"
                  : "border-[#f3d9e8] bg-white hover:border-[#ea4f93] hover:shadow-[0_8px_20px_rgba(236,72,153,0.08)]"
          }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Drag Grip + Index + Title */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {!readOnly && (
              <div
                className="cursor-grab active:cursor-grabbing p-1 rounded-lg text-[#c08aa4] hover:bg-[#fff0f6] hover:text-[#ea4f93] transition-colors shrink-0"
                title={language === "vi" ? "Nhấp giữ & kéo để sắp xếp thứ tự bước trong khung này" : "Click & drag to reorder steps in this frame"}
              >
                <GripVertical size={18} className="opacity-80 group-hover:opacity-100" />
              </div>
            )}

            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black text-white shadow-sm ${isCommon
              ? "bg-gradient-to-br from-[#34d399] to-[#059669]"
              : step.isCustomStep
                ? "bg-gradient-to-br from-[#a855f7] to-[#7e22ce]"
                : "bg-gradient-to-br from-[#ff8ebb] via-[#ea4f93] to-[#c63d79]"
              }`}>
              {globalStepNumber}
            </span>

            <div className="min-w-0 flex-1">
              <p className="font-extrabold text-[#3f2240] text-sm tracking-tight truncate">{step.name}</p>
              {step.note && (
                <p className="text-xs text-[#9c6f87] mt-0.5 font-medium italic truncate">
                  {step.note}
                </p>
              )}
            </div>
          </div>

          {/* Right: Duration Pill (NO PRICE FIELD) & Delete Button */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Duration pill */}
            <div className="flex items-center gap-1.5 bg-gradient-to-br from-[#fff7fa] to-white px-3 py-1.5 rounded-xl border border-[#f5cee1] shadow-xs hover:border-[#ea4f93] transition-colors">
              <Clock size={14} className="text-[#ea4f93]" />
              <InputNumber
                min={1}
                max={300}
                value={step.estimatedMinutes}
                onChange={(val) => handleUpdateStepDuration(step.id, val || 0)}
                className="w-16 text-xs font-extrabold text-[#3f2240]"
                bordered={false}
                controls={false}
                disabled={readOnly}
              />
              <span className="text-[11px] text-[#a988a0] font-extrabold uppercase tracking-wider">{language === "vi" ? "phút" : "min"}</span>
            </div>

            {/* Delete button */}
            {!readOnly && (
              <Tooltip title={language === "vi" ? "Xóa bước này" : "Delete this step"}>
                <Button
                  type="text"
                  size="small"
                  danger
                  onClick={() => handleRemoveStep(step.id)}
                  className="h-8 w-8 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center shrink-0"
                  icon={<Trash2 size={15} />}
                />
              </Tooltip>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-[32px] border border-[#fbcfe8] bg-gradient-to-br from-white via-[#fffafc] to-[#fff2f7] p-6 lg:p-7 shadow-[0_20px_50px_rgba(236,72,153,0.08)] space-y-6">
      {/* Main Header Section */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#f9d4e4] pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff8ebb] via-[#ea4f93] to-[#c63d79] text-white shadow-[0_8px_20px_rgba(234,79,147,0.3)]">
            <Layers size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-xl font-serif font-extrabold text-[#3f2240]">{language === "vi" ? "Quy trình thực hiện móng" : "Nail Implementation Procedure"}</h3>
              <span className="rounded-full bg-[#fff0f6] px-3 py-1 text-[11px] font-extrabold uppercase text-[#ea4f93] border border-[#fbcfe8] shadow-xs">
                {procedures.length} {language === "vi" ? "Bước" : "Steps"}
              </span>
              {!readOnly && (
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-pink-100/60 px-2.5 py-0.5 text-[10px] font-bold text-[#b43e74]">
                  <GripVertical size={12} /> {language === "vi" ? "Kéo thả nội bộ từng khung" : "Drag and drop within each frame"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        {!readOnly && (
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Select DB Procedure */}
            <Select
              placeholder={language === "vi" ? "Chọn các bước có sẵn" : "Select available steps"}
              loading={loadingProcedures}
              value={selectedDbProcedureId}
              onChange={handleAddDbProcedure}
              className="w-56 sm:w-64 custom-procedure-select"
              size="large"
              allowClear
            >
              {dbProcedures.map(p => {
                const isCommon = p.procedureType === 1 || p.procedureType === "Common" || p.isMainStep;
                return (
                  <Select.Option key={p.procedureId || p.id} value={p.procedureId || p.id}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-xs text-[#3f2240] truncate max-w-[130px]">{p.name || p.procedureName}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        {isCommon ? (
                          <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">{language === "vi" ? "Chung" : "Common"}</span>
                        ) : (
                          <span className="text-[9px] font-bold text-purple-700 bg-purple-50 px-1 py-0.2 rounded">{language === "vi" ? "Riêng" : "Specific"}</span>
                        )}
                        <span className="text-[10px] font-bold text-[#ea4f93] bg-pink-50 px-1.5 py-0.5 rounded">
                          {p.activeDuration || p.duration || 15}m
                        </span>
                      </div>
                    </div>
                  </Select.Option>
                );
              })}
            </Select>

            {/* Add Custom Step Button */}
            <Button
              type="primary"
              onClick={() => setIsModalOpen(true)}
              className="h-10 rounded-full bg-gradient-to-r from-[#ea4f93] via-[#df4588] to-[#c63d79] px-5 font-bold border-none flex items-center gap-2 shadow-[0_8px_20px_rgba(234,79,147,0.3)] hover:scale-105 transition-all duration-300"
            >
              <PlusCircle size={16} />
              <span>{language === "vi" ? "Thêm bước mới" : "Add new step"}</span>
            </Button>
          </div>
        )}
      </div>

      {/* Procedure Steps Rendered in 2 Isolated Sub-Sections */}
      {procedures.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#f4c1d8] p-10 text-center bg-[#fff8fb]">
          <Layers className="mx-auto h-10 w-10 text-[#ea4f93] opacity-60 mb-2 animate-bounce" />
          <p className="text-base font-bold text-[#3f2240]">{language === "vi" ? "Chưa có bước quy trình nào trong DB" : "No procedure steps in DB"}</p>
          <p className="text-xs text-[#9c6f87] mt-1 max-w-md mx-auto">
            {language === "vi" ? "Hãy chọn bước chuẩn từ danh sách DB hoặc tạo bước mới cho mẫu customize này để tính chính xác thời gian thực hiện móng." : "Please select standard steps from the DB list or create a new step for this custom design to accurately calculate nail implementation time."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* SECTION 1: Quy trình chung (Common DB Steps Block) */}
          {commonProceduresList.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-emerald-950 tracking-tight">{language === "vi" ? "Quy trình chung" : "Common Procedure"}</h4>
                </div>
              </div>

              <div className="space-y-2.5">
                {commonProceduresList.map((step, idx) => renderStepCard(step, "common", idx, idx + 1))}
              </div>
            </div>
          )}

          {/* SECTION 2: Quy trình riêng theo mẫu Nail (Model-Specific DB Steps Block) */}
          {modelProceduresList.length > 0 && (
            <div className="space-y-4 mt-2">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#ea4f93] to-[#c63d79] text-white shadow-xs">
                  <Palette size={16} />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-[#3f2240] tracking-tight">{language === "vi" ? "Quy trình kỹ thuật riêng mẫu Nail" : "Nail Model Specific Technical Procedure"}</h4>
                </div>
              </div>

              <div className="space-y-2.5">
                {modelProceduresList.map((step, idx) =>
                  renderStepCard(step, "model", idx, commonProceduresList.length + idx + 1)
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Procedure Summary & Sync Bar (No Price Field) */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-[#3f2240] via-[#2d182e] to-[#1e0e1f] p-5 text-white shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md text-[#ff9ec7]">
            <Sparkles size={18} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-pink-200 block">{language === "vi" ? "Tổng Quy Trình Kỹ Thuật" : "Total Technical Procedures"}</span>
            <p className="text-xs text-pink-100 font-medium">{language === "vi" ? "Bao gồm" : "Includes"} {procedures.length} {language === "vi" ? "bước" : "steps"} ({commonProceduresList.length} {language === "vi" ? "bước chung +" : "common steps +"} {modelProceduresList.length} {language === "vi" ? "bước riêng mẫu)" : "specific steps)"}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-5">
          <div className="text-right">
            <span className="text-[9px] font-bold uppercase tracking-widest text-pink-200 block">{language === "vi" ? "Tổng Thời Gian Kỹ Thuật" : "Total Technical Time"}</span>
            <span className="text-xl font-black text-white">{totalDuration} {language === "vi" ? "phút" : "min"}</span>
          </div>

          {onApplyToQuote && (
            <Button
              type="primary"
              onClick={() => onApplyToQuote({ totalDuration })}
              className="h-10 rounded-full bg-gradient-to-r from-[#ea4f93] to-[#df4588] px-5 text-xs font-extrabold border-none flex items-center gap-2 shadow-[0_4px_16px_rgba(234,79,147,0.4)] hover:scale-105 transition-all"
            >
              <Zap size={14} />
              <span>{language === "vi" ? "Đồng bộ Thời Gian vào Báo Giá" : "Sync Time to Quote"}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Modal Add Custom Step */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-[#402542] pb-2 border-b border-pink-100">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fff0f6] text-[#ea4f93]">
              <PlusCircle size={18} />
            </div>
            <span className="font-serif font-extrabold text-lg">{language === "vi" ? "Thêm bước quy trình mới" : "Add new procedure step"}</span>
          </div>
        }
        open={isModalOpen}
        onOk={handleAddCustomStep}
        onCancel={() => setIsModalOpen(false)}
        okText={language === "vi" ? "Thêm vào Quy Trình" : "Add to Procedure"}
        cancelText={language === "vi" ? "Hủy Bỏ" : "Cancel"}
        okButtonProps={{
          className: "h-10 rounded-full bg-gradient-to-r from-[#ea4f93] to-[#df4588] font-bold border-none px-6 shadow-md",
        }}
        cancelButtonProps={{
          className: "h-10 rounded-full font-bold border-pink-200 text-[#a988a0]",
        }}
      >
        <div className="space-y-4 py-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#c08aa4] mb-1.5">
              {language === "vi" ? "Tên bước quy trình" : "Procedure step name"} <span className="text-red-500">*</span>
            </label>
            <Input
              value={customStepName}
              onChange={(e) => setCustomStepName(e.target.value)}
              placeholder={language === "vi" ? "VD: Tạo vân loang đá cẩm thạch, đắp hoa nổi 3D..." : "E.g., create marble veins, 3D flowers..."}
              className="h-11 rounded-xl font-medium"
            />
          </div>

          {/* Quick Preset Buttons for Custom Step Duration */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#c08aa4] mb-1.5">
              {language === "vi" ? "Thời gian ước tính (Phút)" : "Estimated time (Minutes)"}
            </label>
            <div className="flex items-center gap-2 mb-2">
              <InputNumber
                min={1}
                max={300}
                value={customStepDuration}
                onChange={(val) => setCustomStepDuration(val || 15)}
                className="w-full h-11 rounded-xl flex items-center font-bold"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[5, 10, 15, 20, 30, 45, 60].map(mins => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setCustomStepDuration(mins)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${customStepDuration === mins
                    ? "bg-[#ea4f93] text-[#ffffff] shadow-xs"
                    : "bg-pink-50 text-[#ea4f93] hover:bg-pink-100"
                    }`}
                >
                  {mins} {language === "vi" ? "phút" : "min"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#c08aa4] mb-1.5">
              {language === "vi" ? "Ghi chú kỹ thuật (Không bắt buộc)" : "Technical notes (Optional)"}
            </label>
            <Input.TextArea
              value={customStepNote}
              onChange={(e) => setCustomStepNote(e.target.value)}
              placeholder={language === "vi" ? "Ghi chú kỹ thuật hoặc dụng cụ/vật liệu đặc biệt cho bước này..." : "Technical notes or special tools/materials for this step..."}
              rows={3}
              className="rounded-xl font-medium"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
