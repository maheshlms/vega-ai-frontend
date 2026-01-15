import React, { useState, useEffect } from "react";
import { IoIosSearch } from "react-icons/io";
import { IoMdHelpCircleOutline } from "react-icons/io";
import { MdOutlineNotificationsNone, MdOutlineDarkMode } from "react-icons/md";
import { IoSettingsOutline } from "react-icons/io5";
import { FaRegUser } from "react-icons/fa6";
import { GoSun } from "react-icons/go";



/* ---------------- SEARCH BOX ---------------- */
const SearchBox = ({ text, placeholder, className = "", icon: Icon }) => (
  <div className="relative w-[420px]  max-w-full">
    <input
      type={text || "text"}
      placeholder={placeholder}
      className={`w-full h-10 pl-10 pr-3 rounded-md bg-white border border-[#CBD5E1]
        focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 ${className}`}
    />
    {Icon && (
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]">
        <Icon size={18} />
      </span>
    )}
  </div>
);

/* ---------------- DARK MODE ---------------- */
const DarkMode = () => {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(localStorage.getItem("darkMode") === "true");
  }, []);

  useEffect(() => {
    localStorage.setItem("darkMode", dark.toString());
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <button onClick={() => setDark(!dark)} className="p-2 rounded-md shadow bg-white cursor-pointer">
      {dark ? <GoSun size={20} /> : <MdOutlineDarkMode size={20} />}
    </button>
  );
};

/* ---------------- TOP BAR ---------------- */
const TopBar = () => {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(localStorage.getItem("darkMode") === "true");
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      setDark(localStorage.getItem("darkMode") === "true");
    };
    window.addEventListener('storage', handleStorageChange);
    
    // Poll for changes since localStorage events don't fire in same tab
    const interval = setInterval(handleStorageChange, 100);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="sticky top-0 z-50 w-full bg-navbar border-b border-navbar-profile">

      {/* MOBILE BLOCKER */}
      <div className="md:hidden h-screen flex items-center justify-center bg-slate-900 text-white p-6">
        <p className="text-center text-lg font-semibold">
          This application is not available on mobile devices.
          <br /> Please use a laptop or desktop.
        </p>
      </div>

      {/* DESKTOP NAVBAR */}
      <div className="hidden md:flex h-18 items-center justify-between px-6 min-w-[1024px]">

        {/* LEFT */}
        <div className="flex items-center">
          <img src={dark ? "./logo-dark.png" : "./logo-light.png"} alt="Vega AI" className="h-9" />
        </div>

        {/* CENTER SEARCH */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <SearchBox placeholder="Search users, roles, permissions and more" icon={IoIosSearch} />
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-6">
          <MdOutlineNotificationsNone size={24} className="text-navbar-icon cursor-pointer" />
          <IoMdHelpCircleOutline size={24} className="text-navbar-icon cursor-pointer" />
          <IoSettingsOutline size={24} className="text-navbar-icon cursor-pointer" />

          <div className="flex items-center gap-2 px-3 py-1 border border-navbar-profile rounded-md bg-navbar-profile cursor-pointer">
            <div className="w-7 h-7 flex items-center justify-center rounded-md bg-navbar-profile-icon">
              <FaRegUser className="text-white text-sm" />
            </div>
            <span className="text-sm font-semibold text-navbar-profile">Profile</span>
          </div>

          <DarkMode />
        </div>
      </div>
    </div>
  );
};

export default TopBar;
