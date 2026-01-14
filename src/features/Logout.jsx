import React from 'react';

const Logout = () => {
  return (
    <div className="bg-gray-50 min-h-screen p-6 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Logged Out</h1>
        <p className="text-gray-600">You have been successfully logged out.</p>
        <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Return to Login
        </button>
      </div>
    </div>
  );
};

export default Logout;