import React from 'react';
import { useState } from 'react';
import { MdChat } from "react-icons/md";
import ChatBox from "../../components/ChatBox";

const FloatingChat: React.FC = () => {
  const [open, setOpen] = useState<boolean>(false);

  const closeChat = (): void => {
    setOpen(false);
  };

  return (
    <>
      <style>
        {`
          @keyframes dropIn {
            0% {
              transform: translateY(-500px) rotate(-180deg);
              opacity: 0;
            }
            60% {
              transform: translateY(20px) rotate(10deg);
              opacity: 1;
            }
            80% {
              transform: translateY(-10px) rotate(-5deg);
            }
            100% {
              transform: translateY(0) rotate(0);
              opacity: 1;
            }
          }
          
          @keyframes float {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-15px);
            }
          }
          
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          
          .chatbot-button {
            animation: dropIn 3s cubic-bezier(0.68, -0.55, 0.265, 1.55),
                       float 5s ease-in-out 3s infinite;
          }
          
          .backdrop-blur {
            animation: fadeIn 0.3s ease-out;
          }
        `}
      </style>

      {/* Blur Backdrop - Only shows when chat is open */}
      {open && (
        <div 
          className="backdrop-blur fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          onClick={closeChat}
        />
      )}

      <button 
        onClick={() => setOpen(!open)}  
        className="chatbot-button fixed bottom-4 right-4 lg:bottom-6 lg:right-6 xl:bottom-8 xl:right-8 2xl:bottom-10 2xl:right-10 z-50 bg-blue-600 text-white p-3 lg:p-4 xl:p-5 2xl:p-6 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
      >
        <MdChat size={20} className="lg:text-[22px] xl:text-[26px] 2xl:text-[30px]" />
      </button>

      {open && <ChatBox onClose={closeChat} />}
    </>
  );
};

export default FloatingChat;