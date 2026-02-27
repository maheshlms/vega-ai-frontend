import React, { useState, useRef, useEffect } from 'react';
import { IoIosSearch, IoIosClose } from 'react-icons/io';
import { FaRobot, FaClock, FaBolt, FaChartBar } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { IconType } from 'react-icons';

interface SearchBoxProps {
  icon?: IconType;
}

interface QuickAction {
  icon: IconType;
  label: string;
  // shortcut: string;
  action: () => void;
}

interface SearchResult {
  type: string;
  icon: string;
  name: string;
  description: string;
  action: () => void;
}

const SearchBox: React.FC<SearchBoxProps> = ({ icon: Icon }) => {
  const WORDS: string[] = [
    "Search Users",
    "Search Roles",
    "Search Permissions",
    "And more..."
  ];

  const [inputValue, setInputValue] = useState<string>("");
  const [typingText, setTypingText] = useState<string>("");
  const [wordIndex, setWordIndex] = useState<number>(0);
  const [charIndex, setCharIndex] = useState<number>(0);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [isDone, setIsDone] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const [recentSearches] = useState<string[]>([
    // 'Astra - Ping Federate Agent',
    'Dashboard',
    // 'SSL Certificate Renewal',
    // 'Integration Settings'
  ]);

  const quickActions: QuickAction[] = [
    {
      icon: FaRobot,
      label: 'Create New Agent',
      // shortcut: 'Ctrl + N',
      action: () => navigate('/agents/createagent')
    },
    {
      icon: FaChartBar,
      label: 'View Dashboard',
      // shortcut: 'Ctrl + D',
      action: () => navigate('/agent_dashboard')
    },
    {
      icon: FaBolt,
      label: 'View All Agents',
      // shortcut: 'Ctrl + A',
      action: () => navigate('/agents')
    }
  ];

  const searchResults: SearchResult[] = [
    {
      type: 'agent',
      icon: '🤖',
      name: 'Astra',
      description: 'Ping Federate Agent',
      action: () => navigate('/agents/agentchat')
    },
    {
      type: 'agent',
      icon: '🤖',
      name: 'Nexa',
      description: 'Ping Directory Agent',
      action: () => navigate('/agents')
    },
    {
      type: 'page',
      icon: '📊',
      name: 'Dashboard',
      description: 'View analytics and statistics',
      action: () => navigate('/agent_dashboard')
    },
    {
      type: 'page',
      icon: '⚙️',
      name: 'Settings',
      description: 'Configure your account',
      action: () => navigate('/settings')
    }
  ];

  const filteredResults: SearchResult[] = inputValue
    ? searchResults.filter(
        (item) =>
          item.name.toLowerCase().includes(inputValue.toLowerCase()) ||
          item.description.toLowerCase().includes(inputValue.toLowerCase())
      )
    : [];

  /* Typing effect */
  useEffect(() => {
    if (isFocused || inputValue || isDone) return;

    const currentWord = WORDS[wordIndex];

    if (charIndex < currentWord.length) {
      const timeout = setTimeout(() => {
        setTypingText((prev) => prev + currentWord[charIndex]);
        setCharIndex((prev) => prev + 1);
      }, 80);

      return () => clearTimeout(timeout);
    } else {
      const timeout = setTimeout(() => {
        setTypingText("");
        setCharIndex(0);

        if (wordIndex === WORDS.length - 1) {
          setIsDone(true);
        } else {
          setWordIndex((prev) => prev + 1);
        }
      }, 900);

      return () => clearTimeout(timeout);
    }
  }, [charIndex, wordIndex, isFocused, inputValue, isDone, WORDS]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleResultClick = (action: () => void): void => {
    action();
    setIsOpen(false);
    setInputValue('');
  };

  return (
    <div className="relative w-[280px] lg:w-[420px] xl:w-[480px] 2xl:w-[520px] max-w-full" ref={dropdownRef}>
      <input
        ref={inputRef}
        type="text"
        value={inputValue || typingText}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
        onFocus={() => {
          setIsFocused(true);
          setTypingText("");
          setIsOpen(true);
        }}
        onBlur={() => setIsFocused(false)}
        className="w-full h-9 lg:h-10 xl:h-11 pl-9 lg:pl-10 pr-3 rounded-md bg-white border border-[#CBD5E1]
          focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 text-slate-900 text-sm lg:text-base"
      />

      {Icon && (
        <span className="absolute left-2.5 lg:left-3 top-1/2 -translate-y-1/2 text-[#64748B]">
          <Icon size={16} className="lg:text-[18px]" />
        </span>
      )}

      {inputValue && (
        <button
          onClick={() => {
            setInputValue('');
            inputRef.current?.focus();
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <IoIosClose className="text-base lg:text-lg" />
        </button>
      )}

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 animate-slideDown max-h-72 lg:max-h-96 xl:max-h-[420px] overflow-y-auto">
          {inputValue ? (
            <div className="py-2">
              {filteredResults.length > 0 ? (
                <>
                  <div className="px-3 lg:px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                    Results ({filteredResults.length})
                  </div>
                  {filteredResults.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => handleResultClick(result.action)}
                      className="w-full px-3 lg:px-4 py-2.5 lg:py-3 hover:bg-gray-50 transition-colors flex items-center gap-2 lg:gap-3 text-left"
                    >
                      <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg lg:text-xl flex-shrink-0">
                        {result.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs lg:text-sm font-semibold text-gray-900 truncate">
                          {result.name}
                        </h4>
                        <p className="text-xs text-gray-500 truncate">
                          {result.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </>
              ) : (
                <div className="px-4 py-6 lg:py-8 text-center">
                  <div className="text-2xl lg:text-3xl mb-2">🔍</div>
                  <p className="text-sm text-gray-500">No results found</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Try searching for agents, tasks, or settings
                  </p>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="py-2 border-b border-gray-200">
                <div className="px-3 lg:px-4 py-2 flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase">
                  <FaClock />
                  <span>Recent Searches</span>
                </div>
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => setInputValue(search)}
                    className="w-full px-3 lg:px-4 py-2 hover:bg-gray-50 transition-colors flex items-center gap-2 text-left text-xs lg:text-sm text-gray-700"
                  >
                    <IoIosSearch className="text-gray-400 flex-shrink-0" />
                    <span>{search}</span>
                  </button>
                ))}
              </div>

              <div className="py-2">
                <div className="px-3 lg:px-4 py-2 flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase">
                  <FaBolt />
                  <span>Quick Actions</span>
                </div>
                {quickActions.map((action, index) => {
                  const ActionIcon = action.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => handleResultClick(action.action)}
                      className="w-full px-3 lg:px-4 py-2.5 lg:py-3 hover:bg-gray-50 transition-colors flex items-center gap-2 lg:gap-3 text-left"
                    >
                      <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                        <ActionIcon />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs lg:text-sm font-semibold text-gray-900 truncate">
                          {action.label}
                        </h4>
                      </div>
                      <div className="text-xs text-gray-400 bg-gray-100 px-1.5 lg:px-2 py-1 rounded flex-shrink-0">
                        {action.shortcut}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slideDown {
          animation: slideDown 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default SearchBox;