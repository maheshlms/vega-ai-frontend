import React from 'react';
import { IoIosClose } from "react-icons/io";
import { useNavigate } from "react-router-dom";

// Type Definitions
interface PlanDataItem {
  heading: string;
  value: string;
}

const Plans: React.FC = () => {
  const navigate = useNavigate();

  const data: PlanDataItem[] = [
    { heading: "Your Current Plan", value: "Basic Plan" },
    { heading: "Status", value: "Active" },
    { heading: "Billing Cycle", value: "Annually" },
    { heading: "Next Billing Date", value: "19/10/2026" },
    { heading: "Amount", value: "₹200k" },
    { heading: "Renewal Date", value: "19/10/2026" }
  ];

  return (
    <>
      {/* Blurred Background Overlay */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={() => navigate("/settings")}></div>

      {/* Main Content - Compact Box */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-120 max-w-xl">
          
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-2xl">👋</span>
              <h1 className="text-xl font-bold text-gray-800">Hi Mahesh</h1>
            </div>
            <button 
              onClick={() => navigate("/settings")}
              className="text-gray-400 hover:text-red-500 transition-colors duration-200"
            >
              <IoIosClose className="text-3xl" />
            </button>
          </div>

          {/* Content */}
          <div className="px-5 py-4">
            
            {/* Plan Details - Compact */}
            <div className="space-y-2 mb-4">
              {data.map((item, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <h2 className="text-sm font-semibold text-gray-600">{item.heading}</h2>
                  <p className="text-sm font-medium text-gray-800">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Action Buttons - Compact */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button className="bg-green-100 text-green-600 border border-green-500 py-2 px-3 rounded-lg text-sm font-medium hover:bg-green-200 hover:border-green-600 transition-all duration-200 hover:scale-105">
                  Upgrade Plan
                </button>
                <button className="bg-red-100 text-red-600 border border-red-500 py-2 px-3 rounded-lg text-sm font-medium hover:bg-red-200 hover:border-red-600 transition-all duration-200 hover:scale-105">
                  Cancel
                </button>
              </div>
              
              <button className="w-full bg-blue-100 text-blue-600 border border-blue-500 py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-200 hover:border-blue-600 transition-all duration-200 hover:scale-105">
                View Billing History
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default Plans;