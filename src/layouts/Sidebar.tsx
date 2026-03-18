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

// ─── Responsive Sidebar Styles ────────────────────────────────────────────────
const sidebarStyles = `
  /* ── Sidebar width ladder ── */
  /* 1920×1080 (target) — keep exact current look */
  .aad-sidebar {
    width: 216px;
    top: 72px;
    height: calc(100vh - 72px);
  }

  /* Small laptop: 1024–1279 — full labels, slightly narrower */
  @media (min-width: 1024px) and (max-width: 1279px) {
    .aad-sidebar { width: 200px; }
    .aad-sidebar-link { padding-left: 20px; padding-right: 20px; }
  }

  /* Laptop: 1280–1439 — full labels */
  @media (min-width: 1280px) and (max-width: 1439px) {
    .aad-sidebar { width: 210px; }
    .aad-sidebar-link { padding-left: 22px; padding-right: 22px; }
  }

  /* Large laptop / small desktop: 1440–1919 */
  @media (min-width: 1440px) and (max-width: 1919px) {
    .aad-sidebar { width: 214px; }
  }

  /* Exact target: 1920×1080 — unchanged */

  /* 4K / ultrawide: 2560px+ */
  @media (min-width: 2560px) {
    .aad-sidebar { width: 260px; }
    .aad-sidebar-link { padding-left: 32px; padding-right: 32px; padding-top: 24px; padding-bottom: 24px; }
  }
`;

interface MenuItem {
  icon: IconType;
  value: string;
  path: string;
}

interface MenuItemtwo {
  icon : IconType ;
  value : string ;
  path : string ;
}

const Sidebar: React.FC = () => {
  const location = useLocation();

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

  // Systems menu item (conditionally added — admin only)
  const adminMenuItem: MenuItem = { icon: RiAdminLine, value: "Systems", path: "/systems" };

  // Bottom menu items (always visible)
  const bottomMenuItems: MenuItem[] = [
    { icon: IoLogOutOutline, value: "Logout", path: "/logout" }
  ];

  // Construct final menu items
  const menuItems: MenuItem[] = [
    ...baseMenuItems,
    ...(isAdmin ? [adminMenuItem] : []), // Only add Admin if user is admin
    // ...bottomMenuItems
  ];

  return (
    <div className="aad-sidebar h-[calc(100vh-72px)] w-54 fixed left-0 top-18 border-r border-sidebar bg-sidebar flex-shrink-0 z-10 flex flex-col overflow-hidden">
      <style>{sidebarStyles}</style>

      {/* ── Top nav items (scrollable if needed) ── */}
      <div className="flex-1 overflow-y-auto">
        {menuItems.map((item, index) => {
          const isActive: boolean = location.pathname.startsWith(item.path);
          const Icon: IconType = item.icon;

          return (
            <Link
              key={index}
              to={item.path}
              className={`aad-sidebar-link block px-6 py-5 cursor-pointer transition-all duration-200 
                ${isActive ? "bg-sidebar-active rounded-md" : ""}
              `}
            >
              <div className="flex items-center ">
                {/* ICON COLUMN */}
                <span className="aad-sidebar-icon-wrap w-8 flex justify-center">
                  <Icon
                    size={22}
                    className={isActive ? "text-sidebar-active" : "text-sidebar-icon"}
                  />
                </span>

                {/* LABEL */}
                <span
                  className={`aad-sidebar-label ml-4 text-sm font-medium whitespace-nowrap ${
                    isActive ? "text-sidebar-active" : "text-sidebar"
                  }`}
                >
                  {item.value}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* ── Bottom logout (pinned to bottom) ── */}
      <div className="border-t border-sidebar">
        {bottomMenuItems.map((item, index) => {
          const isActive: boolean = location.pathname.startsWith(item.path);
          const Icon: IconType = item.icon;

          return (
            <Link
              key={index}
              to={item.path}
              className={`aad-sidebar-link block px-6 py-5 cursor-pointer transition-all duration-200 
                ${isActive ? "bg-sidebar-active rounded-md" : ""}
              `}
            >
              <div className="flex items-center  ">
                {/* ICON COLUMN */}
                <span className="aad-sidebar-icon-wrap w-8 flex justify-center">
                  <Icon
                    size={22}
                    className={`{isActive ? "text-sidebar-active" : "text-sidebar-icon"} text-red-600 `}
                  />
                </span>

                {/* LABEL */}
                <span
                  className={"aad-sidebar-label ml-4 text-sm font-medium whitespace-nowrap text-red-600 "}
                >
                  {item.value}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar;