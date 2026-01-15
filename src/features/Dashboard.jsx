import React, { useEffect, useState } from 'react'
import { TbWaveSawTool } from "react-icons/tb"
import { TfiReload } from "react-icons/tfi"
import { FaRegClock } from "react-icons/fa"
import { MdMonitor, MdSecurity } from "react-icons/md"
import { PiCertificate } from "react-icons/pi"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { CiServer } from "react-icons/ci"
import FloatingChat from "./FloatingChat" ;

const Dashboard = () => {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  const data = [
    { value: "142", icon: FaRegClock, description: "Today • 98% success", iconcolor: "#16A34A", heading: "Password Reset" },
    { value: "99.8%", icon: MdMonitor, description: "Last 30 days", iconcolor: "#2563EB", heading: "System Uptime" },
    { value: "2,847", icon: TbWaveSawTool, description: "Authenticated users", iconcolor: "#7C3AED", heading: "Active Sessions" },
    { value: "12", icon: PiCertificate, description: "Expiring soon", iconcolor: "#EA580C", heading: "Certificates" }
  ]

  const datatwo = [
    { value: "2847", description: "User Provisioning", sub: "+12 today" },
    { value: "1234", description: "Token Refreshes", sub: "Last hour" },
    { value: "94%", description: "MFA Adoption", sub: "Users enabled" },
    { value: "7", description: "Role Changes", sub: "Pending Approval" }
  ]

  const chartData = [
    { day: 'Mon', successful: 750, failed: 45 },
    { day: 'Tue', successful: 920, failed: 38 },
    { day: 'Wed', successful: 680, failed: 42 },
    { day: 'Thu', successful: 850, failed: 35 },
    { day: 'Fri', successful: 950, failed: 40 },
    { day: 'Sat', successful: 520, failed: 28 },
    { day: 'Sun', successful: 890, failed: 32 }
  ]

  const certdata = [
    { value: "sso.company.com", day: "12 days", colo: "#000000" },
    { value: "api.company.com", day: "18 days", colo: "#000000" },
    { value: "auth.company.com", day: "✓ Renewed", colo: "#22C55E" }
  ]

  const licenseData = [
    { name: "Pingidentity", days: "156 days", bgColor: "#D1FAE5", textColor: "#059669" },
    { name: "Support Contract", days: "45 days", bgColor: "#FEF3C7", textColor: "#D97706" },
    { name: "Keycloak", days: "Open Source", bgColor: "#DBEAFE", textColor: "#2563EB" }
  ]

  const environmentData = {
    production: {
      title: "Production",
      nodes: "4/4 nodes",
      color: "#22C55E",
      servers: [
        { name: "ping-prod-1", status: "online" },
        { name: "ping-prod-2", status: "online" },
        { name: "keycloak-prod-1", status: "online" },
        { name: "keycloak-prod-2", status: "online" }
      ]
    },
    staging: {
      title: "Staging",
      nodes: "2/3 nodes",
      color: "#F59E0B",
      servers: [
        { name: "ping-staging-1", status: "online" },
        { name: "keycloak-staging-1", status: "online" },
        { name: "keycloak-staging-2", status: "offline" }
      ]
    },
    development: {
      title: "Development",
      nodes: "2/2 nodes",
      color: "#22C55E",
      servers: [
        { name: "ping-dev-1", status: "online" },
        { name: "keycloak-dev-1", status: "online" }
      ]
    }
  }

  const securityAlerts = [
    { type: "Failed logins", count: "23" },
    { type: "Compliance violations", count: "2" },
    { type: "Auto-resolved", count: "18" }
  ]

  return (
    <div className="bg-[#F9FAFB] min-h-screen pb-10">
      <div className="max-w-[1920px] mx-auto px-6">
        
        {/* Header Section */}
        <div className={`pt-4 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl 2xl:text-3xl font-bold text-slate-800">IAM Command Center</h1>
            <TfiReload className="text-[#16A34A] cursor-pointer hover:rotate-180 transition-transform duration-500 hover:scale-110" />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <TbWaveSawTool size={22} className="text-gray-400" />
            <p className="text-sm text-[#6B7280]">Agent Uptime : 99.8%</p>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-1" />
          </div>
        </div>

        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-4">
          {data.map((item, index) => (
            <div 
              key={index} 
              className={`rounded-xl shadow-xl bg-white p-3 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: `${index * 80}ms` }}
            >
              <div className="flex justify-between items-center">
                <p className="text-sm text-[#6B7280] font-medium">{item.heading}</p>
                <div className="p-1.5 rounded-lg bg-slate-50 hover:scale-110 transition-transform duration-300">
                  <item.icon size={18} style={{ color: item.iconcolor }} />
                </div>
              </div>
              <p className="text-lg 2xl:text-xl font-bold text-center mt-2 text-slate-900">{item.value}</p>
              <p className="text-xs text-center mt-1 text-[#9CA3AF]">{item.description}</p>
            </div>
          ))}
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {datatwo.map((item, index) => (
            <div 
              key={index} 
              className={`rounded-xl shadow-xl bg-white p-3 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 group ${isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}
              style={{ transitionDelay: `${320 + index * 80}ms` }}
            >
              <p className="text-lg 2xl:text-xl font-bold text-center mt-2 text-slate-900 group-hover:scale-105 transition-transform duration-300">{item.value}</p>
              <p className="text-sm text-[#6B7280] text-center mt-1 font-medium">{item.description}</p>
              <p className="text-xs text-[#9CA3AF] text-center mt-1">{item.sub}</p>
            </div>
          ))}
        </div>

        {/* Chart and Side Cards Section */}
        <div className={`flex flex-col xl:flex-row gap-4 mt-6 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '640ms' }}>
          
          {/* SSO TRANSACTION OVERVIEW CHART */}
          <div className="flex-1 bg-white rounded-xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 group h-90">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-sm shadow-blue-500/50"></div>
                <h2 className="text-base 2xl:text-lg font-semibold text-gray-800">
                  SSO Transaction Overview (This Week)
                </h2>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-all duration-300 hover:rotate-12">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth="2" />
                  <path strokeLinecap="round" strokeWidth="2" d="M12 8v4m0 4h.01" />
                </svg>
              </button>
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <defs>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="day"
                  stroke="#9CA3AF"
                  tick={{ fill: '#000000', fontSize: 12 }}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <YAxis
                  stroke="#9CA3AF"
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="successful"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  dot={{ fill: '#10B981', r: 4, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }}
                  name="Successful"
                />
                <Line
                  type="monotone"
                  dataKey="failed"
                  stroke="#EF4444"
                  strokeWidth={2.5}
                  dot={{ fill: '#EF4444', r: 4, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, fill: '#EF4444', strokeWidth: 2, stroke: '#fff' }}
                  name="Failed"
                />
              </LineChart>
            </ResponsiveContainer>

            {/* Footer */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs text-gray-600">4,963 Successful</span>
              </div>
              <div className="flex items-center gap-2 text-blue-500 cursor-pointer hover:text-blue-600 transition-colors group/link">
                <span className="text-sm font-medium">30 Failed Today</span>
                <svg className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE CARDS COLUMN */}
          <div className="flex flex-col gap-4 xl:w-80 2xl:w-96">
            
            {/* CERTIFICATE RENEWALS */}
            <div className="shadow-xl rounded-xl bg-white p-4 hover:shadow-2xl transition-all duration-300 hover:scale-[1.01]">
              <div className="flex gap-2 items-center mb-4">
                <div className="p-1.5 rounded-lg bg-orange-50">
                  <PiCertificate size={24} className="text-[#EA580C]" />
                </div>
                <h2 className="font-bold text-sm">Certificate Renewals</h2>
              </div>
              <div className="space-y-2">
                {certdata.map((items, index) => (
                  <div 
                    key={index} 
                    className="rounded-md h-10 bg-gray-50 shadow-sm flex justify-between items-center px-3 hover:bg-gray-100 transition-all duration-300 hover:scale-[1.01]"
                  >
                    <p className="text-sm truncate max-w-[60%] font-medium">{items.value}</p>
                    <p className="text-sm font-medium whitespace-nowrap" style={{ color: items.colo }}>
                      {items.day}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* LICENSE STATUS */}
            <div className="shadow-xl rounded-xl bg-white p-4 hover:shadow-2xl transition-all duration-300 hover:scale-[1.01]">
              <div className="flex gap-2 items-center mb-4">
                <div className="p-1.5 rounded-lg bg-blue-50">
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 className="font-bold text-sm">License Status</h2>
              </div>
              <div className="space-y-2">
                {licenseData.map((license, index) => (
                  <div
                    key={index}
                    className="rounded-md h-12 flex justify-between items-center px-3 hover:opacity-90 transition-all duration-300 hover:scale-[1.01]"
                    style={{ backgroundColor: license.bgColor }}
                  >
                    <p className="text-sm font-medium" style={{ color: license.textColor }}>
                      {license.name}
                    </p>
                    <p className="text-sm font-semibold whitespace-nowrap" style={{ color: license.textColor }}>
                      {license.days}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ENVIRONMENT STATUS AND SECURITY ALERTS */}
        <div className={`flex flex-col lg:flex-row gap-4 mt-6 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '800ms' }}>
          
          {/* ENVIRONMENT STATUS */}
          <div className="flex-1 bg-white rounded-xl shadow-xl -mt-30 h-65 p-5 hover:shadow-2xl transition-all duration-300">
            {/* Header */}
            <div className="flex items-center gap-2 mb-5">
              <div className="p-1.5 rounded-lg bg-indigo-50">
                <CiServer size={24} className="text-[#818CF8]" />
              </div>
              <h1 className="text-lg font-bold">Environment Status</h1>
            </div>

            {/* Three Columns */}
            <div className="flex flex-col sm:flex-row gap-5">
              
              {/* PRODUCTION */}
              <div className="flex-1 pb-5 sm:pb-0 sm:pr-5 border-b sm:border-b-0 sm:border-r border-gray-200">
                <div className="flex justify-between items-center mb-3">
                  <div className="font-semibold text-sm">Production</div>
                  <div className="flex items-center gap-2 -mr-4 bg-emerald-50 px-2 py-1 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-sm shadow-green-500/50"></div>
                    <span className="text-[9px]  font-medium text-green-600">4/4 nodes</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {environmentData.production.servers.map((server, index) => (
                    <div key={index} className="flex justify-between items-center hover:bg-slate-50 p-1.5 rounded transition-colors duration-200">
                      <span className="text-xs text-gray-600 font-medium">{server.name}</span>
                      <div 
                        className="w-2 h-2 rounded-full shadow-sm" 
                        style={{ 
                          backgroundColor: server.status === 'online' ? '#22C55E' : '#EF4444',
                          boxShadow: server.status === 'online' ? '0 0 6px rgba(34, 197, 94, 0.5)' : '0 0 6px rgba(239, 68, 68, 0.5)'
                        }}
                      ></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* STAGING */}
              <div className="flex-1 pb-5 sm:pb-0 sm:px-5 border-b sm:border-b-0 sm:border-r border-gray-200">
                <div className="flex justify-between items-center mb-3">
                  <div className="font-semibold text-sm">Staging</div>
                  <div className="flex items-center gap-2 -mr-4 bg-orange-50 px-2 py-1 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shadow-sm shadow-orange-500/50"></div>
                    <span className="text-[9px] font-medium text-orange-600">2/3 nodes</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {environmentData.staging.servers.map((server, index) => (
                    <div key={index} className="flex justify-between items-center hover:bg-slate-50 p-1.5 rounded transition-colors duration-200">
                      <span className="text-xs text-gray-600 font-medium">{server.name}</span>
                      <div 
                        className="w-2 h-2 rounded-full shadow-sm" 
                        style={{ 
                          backgroundColor: server.status === 'online' ? '#22C55E' : '#EF4444',
                          boxShadow: server.status === 'online' ? '0 0 6px rgba(34, 197, 94, 0.5)' : '0 0 6px rgba(239, 68, 68, 0.5)'
                        }}
                      ></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* DEVELOPMENT */}
              <div className="flex-1 sm:pl-5">
                <div className="flex justify-between items-center mb-3">
                  <div className="font-semibold text-sm">Development</div>
                  <div className="flex items-center gap-2 -mr-4 bg-emerald-50 px-2 py-1 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-sm shadow-green-500/50"></div>
                    <span className="text-[9px] font-medium text-green-600">2/2 nodes</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {environmentData.development.servers.map((server, index) => (
                    <div key={index} className="flex justify-between items-center hover:bg-slate-50 p-1.5 rounded transition-colors duration-200">
                      <span className="text-xs text-gray-600 font-medium">{server.name}</span>
                      <div 
                        className="w-2 h-2 rounded-full shadow-sm" 
                        style={{ 
                          backgroundColor: server.status === 'online' ? '#22C55E' : '#EF4444',
                          boxShadow: server.status === 'online' ? '0 0 6px rgba(34, 197, 94, 0.5)' : '0 0 6px rgba(239, 68, 68, 0.5)'
                        }}
                      ></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SECURITY ALERTS */}
          <div className="lg:w-80 2xl:w-96 bg-white rounded-xl h-70  shadow-xl p-5 hover:shadow-2xl transition-all duration-300">
            {/* Header */}
            <div className="flex items-center gap-2 ">
              <div className="p-1.5 rounded-lg bg-red-50">
                <MdSecurity size={24} className="text-red-500" />
              </div>
              <h1 className="text-lg font-bold">Security Alerts</h1>
            </div>

            {/* Alert Items */}
            <div className="space-y-3">
              {securityAlerts.map((alert, index) => (
                <div key={index} className="flex justify-between items-center hover:bg-slate-50 p-2 rounded transition-colors duration-200">
                  <span className="text-sm text-gray-700 font-medium">{alert.type}</span>
                  <span className="text-sm font-semibold text-gray-900 bg-slate-100 px-3 py-1 rounded-full">{alert.count}</span>
                </div>
              ))}
            </div>

            {/* Action Button */}
            <button className="w-full mt-5 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-all duration-300 border border-blue-200 active:scale-95 transform hover:shadow-md">
              All critical issues resolved
            </button>
          </div>
        </div>
          <div className="chatbot flex items-center ">
              <FloatingChat />
          </div>

      </div>

      {/* Minimal Custom CSS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        * {
          font-family: 'Inter', sans-serif;
        }
      `}</style>
    </div>
  )
}

export default Dashboard