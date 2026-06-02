export const ROUTES = {
  root: "/",
  login: "/login",
  staffRoot: "/staff",
  managerRoot: "/manager",
  adminRoot: "/admin",
  staffDashboard: "/staff/dashboard",
  managerDashboard: "/manager/dashboard",
  adminDashboard: "/admin/dashboard",
  adminUsers: "/admin/users",
  adminUsersCreate: "/admin/users/create",
};

export const getAdminUserDetailRoute = (userId) => `/admin/users/${userId}`;
