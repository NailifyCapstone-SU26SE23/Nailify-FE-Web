# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Feature based architecture (Đề xuất cấu trúc)

Format nên dùng thống nhất cho mọi feature:

```
feature-name/
├── pages/ // màn hình chính của feature
├── components/ // component chỉ dùng trong feature đó
├── services/ // gọi API của feature đó
├── hooks/ // custom hook xử lý logic/data của feature
├── utils/ // hàm xử lý dữ liệu nội bộ feature
└── constants/ // hằng số riêng của feature
```

Cấu trúc này phù hợp cho web nội bộ (Staff / Manager / Admin):

```
nailify-web/ // thư mục gốc của frontend web Staff, Manager, Admin
|
├── public/ // chứa file tĩnh public, không cần import trong React
│   ├── favicon.ico // icon tab trình duyệt
│   └── images/ // ảnh public dùng trực tiếp bằng đường dẫn /images/...
│
├── src/ // chứa toàn bộ source code chính của React
│
│   ├── app/ // cấu hình cấp ứng dụng
│   │   ├── router/ // cấu hình route toàn hệ thống
│   │   │   ├── AppRouter.jsx // router tổng, gom public/staff/manager/admin routes
│   │   │   ├── publicRoutes.jsx // route không cần đăng nhập: login, forgot password
│   │   │   ├── staffRoutes.jsx // route dành cho Staff
│   │   │   ├── managerRoutes.jsx // route dành cho Salon Manager
│   │   │   └── adminRoutes.jsx // route dành cho Admin hệ thống
│   │   │
│   │   ├── layouts/ // layout theo từng nhóm role
│   │   │   ├── PublicLayout.jsx // layout cho login/forgot password
│   │   │   ├── StaffLayout.jsx // layout cho nhân viên nail
│   │   │   ├── ManagerLayout.jsx // layout cho quản lý salon
│   │   │   └── AdminLayout.jsx // layout cho admin hệ thống
│   │   │
│   │   └── providers/ // provider bọc toàn app
│   │       ├── AppProviders.jsx // gom tất cả provider
│   │       ├── AuthProvider.jsx // quản lý user, token, role
│   │       ├── QueryProvider.jsx // cấu hình React Query
│   │       └── ThemeProvider.jsx // quản lý theme nếu có dark/light mode
│   │
│   ├── features/ // chứa các module nghiệp vụ chính
│   │
│   │   ├── auth/ // đăng nhập, đăng xuất, quên mật khẩu
│   │   │   ├── pages/
│   │   │   │   ├── LoginPage.jsx // trang đăng nhập
│   │   │   │   └── ForgotPasswordPage.jsx // trang quên mật khẩu
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.jsx // form đăng nhập
│   │   │   │   └── ForgotPasswordForm.jsx // form quên mật khẩu
│   │   │   ├── services/
│   │   │   │   └── authService.js // login, logout, refresh token, forgot password
│   │   │   ├── hooks/
│   │   │   │   └── useAuth.js // xử lý login/logout/user hiện tại
│   │   │   ├── utils/
│   │   │   │   └── authStorage.js // lưu token, lấy token, xóa token
│   │   │   └── constants/
│   │   │       └── authConstants.js // token key, auth status
│   │   │
│   │   ├── dashboard/ // dashboard tổng quan theo role
│   │   │   ├── pages/
│   │   │   │   ├── StaffDashboardPage.jsx // dashboard Staff
│   │   │   │   ├── ManagerDashboardPage.jsx // dashboard Manager
│   │   │   │   └── AdminDashboardPage.jsx // dashboard Admin
│   │   │   ├── components/
│   │   │   │   ├── RevenueChart.jsx // biểu đồ doanh thu
│   │   │   │   ├── BookingStatsCard.jsx // card thống kê booking
│   │   │   │   ├── SalonPerformanceTable.jsx // bảng hiệu suất salon
│   │   │   │   └── StaffRankingTable.jsx // bảng xếp hạng staff
│   │   │   ├── services/
│   │   │   │   └── dashboardService.js // API dashboard
│   │   │   ├── hooks/
│   │   │   │   └── useDashboard.js // lấy dữ liệu dashboard
│   │   │   ├── utils/
│   │   │   │   └── dashboardMapper.js // map dữ liệu chart/card
│   │   │   └── constants/
│   │   │       └── dashboardConstants.js // loại thống kê, filter thời gian
│   │   │
│   │   ├── salons/ // quản lý chuỗi salon/chi nhánh
│   │   │   ├── pages/
│   │   │   │   ├── SalonListPage.jsx // danh sách salon
│   │   │   │   ├── SalonDetailPage.jsx // chi tiết salon
│   │   │   │   ├── CreateSalonPage.jsx // tạo salon
│   │   │   │   └── EditSalonPage.jsx // chỉnh sửa salon
│   │   │   ├── components/
│   │   │   │   ├── SalonCard.jsx // card salon
│   │   │   │   ├── SalonTable.jsx // bảng salon
│   │   │   │   ├── SalonForm.jsx // form tạo/sửa salon
│   │   │   │   ├── SalonFilter.jsx // bộ lọc salon
│   │   │   │   └── SalonStatusBadge.jsx // badge trạng thái salon
│   │   │   ├── services/
│   │   │   │   └── salonService.js // API salon
│   │   │   ├── hooks/
│   │   │   │   ├── useSalons.js // lấy danh sách salon
│   │   │   │   └── useSalonDetail.js // lấy chi tiết salon
│   │   │   ├── utils/
│   │   │   │   └── salonMapper.js // map dữ liệu salon
│   │   │   └── constants/
│   │   │       └── salonConstants.js // trạng thái salon, loại salon
│   │   │
│   │   ├── bookings/ // quản lý lịch hẹn
│   │   │   ├── pages/
│   │   │   │   ├── BookingListPage.jsx // danh sách booking
│   │   │   │   ├── BookingDetailPage.jsx // chi tiết booking
│   │   │   │   └── BookingCalendarPage.jsx // lịch booking dạng calendar
│   │   │   ├── components/
│   │   │   │   ├── BookingTable.jsx // bảng booking
│   │   │   │   ├── BookingCalendar.jsx // lịch booking
│   │   │   │   ├── BookingStatusBadge.jsx // trạng thái booking
│   │   │   │   ├── BookingFilter.jsx // lọc booking
│   │   │   │   └── BookingTimeline.jsx // tiến trình xử lý booking
│   │   │   ├── services/
│   │   │   │   └── bookingService.js // API booking
│   │   │   ├── hooks/
│   │   │   │   ├── useBookings.js // lấy danh sách booking
│   │   │   │   └── useBookingDetail.js // lấy chi tiết booking
│   │   │   ├── utils/
│   │   │   │   └── bookingMapper.js // map trạng thái, format booking
│   │   │   └── constants/
│   │   │       └── bookingStatus.js // pending, confirmed, completed, cancelled
│   │   │
│   │   ├── nail-designs/ // quản lý mẫu nail, layer, skill, costing
│   │   │   ├── pages/
│   │   │   │   ├── NailDesignListPage.jsx // danh sách mẫu nail
│   │   │   │   ├── NailDesignDetailPage.jsx // chi tiết mẫu nail
│   │   │   │   ├── CreateNailDesignPage.jsx // tạo mẫu nail
│   │   │   │   └── EditNailDesignPage.jsx // chỉnh sửa mẫu nail
│   │   │   ├── components/
│   │   │   │   ├── NailDesignCard.jsx // card mẫu nail
│   │   │   │   ├── NailDesignTable.jsx // bảng mẫu nail
│   │   │   │   ├── NailDesignForm.jsx // form thông tin mẫu nail
│   │   │   │   ├── NailLayerBuilder.jsx // tạo từng layer nail
│   │   │   │   ├── NailPreview.jsx // xem trước mẫu nail
│   │   │   │   ├── SkillRequirementForm.jsx // yêu cầu kỹ năng staff
│   │   │   │   ├── CostingForm.jsx // vật liệu và chi phí dịch vụ
│   │   │   │   └── PublishReviewPanel.jsx // kiểm tra cuối và publish
│   │   │   ├── services/
│   │   │   │   └── nailDesignService.js // API nail design
│   │   │   ├── hooks/
│   │   │   │   ├── useNailDesigns.js // lấy danh sách mẫu nail
│   │   │   │   └── useNailDesignDetail.js // lấy chi tiết mẫu nail
│   │   │   ├── utils/
│   │   │   │   ├── nailDesignMapper.js // map payload nail design
│   │   │   │   └── layerUtils.js // xử lý layer nail
│   │   │   └── constants/
│   │   │       ├── nailShape.js // dáng móng
│   │   │       ├── nailLength.js // độ dài móng
│   │   │       ├── nailStyle.js // style nail
│   │   │       ├── skinTone.js // tông da
│   │   │       └── skillLevels.js // level kỹ năng 1-5 sao
│   │   │
│   │   ├── services/ // quản lý dịch vụ nail
│   │   │   ├── pages/
│   │   │   │   ├── ServiceListPage.jsx // danh sách dịch vụ
│   │   │   │   ├── ServiceDetailPage.jsx // chi tiết dịch vụ
│   │   │   │   ├── CreateServicePage.jsx // tạo dịch vụ
│   │   │   │   └── EditServicePage.jsx // sửa dịch vụ
│   │   │   ├── components/
│   │   │   │   ├── ServiceCard.jsx // card dịch vụ
│   │   │   │   ├── ServiceTable.jsx // bảng dịch vụ
│   │   │   │   ├── ServiceForm.jsx // form dịch vụ
│   │   │   │   └── ServicePriceInput.jsx // input giá dịch vụ
│   │   │   ├── services/
│   │   │   │   └── serviceApi.js // API dịch vụ
│   │   │   ├── hooks/
│   │   │   │   └── useServices.js // lấy danh sách dịch vụ
│   │   │   ├── utils/
│   │   │   │   └── serviceMapper.js // map dữ liệu dịch vụ
│   │   │   └── constants/
│   │   │       └── serviceCategory.js // manicure, pedicure, gel, acrylic...
│   │   │
│   │   ├── staff/ // quản lý nhân viên nail
│   │   │   ├── pages/
│   │   │   │   ├── StaffListPage.jsx // danh sách staff
│   │   │   │   ├── StaffDetailPage.jsx // chi tiết staff
│   │   │   │   ├── StaffSchedulePage.jsx // lịch làm staff
│   │   │   │   └── StaffPerformancePage.jsx // hiệu suất staff
│   │   │   ├── components/
│   │   │   │   ├── StaffTable.jsx // bảng staff
│   │   │   │   ├── StaffCard.jsx // card staff
│   │   │   │   ├── StaffForm.jsx // form staff
│   │   │   │   ├── StaffSkillMatrix.jsx // ma trận kỹ năng staff
│   │   │   │   └── StaffScheduleCalendar.jsx // lịch làm staff
│   │   │   ├── services/
│   │   │   │   └── staffService.js // API staff
│   │   │   ├── hooks/
│   │   │   │   ├── useStaff.js // lấy danh sách staff
│   │   │   │   └── useStaffDetail.js // lấy chi tiết staff
│   │   │   ├── utils/
│   │   │   │   └── staffMapper.js // map dữ liệu staff
│   │   │   └── constants/
│   │   │       └── staffConstants.js // role staff, skill type, status
│   │   │
│   │   ├── customers/ // xem và quản lý dữ liệu khách hàng từ mobile app
│   │   │   ├── pages/
│   │   │   │   ├── CustomerListPage.jsx // danh sách khách hàng
│   │   │   │   └── CustomerDetailPage.jsx // chi tiết khách hàng
│   │   │   ├── components/
│   │   │   │   ├── CustomerTable.jsx // bảng khách hàng
│   │   │   │   ├── CustomerInfoCard.jsx // card thông tin khách
│   │   │   │   └── CustomerBookingHistory.jsx // lịch sử booking của khách
│   │   │   ├── services/
│   │   │   │   └── customerService.js // API customer
│   │   │   ├── hooks/
│   │   │   │   ├── useCustomers.js // lấy danh sách khách hàng
│   │   │   │   └── useCustomerDetail.js // lấy chi tiết khách hàng
│   │   │   ├── utils/
│   │   │   │   └── customerMapper.js // format dữ liệu khách hàng
│   │   │   └── constants/
│   │   │       └── customerConstants.js // loại khách hàng, trạng thái khách
│   │   │
│   │   ├── schedules/ // quản lý ca làm và phân công lịch
│   │   │   ├── pages/
│   │   │   │   ├── SchedulePage.jsx // màn lịch làm việc tổng
│   │   │   │   └── ShiftManagementPage.jsx // quản lý ca làm
│   │   │   ├── components/
│   │   │   │   ├── ScheduleCalendar.jsx // lịch ca làm
│   │   │   │   ├── ShiftForm.jsx // form tạo/sửa ca
│   │   │   │   ├── ShiftTable.jsx // bảng ca làm
│   │   │   │   └── StaffShiftCard.jsx // card ca làm của staff
│   │   │   ├── services/
│   │   │   │   └── scheduleService.js // API schedule/shift
│   │   │   ├── hooks/
│   │   │   │   └── useSchedules.js // lấy lịch làm việc
│   │   │   ├── utils/
│   │   │   │   └── scheduleUtils.js // kiểm tra trùng lịch, map ca làm
│   │   │   └── constants/
│   │   │       └── shiftConstants.js // loại ca, trạng thái ca
│   │   │
│   │   ├── payments/ // thanh toán, hóa đơn, giao dịch
│   │   │   ├── pages/
│   │   │   │   ├── PaymentListPage.jsx // danh sách giao dịch
│   │   │   │   ├── PaymentDetailPage.jsx // chi tiết giao dịch
│   │   │   │   └── InvoicePage.jsx // hóa đơn
│   │   │   ├── components/
│   │   │   │   ├── PaymentTable.jsx // bảng thanh toán
│   │   │   │   ├── PaymentSummary.jsx // tóm tắt thanh toán
│   │   │   │   ├── PaymentMethodBadge.jsx // phương thức thanh toán
│   │   │   │   └── InvoiceCard.jsx // card hóa đơn
│   │   │   ├── services/
│   │   │   │   └── paymentService.js // API payment
│   │   │   ├── hooks/
│   │   │   │   └── usePayments.js // lấy dữ liệu payment
│   │   │   ├── utils/
│   │   │   │   └── paymentMapper.js // map trạng thái, format tiền
│   │   │   └── constants/
│   │   │       └── paymentConstants.js // cash, momo, vnpay, refund...
│   │   │
│   │   ├── reports/ // báo cáo doanh thu, booking, staff, salon
│   │   │   ├── pages/
│   │   │   │   ├── RevenueReportPage.jsx // báo cáo doanh thu
│   │   │   │   ├── BookingReportPage.jsx // báo cáo booking
│   │   │   │   ├── StaffReportPage.jsx // báo cáo staff
│   │   │   │   └── SalonReportPage.jsx // báo cáo salon
│   │   │   ├── components/
│   │   │   │   ├── ReportFilter.jsx // bộ lọc báo cáo
│   │   │   │   ├── ReportTable.jsx // bảng báo cáo
│   │   │   │   ├── ReportChart.jsx // biểu đồ báo cáo
│   │   │   │   └── ExportButton.jsx // nút export file
│   │   │   ├── services/
│   │   │   │   └── reportService.js // API report
│   │   │   ├── hooks/
│   │   │   │   └── useReports.js // lấy dữ liệu report
│   │   │   ├── utils/
│   │   │   │   ├── reportMapper.js // map dữ liệu chart/table
│   │   │   │   └── exportUtils.js // xử lý export CSV/Excel
│   │   │   └── constants/
│   │   │       └── reportConstants.js // loại report, range thời gian
│   │   │
│   │   └── notifications/ // thông báo nội bộ
│   │       ├── pages/
│   │       │   └── NotificationListPage.jsx // danh sách thông báo
│   │       ├── components/
│   │       │   ├── NotificationDropdown.jsx // dropdown thông báo ở header
│   │       │   ├── NotificationItem.jsx // item thông báo
│   │       │   └── NotificationBadge.jsx // badge số lượng thông báo
│   │       ├── services/
│   │       │   └── notificationService.js // API notification
│   │       ├── hooks/
│   │       │   └── useNotifications.js // lấy thông báo
│   │       ├── utils/
│   │       │   └── notificationUtils.js // format thời gian, trạng thái đã đọc
│   │       └── constants/
│   │           └── notificationConstants.js // loại thông báo
│   │
│   ├── shared/ // phần dùng chung giữa nhiều feature
│   │   ├── components/ // component tái sử dụng toàn app
│   │   │   ├── ui/ // UI component nhỏ, không chứa nghiệp vụ
│   │   │   │   ├── Button.jsx // button dùng chung
│   │   │   │   ├── Input.jsx // input dùng chung
│   │   │   │   ├── Select.jsx // select dùng chung
│   │   │   │   ├── Modal.jsx // modal dùng chung
│   │   │   │   ├── Table.jsx // table base dùng chung
│   │   │   │   ├── Badge.jsx // badge dùng chung
│   │   │   │   ├── Card.jsx // card base dùng chung
│   │   │   │   └── DatePicker.jsx // chọn ngày dùng chung
│   │   │   │
│   │   │   ├── common/ // component layout/common dùng nhiều nơi
│   │   │   │   ├── Header.jsx // header chung
│   │   │   │   ├── Sidebar.jsx // sidebar chung
│   │   │   │   ├── Navbar.jsx // navbar nếu cần
│   │   │   │   ├── Pagination.jsx // phân trang
│   │   │   │   ├── Loading.jsx // loading chung
│   │   │   │   ├── EmptyState.jsx // trạng thái không có dữ liệu
│   │   │   │   └── SearchBox.jsx // ô tìm kiếm chung
│   │   │   │
│   │   │   └── guards/ // component bảo vệ route
│   │   │       ├── AuthGuard.jsx // bắt buộc đăng nhập
│   │   │       ├── RoleGuard.jsx // kiểm tra role Staff/Manager/Admin
│   │   │       └── GuestGuard.jsx // chặn user đã login vào login page
│   │   │
│   │   ├── hooks/ // custom hook dùng chung toàn app
│   │   │   ├── useDebounce.js // delay search input
│   │   │   ├── usePagination.js // xử lý phân trang
│   │   │   ├── useModal.js // đóng/mở modal
│   │   │   ├── useLocalStorage.js // đọc/ghi localStorage
│   │   │   └── useClickOutside.js // bắt sự kiện click ngoài element
│   │   │
│   │   ├── utils/ // hàm tiện ích dùng chung
│   │   │   ├── formatDate.js // format ngày giờ
│   │   │   ├── formatCurrency.js // format tiền VND
│   │   │   ├── validators.js // validate form chung
│   │   │   ├── storage.js // helper localStorage/sessionStorage
│   │   │   ├── errorHandler.js // xử lý lỗi API
│   │   │   └── classNames.js // nối class Tailwind có điều kiện
│   │   │
│   │   ├── constants/ // hằng số dùng chung toàn app
│   │   │   ├── roles.js // STAFF, MANAGER, ADMIN
│   │   │   ├── routes.js // path route toàn app
│   │   │   ├── apiEndpoints.js // endpoint API dùng chung
│   │   │   ├── status.js // status chung
│   │   │   └── appConfig.js // config app
│   │   │
│   │   └── assets/ // asset import trực tiếp trong React
│   │       ├── images/ // ảnh
│   │   │   ├── icons/ // icon
│   │   │   └── fonts/ // font
│   │
│   ├── lib/ // cấu hình thư viện ngoài
│   │   ├── axiosClient.js // cấu hình Axios, baseURL, interceptor token
│   │   ├── queryClient.js // cấu hình React Query client
│   │   ├── dayjs.js // cấu hình dayjs, locale vi
│   │   └── tailwindHelper.js // helper merge class Tailwind nếu cần
│   │
│   ├── store/ // Redux/global state nếu dùng
│   │   ├── index.js // cấu hình Redux store
│   │   ├── authSlice.js // lưu user, token, role
│   │   ├── bookingSlice.js // lưu booking đang thao tác nếu cần global
│   │   ├── nailDesignSlice.js // lưu trạng thái tạo nail design/layer
│   │   └── layoutSlice.js // lưu trạng thái sidebar/theme/menu
│   │
│   ├── styles/ // CSS global
│   │   ├── index.css // file CSS chính, import Tailwind
│   │   └── tailwind.css // tách Tailwind layer nếu muốn
│   │
│   ├── App.jsx // component gốc, thường chỉ render AppRouter
│   │   └── main.jsx // entry point của Vite React
│
├── .env // biến môi trường chung, phải bắt đầu bằng VITE_
├── .env.development // biến môi trường cho môi trường dev
├── .env.production // biến môi trường cho production
├── index.html // HTML gốc của Vite
├── vite.config.js // cấu hình Vite, React plugin, alias @
├── tailwind.config.js // cấu hình Tailwind
├── postcss.config.js // cấu hình PostCSS cho Tailwind
├── jsconfig.json // cấu hình alias @ cho VS Code
├── eslint.config.js // cấu hình lint code
├── package.json // dependencies và script chạy project
└── README.md // mô tả project
