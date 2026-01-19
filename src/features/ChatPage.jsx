import React, { useState, useEffect, useRef } from 'react';
import { FaPaperPlane, FaRobot, FaUser } from "react-icons/fa";
import { BsThreeDots } from "react-icons/bs";
import { MdRefresh } from "react-icons/md";
import { api } from '../utils/api';

const ChatPage = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Hello! I\'m your AI assistant. How can I help you with your IAM tasks today?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Format chat history as {User1: msg, Agent1: reply, User2: msg, ...}
      const chatHistory = {};
      messages.forEach((msg, index) => {
        const key = msg.sender === 'user' ? `User${Math.floor(index / 2) + 1}` : `Agent${Math.floor((index + 1) / 2)}`;
        chatHistory[key] = msg.text;
      });

      const response = await api.sendChatMessage(inputMessage, chatHistory);
      
      const botMessage = {
        id: Date.now() + 1,
        sender: 'bot',
        text: response.reply || 'I received your message.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage = {
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

  const handleClearChat = () => {
    setMessages([
      {
        id: 1,
        sender: 'bot',
        text: 'Hello! I\'m your AI assistant. How can I help you with your IAM tasks today?',
        timestamp: new Date()
      }
    ]);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const suggestedQuestions = [
    "Show me license details",
    "Check certificate expiry",
    "View active sessions",
    "Help me renew a license"
  ];

  return (
    <div className="bg-[#F9FAFB] min-h-screen pb-10">
      <div className="max-w-[1920px] mx-auto px-6">
        <div className="pt-4">

          {/* HEADER */}
          <div className="heading flex justify-between items-start mb-6">
            <div>
              <div className="font-bold text-2xl">AI Chat Assistant</div>
              <div className="text-[#9CA3AF]">Interact with your AI agent for IAM tasks</div>
            </div>

            <button 
              onClick={handleClearChat}
              className="bg-white border border-gray-300 px-4 h-10 text-gray-700 rounded-md flex items-center gap-2 hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              <MdRefresh />
              <span>Clear Chat</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* MAIN CHAT AREA */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
                
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                      <FaRobot className="text-white" size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">AI Assistant</h3>
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Online
                      </p>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    <BsThreeDots size={20} />
                  </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} items-start gap-3`}
                    >
                      {message.sender === 'bot' && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                          <FaRobot className="text-white" size={14} />
                        </div>
                      )}
                      
                      <div className={`max-w-[70%] ${message.sender === 'user' ? 'order-1' : ''}`}>
                        <div
                          className={`rounded-2xl px-4 py-3 ${
                            message.sender === 'user'
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                              : message.isError
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                        </div>
                        <p className="text-xs text-gray-400 mt-1 px-1">
                          {formatTime(message.timestamp)}
                        </p>
                      </div>

                      {message.sender === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                          <FaUser className="text-white" size={14} />
                        </div>
                      )}
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                        <FaRobot className="text-white" size={14} />
                      </div>
                      <div className="bg-gray-100 rounded-2xl px-4 py-3">
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

                {/* Input Area */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Type your message..."
                      disabled={isLoading}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
                    />
                    <button
                      type="submit"
                      disabled={!inputMessage.trim() || isLoading}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                    >
                      <FaPaperPlane size={18} />
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* SIDEBAR */}
            <div className="lg:col-span-1 space-y-6">
              {/* Quick Actions */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Suggested Questions</h3>
                <div className="space-y-2">
                  {suggestedQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => setInputMessage(question)}
                      className="w-full text-left px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 text-sm text-gray-700 transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Stats */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Session Info</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Messages</span>
                    <span className="text-sm font-semibold text-gray-900">{messages.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Status</span>
                    <span className="text-sm font-semibold text-green-600">Active</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Response Time</span>
                    <span className="text-sm font-semibold text-gray-900">~2s</span>
                  </div>
                </div>
              </div>

              {/* Help Card */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-100 p-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
                    <FaRobot className="text-blue-500" size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Need Help?</h4>
                    <p className="text-sm text-gray-600">
                      Ask me anything about licenses, certificates, users, or IAM configurations.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
