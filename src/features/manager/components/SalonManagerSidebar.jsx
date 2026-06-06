import {
  CalendarOutlined,
  ClockCircleOutlined,
  DashboardOutlined,
  DollarCircleOutlined,
  EnvironmentOutlined,
  LeftOutlined,
  LogoutOutlined,
  ReadOutlined,
  RightOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Avatar, Badge, Layout, Menu, Typography } from "antd";
import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/hooks/useAuth";
import { ROUTES } from "../../../shared/constants/routes";
import { PropTypes } from "../../../shared/utils/propTypes";

const { Sider } = Layout;
const { Text } = Typography;

const getItem = (label, key, icon, route, badge, type) => ({
  key,
  icon,
  label: badge ? (
    <span className="flex w-full items-center justify-between gap-2">
      <span>{label}</span>
      <Badge count={badge} size="small" style={{ backgroundColor: "rgba(255,255,255,0.95)", color: "#cc437a" }} />
    </span>
  ) : (
    label
  ),
  route,
  type,
});

const SIDEBAR_ITEMS = [
  { type: "group", label: "MAIN" },
  getItem("Dashboard", "dashboard", <DashboardOutlined />, ROUTES.managerDashboard),
  getItem("Bookings", "bookings", <CalendarOutlined />, ROUTES.managerBookings, 3),
  getItem("Staff", "staff", <TeamOutlined />),
  getItem("Queue", "queue", <ClockCircleOutlined />, undefined, 1),
  { type: "group", label: "MANAGEMENT" },
  getItem("Customers", "customers", <UserOutlined />),
  getItem("Revenue", "revenue", <DollarCircleOutlined />),
  getItem("Recipes", "recipes", <ReadOutlined />),
  getItem("Settings", "settings", <SettingOutlined />),
];

function getSelectedKey(pathname) {
  if (pathname.startsWith(ROUTES.managerBookings)) {
    return "bookings";
  }

  if (pathname.startsWith(ROUTES.managerDashboard)) {
    return "dashboard";
  }

  return "dashboard";
}

function getUserInitials(fullName) {
  if (!fullName) {
    return "LN";
  }

  return fullName
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function SalonManagerSidebar({ collapsed = false, onCollapse, user }) {
  const { logout } = useAuth();
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
        .salon-manager-sidebar .ant-menu-item-selected {
          background-color: rgba(255, 255, 255, 0.25) !important;
          color: white !important;
        }
        .salon-manager-sidebar .ant-menu-item-selected .ant-menu-item-icon,
        .salon-manager-sidebar .ant-menu-item-selected span {
          color: white !important;
        }
        .salon-manager-sidebar .ant-menu-item:hover {
          background-color: rgba(255, 255, 255, 0.15) !important;
          color: white !important;
        }
        .salon-manager-sidebar .ant-menu-item {
          color: rgba(255, 255, 255, 0.78) !important;
          border-radius: 8px !important;
        }
        .salon-manager-sidebar .ant-menu-item-group-title {
          color: rgba(255, 255, 255, 0.45) !important;
          font-size: 10px !important;
          letter-spacing: 0.12em;
          padding-left: 12px !important;
        }
        .salon-manager-sidebar .ant-layout-sider-trigger {
          display: none;
        }
      `}</style>

      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={onCollapse}
        width={200}
        collapsedWidth={80}
        className="salon-manager-sidebar"
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
            padding: collapsed ? "16px 8px" : "20px 16px",
            textAlign: "center",
          }}
        >
          <div className="flex items-center justify-center gap-2">
            {!collapsed ? (
              <EnvironmentOutlined style={{ color: "white", fontSize: 18 }} />
            ) : null}
            <Text
              style={{
                fontSize: collapsed ? 16 : 24,
                fontWeight: 900,
                color: "white",
                display: "block",
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
            >
              {collapsed ? "N" : "Nailify"}
            </Text>
          </div>
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
            padding: collapsed ? "12px 8px" : "12px 16px 16px",
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
                  {user?.fullName ?? "Linh Nguyen"}
                </Text>
                <Text
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.65)",
                    display: "block",
                  }}
                >
                  Salon Manager
                </Text>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={logout}
            title="Sign out"
            style={{
              marginTop: collapsed ? 10 : 12,
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "flex-start",
              gap: collapsed ? 0 : 8,
              padding: collapsed ? "8px" : "8px 12px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(255,255,255,0.12)",
              color: "white",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.background = "rgba(255,255,255,0.22)";
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.background = "rgba(255,255,255,0.12)";
            }}
          >
            <LogoutOutlined style={{ fontSize: 14 }} />
            {!collapsed ? <span>Sign out</span> : null}
          </button>
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
          }}
        >
          {collapsed ? <RightOutlined /> : <LeftOutlined />}
        </div>
      </Sider>
    </>
  );
}

SalonManagerSidebar.propTypes = {
  collapsed: PropTypes.bool,
  onCollapse: PropTypes.func.isRequired,
  user: PropTypes.shape({
    fullName: PropTypes.string,
    role: PropTypes.string,
  }),
};
