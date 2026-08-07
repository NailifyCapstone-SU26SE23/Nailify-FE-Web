import {
  CheckCircle2,
  Clock3,
  Gift,
  HeartHandshake,
  Mail,
  MapPin,
  Phone,
  Save,
  Sparkles,
  Star,
  User,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import { ROUTES } from "../../../../shared/constants/routes";
import { receptionistWalkInBookingService } from "../../walk-in-bookings/services/receptionistWalkInBookingService";
import { useLanguage } from "../../../../shared/hooks/useLanguage";
import toast from "react-hot-toast";

function PanelCard({ title, icon, children, className = "" }) {
  const Icon = icon;

  return (
    <section className={`rounded-[22px] border border-[#f3d7e3] bg-white p-4 shadow-[0_12px_28px_rgba(236,72,153,0.05)] ${className}`}>
      <div className="flex items-start gap-2">
        <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ec4899_0%,#fb7185_100%)] text-white">
          {Icon ? <Icon size={12} /> : null}
        </span>
        <h2 className="text-sm font-extrabold text-[#d83982]">{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function LabeledInput({ label, value, onChange, placeholder, type = "text", optional = false, language = "vi" }) {
  return (
    <label className="space-y-2">
      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#c79bb1]">
        {label} {optional ? <span className="text-[#d8c0cb]">{language === "vi" ? "(Không bắt buộc)" : "(Optional)"}</span> : <span className="text-[#ea4f93]">*</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="h-12 w-full rounded-xl border border-[#f2d7e3] bg-[#fff9fc] px-4 text-sm text-[#5c4559] outline-none placeholder:text-[#d39bb5] focus:border-[#ee6cb5]"
      />
    </label>
  );
}

function LabeledSelect({ label, value, onChange, options, optional = false, language = "vi" }) {
  return (
    <label className="space-y-2">
      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#c79bb1]">
        {label} {optional ? <span className="text-[#d8c0cb]">{language === "vi" ? "(Không bắt buộc)" : "(Optional)"}</span> : <span className="text-[#ea4f93]">*</span>}
      </span>
      <select
        value={value}
        onChange={onChange}
        className="h-12 w-full rounded-xl border border-[#f2d7e3] bg-[#fff9fc] px-4 text-sm text-[#5c4559] outline-none focus:border-[#ee6cb5]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ReceptionistCustomerCreatePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useLanguage();
  const [showConfirm, setShowConfirm] = useState(false);
  const [formValues, setFormValues] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    birthday: "",
    gender: "",
    address: "",
    notes: "",
  });

  const checklist = useMemo(
    () => [
      { label: language === "vi" ? "Số điện thoại đã hợp lệ" : "Phone number verified", checked: formValues.phoneNumber.trim().length >= 10 },
      { label: language === "vi" ? "Địa chỉ Email đã nhập" : "Email address entered", checked: formValues.email.trim().length > 0 },
      { label: language === "vi" ? "Thông tin khách hàng đã hoàn thành" : "Customer information completed", checked: formValues.fullName.trim().length > 0 },
    ],
    [formValues.email, formValues.fullName, formValues.phoneNumber, language],
  );

  const handleChange = (field) => (event) => {
    setFormValues((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (continueBooking) => {
    setShowConfirm(false);

    if (!formValues.fullName || !formValues.phoneNumber) {
      toast.error(language === "vi" ? "Vui lòng nhập họ tên và số điện thoại." : "Please enter full name and phone number.");
      return;
    }

    const nameParts = formValues.fullName.trim().split(" ");
    const firstName = nameParts.pop() || "";
    const lastName = nameParts.join(" ") || "";

    const payload = {
      email: formValues.email || `${formValues.phoneNumber}@nailify.test`, // Dummy email if missing since it might be required by backend
      password: "User@1234",
      confirmPassword: "User@1234",
      firstName: firstName,
      lastName: lastName || firstName,
      phone: formValues.phoneNumber
    };

    try {
      setIsSubmitting(true);
      await receptionistWalkInBookingService.registerCustomer(payload);
      toast.success(language === "vi" ? `Đã khởi tạo tài khoản cho ${formValues.fullName}` : `An account has been created for ${formValues.fullName}`);

      if (continueBooking || location.state?.continueToBooking) {
        navigate(ROUTES.receptionistBookingsCreate, {
          state: {
            prefillCustomerName: formValues.fullName,
          },
        });
        return;
      }

      navigate(ROUTES.receptionistDashboard);
    } catch (err) {
      console.error(err);
      toast.error(language === "vi" ? "Không thể tạo tài khoản khách hàng. Vui lòng kiểm tra lại thông tin." : "Failed to create customer. Please check the provided information.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="flex min-h-full flex-col gap-4 bg-[linear-gradient(180deg,#fff9fc_0%,#fff4f8_100%)]">
      <div className="rounded-[24px] border border-[#f3d7e3] bg-white px-4 py-4 shadow-[0_12px_28px_rgba(236,72,153,0.05)] sm:px-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#412643]">{language === "vi" ? "Đăng Ký Khách Hàng Mới" : "Register New Customer"}</h1>
            <p className="mt-1 text-sm text-[#c092a8]">
              {language === "vi" ? "Tạo tài khoản khách hàng mới phục vụ đặt lịch vãng lai" : "Create a new customer account for walk-in booking"}
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4 lg:items-end">
            <div className="text-sm text-[#b48ca0]">
              {language === "vi" ? "Thứ Ba, 12 Tháng 5 2026" : "Tuesday, 12 May 2026"}
              <div className="text-lg font-extrabold text-[#eb4f94]">21:38</div>
            </div>
            <span className="inline-flex rounded-full border border-[#f4cadc] bg-[#fff2f8] px-3 py-1 text-[11px] font-bold text-[#ea4f93]">
              {language === "vi" ? "Khách Vãng Lai Mới" : "New Walk-in Customer"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-4">
          <PanelCard title={language === "vi" ? "Thông Tin Khách Hàng" : "Customer Information"} icon={User}>
            <p className="mb-4 text-[11px] text-[#c495ab]">
              {language === "vi" ? "Nhập chi tiết thông tin cơ bản để tạo tài khoản" : "Fill in the customer's basic details to create their account"}
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <LabeledInput label={language === "vi" ? "Họ và Tên" : "Full Name"} value={formValues.fullName} onChange={handleChange("fullName")} placeholder="e.g. Nguyen Thi Lan" language={language} />
              <LabeledInput label={language === "vi" ? "Số Điện Thoại" : "Phone Number"} value={formValues.phoneNumber} onChange={handleChange("phoneNumber")} placeholder="0912 345 678" language={language} />
              <LabeledInput label={language === "vi" ? "Địa Chỉ Email" : "Email Address"} value={formValues.email} onChange={handleChange("email")} placeholder="lan.nguyen@email.com" language={language} />
              <LabeledInput label={language === "vi" ? "Ngày Sinh" : "Birthday"} optional value={formValues.birthday} onChange={handleChange("birthday")} placeholder="" type="date" language={language} />
              <LabeledSelect
                label={language === "vi" ? "Giới Tính" : "Gender"}
                optional
                value={formValues.gender}
                onChange={handleChange("gender")}
                language={language}
                options={[
                  { value: "", label: language === "vi" ? "Chọn giới tính" : "Select gender" },
                  { value: "Female", label: language === "vi" ? "Nữ" : "Female" },
                  { value: "Male", label: language === "vi" ? "Nam" : "Male" },
                  { value: "Other", label: language === "vi" ? "Khác" : "Other" },
                  { value: "Prefer not to say", label: language === "vi" ? "Không muốn tiết lộ" : "Prefer not to say" },
                ]}
              />
              <LabeledInput label={language === "vi" ? "Địa Chỉ" : "Address"} optional value={formValues.address} onChange={handleChange("address")} placeholder={language === "vi" ? "Tên đường, Quận, Thành phố" : "Street, District, City"} language={language} />
            </div>
            <label className="mt-4 block space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#c79bb1]">
                {language === "vi" ? "Ghi Chú" : "Notes"} <span className="text-[#d8c0cb]">{language === "vi" ? "(Không bắt buộc)" : "(Optional)"}</span>
              </span>
              <textarea
                value={formValues.notes}
                onChange={handleChange("notes")}
                placeholder={language === "vi" ? "Nhập các ghi chú đặc biệt (dị ứng, sở thích...)" : "Any special notes about this customer (allergies, preferences, etc.)"}
                className="min-h-[96px] w-full rounded-xl border border-[#f2d7e3] bg-[#fff9fc] px-4 py-3 text-sm text-[#5c4559] outline-none placeholder:text-[#d39bb5] focus:border-[#ee6cb5]"
              />
            </label>
          </PanelCard>

          <PanelCard title={language === "vi" ? "Xem Trước Hồ Sơ Khách Hàng" : "Customer Profile Preview"} icon={Sparkles}>
            <p className="mb-4 text-[11px] text-[#c495ab]">{language === "vi" ? "Xem trước thông tin tài khoản sẽ được khởi tạo" : "Live preview of the customer account being created"}</p>
            <div className="grid gap-4 md:grid-cols-[120px_minmax(0,1fr)]">
              <div className="flex flex-col items-center justify-start gap-3 rounded-[18px] bg-[#fff8fb] px-4 py-4">
                <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#f4cadb] bg-[#fff1f7] text-[#ea4f93]">
                  <User size={24} />
                </span>
                <span className="rounded-full bg-[#fff1f7] px-3 py-1 text-[10px] font-bold text-[#ea4f93]">
                  {language === "vi" ? "Thành Viên Mới" : "New Member"}
                </span>
                <span className="rounded-full bg-[#eff9f1] px-3 py-1 text-[10px] font-bold text-[#2f9557]">
                  {language === "vi" ? "Khách Vãng Lai" : "Walk-in Customer"}
                </span>
              </div>
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[16px] bg-[#fff8fb] px-4 py-4">
                    <p className="text-sm font-bold text-[#432744]">{formValues.fullName || (language === "vi" ? "Khách Hàng Mới" : "New Customer")}</p>
                    <div className="mt-3 space-y-2 text-[11px] text-[#b48ca0]">
                      <p className="inline-flex items-center gap-2"><Phone size={12} /> {formValues.phoneNumber || "—"}</p>
                      <p className="inline-flex items-center gap-2"><Mail size={12} /> {formValues.email || "—"}</p>
                      <p className="inline-flex items-center gap-2"><Star size={12} /> {language === "vi" ? "0 Điểm Tích Lũy" : "0 Loyalty Points"}</p>
                      <p className="inline-flex items-center gap-2"><Gift size={12} /> {language === "vi" ? "Sẵn Sàng Voucher Chào Mừng" : "Welcome Voucher Ready"}</p>
                    </div>
                  </div>
                  <div className="rounded-[16px] bg-[#fff1f7] px-4 py-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#c79bb1]">{language === "vi" ? "Trạng Thái Tài Khoản" : "Account Status"}</p>
                    <p className="mt-2 text-sm font-bold text-[#ea4f93]">{language === "vi" ? "Đang Chờ Khởi Tạo" : "Pending Creation"}</p>
                  </div>
                </div>
              </div>
            </div>
          </PanelCard>

          <PanelCard title={language === "vi" ? "Đặc Quyền Hội Viên & Điểm Thưởng" : "Loyalty & Membership Benefits"} icon={HeartHandshake}>
            <p className="mb-4 text-[11px] text-[#c495ab]">
              {language === "vi" ? "Khách hàng mới sẽ tự động được nhận các ưu đãi này sau khi đăng ký thành công" : "New customers automatically receive these benefits upon registration"}
            </p>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px]">
              <div className="space-y-3">
                {[
                  [language === "vi" ? "Voucher Chào Mừng" : "Welcome Voucher", language === "vi" ? "Giảm 10% cho lượt đặt đầu tiên — tự động áp dụng" : "10% off first booking — auto-applied"],
                  [language === "vi" ? "Điểm Tích Lũy" : "Loyalty Points", language === "vi" ? "Tích lũy điểm mỗi khi sử dụng dịch vụ và đổi quà" : "Earn points on every visit and redeem rewards"],
                  [language === "vi" ? "Lịch Sử Đặt Lịch" : "Booking History", language === "vi" ? "Theo dõi đầy đủ lịch sử làm dịch vụ qua các lần ghé" : "Full history tracking across all visits"],
                  [language === "vi" ? "Gợi Ý Phong Cách Riêng" : "Personalized Recommendations", language === "vi" ? "Đề xuất kiểu móng phù hợp tối ưu bởi AI" : "AI-powered nail style suggestions"],
                ].map(([label, note]) => (
                  <div key={label} className="flex gap-3 border-b border-[#f6dce8] pb-3 last:border-b-0 last:pb-0">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fff1f7] text-[#ea4f93]">
                      <Gift size={16} />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-[#432744]">{label}</p>
                      <p className="mt-1 text-[11px] text-[#b48ca0]">{note}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col items-center justify-center rounded-[18px] border border-[#f3d7e3] bg-[#fff8fb] p-3">
                <img
                  src="https://images.unsplash.com/photo-1604902396830-aca29e19b067?auto=format&fit=crop&w=500&q=80"
                  alt="Premium loyalty experience"
                  className="h-40 w-full rounded-[14px] object-cover"
                />
                <p className="mt-3 text-center text-[11px] text-[#b48ca0]">
                  {language === "vi" ? "Trải nghiệm chăm sóc cao cấp cho mọi khách hàng" : "Premium loyalty experience for every customer"}
                </p>
              </div>
            </div>
          </PanelCard>

          <PanelCard title={language === "vi" ? "Xác Nhận Tạo Tài Khoản" : "Account Creation Confirmation"} icon={CheckCircle2}>
            <p className="mb-4 text-[11px] text-[#c495ab]">
              {language === "vi" ? "Kiểm tra lại danh sách trước khi khởi tạo tài khoản" : "Review the checklist before creating the customer account"}
            </p>
            <div className="space-y-3">
              {checklist.map((item) => (
                <div key={item.label} className="flex items-center gap-3 border-b border-[#f6dce8] pb-3 last:border-b-0 last:pb-0">
                  <span className={`h-5 w-5 rounded-full border ${item.checked ? "border-[#6bc277] bg-[#eff9f1]" : "border-[#efcfdb] bg-white"}`} />
                  <span className="text-sm text-[#8f7181]">{item.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowConfirm(true)}
                className="rounded-xl bg-[image:var(--gradient-accent)] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                {language === "vi" ? "Tạo Tài Khoản Khách Hàng" : "Create Customer Account"}
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleCreate(true)}
                className="rounded-xl border border-[#f3cadb] bg-[#fff1f7] px-5 py-3 text-sm font-bold text-[#ea4f93] disabled:opacity-50"
              >
                {language === "vi" ? "Tạo Tài Khoản & Tiếp Tục Đặt Lịch" : "Create Account & Continue Booking"}
              </button>
            </div>
          </PanelCard>
        </div>

        <aside className="space-y-4">
          <PanelCard title={language === "vi" ? "Tình Trạng Tiếp Đón" : "Reception Status"} icon={Clock3}>
            <div className="space-y-3 text-sm">
              {[
                [language === "vi" ? "Khách Vãng Lai Hôm Nay" : "Walk-ins Today", "14", "text-[#ea4f93]"],
                [language === "vi" ? "Khách Hàng Đang Chờ" : "Waiting Customers", "3", "text-[#de861e]"],
                [language === "vi" ? "Thời Gian Tạo TB" : "Avg. Registration Time", "2 min", "text-[#2f9557]"],
              ].map(([label, value, tone]) => (
                <div key={label} className="flex items-center justify-between gap-3 border-b border-[#f7dce8] pb-3 last:border-b-0 last:pb-0">
                  <span className="text-[#b48ca0]">{label}</span>
                  <span className={`font-extrabold ${tone}`}>{value}</span>
                </div>
              ))}
            </div>
          </PanelCard>

          <PanelCard title={language === "vi" ? "Xem Trước Khách Hàng" : "Customer Preview"} icon={User}>
            <div className="text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#f4cadb] bg-[#fff1f7] text-[#ea4f93]">
                <User size={24} />
              </span>
              <p className="mt-3 text-sm font-bold text-[#432744]">{formValues.fullName || (language === "vi" ? "Khách Hàng Mới" : "New Customer")}</p>
              <p className="mt-1 text-[11px] text-[#b48ca0]">{language === "vi" ? "Chưa có số điện thoại" : "No phone yet"}</p>
              <span className="mt-3 inline-flex rounded-full bg-[#fff1f7] px-3 py-1 text-[10px] font-bold text-[#ea4f93]">
                {language === "vi" ? "Thành Viên Mới" : "New Member"}
              </span>
            </div>
          </PanelCard>

          <PanelCard title={language === "vi" ? "Mẹo Đăng Ký" : "Registration Tips"} icon={Sparkles}>
            <ul className="space-y-2 text-[11px] text-[#b48ca0]">
              {language === "vi" ? (
                <>
                  <li>Hỏi khách hàng về sở thích kiểu móng để cá nhân hóa dịch vụ tốt hơn.</li>
                  <li>Xác nhận chính xác số điện thoại để gửi tin nhắn xác nhận đặt lịch.</li>
                  <li>Khuyến khích khách hàng tích điểm thành viên cho các lần ghé tiếp theo.</li>
                  <li>Email là thông tin tùy chọn nhưng giúp gửi voucher ưu đãi dễ dàng hơn.</li>
                </>
              ) : (
                <>
                  <li>Ask customer for preferred nail styles to personalize their experience.</li>
                  <li>Verify phone number carefully for used booking confirmations.</li>
                  <li>Encourage customer to use their loyalty account for future visits.</li>
                  <li>Email is optional but recommended for voucher delivery.</li>
                </>
              )}
            </ul>
          </PanelCard>

          <PanelCard title={language === "vi" ? "Quyền Lợi Thành Viên" : "Membership Benefits"} icon={Gift}>
            <ul className="space-y-2 text-[11px] text-[#b48ca0]">
              {language === "vi" ? (
                <>
                  <li>Tích lũy điểm thưởng sau mỗi lần làm dịch vụ</li>
                  <li>Đặt lịch nhanh hơn trong tương lai với hồ sơ lưu sẵn</li>
                  <li>Nhận gợi ý kiểu dáng móng độc quyền từ AI</li>
                  <li>Theo dõi lịch sử toàn bộ các lần ghé tiệm</li>
                  <li>Nhận các chương trình khuyến mãi đặc quyền</li>
                </>
              ) : (
                <>
                  <li>Earn loyalty points on every visit</li>
                  <li>Faster future booking with saved profile</li>
                  <li>AI-powered personalized recommendations</li>
                  <li>Full booking history tracking</li>
                  <li>Exclusive member-only promotions</li>
                </>
              )}
            </ul>
          </PanelCard>
        </aside>
      </div>

      <ActionConfirmModal
        open={showConfirm}
        intent="success"
        title={language === "vi" ? "Tạo Tài Khoản Khách Hàng" : "Create Customer Account"}
        subtitle={language === "vi" ? "Thao tác này sẽ khởi tạo tài khoản thành viên trên hệ thống." : "This will create the receptionist-side mock customer account."}
        description={language === "vi" ? "Xác nhận tạo hồ sơ với các thông tin đã cung cấp." : "Confirm to create the customer account with the current registration information."}
        confirmText={language === "vi" ? "Tạo Tài Khoản Khách Hàng" : "Create Customer Account"}
        cancelText={language === "vi" ? "Kiểm Tra Lại" : "Review Again"}
        confirmIcon={Save}
        onConfirm={() => handleCreate(false)}
        onCancel={() => setShowConfirm(false)}
        highlights={[formValues.fullName || (language === "vi" ? "Khách Hàng Mới" : "New Customer"), formValues.phoneNumber || (language === "vi" ? "Không có SĐT" : "No phone"), formValues.email || (language === "vi" ? "Không có Email" : "No email")]}
        details={[
          { label: language === "vi" ? "Hội Viên" : "Membership", value: language === "vi" ? "Thành Viên Mới" : "New Member" },
          { label: language === "vi" ? "Liên Kết Đặt Lịch" : "Booking Link", value: location.state?.continueToBooking ? (language === "vi" ? "Tiếp tục đặt lịch vãng lai" : "Continue to walk-in booking") : (language === "vi" ? "Chỉ tạo tài khoản" : "Account only") },
        ]}
        warnings={[]}
      />
    </section>
  );
}
