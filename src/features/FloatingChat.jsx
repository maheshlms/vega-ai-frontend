import React from 'react' ;
import {useState} from 'react' ;
import { MdChat } from "react-icons/md";
import ChatBox from "../components/ChatBox";

function FloatingChat() {
    const[open, setOpen] = useState(false) ;


  return (
    <>
      <button onClick={()=>setOpen(!open)}  className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white p-4 rounded-full shadow-lg">
          <MdChat size={22} />
      </button>

      {open && <ChatBox/> }
    </>
  )
}

export default  FloatingChat ;
