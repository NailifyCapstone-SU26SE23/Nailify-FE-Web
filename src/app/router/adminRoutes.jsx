import { Navigate } from "react-router-dom";
import { AdminLayout } from "../layouts/AdminLayout";
import { ProfilePage } from "../../features/core/auth/pages/profilePage";
import { AdminDashboardPage } from "../../features/core/dashboard/pages/AdminDashboardPage";
import { AuthGuard } from "../../shared/components/guards/AuthGuard";
import { RoleGuard } from "../../shared/components/guards/RoleGuard";
import { ROLES } from "../../shared/constants/roles";
import { ROUTES } from "../../shared/constants/routes";
import { UserManagementPage } from "../../features/admin/user-management/pages/UserManagementPage";
import { UserManagementCreatePage } from "../../features/admin/user-management/pages/UserManagementCreatePage";
import { UserManagementDetailPage } from "../../features/admin/user-management/pages/UserManagementDetailPage";
import { LoyaltyTierManagement } from "../../features/admin/loyalty-tiers-management/pages/LoyaltyTierManagement";
import { QuizManagement } from "../../features/admin/quiz-management/pages/QuizManagement";
import { CreateQuiz } from "../../features/admin/quiz-management/pages/CreateQuiz";
import { UpdateQuiz } from "../../features/admin/quiz-management/pages/UpdateQuiz";
import { SalonManagementPage } from "../../features/admin/salon-management/pages/SalonManagementPage";
import { SalonCreatePage } from "../../features/admin/salon-management/pages/SalonCreatePage";
import { SalonDetailPage } from "../../features/admin/salon-management/pages/SalonDetailPage";
import { SalonUpdatePage } from "../../features/admin/salon-management/pages/SalonUpdatePage";
import ChairManagementPage from "../../features/admin/chair-management/pages/ChairManagementPage";
import { StaffManagementPage } from "../../features/admin/staff-management/pages/StaffManagementPage";
import { StaffCreatePage } from "../../features/admin/staff-management/pages/StaffCreatePage";
import { StaffUpdatePage } from "../../features/admin/staff-management/pages/StaffUpdatePage";

import { NailDesignManagementPage } from "../../features/admin/nails-design-management/pages/NailDesignManagementPage";
import { NailDesignManagementCategoryPage } from "../../features/admin/nails-design-management/pages/NailDesignManagementCategoryPage";
import { NailDesignManagementCreatePage } from "../../features/admin/nails-design-management/pages/NailDesignManagementCreatePage";
import { NailDesignManagementDetailPage } from "../../features/admin/nails-design-management/pages/NailDesignManagementDetailPage";
import { NailVariantCreatePage } from "../../features/admin/nails-design-management/pages/NailVariantCreatePage";
import { NailVariantDetailPage } from "../../features/admin/nails-design-management/pages/NailVariantDetailPage";
import { ServicePricingManagementPage } from "../../features/admin/service-pricing-management/pages/ServicePricingManagementPage";
import { NailShapesManagementPage } from "../../features/admin/nail-shapes-management/pages/NailShapesManagementPage";
import { NailShapeCreatePage } from "../../features/admin/nail-shapes-management/pages/NailShapeCreatePage";
import { NailShapeDetailPage } from "../../features/admin/nail-shapes-management/pages/NailShapeDetailPage";
import { NailSurfacesManagementPage } from "../../features/admin/nail-surfaces-management/pages/NailSurfacesManagementPage";
import { NailSurfaceCreatePage } from "../../features/admin/nail-surfaces-management/pages/NailSurfaceCreatePage";
import { NailSurfaceDetailPage } from "../../features/admin/nail-surfaces-management/pages/NailSurfaceDetailPage";
import { ComponentsManagementPage } from "../../features/admin/components-management/pages/ComponentsManagementPage";
import { ComponentCreatePage } from "../../features/admin/components-management/pages/ComponentCreatePage";
import { ComponentDetailPage } from "../../features/admin/components-management/pages/ComponentDetailPage";
import { ProceduresManagementPage } from "../../features/admin/procedures-management/pages/ProceduresManagementPage";
import { ProcedureCreatePage } from "../../features/admin/procedures-management/pages/ProcedureCreatePage";
import { ProcedureDetailPage } from "../../features/admin/procedures-management/pages/ProcedureDetailPage";
import { CategoryTypesManagementPage } from "../../features/admin/category-types-management/pages/CategoryTypesManagementPage";
import { CategoryTypeCreatePage } from "../../features/admin/category-types-management/pages/CategoryTypeCreatePage";
import { CategoryTypeDetailPage } from "../../features/admin/category-types-management/pages/CategoryTypeDetailPage";
import { SkillTypesManagementPage } from "../../features/admin/skill-types-management/pages/SkillTypesManagementPage";
import { SkillTypeCreatePage } from "../../features/admin/skill-types-management/pages/SkillTypeCreatePage";
import { SkillTypeDetailPage } from "../../features/admin/skill-types-management/pages/SkillTypeDetailPage";
import { CategoriesManagementPage } from "../../features/admin/categories-management/pages/CategoriesManagementPage";
import { CategoryCreatePage } from "../../features/admin/categories-management/pages/CategoryCreatePage";
import { CategoryDetailPage } from "../../features/admin/categories-management/pages/CategoryDetailPage";
import { PromotionsManagementPage } from "../../features/admin/promotion-management/pages/PromotionsManagementPage";
import { PromotionCreatePage } from "../../features/admin/promotion-management/pages/PromotionCreatePage";
import { PromotionDetailPage } from "../../features/admin/promotion-management/pages/PromotionDetailPage";
import { AdminSalonBookingsPage } from "../../features/admin/salon-bookings/pages/AdminSalonBookingsPage";
import { AdminSalonBookingDetailPage } from "../../features/admin/salon-bookings/pages/AdminSalonBookingDetailPage";
import { ManagerBookingDetailPage } from "../../features/manager/bookings/pages/ManagerBookingDetailPage";
import { ShapeMethodConfigsManagementPage } from "../../features/admin/shape-method-configs-management/pages/ShapeMethodConfigsManagementPage";
import { ShapeMethodConfigCreatePage } from "../../features/admin/shape-method-configs-management/pages/ShapeMethodConfigCreatePage";
import { ShapeMethodConfigDetailPage } from "../../features/admin/shape-method-configs-management/pages/ShapeMethodConfigDetailPage";
import { AdminSalonBookingRatingPage } from "../../features/admin/salon-bookings/pages/AdminSalonBookingRatingPage";
import { TransactionOverviewPage } from "../../features/admin/transaction-overview/pages/TransactionOverviewPage";

export const adminRoutes = [
  {
    path: ROUTES.adminRoot,
    element: (
      <AuthGuard>
        <RoleGuard allowedRoles={[ROLES.admin]}>
          <AdminLayout />
        </RoleGuard>
      </AuthGuard>
    ),
    children: [
      {
        index: true,
        element: <Navigate to={ROUTES.adminDashboard} replace />,
      },
      {
        path: ROUTES.adminDashboard,
        element: <AdminDashboardPage />,
      },
      {
        path: ROUTES.adminProfile,
        element: <ProfilePage />,
      },
      {
        path: ROUTES.adminBookings,
        element: <AdminSalonBookingsPage />,
      },
      {
        path: ROUTES.adminSalons,
        element: <SalonManagementPage />,
      },
      {
        path: ROUTES.adminChairs,
        element: <ChairManagementPage />,
      },
      {
        path: ROUTES.adminTransactions,
        element: <TransactionOverviewPage />,
      },
      {
        path: ROUTES.adminSalonsCreate,
        element: <SalonCreatePage />,
      },
      {
        path: ROUTES.adminSalonDetail,
        element: <SalonDetailPage />,
      },
      {
        path: ROUTES.adminSalonUpdate,
        element: <SalonUpdatePage />,
      },
      {
        path: ROUTES.adminStaff,
        element: <StaffManagementPage />,
      },
      {
        path: ROUTES.adminStaffCreate,
        element: <StaffCreatePage />,
      },
      {
        path: ROUTES.adminStaffUpdate,
        element: <StaffUpdatePage />,
      },
      {
        path: ROUTES.adminUsers,
        element: <UserManagementPage />,
      },
      {
        path: ROUTES.adminLoyaltyTiers,
        element: <LoyaltyTierManagement />,
      },
      {
        path: ROUTES.adminQuiz,
        element: <QuizManagement />,
      },
      {
        path: ROUTES.adminQuizCreate,
        element: <CreateQuiz />,
      },
      {
        path: "/admin/quiz/update/:id",
        element: <UpdateQuiz />,
      },
      {
        path: ROUTES.adminServicePricing,
        element: <ServicePricingManagementPage />,
      },
      {
        path: ROUTES.adminNailShapes,
        element: <NailShapesManagementPage />,
      },
      {
        path: ROUTES.adminNailShapesCreate,
        element: <NailShapeCreatePage />,
      },
      {
        path: ROUTES.adminNailShapeDetail,
        element: <NailShapeDetailPage />,
      },
      {
        path: ROUTES.adminShapeMethodConfigs,
        element: <ShapeMethodConfigsManagementPage />,
      },
      {
        path: ROUTES.adminShapeMethodConfigsCreate,
        element: <ShapeMethodConfigCreatePage />,
      },
      {
        path: ROUTES.adminShapeMethodConfigDetail,
        element: <ShapeMethodConfigDetailPage />,
      },
      {
        path: ROUTES.adminNailSurfaces,
        element: <NailSurfacesManagementPage />,
      },
      {
        path: ROUTES.adminNailSurfacesCreate,
        element: <NailSurfaceCreatePage />,
      },
      {
        path: ROUTES.adminNailSurfaceDetail,
        element: <NailSurfaceDetailPage />,
      },
      {
        path: ROUTES.adminComponents,
        element: <ComponentsManagementPage />,
      },
      {
        path: ROUTES.adminComponentsCreate,
        element: <ComponentCreatePage />,
      },
      {
        path: ROUTES.adminComponentDetail,
        element: <ComponentDetailPage />,
      },
      {
        path: ROUTES.adminProcedures,
        element: <ProceduresManagementPage />,
      },
      {
        path: ROUTES.adminProceduresCreate,
        element: <ProcedureCreatePage />,
      },
      {
        path: ROUTES.adminProcedureDetail,
        element: <ProcedureDetailPage />,
      },
      {
        path: ROUTES.adminCategoryTypes,
        element: <CategoryTypesManagementPage />,
      },
      {
        path: ROUTES.adminCategoryTypesCreate,
        element: <CategoryTypeCreatePage />,
      },
      {
        path: ROUTES.adminCategoryTypeDetail,
        element: <CategoryTypeDetailPage />,
      },
      {
        path: ROUTES.adminSkillTypes,
        element: <SkillTypesManagementPage />,
      },
      {
        path: ROUTES.adminSkillTypesCreate,
        element: <SkillTypeCreatePage />,
      },
      {
        path: ROUTES.adminSkillTypeDetail,
        element: <SkillTypeDetailPage />,
      },
      {
        path: ROUTES.adminCategories,
        element: <CategoriesManagementPage />,
      },
      {
        path: ROUTES.adminCategoriesCreate,
        element: <CategoryCreatePage />,
      },
      {
        path: ROUTES.adminCategoryDetail,
        element: <CategoryDetailPage />,
      },
      {
        path: ROUTES.adminPromotions,
        element: <PromotionsManagementPage />,
      },
      {
        path: ROUTES.adminPromotionsCreate,
        element: <PromotionCreatePage />,
      },
      {
        path: ROUTES.adminPromotionDetail,
        element: <PromotionDetailPage />,
      },
      {
        path: ROUTES.adminNailDesigns,
        element: <NailDesignManagementPage />,
      },
      {
        path: ROUTES.adminNailDesignCategories,
        element: <NailDesignManagementCategoryPage />,
      },
      {
        path: ROUTES.adminNailDesignsCreate,
        element: <NailDesignManagementCreatePage />,
      },
      {
        path: ROUTES.adminNailDesignDetail,
        element: <NailDesignManagementDetailPage />,
      },
      {
        path: ROUTES.adminNailVariantCreate,
        element: <NailVariantCreatePage />,
      },
      {
        path: ROUTES.adminNailVariantDetail,
        element: <NailVariantDetailPage />,
      },
      {
        path: ROUTES.adminUsersCreate,
        element: <UserManagementCreatePage />,
      },
      {
        path: ROUTES.adminUserDetail,
        element: <UserManagementDetailPage />,
      },
      {
        path: ROUTES.adminBookingDetail,
        element: <ManagerBookingDetailPage />,
      },
      {
        path: ROUTES.adminSalonBookingDetail,
        element: <AdminSalonBookingDetailPage />,
      },
      {
        path: ROUTES.adminBookingRatings,
        element: <AdminSalonBookingRatingPage />,
      },
      // {
      //   path: "*",
      //   element: <Navigate to={ROUTES.adminDashboard} replace />,
      // },
    ],
  },
];
