export const translations = {
  en: {
    // Common
    back: "Back",
    signOut: "Sign out",
    notifications: "Notifications",
    today: "Today",
    changeLanguage: "Language",
    vietnamese: "Tiếng Việt",
    english: "English",

    // Roles and Console Labels
    superAdmin: "Super Admin",
    salonManager: "Salon Manager",
    receptionist: "Receptionist",
    nailArtist: "Nail Artist",
    adminConsole: "Admin Console",
    managerPortal: "Manager Portal",
    receptionDesk: "Reception Desk",
    staffWorkspace: "Staff Workspace",
    nailifyPortal: "Nailify Portal",

    // Menu Sections
    menuSections: {
      Main: "Main Menu",
      Support: "Support & Settings",
      Analytics: "Analytics"
    },

    // Sidebar Menus (EN)
    menus: {
      "staff-dashboard": "Dashboard",
      "staff-bookings": "Bookings",
      "staff-tasks": "Tasks",
      "staff-customer-nails": "Custom Reviews",
      "staff-schedule": "Schedule",
      "staff-breaks": "Breaks",
      "staff-customers": "Customers",
      "staff-profile": "Profile",

      "receptionist-dashboard": "Dashboard",
      "receptionist-bookings": "Bookings",
      "receptionist-customers": "Customers",
      "receptionist-breaks": "Breaks",
      "receptionist-chairs": "Chairs",
      "receptionist-reviews": "Reviews",
      "receptionist-complaints": "Complaints",
      "receptionist-profile": "Profile",

      "manager-dashboard": "Dashboard",
      "manager-bookings": "Bookings",
      "manager-chairs": "Chairs",
      "manager-reschedule": "Reschedule",
      "manager-customer-nails": "Customer Nails",
      "manager-schedules": "Schedules",
      "manager-staff": "Staff Artists",
      "manager-breaks": "Artist Breaks",
      "manager-transactions": "Transactions",
      "manager-customers": "Customers",
      "manager-reports": "Analytics",
      "manager-reviews": "Reviews",
      "manager-profile": "Profile",

      "admin-dashboard": "Dashboard",
      "admin-bookings": "Bookings",
      "admin-transactions": "Transactions",
      "admin-salons": "Salons",
      "admin-chairs": "Chairs",
      "admin-staff": "Staff",
      "admin-users": "Users",
      "admin-loyalty-tiers": "Loyalty Tiers",
      "admin-quiz": "Quiz",
      "admin-service-pricing": "Services",
      "admin-nail-shapes": "Nail Shapes",
      "admin-shape-method-configs": "Shape Method Configs",
      "admin-nail-surfaces": "Nail Surfaces",
      "admin-components": "Components",
      "admin-procedures": "Procedures",
      "admin-category-types": "Category Types",
      "admin-skill-types": "Skill Types",
      "admin-categories": "Categories",
      "admin-promotions": "Promotions",
      "admin-nail-designs": "Nail Designs",
      "admin-analytics": "Analytics",
      "admin-reviews": "Reviews",
      "admin-complaints": "Complaints",
      "admin-profile": "Profile"
    },

    // Header Content Titles & Descriptions (EN)
    header: {
      dashboard: {
        title: "Dashboard",
        desc: "Monitor internal operations across the Nailify workspace."
      },
      bookings: {
        title: "Bookings",
        desc: "Monitor bookings across all Nailify salon locations."
      },
      salons: {
        title: "Salon Management",
        desc: "Manage salons, branches, capacity, and operational status."
      },
      staff: {
        title: "Staff Management",
        desc: "Manage staff profiles, assignments, performance, and availability."
      },
      users: {
        title: "Users",
        desc: "Manage customers, staff artists, and salon managers."
      },
      loyaltyTiers: {
        title: "Loyalty Tiers",
        desc: "Manage customer loyalty programs, point systems, and benefits."
      },
      quiz: {
        title: "Quiz Management",
        desc: "Configure nail styling diagnostic questions, scoring logic, and shape recommendations."
      },
      quizCreate: {
        title: "Create Quiz Question",
        desc: "Configure a new diagnostic question with multiple choice options and properties."
      },
      servicePricing: {
        title: "Service Management",
        desc: "Manage services, prices, and estimated durations."
      },
      tasks: {
        title: "Task Queue",
        desc: "Track assigned procedures and claim open salon tasks."
      },
      profile: {
        title: "Profile",
        desc: "View and manage your account information and assigned salon details."
      },
      default: {
        title: "Management Console",
        desc: "Manage operations across the Nailify workspace."
      }
    },

    // Promotion Detail Page (EN)
    promotionDetail: {
      title: "Promotion Detail",
      editTitle: "Edit Promotion",
      backButton: "Back to Promotions List",
      saveBtn: "Save",
      savingBtn: "Saving...",
      deleteBtn: "Delete",
      promotionName: "Promotion Name",
      description: "Description",
      promotionType: "Promotion Type",
      scope: "Scope",
      discountType: "Discount Type",
      discountValue: "Discount Value",
      startDate: "Start Date",
      endDate: "End Date",
      status: "Status",
      categoryId: "Category",
      categoryTypeId: "Category Type",
      nailDesignId: "Nail Design",
      active: "Active",
      inactive: "Inactive",

      // Form Validations
      validations: {
        nameRequired: "Promotion name is required.",
        descRequired: "Promotion description is required.",
        typeRequired: "Promotion type is required.",
        scopeRequired: "Promotion scope is required.",
        discountTypeRequired: "Discount type is required.",
        discountValueGreaterZero: "Discount value must be greater than 0.",
        dateRequired: "Start date and end date are required.",
        endDateLater: "End date must be later than start date.",
        categoryRequired: "Category is required for category-scoped promotions.",
        categoryTypeRequired: "Category type is required for category-type-scoped promotions.",
        nailDesignRequired: "Nail design is required for nail-design-scoped promotions."
      },

      // Notifications
      messages: {
        fetchError: "Failed to load promotion details.",
        updateSuccess: "Promotion updated successfully!",
        deleteSuccess: "Promotion deleted successfully!",
        deleteConfirmTitle: "Are you sure?",
        deleteConfirmText: "This action cannot be undone. Do you want to delete this promotion?",
        yesDelete: "Yes, delete it",
        cancel: "Cancel"
      }
    },

    // Admin Dashboard (EN)
    adminDashboard: {
      resetLayout: "Reset Layout",
      day: "Day",
      week: "Week",
      month: "Month",
      year: "Year",
      custom: "Custom",
      widgets: {
        globalServicePopularity: "Global Service Popularity",
        salonRatingDistribution: "Salon Rating Distribution",
        revenueTrend: "Revenue Trend",
        userGrowth: "User Growth",
        globalPromotionPerformance: "Global Promotion Performance",
        topPerformingSalons: "Top Performing Salons",
        rankedSalons: "Ranked Salons by Revenue",
        totalBranches: "Total Branches",
      },
      widgetActions: {
        pin: "Pin to top",
        unpin: "Unpin widget",
        hide: "Hide widget"
      },
      table: {
        salon: "Salon",
        manager: "Manager",
        revenue: "Revenue",
        receptionists: "Receptionists",
        artists: "Artists"
      },

    },
    shared: {
      customize: "Customize",
    },
    // User Management (EN)
    userManagement: {
      metric: {
        totalUsers: "Total Users",
        activeAdmins: "Active Admins",
        branchManagers: "Branch Managers",
        receptionDesk: "Reception Desk",
        nailArtists: "Nail Artists",
        clientAccounts: "Client Accounts"
      },
      filter: {
        searchPlaceholder: "Search by name, email, phone...",
        allRoles: "All roles",
        allSalons: "All salons",
        selectSalon: "Select Salon / Branch",
        sortBy: "Sort by"
      },
      table: {
        user: "User",
        assignedRole: "Assigned Role",
        salonBranch: "Salon / Branch",
        status: "Status",
        lastActive: "Last Active",
        actions: "Actions"
      }
    },

    // Service Pricing (EN)
    servicePricing: {
      metric: {
        activeServices: "Active Services",
        mostBooked: "Most Booked Service",
        highestRevenue: "Highest Revenue Service"
      },
      filter: {
        searchPlaceholder: "Search services by name, description...",
        allStatuses: "All statuses",
        allCategories: "All categories"
      },
      table: {
        service: "Service",
        category: "Category",
        price: "Base Price",
        duration: "Duration",
        status: "Status",
        actions: "Actions"
      }
    },

    // Promotions List (EN)
    promotions: {
      title: "Promotions Management",
      description: "Manage customer loyalty promotions, coupons and active campaigns.",
      btnCreate: "Create Promotion",
      filter: {
        searchPlaceholder: "Search promotions by name, description..."
      },
      table: {
        promotion: "Promotion",
        type: "Type",
        scope: "Scope",
        value: "Value",
        startDate: "Start Date",
        endDate: "End Date",
        status: "Status",
        actions: "Actions"
      }
    }
  },
  vi: {
    // Common
    back: "Quay lại",
    signOut: "Đăng xuất",
    notifications: "Thông báo",
    today: "Hôm nay",
    changeLanguage: "Ngôn ngữ",
    vietnamese: "Tiếng Việt",
    english: "English",

    // Roles and Console Labels
    superAdmin: "Quản trị viên tối cao",
    salonManager: "Quản lý Salon",
    receptionist: "Lễ tân",
    nailArtist: "Nghệ sĩ làm móng",
    adminConsole: "Bảng điều khiển Admin",
    managerPortal: "Cổng quản lý",
    receptionDesk: "Bàn lễ tân",
    staffWorkspace: "Không gian nhân viên",
    nailifyPortal: "Cổng Nailify",

    // Menu Sections
    menuSections: {
      Main: "Danh mục chính",
      Support: "Hỗ trợ & Cài đặt",
      Analytics: "Thống kê"
    },

    // Sidebar Menus (VI)
    menus: {
      "staff-dashboard": "Bảng điều khiển",
      "staff-bookings": "Lịch hẹn",
      "staff-tasks": "Nhiệm vụ",
      "staff-customer-nails": "Đánh giá mẫu móng",
      "staff-schedule": "Lịch làm việc",
      "staff-breaks": "Nghỉ ngơi",
      "staff-customers": "Khách hàng",
      "staff-profile": "Hồ sơ cá nhân",

      "receptionist-dashboard": "Bảng điều khiển",
      "receptionist-bookings": "Lịch hẹn",
      "receptionist-customers": "Khách hàng",
      "receptionist-breaks": "Nghỉ ngơi",
      "receptionist-chairs": "Ghế salon",
      "receptionist-reviews": "Đánh giá",
      "receptionist-complaints": "Khiếu nại",
      "receptionist-profile": "Hồ sơ cá nhân",

      "manager-dashboard": "Bảng điều khiển",
      "manager-bookings": "Lịch hẹn",
      "manager-chairs": "Ghế salon",
      "manager-reschedule": "Đổi lịch hẹn",
      "manager-customer-nails": "Hình móng khách hàng",
      "manager-schedules": "Lịch làm việc",
      "manager-staff": "Nhân viên móng",
      "manager-breaks": "Thời gian nghỉ",
      "manager-transactions": "Giao dịch",
      "manager-customers": "Khách hàng",
      "manager-reports": "Thống kê",
      "manager-reviews": "Đánh giá",
      "manager-profile": "Hồ sơ cá nhân",

      "admin-dashboard": "Bảng điều khiển",
      "admin-bookings": "Lịch hẹn",
      "admin-transactions": "Giao dịch",
      "admin-salons": "Chi nhánh Salon",
      "admin-chairs": "Quản lý Ghế",
      "admin-staff": "Nhân viên",
      "admin-users": "Người dùng",
      "admin-loyalty-tiers": "Hạng thành viên",
      "admin-quiz": "Trắc nghiệm dáng móng",
      "admin-service-pricing": "Dịch vụ & Giá",
      "admin-nail-shapes": "Dáng móng",
      "admin-shape-method-configs": "Cấu hình phương pháp",
      "admin-nail-surfaces": "Bề mặt móng",
      "admin-components": "Thành phần móng",
      "admin-procedures": "Quy trình làm móng",
      "admin-category-types": "Loại danh mục",
      "admin-skill-types": "Loại kỹ năng",
      "admin-categories": "Danh mục dịch vụ",
      "admin-promotions": "Khuyến mãi",
      "admin-nail-designs": "Mẫu móng",
      "admin-analytics": "Thống kê hệ thống",
      "admin-reviews": "Quản lý Đánh giá",
      "admin-complaints": "Khiếu nại",
      "admin-profile": "Hồ sơ cá nhân"
    },

    // Header Content Titles & Descriptions (VI)
    header: {
      dashboard: {
        title: "Bảng điều khiển",
        desc: "Giám sát các hoạt động nội bộ trên toàn hệ thống Nailify."
      },
      bookings: {
        title: "Quản lý Lịch hẹn",
        desc: "Theo dõi và giám sát lịch hẹn trên tất cả các chi nhánh Nailify."
      },
      salons: {
        title: "Quản lý Salon",
        desc: "Quản lý chi nhánh, năng suất hoạt động và trạng thái vận hành."
      },
      staff: {
        title: "Quản lý Nhân viên",
        desc: "Quản lý hồ sơ nhân viên, phân công công việc, hiệu suất và thời gian rảnh."
      },
      users: {
        title: "Quản lý Người dùng",
        desc: "Quản lý tài khoản khách hàng, nhân viên làm móng và quản lý salon."
      },
      loyaltyTiers: {
        title: "Hạng thành viên thân thiết",
        desc: "Quản lý chương trình khách hàng thân thiết, hệ thống điểm và quyền lợi."
      },
      quiz: {
        title: "Quản lý Trắc nghiệm",
        desc: "Thiết lập câu hỏi chẩn đoán móng, logic tính điểm và gợi ý dáng móng."
      },
      quizCreate: {
        title: "Tạo câu hỏi trắc nghiệm",
        desc: "Cấu hình một câu hỏi chẩn đoán mới với nhiều lựa chọn và thuộc tính."
      },
      servicePricing: {
        title: "Quản lý Dịch vụ",
        desc: "Quản lý dịch vụ, bảng giá và thời gian thực hiện ước tính."
      },
      tasks: {
        title: "Hàng đợi nhiệm vụ",
        desc: "Theo dõi quy trình được phân công và nhận các nhiệm vụ còn trống."
      },
      profile: {
        title: "Hồ sơ cá nhân",
        desc: "Xem và quản lý thông tin tài khoản cá nhân cũng như chi tiết salon được phân công."
      },
      default: {
        title: "Bảng điều khiển quản trị",
        desc: "Quản lý các hoạt động vận hành trên toàn hệ thống Nailify."
      }
    },

    // Promotion Detail Page (VI)
    promotionDetail: {
      title: "Chi tiết khuyến mãi",
      editTitle: "Chỉnh sửa khuyến mãi",
      backButton: "Quay lại danh sách khuyến mãi",
      saveBtn: "Lưu lại",
      savingBtn: "Đang lưu...",
      deleteBtn: "Xóa khuyến mãi",
      promotionName: "Tên khuyến mãi",
      description: "Mô tả chi tiết",
      promotionType: "Loại khuyến mãi",
      scope: "Phạm vi áp dụng",
      discountType: "Loại giảm giá",
      discountValue: "Giá trị giảm",
      startDate: "Ngày bắt đầu",
      endDate: "Ngày kết thúc",
      status: "Trạng thái hoạt động",
      categoryId: "Danh mục",
      categoryTypeId: "Loại danh mục",
      nailDesignId: "Mẫu móng thiết kế",
      active: "Đang hoạt động",
      inactive: "Ngừng hoạt động",

      // Form Validations
      validations: {
        nameRequired: "Tên khuyến mãi không được để trống.",
        descRequired: "Mô tả khuyến mãi không được để trống.",
        typeRequired: "Vui lòng chọn loại khuyến mãi.",
        scopeRequired: "Vui lòng chọn phạm vi áp dụng.",
        discountTypeRequired: "Vui lòng chọn loại giảm giá.",
        discountValueGreaterZero: "Giá trị giảm giá phải lớn hơn 0.",
        dateRequired: "Ngày bắt đầu và ngày kết thúc không được để trống.",
        endDateLater: "Ngày kết thúc phải sau ngày bắt đầu.",
        categoryRequired: "Vui lòng chọn danh mục cho khuyến mãi này.",
        categoryTypeRequired: "Vui lòng chọn loại danh mục cho khuyến mãi này.",
        nailDesignRequired: "Vui lòng chọn mẫu móng cho khuyến mãi này."
      },

      // Notifications
      messages: {
        fetchError: "Không thể tải chi tiết chương trình khuyến mãi.",
        updateSuccess: "Cập nhật khuyến mãi thành công!",
        deleteSuccess: "Xóa khuyến mãi thành công!",
        deleteConfirmTitle: "Bạn chắc chắn chứ?",
        deleteConfirmText: "Hành động này không thể hoàn tác. Bạn có thực sự muốn xóa khuyến mãi này?",
        yesDelete: "Có, xóa ngay",
        cancel: "Hủy bỏ"
      }
    },

    // Admin Dashboard (VI)
    adminDashboard: {
      resetLayout: "Đặt lại bố cục",
      day: "Ngày",
      week: "Tuần",
      month: "Tháng",
      year: "Năm",
      custom: "Tùy chỉnh",
      widgets: {
        globalServicePopularity: "Mức độ phổ biến dịch vụ toàn cầu",
        salonRatingDistribution: "Phân phối đánh giá chi nhánh",
        revenueTrend: "Xu hướng doanh thu",
        userGrowth: "Tăng trưởng người dùng",
        globalPromotionPerformance: "Hiệu suất chương trình khuyến mãi",
        topPerformingSalons: "Chi nhánh đạt doanh thu cao nhất",
        rankedSalons: "Xếp hạng chi nhánh theo doanh thu",
        totalBranches: "Tổng chi nhánh",
      },
      widgetActions: {
        pin: "Ghim lên đầu",
        unpin: "Bỏ ghim tiện ích",
        hide: "Ẩn tiện ích"
      },
      table: {
        salon: "Chi nhánh",
        manager: "Quản lý",
        revenue: "Doanh thu",
        receptionists: "Lễ tân",
        artists: "Nghệ sĩ móng"
      },

    },
    shared: {
      customize: "Tùy chỉnh",
    },
    // User Management (VI)
    userManagement: {
      metric: {
        totalUsers: "Tổng người dùng",
        activeAdmins: "Admin hoạt động",
        branchManagers: "Quản lý chi nhánh",
        receptionDesk: "Nhân viên lễ tân",
        nailArtists: "Nghệ sĩ móng",
        clientAccounts: "Tài khoản khách hàng"
      },
      filter: {
        searchPlaceholder: "Tìm theo tên, email, số điện thoại...",
        allRoles: "Tất cả vai trò",
        allSalons: "Tất cả chi nhánh",
        selectSalon: "Chọn Chi nhánh",
        sortBy: "Sắp xếp theo"
      },
      table: {
        user: "Người dùng",
        assignedRole: "Vai trò",
        salonBranch: "Chi nhánh",
        status: "Trạng thái",
        lastActive: "Hoạt động cuối",
        actions: "Thao tác"
      }
    },

    // Service Pricing (VI)
    servicePricing: {
      metric: {
        activeServices: "Dịch vụ đang hoạt động",
        mostBooked: "Dịch vụ đặt nhiều nhất",
        highestRevenue: "Dịch vụ doanh thu cao nhất"
      },
      filter: {
        searchPlaceholder: "Tìm dịch vụ theo tên, mô tả...",
        allStatuses: "Tất cả trạng thái",
        allCategories: "Tất cả danh mục"
      },
      table: {
        service: "Dịch vụ",
        category: "Danh mục",
        price: "Giá cơ bản",
        duration: "Thời lượng",
        status: "Trạng thái",
        actions: "Thao tác"
      }
    },

    // Promotions List (VI)
    promotions: {
      title: "Quản lý khuyến mãi",
      description: "Quản lý các chương trình khuyến mãi, mã giảm giá và chiến dịch đang chạy.",
      btnCreate: "Tạo khuyến mãi mới",
      filter: {
        searchPlaceholder: "Tìm khuyến mãi theo tên, mô tả..."
      },
      table: {
        promotion: "Khuyến mãi",
        type: "Loại",
        scope: "Phạm vi",
        value: "Giá trị",
        startDate: "Bắt đầu",
        endDate: "Kết thúc",
        status: "Trạng thái",
        actions: "Thao tác"
      }
    }
  }
};
