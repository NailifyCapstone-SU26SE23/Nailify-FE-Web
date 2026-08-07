import { useLanguage } from "../../../../shared/hooks/useLanguage";
import { Building2, CalendarDays, Clock3, LoaderCircle, MapPin, PencilLine, Phone, Save, Star, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { Table } from "antd";
import toast from "react-hot-toast";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import { ROUTES } from "../../../../shared/constants/routes";
import { fetchSalonById } from "../../salon-management/services/salonsService";
import { UserManagementFormFields } from "../components/UserManagementFormFields";
import { UserManagementHeroCard } from "../components/UserManagementHeroCard";
import { UserManagementSnapshotCard } from "../components/UserManagementSnapshotCard";
import {
  deleteAdminUser,
  fetchAdminUserDetail,
  updateAdminUser,
} from "../services/userManagementService";
import {
  fetchArtistSchedules,
  fetchNailArtistById,
  fetchNailArtistSkills,
} from "../../../manager/staff-artist-management/services/nailArtistsService";

function formatWorkDate(value) {
  if (!value) {
    return "--";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return "--";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
}

function formatShiftRange(start, end) {
  if (!start || !end) {
    return "--";
  }

  return `${String(start).slice(0, 5)} - ${String(end).slice(0, 5)}`;
}

function getScheduleStatusClass(status) {
  switch (String(status || "").trim().toLowerCase()) {
    case "active":
      return "bg-[#edfdf4] text-[#16975f]";
    case "inactive":
      return "bg-[#f4f1ff] text-[#7157d9]";
    default:
      return "bg-[#fff0f5] text-[#d14c84]";
  }
}

function InfoSection({ icon: Icon, title, children }) {
  return (
    <section className="rounded-[22px] border border-[#f6dbe7] bg-[linear-gradient(180deg,#fffdfd_0%,#fff8fb_100%)] p-5 shadow-[0_14px_30px_rgba(94,76,62,0.04)]">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff0f6] text-[#d45b9f]">
          <Icon size={18} />
        </div>
        <h3 className="text-lg font-semibold text-[var(--color-ink)]">{title}</h3>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function StarRating({ level = 0, max = 5 }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }, (_, index) => {
        const active = index < Number(level || 0);

        return (
          <Star
            key={index}
            size={14}
            className={active ? "fill-[#f7b731] text-[#f7b731]" : "text-[#ead6c4]"}
          />
        );
      })}
    </div>
  );
}

export function UserManagementDetailPage() {
  const { t, language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { userId } = useParams();
  const [initialUser, setInitialUser] = useState(null);
  const [formValues, setFormValues] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [flashMessage, setFlashMessage] = useState("");
  const [isEditing, setIsEditing] = useState(Boolean(location.state?.requestEdit));
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(
    Boolean(location.state?.requestDelete),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [salonDetail, setSalonDetail] = useState(null);
  const [artistDetail, setArtistDetail] = useState(null);
  const [artistSkills, setArtistSkills] = useState([]);
  const [artistSchedules, setArtistSchedules] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      setIsLoading(true);
      setLoadError("");

      try {
        const user = await fetchAdminUserDetail(userId);

        const [
          nextSalonDetail,
          nextArtistDetail,
          nextArtistSkills,
          nextArtistSchedules,
        ] = await Promise.all([
          user?.salonId ? fetchSalonById(user.salonId).catch(() => null) : Promise.resolve(null),
          user?.staffId ? fetchNailArtistById(user.staffId).catch(() => null) : Promise.resolve(null),
          user?.staffId ? fetchNailArtistSkills(user.staffId).catch(() => []) : Promise.resolve([]),
          user?.staffId ? fetchArtistSchedules(user.staffId).catch(() => []) : Promise.resolve([]),
        ]);

        if (!isMounted) {
          return;
        }

        const detailValues = {
          ...user,
          branch: user.salon,
          status: user.status,
          joinedAt: user.joinedAt,
          lastActive: user.lastActive,
          notes: "",
        };

        setInitialUser(detailValues);
        setFormValues(detailValues);
        setSalonDetail(nextSalonDetail);
        setArtistDetail(nextArtistDetail);
        setArtistSkills(Array.isArray(nextArtistSkills) ? nextArtistSkills : []);
        setArtistSchedules(Array.isArray(nextArtistSchedules) ? nextArtistSchedules : []);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message = error instanceof Error ? error.message : t("userManagement.detail.loadDetailFailed");
        setLoadError(message);
        toast.error(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadUser();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  if (!userId) {
    return <Navigate to={ROUTES.adminUsers} replace />;
  }

  if (isLoading) {
    return (
      <section className="flex min-h-full items-center justify-center rounded-[24px] bg-white p-6">
        <div className="flex items-center gap-3 text-sm text-[#b38a9f]">
          <LoaderCircle size={18} className="animate-spin text-[#ea4f93]" />
          {t("userManagement.detail.loadingDetails")}
        </div>
      </section>
    );
  }

  if (loadError || !initialUser || !formValues) {
    return <Navigate to={ROUTES.adminUsers} replace />;
  }

  const handleChange = (field) => (event) => {
    const nextValue = event.target.value;

    setFormValues((current) => ({
      ...current,
      [field]: nextValue,
      ...(field === "firstName" || field === "lastName"
        ? {
          name: [
            field === "firstName" ? nextValue : current.firstName,
            field === "lastName" ? nextValue : current.lastName,
          ]
            .filter(Boolean)
            .join(" ")
            .trim(),
        }
        : {}),
    }));
  };

  const displayName =
    [formValues.firstName, formValues.lastName].filter(Boolean).join(" ").trim() ||
    formValues.name ||
    t("userManagement.detail.userProfile");
  const normalizedRole = String(formValues.rawRole || formValues.role || "").trim().toLowerCase();
  const shouldShowSalonDetail = ["staff_artist", "manager", "receptionist"].includes(normalizedRole) && Boolean(salonDetail);
  const shouldShowSkills = normalizedRole === "staff_artist";
  const shouldShowWorkSchedule = normalizedRole !== "customer";
  const sortedSchedules = [...artistSchedules].sort(
    (left, right) => new Date(left?.workDate || 0).getTime() - new Date(right?.workDate || 0).getTime(),
  );
  const scheduleColumns = [
    {
      title: t("userManagement.detail.workDate"),
      dataIndex: "workDate",
      key: "workDate",
      render: (value) => <span className="font-semibold text-[var(--color-ink)]">{formatWorkDate(value)}</span>,
    },
    {
      title: t("userManagement.detail.shift"),
      key: "shift",
      render: (_, schedule) => (
        <span className="inline-flex items-center gap-2 text-sm text-[var(--color-muted)]">
          <Clock3 size={14} className="text-[#d45b9f]" />
          {formatShiftRange(schedule.shiftStart, schedule.shiftEnd)}
        </span>
      ),
    },
    {
      title: t("userManagement.detail.status"),
      dataIndex: "status",
      key: "status",
      render: (value) => (
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getScheduleStatusClass(value)}`}>
          {value || t("userManagement.detail.unknown")}
        </span>
      ),
    },
  ];

  const handleSave = async () => {
    const firstName = String(formValues.firstName || "").trim();
    const lastName = String(formValues.lastName || "").trim();
    const email = String(formValues.email || "").trim();

    if (!firstName || !lastName || !email) {
      toast.error(t("userManagement.detail.validationRequired"));
      return;
    }

    setIsSaving(true);

    try {
      const updatedUser = await updateAdminUser(userId, formValues);
      const nextValues = {
        ...updatedUser,
        branch: updatedUser.salon,
        status: updatedUser.status,
        joinedAt: updatedUser.joinedAt,
        lastActive: updatedUser.lastActive,
        notes: formValues.notes || "",
      };

      setInitialUser(nextValues);
      setFormValues(nextValues);
      setShowSaveConfirm(false);
      setIsEditing(false);
      setFlashMessage(t("userManagement.detail.updateSuccess"));
      toast.success(t("userManagement.detail.updateSuccess"));
    } catch (error) {
      const message = error instanceof Error ? error.message : t("userManagement.detail.updateFailed");
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEdit = () => {
    setFlashMessage("");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setShowCancelConfirm(false);
    setFormValues(initialUser);
    setFlashMessage("");
    setIsEditing(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      await deleteAdminUser(userId);
      setShowDeleteConfirm(false);
      toast.success(t("userManagement.detail.deleteSuccess"));
      navigate(ROUTES.adminUsers, {
        state: {
          flashMessage: t("userManagement.detail.deleteSuccess"),
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : t("userManagement.detail.deleteFailed");
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="flex min-h-full flex-col gap-4">
      <UserManagementHeroCard
        avatarUrl={formValues.avatarUrl}
        backLabel={t("back")}
        backTo={ROUTES.adminUsers}
        badge={t("menus.admin-users") || "Users"}
        title={displayName}
        description={t("userManagement.detail.detailNotice")}
        headerActions={!isEditing ? (
          <>
            <button
              type="button"
              onClick={handleStartEdit}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[image:var(--gradient-accent)] px-5 text-sm font-semibold text-white shadow-[0_14px_26px_rgba(239,93,180,0.24)] transition hover:scale-[1.01]"
            >
              <PencilLine size={16} />
              <span>{t("userManagement.detail.editUser")}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#fff0f5] px-5 text-sm font-semibold text-[#d14c84] transition hover:bg-[#ffe1ec] disabled:opacity-70"
            >
              {isDeleting ? <LoaderCircle size={16} className="animate-spin" /> : <Trash2 size={16} />}
              <span>{isDeleting ? t("userManagement.detail.deleting") : t("userManagement.detail.deleteUser")}</span>
            </button>
          </>
        ) : null}
        panelIcon={<PencilLine size={18} className="text-[#d45b9f]" />}
        panelTitle={isEditing ? t("userManagement.detail.editMode") : t("userManagement.detail.viewMode")}
        panelDescription={t("userManagement.detail.detailDataLoadedDesc")}
      />

      {flashMessage ? (
        <div className="rounded-[22px] bg-[#edfdf4] px-5 py-4 text-sm font-medium text-[#16975f] shadow-[0_14px_30px_rgba(94,76,62,0.06)]">
          {flashMessage}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <article className="rounded-[24px] bg-white p-4 shadow-[0_16px_34px_rgba(94,76,62,0.06)] sm:p-5 md:p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <UserManagementFormFields
              formValues={formValues}
              onFieldChange={handleChange}
              disabled={!isEditing}
              updateApiFieldsOnly
            />
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowSaveConfirm(true)}
                  disabled={isSaving}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[image:var(--gradient-accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_26px_rgba(239,93,180,0.24)] transition hover:scale-[1.01] sm:w-auto"
                >
                  {isSaving ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
                  <span>{isSaving ? t("userManagement.detail.creating") : t("userManagement.detail.saveChanges")}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(true)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#fff5ef] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[#ffe9d7] sm:w-auto"
                >
                  <span>{t("userManagement.detail.discardChanges")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isDeleting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#fff0f5] px-5 py-3 text-sm font-semibold text-[#d14c84] transition hover:bg-[#ffe1ec] sm:w-auto"
                >
                  {isDeleting ? <LoaderCircle size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  <span>{isDeleting ? t("userManagement.detail.deleting") : t("userManagement.detail.deleteUser")}</span>
                </button>
              </>
            ) : null}
          </div>

          <div className="mt-8 space-y-4">
            {shouldShowSalonDetail ? (
              <InfoSection icon={Building2} title={t("userManagement.detail.assignedSalon")}>
                <div className="grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)]">
                  {salonDetail?.imageUrl ? (
                    <img
                      src={salonDetail.imageUrl}
                      alt={salonDetail.name || "Salon"}
                      className="h-40 w-full rounded-[20px] border border-[#f6dbe7] object-cover"
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                    />
                  ) : null}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d39bb5]">{t("userManagement.detail.salonName")}</p>
                      <p className="mt-2 font-semibold text-[var(--color-ink)]">{salonDetail?.name || "--"}</p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d39bb5]">{t("userManagement.detail.status")}</p>
                      <p className="mt-2 font-semibold text-[var(--color-ink)]">{salonDetail?.status || "--"}</p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3 sm:col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d39bb5]">{t("userManagement.detail.address")}</p>
                      <p className="mt-2 flex items-start gap-2 text-[var(--color-ink)]"><MapPin size={15} className="mt-0.5 text-[#d45b9f]" />{salonDetail?.address || "--"}</p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d39bb5]">{t("userManagement.detail.phone")}</p>
                      <p className="mt-2 flex items-center gap-2 text-[var(--color-ink)]"><Phone size={15} className="text-[#d45b9f]" />{salonDetail?.phone || "--"}</p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d39bb5]">Artist {t("userManagement.detail.status")}</p>
                      <p className="mt-2 font-semibold text-[var(--color-ink)]">{artistDetail?.status || formValues.status || "--"}</p>
                    </div>
                  </div>
                </div>
              </InfoSection>
            ) : null}

            {shouldShowSkills ? (
              <InfoSection icon={Star} title={t("userManagement.detail.skillRatings")}>
                {artistSkills.length ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {artistSkills.map((skill) => (
                      <div
                        key={skill.nailArtistSkillId || `${skill.skillTypeId}-${skill.skillTypeName}`}
                        className="rounded-2xl bg-white px-4 py-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-[var(--color-ink)]">{skill.skillTypeName || "Skill"}</p>
                            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[#d39bb5]">Level {skill.level ?? 0}/5</p>
                          </div>
                          <StarRating level={skill.level} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl bg-white px-4 py-4 text-sm text-[#8f7c6d]">
                    {t("userManagement.detail.noSkillsAssigned")}
                  </div>
                )}
              </InfoSection>
            ) : null}

            {shouldShowWorkSchedule ? (
              <InfoSection icon={CalendarDays} title={t("userManagement.detail.workSchedule")}>
                {formValues.staffId ? (
                  sortedSchedules.length ? (
                    <div className="overflow-hidden rounded-[20px] border border-[#f6dbe7] bg-white">
                      <Table
                        rowKey={(schedule) => schedule.scheduleId || `${schedule.workDate}-${schedule.shiftStart}-${schedule.shiftEnd}`}
                        columns={scheduleColumns}
                        dataSource={sortedSchedules}
                        pagination={false}
                        locale={{ emptyText: t("userManagement.detail.noWorkScheduleFound") }}
                        scroll={{ x: 640 }}
                      />
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-white px-4 py-4 text-sm text-[#8f7c6d]">
                      {t("userManagement.detail.noWorkScheduleFound")}
                    </div>
                  )
                ) : (
                  <div className="rounded-2xl bg-white px-4 py-4 text-sm text-[#8f7c6d]">
                    {t("userManagement.detail.notLinkedToArtist")}
                  </div>
                )}
              </InfoSection>
            ) : null}
          </div>
        </article>

        <UserManagementSnapshotCard
          formValues={formValues}
          notice={t("userManagement.detail.detailNotice")}
        />
      </div>

      <ActionConfirmModal
        open={showSaveConfirm}
        intent="success"
        title={t("userManagement.detail.saveUserChanges")}
        subtitle={t("userManagement.detail.saveUserChanges")}
        description={t("userManagement.detail.saveUserChangesDesc")}
        confirmText={t("userManagement.detail.saveChangesBtn")}
        cancelText={t("userManagement.detail.reviewAgain")}
        confirmIcon={Save}
        onConfirm={handleSave}
        onCancel={() => setShowSaveConfirm(false)}
        highlights={[displayName, formValues.role || t("userManagement.detail.rolePending"), formValues.status || t("userManagement.detail.statusPendingShort")]}
        details={[
          { label: t("userManagement.detail.email"), value: formValues.email || t("userManagement.detail.emailNotSet") },
          { label: t("userManagement.detail.status"), value: formValues.status || t("userManagement.detail.notSet") },
        ]}
        warnings={[t("userManagement.detail.saveWarning")]}
      />

      <ActionConfirmModal
        open={showCancelConfirm}
        intent="warning"
        title={t("userManagement.detail.discardChanges")}
        subtitle={t("userManagement.detail.discardChangesSubtitle")}
        description={t("userManagement.detail.discardChangesDesc")}
        confirmText={t("userManagement.detail.discardChanges")}
        cancelText={t("userManagement.detail.keepEditing")}
        confirmIcon={X}
        onConfirm={handleCancelEdit}
        onCancel={() => setShowCancelConfirm(false)}
        details={[
          { label: t("userManagement.detail.editModeLabel"), value: t("userManagement.detail.editModeValue") },
          { label: t("userManagement.detail.resultLabel"), value: t("userManagement.detail.resultValue") },
        ]}
        warnings={[t("userManagement.detail.discardWarning")]}
      />

      <ActionConfirmModal
        open={showDeleteConfirm}
        intent="danger"
        title={t("userManagement.detail.deleteUserConfirmTitle")}
        subtitle={t("userManagement.detail.deleteUserConfirmSubtitle")}
        description={t("userManagement.detail.deleteUserConfirmDesc", { name: displayName || "this user" })}
        confirmText={t("userManagement.detail.deleteUser")}
        cancelText={t("userManagement.detail.keepUser")}
        confirmIcon={Trash2}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        item={{
          title: displayName || t("userManagement.detail.userProfile"),
          meta: `${formValues.role || t("userManagement.detail.rolePending")} | ${formValues.branch || t("userManagement.detail.branchPending")}`,
          note: formValues.email || t("userManagement.detail.noEmailEntered"),
        }}
        warnings={[t("userManagement.detail.softDeleteWarning")]}
      />
    </section>
  );
}
