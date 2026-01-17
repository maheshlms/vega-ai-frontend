import {React, useCallback} from 'react'
import { FaPlus } from "react-icons/fa6";
import { GoPeople, GoGraph } from "react-icons/go";
import { TiFlashOutline, TiTickOutline } from "react-icons/ti";
import { MdOutlineStar } from "react-icons/md";
import { useNavigate } from 'react-router-dom'

const Agents = () => {

  const navigate = useNavigate() ;

  const handleCreateAgent = useCallback(()=>{
    navigate('createagent')

  }, [navigate])
  const data = [
    { icon: GoPeople, value: "4", description: "Total Agents", sub: "+1 this month", iconcolor: "#60A5FA" },
    { icon: TiFlashOutline, value: "3", description: "Active Now", sub: "75% uptime", iconcolor: "#22C55E" },
    { icon: TiTickOutline, value: "2.9k", description: "Tasks Completed", sub: "+12% vs last week", iconcolor: "#A78BFA" },
    { icon: GoGraph, value: "97.5%", description: "Avg Success Rate", sub: "+2.3% improvement", iconcolor: "#F97316" }
  ];

  const agentsData = [
    {
      name: "Astra",
      role: "Ping Federate Agent",
      type: "Authentication",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
      tasks: "100",
      success: "98.5%",
      status: "active"
    },
    {
      name: "Nexa",
      role: "Ping Directory Agent",
      type: "User Mgmt",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop",
      tasks: "150",
      success: "98.5%",
      status: "active"
    },
    {
      name: "Orion",
      role: "Ping One Agent",
      type: "Access Control",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
      tasks: "120",
      success: "98.5%",
      status: "active"
    }
  ];

  const handleExecute = useCallback(()=>{
    navigate('/agents/createagent') ;
  }, [navigate]) ;

  return (
    <div className="bg-[#F9FAFB] min-h-screen pb-10">
      <div className="max-w-[1920px] mx-auto px-6">
        <div className="pt-4">

          {/* HEADER */}
          <div className="heading flex justify-between items-start">
            <div>
              <div className="font-bold text-2xl">AI Agents</div>
              <div className="text-[#9CA3AF]">Manage and monitor your AI-powered IAM agents</div>
            </div>

            <button className="bg-blue-500 px-4 h-10 text-white rounded-md flex items-center gap-2 hover:bg-blue-600 transition-colors whitespace-nowrap"
            onClick={handleExecute}
            >
              <FaPlus />
              <span>Create New Agent</span>
            </button>
          </div>

          {/* STATS CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4   mt-6 mb-8">
            {data.map((items, index) => {
              const Icon = items.icon;

              return (
                <div className="rounded-xl h-45 w-50  shadow-xl bg-white p-4" key={index}>
                  {/* Icon at top */}
                  <div className="flex justify-start mb-3">
                    <div className="w-10 h-10 shadow-lg rounded-xl flex items-center justify-center bg-white">
                      <Icon style={{ color: items.iconcolor }} size={20} />
                    </div>
                  </div>

                  {/* Value - Centered */}
                  <div className="flex items-center justify-center text-3xl font-bold text-slate-900 my-2">
                    {items.value}
                  </div>

                  {/* Description and Sub - Centered */}
                  <div className="text-center mt-3">
                    <h2 className="text-[#6B7280] text-sm font-medium">{items.description}</h2>
                    <p className="text-xs text-[#9CA3AF] mt-1">{items.sub}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* EXPERT MODE SECTION */}
          <div className="mb-6">
            <div className="flex items-center gap-3">
              {/* Star Icon */}
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                <MdOutlineStar className="text-gray-600" size={24} />
              </div>
              {/* Text Content */}
              <div>
                <h2 className="font-bold text-2xl text-black">Expert Mode</h2>
                <p className="text-[#9CA3AF] text-sm">Fully autonomous AI agents with advanced capabilities</p>
              </div>
            </div>
          </div>

          {/* AGENT CARDS */}
          <div className="flex gap-10 ">
            {agentsData.map((agent, index) => (
              <div 
                key={index}
                className="bg-white rounded-2xl p-6 w-50 h-70 shadow-sm border border-gray-200 relative"
                onClick={()=>  navigate('/agents/agentchat') }
              >
                {/* Green Active Dot - Top Right */}
                <div className="absolute top-3 right-3">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                </div>

                {/* Profile Image - Centered */}
                <div className="flex justify-center mb-4">
                  <div className="w-29 h-29 rounded-full overflow-hidden  p-[2px]  bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
                    <img 
                      src={agent.image} 
                      alt={agent.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Type Badge - Centered */}
                <div className="flex justify-center absolute  top-33 left-13 mb-1">
                  <div className="bg-blue-50 text-blue-600 px-3  rounded text-xs font-medium">
                    {agent.type}
                  </div>
                </div>

                {/* Agent Name - Centered */}
                <h3 className="text-center text-xl font-bold text-black ">{agent.name}</h3>
                
                {/* Agent Role - Centered */}
                <p className="text-center text-sm text-gray-600 mb-4">{agent.role}</p>

                {/* Stats - Side by Side */}
                <div className="flex justify-center items-center gap-8">
                  <div className="text-center w-18 h-12 rounded-md  shadow-md">
                    <div className="text-md  font-bold text-black">{agent.tasks}</div>
                    <div className="text-xs text-gray-500">Task</div>
                  </div>
                  <div className="text-center w-18 h-12 rounded-md shadow-md  ">
                    <div className="text-md font-bold text-emerald-600">{agent.success}</div>
                    <div className="text-xs text-gray-500">Success</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Agents;  