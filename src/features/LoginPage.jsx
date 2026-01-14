import React from 'react'
import InputField from '../components/InputField'
import Btn from '../components/Btn'
import { MdOutlineRemoveRedEye } from "react-icons/md"
import MouseMove from '../effects/MouseMove'
import FloatingDots from '../effects/FloatingDots'
import { GoSun } from "react-icons/go"
import { MdOutlineDarkMode } from "react-icons/md";
import {useState , useEffect} from 'react';

function LoginPage() {

  const[dark , setDark]=useState(false) ;
  
  useEffect(()=>{
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light")
  } , [dark])
  

  return (
    <>
      {/* MOBILE BLOCKER */}
      <div className="flex md:hidden h-screen w-full items-center justify-center bg-slate-900 text-white p-6"    style={{ background: "var(--bg-gradient)" }}>
        <p className="text-center text-lg font-semibold">
          This application is not available on mobile devices.
          <br />
          Please use a laptop or desktop.
        </p>
      </div>

      {/* DESKTOP UI */}
      <div className="hidden md:flex h-screen w-full items-center justify-center bg-gradient-to-l from-[#DBEAFE] via-[#F3E8FF] to-[#FCE7F3] p-6 relative"   style={{ background: "var(--bg-gradient)" }}>
        <MouseMove />
        <FloatingDots />

        {/* THEME ICON */}
        <div >
              <button
        onClick={() => setDark(!dark)}
        className="absolute top-6 right-6 p-2 rounded-md shadow bg-white"
      >
        {dark ? <GoSun /> : <MdOutlineDarkMode />
}
      </button>
        </div>

        {/* LOGIN CARD */}
        <div className="h-[500px] w-[380px] relative rounded-md bg-white shadow-xl"  style={{ background: "var(--card-bg)" }}>
          <div className="flex justify-center pt-6">
            <img src="/logo.png" alt="Vega AI" className="h-10" />
          </div>

          <h1 className="text-center text-2xl font-bold mt-4"    style={{ color: "var(--text-main)" }}>
            Welcome to Vega AI
          </h1>

          <p className="text-center text-xs font-medium text-gray-500 mb-6"    style={{ color: "var(--text-belowmain)" }}>
            Your IAM AI Support Assistant
          </p>

          <div className="px-7"  >
            <label className="text-gray-600"  style={{ color: "var(--username-color)" }}>Username</label>
            <InputField
              className=" border border-[#D1D5DB] mt-1 mb-4 placeholder:text-[#9CA3AF]"
              placeholder="Enter your username"  style={{ color: "var(--input-bg)" }}
            />

            <label className="text-gray-600"  style={{ color: "var(--username-color)" }}>Password</label>
            <InputField
              type="password"
              className=" border border-[#D1D5DB] mt-1 mb-3 pr-10 placeholder:text-[#9CA3AF]"
              placeholder="Enter your password"
            >
              <MdOutlineRemoveRedEye className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer" />
            </InputField>

            <p className="text-sm  font-semibold text-right cursor-pointer mb-6"   style={{ color: "var(--forget-color)" }}>
              Forgot Password?
            </p>

            <Btn
              value="Sign In"
              className="bg-gradient-to-r from-[#3B82F6] to-[#9333EA] w-full h-10 rounded-md  transition-all duration-300 ease-in-out"
            />
          </div>

          <p className="absolute bottom-10 w-full text-center text-xs text-gray-400"    style={{ color: "var(--text-muted)" }}>
            © 2026 Vega.ai - Secure IAM Solution
          </p>
        </div>
      </div>
    </>
  )
}

export default LoginPage
