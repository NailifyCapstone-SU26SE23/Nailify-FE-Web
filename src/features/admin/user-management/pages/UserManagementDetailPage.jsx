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

        const message = error instanceof Error ? error.message : "Failed to load user detail.";
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
          Loading user detail...
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
    "User profile";
  const normalizedRole = String(formValues.rawRole || formValues.role || "").trim().toLowerCase();
  const shouldShowSalonDetail = ["staff_artist", "manager", "receptionist"].includes(normalizedRole) && Boolean(salonDetail);
  const shouldShowSkills = normalizedRole === "staff_artist";
  const shouldShowWorkSchedule = normalizedRole !== "customer";
  const sortedSchedules = [...artistSchedules].sort(
    (left, right) => new Date(left?.workDate || 0).getTime() - new Date(right?.workDate || 0).getTime(),
  );
  const scheduleColumns = [
    {
      title: "Work Date",
      dataIndex: "workDate",
      key: "workDate",
      render: (value) => <span className="font-semibold text-[var(--color-ink)]">{formatWorkDate(value)}</span>,
    },
    {
      title: "Shift",
      key: "shift",
      render: (_, schedule) => (
        <span className="inline-flex items-center gap-2 text-sm text-[var(--color-muted)]">
          <Clock3 size={14} className="text-[#d45b9f]" />
          {formatShiftRange(schedule.shiftStart, schedule.shiftEnd)}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (value) => (
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getScheduleStatusClass(value)}`}>
          {value || "Unknown"}
        </span>
      ),
    },
  ];

  const handleSave = async () => {
    const firstName = String(formValues.firstName || "").trim();
    const lastName = String(formValues.lastName || "").trim();
    const email = String(formValues.email || "").trim();

    if (!firstName || !lastName || !email) {
      toast.error("First name, last name, and email are required.");
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
      setFlashMessage("User information updated successfully.");
      toast.success("User updated successfully.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update user.";
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
      toast.success("User deleted successfully.");
      navigate(ROUTES.adminUsers, {
        state: {
          flashMessage: `${displayName || formValues.id} has been moved to inactive status.`,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete user.";
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="flex min-h-full flex-col gap-4">
      <UserManagementHeroCard
        avatarUrl={formValues.avatarUrl}
        backLabel="Back to user list"
        backTo={ROUTES.adminUsers}
        badge="Users"
        title={displayName}
        description="Review the user profile loaded from the backend and manage this account from the admin detail page."
        headerActions={!isEditing ? (
          <>
            <button
              type="button"
              onClick={handleStartEdit}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[image:var(--gradient-accent)] px-5 text-sm font-semibold text-white shadow-[0_14px_26px_rgba(239,93,180,0.24)] transition hover:scale-[1.01]"
            >
              <PencilLine size={16} />
              <span>Edit user</span>
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#fff0f5] px-5 text-sm font-semibold text-[#d14c84] transition hover:bg-[#ffe1ec] disabled:opacity-70"
            >
              {isDeleting ? <LoaderCircle size={16} className="animate-spin" /> : <Trash2 size={16} />}
              <span>{isDeleting ? "Deleting..." : "Delete user"}</span>
            </button>
          </>
        ) : null}
        panelIcon={<PencilLine size={18} className="text-[#d45b9f]" />}
        panelTitle={isEditing ? "Edit mode" : "View mode"}
        panelDescription="Detail data is loaded from API. Save and delete actions now call the backend user management endpoints."
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
                  <span>{isSaving ? "Saving..." : "Save changes"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(true)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#fff5ef] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[#ffe9d7] sm:w-auto"
                >
                  <span>Cancel</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isDeleting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#fff0f5] px-5 py-3 text-sm font-semibold text-[#d14c84] transition hover:bg-[#ffe1ec] sm:w-auto"
                >
                  {isDeleting ? <LoaderCircle size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  <span>{isDeleting ? "Deleting..." : "Delete user"}</span>
                </button>
              </>
            ) : null}
          </div>

          <div className="mt-8 space-y-4">
            {shouldShowSalonDetail ? (
              <InfoSection icon={Building2} title="Assigned Salon">
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
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d39bb5]">Salon Name</p>
                      <p className="mt-2 font-semibold text-[var(--color-ink)]">{salonDetail?.name || "--"}</p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d39bb5]">Status</p>
                      <p className="mt-2 font-semibold text-[var(--color-ink)]">{salonDetail?.status || "--"}</p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3 sm:col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d39bb5]">Address</p>
                      <p className="mt-2 flex items-start gap-2 text-[var(--color-ink)]"><MapPin size={15} className="mt-0.5 text-[#d45b9f]" />{salonDetail?.address || "--"}</p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d39bb5]">Phone</p>
                      <p className="mt-2 flex items-center gap-2 text-[var(--color-ink)]"><Phone size={15} className="text-[#d45b9f]" />{salonDetail?.phone || "--"}</p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d39bb5]">Artist Status</p>
                      <p className="mt-2 font-semibold text-[var(--color-ink)]">{artistDetail?.status || formValues.status || "--"}</p>
                    </div>
                  </div>
                </div>
              </InfoSection>
            ) : null}

            {shouldShowSkills ? (
              <InfoSection icon={Star} title="Skill Ratings">
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
                    No skills assigned for this staff artist yet.
                  </div>
                )}
              </InfoSection>
            ) : null}

            {shouldShowWorkSchedule ? (
              <InfoSection icon={CalendarDays} title="Work Schedule">
                {formValues.staffId ? (
                  sortedSchedules.length ? (
                    <div className="overflow-hidden rounded-[20px] border border-[#f6dbe7] bg-white">
                      <Table
                        rowKey={(schedule) => schedule.scheduleId || `${schedule.workDate}-${schedule.shiftStart}-${schedule.shiftEnd}`}
                        columns={scheduleColumns}
                        dataSource={sortedSchedules}
                        pagination={false}
                        locale={{ emptyText: "No work schedule found." }}
                        scroll={{ x: 640 }}
                      />
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-white px-4 py-4 text-sm text-[#8f7c6d]">
                      No work schedule entries found for this staff artist.
                    </div>
                  )
                ) : (
                  <div className="rounded-2xl bg-white px-4 py-4 text-sm text-[#8f7c6d]">
                    This account is not linked to a nail artist profile, so there is no work schedule to display.
                  </div>
                )}
              </InfoSection>
            ) : null}
          </div>
        </article>

        <UserManagementSnapshotCard
          formValues={formValues}
          notice="This profile is loaded from API. Save updates the account, and delete changes the account status to inactive."
        />
      </div>

      <ActionConfirmModal
        open={showSaveConfirm}
        intent="success"
        title="Save User Changes"
        subtitle="This will update the user account in the backend."
        description="Confirm to apply the latest edits to this user profile."
        confirmText="Save Changes"
        cancelText="Review Again"
        confirmIcon={Save}
        onConfirm={handleSave}
        onCancel={() => setShowSaveConfirm(false)}
        highlights={[displayName, formValues.role || "Role pending", formValues.status || "Status pending"]}
        details={[
          { label: "Email", value: formValues.email || "No email entered" },
          { label: "Status", value: formValues.status || "Not set" },
        ]}
        warnings={["Only email, first name, last name, phone, and status are sent to the update API."]}
      />

      <ActionConfirmModal
        open={showCancelConfirm}
        intent="warning"
        title="Discard User Edits"
        subtitle="You are about to leave edit mode without saving."
        description="Unsaved changes on this user profile will be discarded."
        confirmText="Discard Changes"
        cancelText="Keep Editing"
        confirmIcon={X}
        onConfirm={handleCancelEdit}
        onCancel={() => setShowCancelConfirm(false)}
        details={[
          { label: "Editing Mode", value: "User profile detail" },
          { label: "Result", value: "Revert to last loaded values" },
        ]}
        warnings={["Any unsaved changes to this user will be lost immediately."]}
      />

      <ActionConfirmModal
        open={showDeleteConfirm}
        intent="danger"
        title="Delete User"
        subtitle="This will call the delete API and mark the account as inactive."
        description={`You are about to delete ${displayName || "this user"}. This action cannot be undone.`}
        confirmText="Delete User"
        cancelText="Keep User"
        confirmIcon={Trash2}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        item={{
          title: displayName || "User account",
          meta: `${formValues.role || "Role pending"} | ${formValues.branch || "Branch pending"}`,
          note: formValues.email || "No email entered",
        }}
        warnings={["The backend delete endpoint performs a soft delete by changing the account status to inactive."]}
      />
    </section>
  );
}
