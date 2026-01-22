import React, { useState, useRef, useEffect } from 'react';
import { IoClose, IoSend } from "react-icons/io5";
import { BsRobot } from "react-icons/bs";
import { HiSparkles } from "react-icons/hi2";

const ChatBox = ({ onClose }) => {
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      text: "Hi! I'm Vega AI. How can I assist you today?", 
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = () => {
    if (inputValue.trim()) {
      const newMessage = {
        id: messages.length + 1,
        text: inputValue,
        sender: 'user',
        timestamp: new Date()
      };
      setMessages([...messages, newMessage]);
      setInputValue('');

      // Simulate bot typing
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const botResponse = {
          id: messages.length + 2,
          text: "Thanks for your message! I'm analyzing your request and will provide the best assistance possible.",
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botResponse]);
      }, 1500);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="fixed bottom-20 right-6 w-96 h-[500px] bg-white shadow-2xl rounded-2xl z-50 flex flex-col overflow-hidden border border-gray-100">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 px-5 py-4 flex items-center justify-between">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="flex items-center gap-3 relative z-10">
          <div className="relative">
            <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-lg">
              <BsRobot className="text-purple-600" size={24} />
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-white text-lg">Vega AI</h3>
              <HiSparkles className="text-yellow-300" size={16} />
            </div>
            <p className="text-xs text-purple-100 font-medium">Always here to help</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="text-white hover:bg-white/20 rounded-lg p-2 transition-all relative z-10"
          aria-label="Close chat"
        >
          <IoClose size={22} />
        </button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex flex-col ${message.sender === 'user' ? 'items-end' : 'items-start'} animate-fadeIn`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                  message.sender === 'user'
                    ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-br-md'
                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
              </div>
              <span className={`text-xs text-gray-400 mt-1 px-1 ${
                message.sender === 'user' ? 'text-right' : 'text-left'
              }`}>
                {formatTime(message.timestamp)}
              </span>
            </div>
          ))}
          
          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-start animate-fadeIn">
              <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex gap-2 items-end">
          <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-2.5 border-2 border-transparent focus-within:border-purple-500 transition-colors">
            <textarea
              className="w-full bg-transparent outline-none text-sm placeholder-gray-500 resize-none"
              placeholder="Type your message..."
              rows="1"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
          <button
            onClick={handleSend}
            className="bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-xl p-3 hover:shadow-lg hover:scale-105 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            disabled={!inputValue.trim()}
            aria-label="Send message"
          >
            <IoSend size={20} />
          </button>
        </div>
        <p className="text-xs text-gray-400 text-center mt-2">
          Powered by AI • Press Enter to send
        </p>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ChatBox;