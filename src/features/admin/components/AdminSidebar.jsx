import {
  CalendarOutlined,
  DashboardOutlined,
  DollarCircleOutlined,
  HeartOutlined,
  LeftOutlined,
  RightOutlined,
  RiseOutlined,
  SettingOutlined,
  ShopOutlined,
  SolutionOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Avatar, Layout, Menu, Typography } from "antd";
import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ROUTES } from "../../../shared/constants/routes";
import { PropTypes } from "../../../shared/utils/propTypes";

const { Sider } = Layout;
const { Text } = Typography;

const getItem = (label, key, icon, route, children, type) => ({
  key,
  icon,
  children,
  label,
  type,
  route,
});

const SIDEBAR_ITEMS = [
  getItem("Dashboard", "dashboard", <DashboardOutlined />, ROUTES.adminDashboard),
  getItem("Salons", "salon-management", <ShopOutlined />, ROUTES.adminSalons),
  getItem("Staff", "staff", <SolutionOutlined />, ROUTES.adminStaff),
  getItem("Customers", "customers", <TeamOutlined />, ROUTES.adminUsers),
  getItem("Appointments", "appointments", <CalendarOutlined />),
  getItem("Services", "services", <HeartOutlined />),
  { type: "divider" },
  getItem("FINANCE", "finance-header", null, undefined, undefined, "group"),
  getItem("Revenue", "revenue", <DollarCircleOutlined />),
  getItem("Analytics", "analytics", <RiseOutlined />),
  { type: "divider" },
  getItem("SYSTEM", "system-header", null, undefined, undefined, "group"),
  getItem("Settings", "settings", <SettingOutlined />),
];

function getSelectedKey(pathname) {
  if (pathname.startsWith(ROUTES.adminUsers)) {
    return "customers";
  }

  if (pathname.startsWith(ROUTES.adminSalons)) {
    return "salon-management";
  }

  if (pathname.startsWith(ROUTES.adminStaff)) {
    return "staff";
  }

  if (pathname.startsWith(ROUTES.adminDashboard)) {
    return "dashboard";
  }

  return "dashboard";
}

function getUserInitials(fullName) {
  if (!fullName) {
    return "A";
  }

  return fullName
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function AdminSidebar({ collapsed = false, onCollapse, user }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const selectedKey = useMemo(() => getSelectedKey(pathname), [pathname]);

  const handleMenuClick = ({ key }) => {
    const item = SIDEBAR_ITEMS.find((entry) => entry.key === key);

    if (item?.route) {
      navigate(item.route);
    }
  };

  return (
    <>
      <style>{`
        .nailify-sidebar .ant-menu-item-selected {
          background-color: rgba(255, 255, 255, 0.25) !important;
          color: white !important;
        }
        .nailify-sidebar .ant-menu-item-selected .ant-menu-item-icon,
        .nailify-sidebar .ant-menu-item-selected span {
          color: white !important;
        }
        .nailify-sidebar .ant-menu-item:hover {
          background-color: rgba(255, 255, 255, 0.15) !important;
          color: white !important;
        }
        .nailify-sidebar .ant-menu-item {
          color: rgba(255, 255, 255, 0.75) !important;
          border-radius: 8px !important;
        }
        .nailify-sidebar .ant-menu-item-group-title {
          color: rgba(255, 255, 255, 0.45) !important;
          font-size: 10px !important;
          letter-spacing: 0.1em;
        }
        .nailify-sidebar .ant-layout-sider-trigger {
          display: none;
        }
      `}</style>

      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={onCollapse}
        width={200}
        collapsedWidth={80}
        className="nailify-sidebar"
        trigger={null}
        style={{
          background: "linear-gradient(to bottom, #ea87aa, #ea5f94, #cc437a)",
          overflow: "auto",
          height: "100vh",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 40,
        }}
        theme="dark"
      >
        <div
          style={{
            padding: collapsed ? "16px 8px" : "24px 16px",
            textAlign: "center",
          }}
        >
          <Text
            style={{
              fontSize: collapsed ? 16 : 26,
              fontWeight: 900,
              color: "white",
              display: "block",
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
          >
            {collapsed ? "N" : "Nailify"}
          </Text>
          {!collapsed ? (
            <Text
              style={{
                fontSize: 9,
                fontWeight: 600,
                color: "rgba(255,255,255,0.7)",
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                display: "block",
                marginTop: 4,
              }}
            >
              Admin Console
            </Text>
          ) : null}
        </div>

        <Menu
          selectedKeys={[selectedKey]}
          mode="inline"
          items={SIDEBAR_ITEMS}
          onClick={handleMenuClick}
          style={{ background: "transparent", borderRight: 0, padding: "0 8px" }}
          theme="dark"
        />

        <div
          style={{
            padding: collapsed ? "16px 8px" : "16px",
            borderTop: "1px solid rgba(255,255,255,0.15)",
            position: "absolute",
            bottom: 40,
            left: 0,
            right: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "flex-start",
              gap: collapsed ? 0 : 12,
            }}
          >
            <Avatar
              size={collapsed ? 32 : 36}
              style={{
                backgroundColor: "rgba(255,255,255,0.2)",
                color: "white",
                fontWeight: "bold",
                fontSize: collapsed ? 12 : 14,
              }}
            >
              {getUserInitials(user?.fullName)}
            </Avatar>
            {!collapsed ? (
              <div>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "white",
                    display: "block",
                  }}
                >
                  {user?.fullName ?? "Admin User"}
                </Text>
                <Text
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.65)",
                    display: "block",
                  }}
                >
                  {user?.role ? `${user.role.charAt(0).toUpperCase()}${user.role.slice(1)}` : "Super Admin"}
                </Text>
              </div>
            ) : null}
          </div>
        </div>

        <div
          onClick={() => onCollapse(!collapsed)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onCollapse(!collapsed);
            }
          }}
          role="button"
          tabIndex={0}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            borderTop: "1px solid rgba(255,255,255,0.15)",
            color: "rgba(255,255,255,0.8)",
            fontSize: 14,
            transition: "background 0.2s",
          }}
          onMouseEnter={(event) => {
            event.currentTarget.style.background = "rgba(255,255,255,0.1)";
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.background = "transparent";
          }}
        >
          {collapsed ? <RightOutlined /> : <LeftOutlined />}
        </div>
      </Sider>
    </>
  );
}

AdminSidebar.propTypes = {
  collapsed: PropTypes.bool,
  onCollapse: PropTypes.func.isRequired,
  user: PropTypes.shape({
    fullName: PropTypes.string,
    role: PropTypes.string,
  }),
};
