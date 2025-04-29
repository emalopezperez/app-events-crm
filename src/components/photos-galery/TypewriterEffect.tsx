'use client'

import { useEffect, useRef, useState } from 'react'

interface TypewriterEffectProps {
  text: string
  className?: string
  speed?: number
  delay?: number
  onComplete?: () => void
  style?: React.CSSProperties
  showCursor?: boolean
}

export function TypewriterEffect({
  text,
  className = '',
  speed = 50,
  delay = 500,
  onComplete,
  style,
  showCursor = false,
}: TypewriterEffectProps) {
  const [displayText, setDisplayText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setDisplayText('')
    setCurrentIndex(0)
    setIsTyping(false)

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      setIsTyping(true)
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [text, delay])

  useEffect(() => {
    if (!isTyping) return

    if (currentIndex < text.length) {
      timeoutRef.current = setTimeout(() => {
        setDisplayText((prev) => prev + text[currentIndex])
        setCurrentIndex((prev) => prev + 1)
      }, speed)
    } else if (onComplete) {
      onComplete()
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [currentIndex, isTyping, onComplete, speed, text])

  return (
    <div className={className} style={style}>
      <span>{displayText}</span>
      {showCursor && <span className="animate-pulse">|</span>}
    </div>
  )
}
