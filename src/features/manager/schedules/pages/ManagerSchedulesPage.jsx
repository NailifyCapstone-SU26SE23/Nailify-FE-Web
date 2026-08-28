import React, { useState, useMemo } from 'react';
import { Spin, Alert } from 'antd';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';

import { useSchedules } from '../hooks/useSchedules';
import { SchedulesHeader } from '../components/SchedulesHeader';
import { SchedulesFilterBar } from '../components/SchedulesFilterBar';
import { SchedulesTable } from '../components/SchedulesTable';
import { ScheduleModals } from '../components/ScheduleModals';
import { EmergencyOffModal } from '../../staff-artist-management/components/EmergencyOffModal';
import { createSchedule, updateSchedule, deleteSchedule } from '../services/scheduleService';

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

export function ManagerSchedulesPage() {
  const {
    selectedWeekStart,
    setSelectedWeekStart,
    staffList,
    schedulesList,
    scheduleMatrix,
    isLoading,
    error,
    loadData,
    totalWeeklyHours,
    activeTodayCount
  } = useSchedules();

  const [searchQuery, setSearchQuery] = useState("");
  const [showShiftTimes, setShowShiftTimes] = useState(true);
  const [selectedDayKey, setSelectedDayKey] = useState("ALL");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedScheduleForEdit, setSelectedScheduleForEdit] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formArtistId, setFormArtistId] = useState(null);
  const [formWorkDate, setFormWorkDate] = useState(dayjs());
  const [formStartTimeStr, setFormStartTimeStr] = useState("08:00");
  const [formEndTimeStr, setFormEndTimeStr] = useState("17:00");
  const [formStatus, setFormStatus] = useState("Active");
  const [activePreset, setActivePreset] = useState("MORNING");

  const [isEmergencyOffModalOpen, setIsEmergencyOffModalOpen] = useState(false);
  const [selectedEmergencyArtist, setSelectedEmergencyArtist] = useState(null);

  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(selectedWeekStart.add(i, "day"));
    }
    return days;
  }, [selectedWeekStart]);

  const filteredStaff = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return staffList;
    return staffList.filter(
      (s) => s.name.toLowerCase().includes(q) || s.phone.toLowerCase().includes(q)
    );
  }, [staffList, searchQuery]);

  const handleOpenAddModal = (artistId = null, date = dayjs()) => {
    setFormArtistId(artistId || (staffList[0]?.id || null));
    setFormWorkDate(date);
    setFormStartTimeStr("08:00");
    setFormEndTimeStr("17:00");
    setFormStatus("Active");
    setActivePreset("MORNING");
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (schedule) => {
    setSelectedScheduleForEdit(schedule);
    const matchingStaff = staffList.find(
      (st) =>
        st.id === schedule.nailArtistId ||
        st.nailArtistId === schedule.nailArtistId ||
        st.accountId === schedule.nailArtistId
    );
    setFormArtistId(matchingStaff ? matchingStaff.id : (schedule.nailArtistId || schedule.artistId));
    setFormWorkDate(dayjs(schedule.workDate));

    const startStr = String(schedule.shiftStart || "08:00:00").slice(0, 5);
    const endStr = String(schedule.shiftEnd || "17:00:00").slice(0, 5);
    setFormStartTimeStr(startStr);
    setFormEndTimeStr(endStr);
    setFormStatus(schedule.status || "Active");
    setIsEditModalOpen(true);
  };

  const handleCreateScheduleSubmit = async (values) => {
    if (!formArtistId) {
      toast.error("Please select a staff artist");
      return;
    }
    setIsSubmitting(true);
    try {
      await createSchedule({
        nailArtistId: formArtistId,
        workDate: formWorkDate.format("YYYY-MM-DD"),
        shiftStart: `${formStartTimeStr}:00`,
        shiftEnd: `${formEndTimeStr}:00`,
        status: formStatus,
      });
      toast.success("Shift schedule created successfully!");
      setIsAddModalOpen(false);
      loadData();
    } catch (err) {
      console.error("Failed to create schedule:", err);
      toast.error(err.message || "Failed to create schedule");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditScheduleSubmit = async (values) => {
    if (!selectedScheduleForEdit) return;
    setIsSubmitting(true);
    try {
      await updateSchedule(selectedScheduleForEdit.scheduleId || selectedScheduleForEdit.id, {
        nailArtistId: formArtistId,
        workDate: formWorkDate.format("YYYY-MM-DD"),
        shiftStart: `${formStartTimeStr}:00`,
        shiftEnd: `${formEndTimeStr}:00`,
        status: formStatus,
      });
      toast.success("Shift schedule updated!");
      setIsEditModalOpen(false);
      loadData();
    } catch (err) {
      console.error("Failed to update schedule:", err);
      toast.error(err.message || "Failed to update schedule");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteScheduleClick = async (scheduleId) => {
    if (!window.confirm("Are you sure you want to delete this shift schedule?")) return;
    try {
      await deleteSchedule(scheduleId);
      toast.success("Shift schedule deleted");
      loadData();
    } catch (err) {
      console.error("Failed to delete schedule:", err);
      toast.error(err.message || "Failed to delete schedule");
    }
  };

  const handleEmergencyOff = (artist = null) => {
    setSelectedEmergencyArtist(artist || staffList[0] || null);
    setIsEmergencyOffModalOpen(true);
  };

  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="flex min-h-screen flex-col gap-6 bg-[#FAF6F8] p-4 lg:p-8 font-sans"
    >
      <motion.div variants={fadeInUp}>
        <SchedulesHeader 
          staffCount={staffList.length}
          activeTodayCount={activeTodayCount}
          totalWeeklyHours={totalWeeklyHours}
          selectedWeekStart={selectedWeekStart}
          onAddSchedule={() => handleOpenAddModal()}
        />
      </motion.div>

      {error && (
        <Alert message="Error Loading Schedules" description={error} type="error" showIcon className="mb-4 rounded-xl" />
      )}

      <motion.div variants={fadeInUp}>
        <SchedulesFilterBar 
          selectedWeekStart={selectedWeekStart}
          setSelectedWeekStart={setSelectedWeekStart}
          showShiftTimes={showShiftTimes}
          setShowShiftTimes={setShowShiftTimes}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onEmergencyOff={() => handleEmergencyOff()}
        />
      </motion.div>

      <motion.div variants={fadeInUp}>
        {isLoading ? (
          <div className="flex min-h-[360px] items-center justify-center rounded-2xl bg-white border border-[#F3E2EC]">
            <Spin size="large" tip="Loading staff schedules..." />
          </div>
        ) : (
          <SchedulesTable 
            staffList={filteredStaff}
            scheduleMatrix={scheduleMatrix}
            weekDays={weekDays}
            selectedDayKey={selectedDayKey}
            showShiftTimes={showShiftTimes}
            onAddSchedule={handleOpenAddModal}
            onEditSchedule={handleOpenEditModal}
            onDeleteSchedule={handleDeleteScheduleClick}
            onEmergencyOff={handleEmergencyOff}
          />
        )}
      </motion.div>

      <ScheduleModals 
        staffList={staffList}
        isAddModalOpen={isAddModalOpen}
        setIsAddModalOpen={setIsAddModalOpen}
        isEditModalOpen={isEditModalOpen}
        setIsEditModalOpen={setIsEditModalOpen}
        selectedScheduleForEdit={selectedScheduleForEdit}
        formArtistId={formArtistId}
        setFormArtistId={setFormArtistId}
        formWorkDate={formWorkDate}
        setFormWorkDate={setFormWorkDate}
        formStartTimeStr={formStartTimeStr}
        setFormStartTimeStr={setFormStartTimeStr}
        formEndTimeStr={formEndTimeStr}
        setFormEndTimeStr={setFormEndTimeStr}
        formStatus={formStatus}
        setFormStatus={setFormStatus}
        activePreset={activePreset}
        setActivePreset={setActivePreset}
        isSubmitting={isSubmitting}
        onCreateSubmit={handleCreateScheduleSubmit}
        onEditSubmit={handleEditScheduleSubmit}
      />

      <EmergencyOffModal
        open={isEmergencyOffModalOpen}
        onClose={() => setIsEmergencyOffModalOpen(false)}
        artist={selectedEmergencyArtist}
        artists={staffList}
        onSuccess={() => loadData()}
      />
    </motion.section>
  );
}
