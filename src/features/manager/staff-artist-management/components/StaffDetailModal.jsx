import React, { useState } from "react";
import { Modal, Spin } from "antd";
import { Star, Mail, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { getManagerStaffUpdateRoute } from "../../../../shared/constants/routes";
import { getStaffInitials, STAFF_STATUS_STYLES } from "../services/mockStaffArtists";

export function StaffDetailModal({ staff, onClose, loading }) {
  const avgPerDay =
    staff?.stats?.month && staff.stats.month > 0
      ? (staff.stats.month / 26).toFixed(1)
      : "—";

  return (
    <Modal
      open={!!staff}
      onCancel={onClose}
      footer={null}
      width={520}
      centered
      destroyOnClose
      styles={{
        content: { padding: 0, borderRadius: 24, overflow: "hidden" },
        mask: { backdropFilter: "blur(4px)" },
      }}
    >
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spin size="large" tip="Loading artist detail..." />
        </div>
      ) : staff && (
        <>
          <div className="bg-gradient-to-r from-[#ff8ebb] to-[#ea4f93] px-6 pt-6 pb-10">
            <div className="flex items-center gap-4">
              {staff.avatarUrl ? (
                <img
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                  src={staff.avatarUrl}
                  alt={staff.name}
                  className="h-16 w-16 shrink-0 rounded-full object-cover ring-4 ring-white/40 shadow-lg"
                />
              ) : (
                <div
                  className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${staff.avatarTone} ring-4 ring-white/40 text-xl font-black text-white shadow-lg`}
                >
                  {getStaffInitials(staff.name)}
                </div>
              )}
              <div>
                <h2 className="text-[20px] font-extrabold text-white">{staff.name}</h2>
                <p className="text-[12px] font-semibold text-white/80">{staff.role}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${STAFF_STATUS_STYLES[staff.status]}`}>
                    {staff.status}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-bold text-white/90">
                    <Star size={11} fill="currentColor" className="text-yellow-300" />
                    {staff.rating?.toFixed(1) ?? "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="-mt-6 space-y-4 rounded-[24px] bg-white px-6 pt-6 pb-6">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Today", value: staff.stats?.today ?? "—", sub: "bookings" },
                { label: "This Month", value: staff.stats?.month ?? "—", sub: "bookings" },
                { label: "Revenue", value: staff.stats?.revenue ?? "—", sub: "total" },
              ].map(({ label, value, sub }) => (
                <div
                  key={label}
                  className="rounded-[14px] border border-[#f1e7ed] bg-[#fffafd] px-3 py-3 text-center"
                >
                  <p className="text-[16px] font-extrabold text-[#ea4f93]">{value}</p>
                  <p className="text-[10px] font-semibold text-[#9a5f7f]">{label}</p>
                  <p className="text-[9px] text-[#9a5f7f]">{sub}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[14px] border border-[#f1e7ed] bg-[#fffafd] px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#9a5f7f]">Avg / Work Day</p>
                <p className="mt-1 text-[16px] font-extrabold text-[#2d1b35]">{avgPerDay}</p>
                <p className="text-[9px] text-[#9a5f7f]">bookings per day</p>
              </div>
              <div className="rounded-[14px] border border-[#f1e7ed] bg-[#fffafd] px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#9a5f7f]">Rating</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <Star size={14} fill="#fbbf24" className="text-[#fbbf24]" />
                  <p className="text-[16px] font-extrabold text-[#2d1b35]">{staff.rating?.toFixed(1) ?? "—"}</p>
                </div>
                <p className="text-[9px] text-[#9a5f7f]">customer rating</p>
              </div>
            </div>

            {(staff.email || staff.phone) && (
              <div className="space-y-2 rounded-[14px] border border-[#f1e7ed] bg-[#fffafd] px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#9a5f7f]">Contact</p>
                {staff.email && (
                  <div className="flex items-center gap-2 text-[13px] text-[#7f6478]">
                    <Mail size={14} className="text-[#ea4f93]" />
                    <span>{staff.email}</span>
                  </div>
                )}
                {staff.phone && (
                  <div className="flex items-center gap-2 text-[13px] text-[#7f6478]">
                    <Phone size={14} className="text-[#ea4f93]" />
                    <span>{staff.phone}</span>
                  </div>
                )}
              </div>
            )}

            {staff.skills?.length > 0 && (
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#9a5f7f]">
                  Skills & Specialties
                </p>
                <div className="flex flex-wrap gap-2">
                  {staff.skills.map((skill) => {
                    const nameVal = typeof skill === "string" ? skill : skill.skillTypeName || skill.name || "Skill";
                    return (
                      <span
                        key={nameVal}
                        className="rounded-full bg-[#ffe7ef] px-3 py-1.5 text-[11px] font-semibold text-[#ea4f93]"
                      >
                        {nameVal}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Link
                to={getManagerStaffUpdateRoute(staff.id)}
                className="flex-1 rounded-full bg-gradient-to-r from-[#ff8ebb] to-[#ea4f93] py-2.5 text-center text-[12px] font-bold text-white shadow-[0_10px_22px_rgba(234,79,147,0.22)] transition hover:opacity-95"
              >
                Edit Profile
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-full border border-[#f1c6dd] bg-white py-2.5 text-[12px] font-bold text-[#ea4f93] transition hover:bg-[#fffafd]"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}

StaffDetailModal.propTypes = {
  staff: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};
