import React from "react";
import { Link, useLocation , useNavigate } from "react-router-dom";
import { GoPeople, GoDatabase } from "react-icons/go";
import { MdOutlineVerifiedUser } from "react-icons/md";
import { TbWaveSawTool } from "react-icons/tb";
import { IoSettingsOutline, IoLogOutOutline } from "react-icons/io5";
import { AiOutlineHome } from "react-icons/ai";
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";

const Sidebar = () => {
  const location = useLocation();




  const menuItems = [
    { icon: AiOutlineHome, value: "Dashboard", path: "/dashboard" },
    { icon: GoPeople, value: "AI Agent", path: "/agents" },
    { icon: IoChatbubbleEllipsesOutline, value: "Chat", path: "/chat" },
    { icon: MdOutlineVerifiedUser, value: "Integration Bay", path: "/integration" },
    { icon: GoDatabase, value: "Data Uplink", path: "/data" },
    { icon: TbWaveSawTool, value: "Audits Log", path: "/auditlogs" },
    { icon: IoSettingsOutline, value: "Settings", path: "/settings" },
    { icon: IoLogOutOutline, value: "Logout", path: "/logout" }
  ];

  return (
    <div className="h-screen w-54 fixed left-0 top-18 border-r border-sidebar bg-sidebar overflow-y-auto flex-shrink-0 z-10">
      {menuItems.map((item, index) => {
        const isActive = location.pathname === item.path;
        const Icon = item.icon;

        return (
          <Link
            key={index}
            to={item.path}
            className={`block px-6 py-5 cursor-pointer transition-all duration-200 
              ${isActive ? "bg-sidebar-active rounded-md" : ""}
            `}
          >
            <div className="flex items-center">
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