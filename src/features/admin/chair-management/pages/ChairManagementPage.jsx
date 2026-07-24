import { useEffect, useState } from 'react';
import { Button, Select, Popconfirm, message, Tooltip, Spin, Modal } from 'antd';
import { Plus, Edit2, Trash2, Armchair, Building2, Eye } from 'lucide-react';
import { chairManagementService } from '../services/chairManagementService';
import { fetchSalons } from '../../salon-management/services/salonsService';
import ChairFormModal from '../components/ChairFormModal';
import toast from 'react-hot-toast';
import ChairMap from '../../../../shared/components/ui/ChairMap';

const { Option } = Select;

export default function ChairManagementPage() {
  const [salons, setSalons] = useState([]);
  const [selectedSalonId, setSelectedSalonId] = useState(null);

  const [chairs, setChairs] = useState([]);
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedChair, setSelectedChair] = useState(null);
  const [initialChairName, setInitialChairName] = useState("");

  const [detailChair, setDetailChair] = useState(null);

  useEffect(() => {
    const loadSalons = async () => {
      try {
        const data = await fetchSalons({ PageSize: 100 });
        setSalons(data || []);
        if (data && data.length > 0) {
          setSelectedSalonId(data[0].salonId || data[0].id);
        }
      } catch (error) {
        toast.error("Failed to load salons");
      }
    };
    loadSalons();
  }, []);

  const loadChairs = async (salonId) => {
    if (!salonId) return;
    setLoading(true);
    try {
      const response = await chairManagementService.getChairsBySalonId({
        salonId,
        pageIndex: 1,
        pageSize: 100, // fetch enough chairs for the grid
      });
      setChairs(response.items || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load chairs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSalonId) {
      loadChairs(selectedSalonId);
    }
  }, [selectedSalonId]);

  const handleDelete = async (chairId) => {
    try {
      await chairManagementService.deleteChair(chairId);
      toast.success("Chair deleted successfully");
      loadChairs(selectedSalonId);
    } catch (error) {
      toast.error(error.message || "Failed to delete chair");
    }
  };

  const openCreateModal = (cellName = "") => {
    setSelectedChair(null);
    setInitialChairName(cellName);
    setIsModalOpen(true);
  };

  const openEditModal = (chair) => {
    setSelectedChair(chair);
    setInitialChairName("");
    setIsModalOpen(true);
  };

  const openDetailModal = (chair) => {
    setDetailChair(chair);
  };

  const handleModalSuccess = () => {
    loadChairs(selectedSalonId);
  };

  const rows = ['A', 'B', 'C', 'D', 'E'];
  const cols = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  const getStatusColor = (status) => {
    if (status === 'Active') return 'bg-emerald-50 text-emerald-600 border-emerald-200';
    if (status === 'Maintenance') return 'bg-amber-50 text-amber-600 border-amber-200';
    return 'bg-slate-50 text-slate-600 border-slate-200';
  };

  // Drag and drop handlers
  const handleDragStart = (e, chair) => {
    e.dataTransfer.setData("chairId", chair.chairId.toString());
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDrop = async (e, targetCellName) => {
    e.preventDefault();
    const chairIdStr = e.dataTransfer.getData("chairId");
    if (!chairIdStr) return;

    // Use string comparison instead of parseInt to support string IDs (e.g. GUIDs)
    const chair = chairs.find(c => String(c.chairId) === chairIdStr);
    if (!chair) {
      console.error("Chair not found for id:", chairIdStr);
      return;
    }

    // Check if dragging to the same cell
    if (chair.chairName?.trim().toUpperCase() === targetCellName.toUpperCase()) return;

    // Check if target cell already has a chair
    const isOccupied = chairs.some(c => c.chairName?.trim().toUpperCase() === targetCellName.toUpperCase());
    if (isOccupied) {
      toast.warning(`Position ${targetCellName} is already occupied!`);
      return;
    }

    // Call update API
    try {
      setLoading(true);
      await chairManagementService.updateChair(chair.chairId, {
        chairName: targetCellName,
        status: chair.status,
      });
      toast.success(`Chair moved to ${targetCellName}`);
      loadChairs(selectedSalonId);
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to move chair");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#fff9fb] text-slate-800 font-sans bg-[radial-gradient(circle_at_top_right,rgba(255,191,73,.15),transparent_38%),radial-gradient(circle_at_top_left,rgba(255,121,198,.15),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(255,163,196,.15),transparent_35%)]">
      {/* Header */}
      <div className="top-0 z-30 flex flex-col gap-4 border-b border-white/40 bg-white/60 px-8 py-6 backdrop-blur-xl md:flex-row md:items-center md:justify-between shadow-[0_8px_30px_rgb(236,72,153,0.04)]">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#ec4899_0%,#fb7185_100%)] text-white shadow-[0_8px_20px_rgba(236,72,153,0.25)]">
            <Armchair size={24} />
          </div>
          <div>
            <h1 className="text-[24px] font-black tracking-tight text-[#432744]">Chair Management</h1>
            <p className="text-[13px] text-[#a88a9d] font-medium mt-1">Manage physical resources across your salons</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-2 bg-white/80 p-1.5 rounded-2xl border border-[#f5d6e3] shadow-[0_4px_12px_rgba(236,72,153,0.04)] transition-all hover:border-[#ef6bb4]">
            <div className="pl-3 text-[#ea4f93]"><Building2 size={18} /></div>
            <Select
              value={selectedSalonId}
              onChange={setSelectedSalonId}
              style={{ width: 220, height: 20 }}
              bordered={false}
              className="font-semibold text-[#432744] [&_.ant-select-selection-item]:text-[#432744]"
              placeholder="Select a salon"
            >
              {salons.map(salon => (
                <Option key={salon.salonId || salon.id} value={salon.salonId || salon.id}>{salon.name}</Option>
              ))}
            </Select>
          </div>
          <Button
            style={{ background: "#ec4899", color: "white", border: "#432744" }}
            icon={<Plus size={18} strokeWidth={3} />}
            onClick={() => openCreateModal()}
            className="flex h-11 items-center justify-center rounded-2xl border-none bg-[linear-gradient(180deg,#f25b99_0%,#d92f7b_100%)] px-6 font-bold text-white shadow-[0_10px_20px_rgba(236,72,153,0.25)] transition-all hover:scale-105 hover:shadow-[0_14px_28px_rgba(236,72,153,0.35)]"
          >
            Add Chair
          </Button>
        </div>
      </div>

      <div className="p-8 mx-auto w-full max-w-7xl">
        <div className="bg-white/70 backdrop-blur-md border border-white/60 rounded-3xl shadow-xl shadow-pink-500/5 p-8">
          {salons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Building2 size={48} className="text-slate-200 mb-4" />
              <p className="text-slate-500 font-medium">No salons available. Please create a salon first.</p>
            </div>
          ) : loading ? (
            <div className="flex justify-center items-center h-64">
              <Spin size="large" className="text-[#ea4f93]" />
            </div>
          ) : (
            <ChairMap 
              chairs={chairs}
              renderCell={(cellName, chair) => {
                if (chair) {
                  return (
                    <div
                      key={cellName}
                      draggable
                      onDragStart={(e) => handleDragStart(e, chair)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, cellName)}
                      className={`group relative flex flex-col items-center justify-center w-[90px] h-[90px] rounded-2xl border-2 transition-all duration-300 ${getStatusColor(chair.status)} hover:shadow-lg hover:shadow-pink-500/10 hover:border-pink-300 hover:scale-[1.02] bg-white cursor-grab active:cursor-grabbing overflow-hidden`}
                    >
                      <Armchair size={28} className="mb-1.5 opacity-80" />
                      <span className="font-bold text-[15px]">{chair.chairName}</span>

                      {/* Hover Actions */}
                      <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 scale-95 group-hover:scale-100">
                        <Tooltip title="View">
                          <Button
                            type="text"
                            size="small"
                            icon={<Eye size={16} />}
                            className="text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 flex items-center justify-center w-7 h-7 rounded-lg px-0"
                            onClick={() => openDetailModal(chair)}
                          />
                        </Tooltip>
                        <Tooltip title="Edit">
                          <Button
                            type="text"
                            size="small"
                            icon={<Edit2 size={16} />}
                            className="text-sky-500 hover:text-sky-600 hover:bg-sky-50 flex items-center justify-center w-7 h-7 rounded-lg px-0"
                            onClick={() => openEditModal(chair)}
                          />
                        </Tooltip>
                        <Popconfirm
                          title="Delete Chair"
                          description="Are you sure you want to delete this chair?"
                          onConfirm={(e) => {
                            e.stopPropagation();
                            handleDelete(chair.chairId);
                          }}
                          okText="Yes"
                          cancelText="No"
                          okButtonProps={{ danger: true, className: 'rounded-lg font-semibold' }}
                          cancelButtonProps={{ className: 'rounded-lg font-semibold' }}
                        >
                          <Tooltip title="Delete">
                            <Button
                              type="text"
                              size="small"
                              danger
                              icon={<Trash2 size={16} />}
                              className="text-red-500 hover:text-red-600 hover:bg-red-50 flex items-center justify-center w-7 h-7 rounded-lg px-0"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </Tooltip>
                        </Popconfirm>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div
                      key={cellName}
                      onClick={() => openCreateModal(cellName)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, cellName)}
                      className="group flex flex-col items-center justify-center w-[90px] h-[90px] rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-pink-50 hover:border-pink-300 cursor-pointer transition-all duration-200"
                    >
                      <div className="h-8 w-8 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-pink-500 group-hover:scale-110 transition-all duration-200 pointer-events-none">
                        <Plus size={18} strokeWidth={3} />
                      </div>
                      <span className="text-[11px] font-bold text-slate-400 group-hover:text-pink-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                        Add {cellName}
                      </span>
                    </div>
                  );
                }
              }}
            />
          )}
        </div>
      </div>

      <ChairFormModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        chair={selectedChair}
        initialChairName={initialChairName}
        salonId={selectedSalonId}
        salons={salons}
        onSuccess={handleModalSuccess}
      />

      <Modal
        title={
          <div className="text-lg font-black tracking-tight text-slate-900 flex items-center gap-2">
            <Armchair className="text-[#ea4f93]" size={24} />
            Chair Details
          </div>
        }
        open={!!detailChair}
        onCancel={() => setDetailChair(null)}
        footer={[
          <Button key="close" onClick={() => setDetailChair(null)} className="rounded-xl border-slate-200 font-semibold">
            Close
          </Button>
        ]}
        className="[&_.ant-modal-content]:rounded-2xl [&_.ant-modal-content]:p-6"
      >
        {detailChair && (
          <div className="mt-6 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <span className="text-slate-500 font-medium">Chair Name</span>
              <span className="font-bold text-slate-800 text-base">{detailChair.chairName}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <span className="text-slate-500 font-medium">Status</span>
              <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${getStatusColor(detailChair.status).replace('border-2', '')}`}>
                {detailChair.status}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <span className="text-slate-500 font-medium">Salon</span>
              <span className="font-bold text-slate-800">{detailChair.salonName}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

