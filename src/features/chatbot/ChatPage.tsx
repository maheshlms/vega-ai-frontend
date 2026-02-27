import React, { useState, useRef, useEffect } from 'react';
import { FaPaperPlane, FaRobot, FaUser, FaTimes, FaComments } from "react-icons/fa";
import { BsThreeDots } from "react-icons/bs";
import { api } from '../../utils/api';
import { useTheme } from '../../state/ThemeContext';

// Type Definitions
interface Message {
  id: number;
  sender: 'bot' | 'user';
  text: string;
  timestamp: Date;
  isError?: boolean;
}

interface ChatHistory {
  [key: string]: string;
}

const ChatPage: React.FC = () => {
  const { isDark } = useTheme();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'bot',
      text: 'Hello! I\'m your AI assistant. How can I help you with your IAM tasks today?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now(),
      sender: 'user',
      text: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Format chat history
      const chatHistory: ChatHistory = {};
      messages.forEach((msg, index) => {
        const key = msg.sender === 'user' ? `User${Math.floor(index / 2) + 1}` : `Agent${Math.floor((index + 1) / 2)}`;
        chatHistory[key] = msg.text;
      });

      const response = await api.sendChatMessage(inputMessage, chatHistory);
      
      const botMessage: Message = {
        id: Date.now() + 1,
        sender: 'bot',
        text: response.reply || 'I received your message.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage: Message = {
        id: Date.now() + 1,
        sender: 'bot',
        text: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
        isError: true
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = (): void => {
    setMessages([
      {
        id: 1,
        sender: 'bot',
        text: 'Hello! I\'m your AI assistant. How can I help you with your IAM tasks today?',
        timestamp: new Date()
      }
    ]);
  };

  const formatTime = (date: Date): string => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const suggestedQuestions: string[] = [
    "Show me agent details",
    "Check system status",
    "View active agents",
    "Agent performance report"
  ];

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 lg:bottom-6 lg:right-6 w-12 h-12 lg:w-16 lg:h-16 xl:w-18 xl:h-18 2xl:w-20 2xl:h-20 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full shadow-2xl hover:shadow-blue-500/50 hover:scale-110 transition-all duration-300 flex items-center justify-center z-50 group"
        aria-label="Open chat"
      >
        {isOpen ? (
          <FaTimes size={20} className="animate-spin-slow lg:text-2xl" />
        ) : (
          <FaComments size={20} className="group-hover:scale-110 transition-transform lg:text-2xl" />
        )}
        <span className="absolute -top-1 -right-1 w-3 h-3 lg:w-4 lg:h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></span>
      </button>

      {/* Floating Chat Window */}
      {isOpen && (
        <div
          className="fixed top-16 lg:top-20 right-2 lg:right-6 w-[calc(100vw-1rem)] max-w-sm lg:w-96 xl:w-[420px] 2xl:w-[460px] rounded-2xl shadow-2xl z-50 overflow-hidden animate-slideDown"
          style={{
            maxHeight: 'calc(100vh - 100px)',
            backgroundColor: isDark ? '#1a2234' : 'white',
            border: `1px solid ${isDark ? '#1e2d45' : '#e5e7eb'}`,
          }}
        >
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 lg:p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <FaRobot className="text-white" size={16} />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm lg:text-base">AI Assistant</h3>
                <p className="text-xs text-blue-100 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  Online
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 lg:gap-2">
              <button
                onClick={handleClearChat}
                className="text-white/80 hover:text-white p-1.5 lg:p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="Clear chat"
              >
                <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white p-1.5 lg:p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <FaTimes size={16} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div
            className="h-72 lg:h-96 xl:h-[420px] 2xl:h-[460px] overflow-y-auto p-3 lg:p-4 space-y-3"
            style={{ backgroundColor: isDark ? '#0d1117' : '#f9fafb' }}
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} items-start gap-2 animate-fadeIn`}
              >
                {message.sender === 'bot' && (
                  <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                    <FaRobot className="text-white" size={12} />
                  </div>
                )}

                <div className={`max-w-[75%] ${message.sender === 'user' ? 'order-1' : ''}`}>
                  <div
                    className={`rounded-2xl px-3 py-2 lg:px-4 lg:py-2 ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                        : message.isError
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : ''
                    }`}
                    style={
                      message.sender === 'bot' && !message.isError
                        ? {
                            backgroundColor: isDark ? '#1a2234' : 'white',
                            color: isDark ? '#e2e8f0' : '#111827',
                            border: `1px solid ${isDark ? '#1e2d45' : '#e5e7eb'}`,
                          }
                        : undefined
                    }
                  >
                    <p className="text-xs lg:text-sm whitespace-pre-wrap">{message.text}</p>
                  </div>
                  <p
                    className="text-xs mt-1 px-1"
                    style={{ color: isDark ? '#475569' : '#9ca3af' }}
                  >
                    {formatTime(message.timestamp)}
                  </p>
                </div>

                {message.sender === 'user' && (
                  <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <FaUser className="text-white" size={12} />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start items-start gap-2 animate-fadeIn">
                <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <FaRobot className="text-white" size={12} />
                </div>
                <div
                  className="rounded-2xl px-3 py-3 lg:px-4"
                  style={{
                    backgroundColor: isDark ? '#1a2234' : 'white',
                    border: `1px solid ${isDark ? '#1e2d45' : '#e5e7eb'}`,
                  }}
                >
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions */}
          {messages.length === 1 && (
            <div
              className="px-3 py-2 lg:px-4 lg:py-3 border-t"
              style={{
                backgroundColor: isDark ? '#1a2234' : 'white',
                borderColor: isDark ? '#1e2d45' : '#e5e7eb',
              }}
            >
              <p
                className="text-xs mb-2 font-medium"
                style={{ color: isDark ? '#64748b' : '#6b7280' }}
              >
                Quick questions:
              </p>
              <div className="grid grid-cols-2 gap-1.5 lg:gap-2">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => setInputMessage(question)}
                    className="text-left px-2 py-1.5 lg:px-3 lg:py-2 rounded-lg text-xs transition-colors"
                    style={{
                      backgroundColor: isDark ? '#0d1117' : '#f9fafb',
                      color: isDark ? '#94a3b8' : '#374151',
                      border: `1px solid ${isDark ? '#1e2d45' : '#e5e7eb'}`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = isDark ? '#1e2d45' : '#f3f4f6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = isDark ? '#0d1117' : '#f9fafb';
                    }}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 lg:p-4 border-t"
            style={{
              backgroundColor: isDark ? '#1a2234' : 'white',
              borderColor: isDark ? '#1e2d45' : '#e5e7eb',
            }}
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1 px-3 py-2 lg:px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs lg:text-sm transition-colors"
                style={{
                  backgroundColor: isDark ? '#0d1117' : 'white',
                  color: isDark ? '#e2e8f0' : '#111827',
                  border: `1px solid ${isDark ? '#1e2d45' : '#d1d5db'}`,
                  cursor: isLoading ? 'not-allowed' : 'text',
                  opacity: isLoading ? 0.6 : 1,
                }}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-2 lg:px-4 rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
              >
                <FaPaperPlane size={14} />
              </button>
            </div>
          </form>
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-100px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

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

        .animate-slideDown {
          animation: slideDown 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-spin-slow {
          animation: spin 0.3s ease-in-out;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(180deg);
          }
        }
      `}</style>
    </>
  );
};

export default ChatPage;