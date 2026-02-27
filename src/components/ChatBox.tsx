import React, { useState, useRef, useEffect } from 'react';
import { IoClose, IoSend } from "react-icons/io5";
import { BsRobot } from "react-icons/bs";
import { HiSparkles } from "react-icons/hi2";
import { useTheme } from '../state/ThemeContext';

interface Message {
  id: number;
  text: string;
  sender: 'bot' | 'user';
  timestamp: Date;
}

interface ChatBoxProps {
  onClose: () => void;
}

const ChatBox: React.FC<ChatBoxProps> = ({ onClose }) => {
  const { isDark } = useTheme();

  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 1, 
      text: "Hi! I'm Vega AI. How can I assist you today?", 
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = (): void => {
    if (inputValue.trim()) {
      const newMessage: Message = {
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
        const botResponse: Message = {
          id: messages.length + 2,
          text: "Thanks for your message! I'm analyzing your request and will provide the best assistance possible.",
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botResponse]);
      }, 1500);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Dark mode tokens — matched to the app's existing dark palette
  const windowBg    = isDark ? '#1a2234' : 'white';
  const windowBorder = isDark ? '#1e2d45' : '#f3f4f6';
  const msgAreaBg   = isDark ? '#0d1117' : undefined; // light uses gradient via className
  const botBubbleBg = isDark ? '#1e2d45' : 'white';
  const botBubbleBorder = isDark ? '#2d3f5c' : '#e5e7eb';
  const botBubbleText   = isDark ? '#e2e8f0' : '#1f2937';
  const timestampColor  = isDark ? '#475569' : '#9ca3af';
  const inputAreaBg     = isDark ? '#1a2234' : 'white';
  const inputAreaBorder = isDark ? '#1e2d45' : '#e5e7eb';
  const inputWrapBg     = isDark ? '#0d1117' : '#f3f4f6';
  const inputTextColor  = isDark ? '#e2e8f0' : 'inherit';
  const footerTextColor = isDark ? '#475569' : '#9ca3af';

  return (
    <div
      className="fixed bottom-20 right-6 w-96 h-[500px] shadow-2xl rounded-2xl z-50 flex flex-col overflow-hidden"
      style={{
        backgroundColor: windowBg,
        border: `1px solid ${windowBorder}`,
      }}
    >
      {/* Header — unchanged gradient */}
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
      <div
        className={`flex-1 overflow-y-auto p-4 ${!isDark ? 'bg-gradient-to-b from-gray-50 to-white' : ''}`}
        style={isDark ? { backgroundColor: msgAreaBg } : undefined}
      >
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
                    : 'rounded-bl-md'
                }`}
                style={
                  message.sender === 'bot'
                    ? {
                        backgroundColor: botBubbleBg,
                        color: botBubbleText,
                        border: `1px solid ${botBubbleBorder}`,
                      }
                    : undefined
                }
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
              </div>
              <span
                className={`text-xs mt-1 px-1 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}
                style={{ color: timestampColor }}
              >
                {formatTime(message.timestamp)}
              </span>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-start animate-fadeIn">
              <div
                className="rounded-2xl rounded-bl-md px-4 py-3 shadow-sm"
                style={{
                  backgroundColor: botBubbleBg,
                  border: `1px solid ${botBubbleBorder}`,
                }}
              >
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
      <div
        className="p-4 border-t"
        style={{
          backgroundColor: inputAreaBg,
          borderColor: inputAreaBorder,
        }}
      >
        <div className="flex gap-2 items-end">
          <div
            className="flex-1 rounded-2xl px-4 py-2.5 border-2 border-transparent focus-within:border-purple-500 transition-colors"
            style={{ backgroundColor: inputWrapBg }}
          >
            <textarea
              className="w-full bg-transparent outline-none text-sm resize-none"
              style={{
                color: inputTextColor,
              }}
              placeholder="Type your message..."
              rows={1}
              value={inputValue}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputValue(e.target.value)}
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
        <p className="text-xs text-center mt-2" style={{ color: footerTextColor }}>
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