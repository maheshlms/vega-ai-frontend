import { useEffect, useState } from "react"

function FloatingDots() {
  const [dots, setDots] = useState([])

  useEffect(() => {
    const total = 50
    const newDots = Array.from({ length: total }).map(() => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 4    + 1,
      speed: Math.random() * 2 + 0.1,
    }))
    setDots(newDots)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) =>
        prev.map((d) => ({
          ...d,
          y: d.y <= 0 ? window.innerHeight : d.y - d.speed,
        }))
      )
    }, 30)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      {dots.map((d, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-gray-400/30 dark:bg-white/20"
          style={{
            width: d.size,
            height: d.size,
            left: d.x,
            top: d.y,
          }}
        />
      ))}
    </div>
  )
}

export default FloatingDots
