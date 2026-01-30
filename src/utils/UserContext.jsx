import React, { createContext, useState, useContext } from 'react';

// Create Context
const UserContext = createContext();

// Custom hook to use the context
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

// Provider Component
export const UserProvider = ({ children }) => {
  // Initialize from localStorage if available, otherwise use default
  const [userName, setUserName] = useState(() => {
    const savedName = localStorage.getItem('userName');
    return savedName || "Mahesh";
  });

  // Update userName and persist to localStorage
  const updateUserName = (newName) => {
    setUserName(newName);
    localStorage.setItem('userName', newName);
  };

  return (
    <UserContext.Provider value={{ userName, updateUserName }}>
      {children}
    </UserContext.Provider>
  );
};