import React from "react";
import { Link, useLocation , useNavigate } from "react-router-dom";
import { GoPeople, GoDatabase } from "react-icons/go";
import { MdOutlineVerifiedUser } from "react-icons/md";
import { TbWaveSawTool } from "react-icons/tb";
import { IoSettingsOutline, IoLogOutOutline } from "react-icons/io5";
import { AiOutlineHome } from "react-icons/ai";
import { FaLink } from "react-icons/fa";
import { RiAdminLine } from "react-icons/ri";
import { auth } from "../utils/auth";

const Sidebar = () => {
  const location = useLocation();

  // Check if user has admin role
  const isAdmin = auth.isAdmin();

  // Base menu items (always visible)
  const baseMenuItems = [
    { icon: AiOutlineHome, value: "Dashboard", path: "/dashboard" },
    { icon: GoPeople, value: "AI Agent", path: "/agents" },
    { icon: MdOutlineVerifiedUser, value: "Integration Bay", path: "/integration" },
    // { icon: GoDatabase, value: "Data Uplink", path: "/data" },
    { icon: TbWaveSawTool, value: "Audit Logs", path: "/audits" },
  ];

  // Admin menu item (conditionally added)
  const adminMenuItem = { icon: RiAdminLine, value: "Admin", path: "/admin" };

  // Bottom menu items (always visible)
  const bottomMenuItems = [
    { icon: IoSettingsOutline, value: "Settings", path: "/settings" },
    { icon: IoLogOutOutline, value: "Logout", path: "/logout" }
  ];

  // Construct final menu items
  const menuItems = [
    ...baseMenuItems,
    ...(isAdmin ? [adminMenuItem] : []), // Only add Admin if user is admin
    ...bottomMenuItems
  ];

  return (
    <div className="h-screen w-54 fixed left-0 top-18 border-r border-sidebar bg-sidebar overflow-y-auto flex-shrink-0 z-10">
      {menuItems.map((item, index) => {
        const isActive = location.pathname.startsWith(item.path);
        const Icon = item.icon;

        return (
          <Link
            key={index}
            to={item.path}
            className={`block px-6 py-5 cursor-pointer transition-all duration-200 
              ${isActive ? "bg-sidebar-active rounded-md" : ""}
            `}
          >
            <div className="flex items-center ">
              {/* ICON COLUMN */}
              <span className="w-8 flex justify-center">
                <Icon
                  size={22}
                  className={isActive ? "text-sidebar-active" : "text-sidebar-icon"}
                />
              </span>

              {/* LABEL */}
              <span
                className={`ml-4 text-sm font-medium whitespace-nowrap ${
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
  );
};

export default Sidebar;