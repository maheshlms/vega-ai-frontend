import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { GoPeople, GoDatabase } from "react-icons/go";
import { MdOutlineVerifiedUser } from "react-icons/md";
import { TbWaveSawTool } from "react-icons/tb";
import { IoSettingsOutline, IoLogOutOutline } from "react-icons/io5";
import { AiOutlineHome } from "react-icons/ai";
import { FaLink } from "react-icons/fa";
import { RiAdminLine } from "react-icons/ri";
import { IconType } from "react-icons";
import { auth } from "../utils/auth.js";
import { useTheme } from '../state/ThemeContext';

interface MenuItem {
  icon: IconType;
  value: string;
  path: string;
}

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { isDark } = useTheme();

  // Check if user has admin role
  const isAdmin: boolean = auth.isAdmin();

  // Base menu items (always visible)
  const baseMenuItems: MenuItem[] = [
    { icon: AiOutlineHome, value: "Dashboard", path: "/agent_dashboard" },
    { icon: GoPeople, value: "AI Agent", path: "/agents" },
    // { icon: GoDatabase, value: "Data Uplink", path: "/data" },
    { icon: TbWaveSawTool, value: "Audit Logs", path: "/audits" },
    { icon: MdOutlineVerifiedUser, value: "Integration Bay", path: "/integration" },
  ];

  // Admin menu item (conditionally added)
  const adminMenuItem: MenuItem = { icon: RiAdminLine, value: "Admin", path: "/admin" };

  // Bottom menu items (always visible)
  const bottomMenuItems: MenuItem[] = [
    { icon: IoLogOutOutline, value: "Logout", path: "/logout" }
  ];

  // Construct final menu items
  const menuItems: MenuItem[] = [
    ...baseMenuItems,
    ...(isAdmin ? [adminMenuItem] : []),
    ...bottomMenuItems
  ];

  // Dark mode style tokens
  const sidebarBg = isDark ? '#0f1623' : undefined;
  const sidebarBorder = isDark ? '#1e2d45' : undefined;
  const activeBg = isDark ? 'rgba(59, 130, 246, 0.15)' : undefined;
  const activeText = isDark ? '#60a5fa' : undefined;
  const inactiveText = isDark ? '#64748b' : undefined;
  const inactiveIconColor = isDark ? '#475569' : undefined;

  return (
    <div
      className={`h-screen w-44 lg:w-54 xl:w-60 2xl:w-64 fixed left-0 top-14 lg:top-18 xl:top-20 2xl:top-22 border-r overflow-y-auto flex-shrink-0 z-10 transition-colors duration-300 ${
        isDark ? '' : 'border-sidebar bg-sidebar'
      }`}
      style={
        isDark
          ? { backgroundColor: sidebarBg, borderColor: sidebarBorder }
          : undefined
      }
    >
      {menuItems.map((item, index) => {
        const isActive: boolean = location.pathname.startsWith(item.path);
        const Icon: IconType = item.icon;

        return (
          <Link
            key={index}
            to={item.path}
            className={`block px-3 py-3.5 lg:px-6 lg:py-5 xl:px-7 xl:py-5 2xl:px-8 cursor-pointer transition-all duration-200 ${
              !isDark && isActive ? 'bg-sidebar-active rounded-md' : ''
            }`}
            style={
              isDark && isActive
                ? { backgroundColor: activeBg, borderRadius: '6px' }
                : undefined
            }
          >
            <div className="flex items-center">
              {/* ICON COLUMN */}
              <span className="w-6 lg:w-8 flex justify-center">
                <Icon
                  size={19}
                  style={
                    isDark
                      ? { color: isActive ? activeText : inactiveIconColor }
                      : undefined
                  }
                  className={
                    !isDark
                      ? isActive
                        ? 'text-sidebar-active'
                        : 'text-sidebar-icon'
                      : ''
                  }
                />
              </span>

              {/* LABEL */}
              <span
                className={`ml-2 lg:ml-4 text-xs lg:text-sm xl:text-sm font-medium whitespace-nowrap ${
                  !isDark
                    ? isActive
                      ? 'text-sidebar-active'
                      : 'text-sidebar'
                    : ''
                }`}
                style={
                  isDark
                    ? { color: isActive ? activeText : inactiveText }
                    : undefined
                }
              >
                {item.value}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default Sidebar;