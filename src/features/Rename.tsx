import React, { useState } from "react";
import { IoIosClose } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import { useUser } from '../utils/UserContext';

const Rename: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [first, setFirst] = useState<string>("");
  const [second, setSecond] = useState<string>("");

  const handleSave = (): void => {
    if (first === second && first.trim() !== "") {
      // Update user name logic here
      // You'll need to add an updateUserName function to your UserContext
      // or handle the name update differently
      console.log("Saving new name:", first);
      navigate("/settings");
    }
  };

  const handleCancel = (): void => {
    navigate("/settings");
  };

  return (
    <>
      {/* Blurred Background Overlay */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" 
        onClick={handleCancel}
      ></div>

      {/* Main Content - Compact Box */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
          
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-2xl">✏️</span>
              <h1 className="text-xl font-bold text-gray-800">Rename User</h1>
            </div>
            <button 
              onClick={handleCancel}
              className="text-gray-400 hover:text-red-500 transition-colors duration-200"
            >
              <IoIosClose className="text-3xl" />
            </button>
          </div>

          {/* Content */}
          <div className="px-5 py-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Name: <span className="font-bold text-indigo-600">{user?.name || 'User'}</span>
              </label>
            </div>

            <input 
              type="text" 
              placeholder="Enter the New Name" 
              className="p-3 border border-gray-300 w-full rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"  
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFirst(e.target.value)}
              value={first}
            />
            
            <input 
              type="text" 
              placeholder="Re-enter your name" 
              className="p-3 border border-gray-300 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSecond(e.target.value)}
              value={second}
            />
            
            {first && second && (
              <p className={`my-3 text-sm font-medium ${first === second ? "text-green-600" : "text-red-600"}`}>
                {first === second ? "✓ Names match" : "✗ Names don't match"}
              </p>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 mt-5">
              <div className="grid grid-cols-2 gap-2">
                <button 
                  className={`border py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    first === second && first.trim() !== ""
                      ? "bg-green-100 text-green-600 border-green-500 hover:bg-green-200 hover:border-green-600 hover:scale-105 cursor-pointer"
                      : "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
                  }`}
                  onClick={handleSave}
                  disabled={first !== second || first.trim() === ""}
                >
                  Save Changes
                </button>
                <button 
                  className="bg-red-100 text-red-600 border border-red-500 py-2 px-3 rounded-lg text-sm font-medium hover:bg-red-200 hover:border-red-600 transition-all duration-200 hover:scale-105"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Rename;