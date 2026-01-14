import React from 'react' ;

const ChatBox = () => {
  return (
    <div className="fixed bottom-20 right-6 w-80 h-96 bg-white shadow-2xl rounded-xl z-50 flex flex-col">
      <div className="p-3 border-b font-semibold">Support Chat</div>

      <div className="flex-1 overflow-y-auto p-3">
        {/* messages */}
      </div>

      <div className="p-3 border-t">
        <input className="w-full border rounded-md p-2" placeholder="Type message..." />
      </div>
    </div>
  );
};


export default ChatBox ;