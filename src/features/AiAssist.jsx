import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoArrowBackCircle, IoClose, IoPause, IoPlay, IoStop } from "react-icons/io5";

const AiAssist = () => {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(true);
  const [showCaption, setShowCaption] = useState(true);
  const videoRef = useRef(null);

  const handleBack = useCallback(() => {
    navigate('/agents/agentchat');
  }, [navigate]);

  const handleClearChat = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  }, []);

  const handlePause = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setIsPlaying(false);
  }, []);

  const handlePlay = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.play();
    }
    setIsPlaying(true);
  }, []);

  const handleStop = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  }, []);

  const handleCloseCaption = useCallback(() => {
    setShowCaption(false);
  }, []);

  return (
    <div className="w-full h-screen flex flex-col bg-[#F9FAFB] overflow-hidden">
      {/* Header - Fixed height */}
      <div className=" px-4 sm:px-10 py-3 sm:py-4 flex items-center justify-between  flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={handleBack}
            className="text-gray-800 hover:text-gray-600 transition-colors"
            aria-label="Go back"
          >
            <IoArrowBackCircle className="text-2xl sm:text-3xl" />
          </button>
          <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900">AI Agents</h1>
        </div>

        <button
          onClick={handleClearChat}
          className="bg-[#EF4444] hover:bg-[#DC2626] text-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg flex items-center gap-2 transition-colors"
          aria-label="Clear chat"
        >
          <IoClose className="text-sm sm:text-base md:text-lg" />
          <span className="text-xs sm:text-sm font-medium">Clear chat</span>
        </button>
      </div>

      {/* Main Content - Fills remaining space, centers content vertically */}
      <div className="flex-1 flex items-center justify-center px-4 py-4 sm:py-6 overflow-hidden">
        <div className="w-full max-w-4xl flex flex-col items-center justify-center gap-3 sm:gap-4 md:gap-5">
          
          {/* Circular Video Avatar - Responsive sizing */}
          <div className="flex justify-center flex-shrink-0">
            <div className="relative">
              <div className="w-35 h-35 xs:w-48 xs:h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 lg:w-72 lg:h-72 xl:w-80 xl:h-80 rounded-full overflow-hidden shadow-2xl border-2 sm:border-4 border-white bg-gray-200">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                  poster="/avatar-poster.jpg"
                  onError={(e) => {
                    console.error('Video failed to load');
                  }}
                >
                  <source src="/avatar-video.mp4" type="video/mp4" />
                  <img 
                    src="/avatar.png" 
                    alt="AI Assistant"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEyOCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiBmaWxsPSIjOTMzM0VBIi8+CjxjaXJjbGUgY3g9IjY0IiBjeT0iNTAiIHI9IjI0IiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMzIgMTEyQzMyIDk1LjQzMTUgNDUuNDMxNSA4MiA2MiA4Mkg2NkM4Mi41Njg1IDgyIDk2IDk1LjQzMTUgOTYgMTEyVjEyOEgzMlYxMTJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K';
                    }}
                  />
                </video>
              </div>
            </div>
          </div>

          {/* Caption Box - Responsive sizing and max height */}
          {showCaption && (
            <div className="relative w-full max-w-xl lg:max-w-2xl flex-shrink-0">
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3 sm:p-4 md:p-5 relative">
                <button
                  onClick={handleCloseCaption}
                  className="absolute top-2 right-2 sm:top-3 sm:right-3 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close caption"
                >
                  <IoClose className="text-base sm:text-lg md:text-xl" />
                </button>

                <p className="text-gray-700 text-xs sm:text-sm md:text-base leading-relaxed pr-6 sm:pr-8">
                  "Audio explaining the solution will be provided, along with captions so that the user can read and follow along in case they miss anything."
                </p>
              </div>
            </div>
          )}

          {/* Control Buttons - Responsive sizing */}
          <div className="flex justify-center items-center gap-2 sm:gap-3 md:gap-4 flex-shrink-0">
            <button
              onClick={handlePause}
              disabled={!isPlaying}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 sm:px-4 sm:py-2.5 md:px-5 md:py-3 rounded-lg flex items-center gap-1 sm:gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg text-xs sm:text-sm md:text-base"
              aria-label="Pause"
            >
              <IoPause className="text-sm sm:text-base md:text-lg" />
              <span className="font-medium">Pause</span>
            </button>

            <button
              onClick={handlePlay}
              disabled={isPlaying}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 sm:px-4 sm:py-2.5 md:px-5 md:py-3 rounded-lg flex items-center gap-1 sm:gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg text-xs sm:text-sm md:text-base"
              aria-label="Play"
            >
              <IoPlay className="text-sm sm:text-base md:text-lg" />
              <span className="font-medium">Play</span>
            </button>

            <button
              onClick={handleStop}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 sm:px-4 sm:py-2.5 md:px-5 md:py-3 rounded-lg flex items-center gap-1 sm:gap-2 transition-all shadow-md hover:shadow-lg text-xs sm:text-sm md:text-base"
              aria-label="Stop"
            >
              <IoStop className="text-sm sm:text-base md:text-lg" />
              <span className="font-medium">Stop</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiAssist;