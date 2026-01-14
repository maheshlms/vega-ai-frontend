import React from 'react' ;
import { GoSun } from "react-icons/go"
import { MdOutlineDarkMode } from "react-icons/md";
import {useState , useEffect} from 'react' ;



const DarkMode = ({className=""}) => {

    const[dark , setDark]=useState(false) ;

    return (
        <>

         <div >
                      <button
                onClick={() => setDark(!dark)}
                className={`absolute top-6 right-8 p-2 rounded-md shadow bg-white ${className}`}
              >
                {dark ? <GoSun /> : <MdOutlineDarkMode />   }
              </button>
                </div>
        
        
        
        </>
    ) ;
}

export default DarkMode ;