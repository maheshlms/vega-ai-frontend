import React, { useState, useEffect } from "react";
import { IoIosSearch } from "react-icons/io";
import { IoMdHelpCircleOutline } from "react-icons/io";
import { MdOutlineNotificationsNone, MdOutlineDarkMode } from "react-icons/md";
import { IoSettingsOutline } from "react-icons/io5";
import { FaRegUser } from "react-icons/fa6";
import { GoSun } from "react-icons/go";

/* ===================== SEARCH BOX ===================== */
const SearchBox = ({ icon: Icon }) => {
  const WORDS = [
    "Search Users",
    "Search Roles",
    "Search Permissions",
    "And more..."
  ];

  const [inputValue, setInputValue] = useState("");
  const [typingText, setTypingText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [isDone, setIsDone] = useState(false);

  /* Typing effect – runs ONCE through all words */
  useEffect(() => {
    if (isFocused || inputValue || isDone) return;

    const currentWord = WORDS[wordIndex];

    if (charIndex < currentWord.length) {
      const timeout = setTimeout(() => {
        setTypingText((prev) => prev + currentWord[charIndex]);
        setCharIndex((prev) => prev + 1);
      }, 80);

      return () => clearTimeout(timeout);
    } else {
      const timeout = setTimeout(() => {
        setTypingText("");
        setCharIndex(0);

        if (wordIndex === WORDS.length - 1) {
          setIsDone(true); // stop forever
        } else {
          setWordIndex((prev) => prev + 1);
        }
      }, 900);

      return () => clearTimeout(timeout);
    }
  }, [charIndex, wordIndex, isFocused, inputValue, isDone]);

  return (
    <div className="relative w-[420px] max-w-full">
      <input
        type="text"
        value={inputValue || typingText}
        onChange={(e) => setInputValue(e.target.value)}
        onFocus={() => {
          setIsFocused(true);
          setTypingText("");
        }}
        onBlur={() => setIsFocused(false)}
        className="w-full h-10 pl-10 pr-3 rounded-md bg-white border border-[#CBD5E1]
          focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 text-slate-900"
      />

      {Icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]">
          <Icon size={18} />
        </span>
      )}
    </div>
  );
};

/* ===================== DARK MODE ===================== */
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
    <button
      onClick={() => setDark(!dark)}
      className="p-2 rounded-md shadow bg-white"
    >
      {dark ? <GoSun size={20} /> : <MdOutlineDarkMode size={20} />}
    </button>
  );
};

/* ===================== TOP BAR ===================== */
const TopBar = () => {
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
          <img src="./logo.png" alt="Vega AI" className="h-9" />
        </div>

        {/* CENTER SEARCH */}
        <SearchBox icon={IoIosSearch} />

        {/* RIGHT */}
        <div className="flex items-center gap-6">
          <MdOutlineNotificationsNone size={24} className="text-navbar-icon" />
          <IoMdHelpCircleOutline size={24} className="text-navbar-icon" />
          <IoSettingsOutline size={24} className="text-navbar-icon" />

          <div className="flex items-center gap-2 px-3 py-1 border border-navbar-profile rounded-md bg-navbar-profile">
            <div className="w-7 h-7 flex items-center justify-center rounded-md bg-navbar-profile-icon">
              <FaRegUser className="text-white text-sm" />
            </div>
            <span className="text-sm font-semibold text-navbar-profile">
              Profile
            </span>
          </div>

          <DarkMode />
        </div>
      </div>
    </div>
  );
};

export default TopBar;
