import React from 'react'
import {useState , useEffect} from 'react';

function MouseMove() {
    const [pos , setPos] = useState({x:0 , y:0}) ;

    useEffect(()=>{
        const mouse=(e)=>{
            setPos({x:e.clientX , y:e.clientY})

        }

        window.addEventListener('mousemove' , mouse) ;
        return function () {
            window.removeEventListener('mousemove' , mouse) ;
        }

    } , [])

  return (
   <div
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        background: `radial-gradient(30px at ${pos.x}px ${pos.y}px,
          rgba(99,102,241,0.15),
          transparent 80%)`
      }}
    />
  )
}

export default MouseMove