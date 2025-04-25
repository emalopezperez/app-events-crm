'use client'

import { Photo } from '@/types'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { FaExpand, FaPause, FaPlay, FaSync } from 'react-icons/fa'
import { LazyLoadImage } from 'react-lazy-load-image-component'
import 'react-lazy-load-image-component/src/effects/blur.css'
import { StarField } from '../animations/StartField'

import { TypewriterEffect } from './TypewriterEffect'

interface PhotoCarouselProps {
  photos: Photo[]
  currentPhoto: Photo | null
  lastPhotoTime: number
  photoBuffer: Photo[]
  onPhotoComplete: () => void
  setIsProcessingBuffer: (isProcessing: boolean) => void
}

const INACTIVITY_TIMEOUT = 30000
const TEXT_DISPLAY_TIME = 15000
const IMAGE_DISPLAY_TIME = 15000

const RESOLUTIONS = {
  HD: 1920,
  QHD: 2560,
  UHD: 3840,
}

const generateImageUrl = (url: string, width: number) => {
  return `${url}?w=${width}&f_auto,q_auto${width >= 2560 ? ',q_90' : ',q_80'}`
}

const StoryProgressBars = ({
  totalPhotos,
  activeIndex,
  showImage,
  timeRemaining,
  textDisplayTime,
  imageDisplayTime,
  onBarClick,
  isPaused,
}) => {
  const totalTime = textDisplayTime + imageDisplayTime

  const elapsedTime = showImage ? textDisplayTime + (imageDisplayTime - timeRemaining) : textDisplayTime - timeRemaining

  const progressPercentage = (elapsedTime / totalTime) * 100

  return (
    <div className="absolute top-0 right-0 left-0 z-50 px-4 pt-2 sm:pt-3">
      <div className="mx-auto flex max-w-7xl gap-1 sm:gap-2">
        {Array.from({ length: totalPhotos }).map((_, index) => (
          <div
            key={`progress-bar-${index}`}
            className="h-1.5 flex-1 cursor-pointer overflow-hidden rounded-full bg-white/20 transition-colors hover:bg-white/30 sm:h-2"
            onClick={() => onBarClick(index)}
          >
            {index < activeIndex ? (
              <div className="h-full w-full bg-gradient-to-r from-pink-100 to-pink-100"></div>
            ) : index === activeIndex ? (
              <motion.div
                className="h-full bg-gradient-to-r from-pink-100 to-pink-100"
                initial={{ width: '0%' }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{
                  duration: 0.3,
                  ease: [0.4, 0.0, 0.2, 1],
                  stiffness: 100,
                  damping: 30,
                }}
              ></motion.div>
            ) : (
              <div className="h-full w-0"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const PlaybackControls = ({ isPaused, onPlayPause, onPrev, onNext, onFullscreen }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2 }}
      className="absolute bottom-3 left-1 z-50 flex -translate-x-1/2 items-center gap-4 rounded-full border border-pink-500/20 bg-black/30 px-4 py-2 backdrop-blur-sm"
    >
      <button
        onClick={onPlayPause}
        className="rounded-full bg-pink-500/80 p-3 text-white transition-colors hover:bg-pink-500"
      >
        {isPaused ? <FaPlay className="text-sm" /> : <FaPause className="text-sm" />}
      </button>

      <div className="h-6 w-px bg-white/20"></div>

      <button onClick={onFullscreen} className="p-2 text-white/80 transition-colors hover:text-white">
        <FaExpand className="text-lg" />
      </button>

      <button
        onClick={() => {
          localStorage.removeItem('photos')
          window.location.reload()
        }}
        className="p-2 text-white/80 transition-colors hover:text-white"
        title="Vaciar fotos"
      >
        <FaSync className="text-lg" />
      </button>
    </motion.div>
  )
}

export function PhotoCarousel({
  photos,
  currentPhoto,
  photoBuffer,
  onPhotoComplete,
  setIsProcessingBuffer,
}: PhotoCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isAutoAdvancing, setIsAutoAdvancing] = useState(false)
  const [transitionEnabled, setTransitionEnabled] = useState(true)
  const [showImage, setShowImage] = useState(false)
  const [lastChangeTime, setLastChangeTime] = useState(Date.now())
  const [timeRemaining, setTimeRemaining] = useState(TEXT_DISPLAY_TIME)
  const [lastActivityTime, setLastActivityTime] = useState(Date.now())
  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set())
  const [starState, setStarState] = useState('normal')
  const [textSize, setTextSize] = useState('text-5xl')
  const [isPaused, setIsPaused] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [showControls, setShowControls] = useState(false)
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const messageRef = useRef<HTMLDivElement>(null)
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const controlsAreaRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  const preloadImage = (url: string) => {
    if (preloadedImages.has(url)) return
    Object.values(RESOLUTIONS).forEach((width) => {
      const img = new Image()
      const imageUrl = generateImageUrl(url, width)
      img.src = imageUrl
      img.onload = () => {
        setPreloadedImages((prev) => new Set([...prev, url]))
      }
      img.onerror = (error) => {
        console.error(`Error al precargar imagen ${imageUrl}:`, error)
      }
    })
  }

  useEffect(() => {
    const preloadNextImages = () => {
      if (photos[activeIndex]) {
        preloadImage(photos[activeIndex].url)
      }

      photoBuffer.slice(0, 2).forEach((photo) => {
        preloadImage(photo.url)
      })

      const nextIndex = (activeIndex + 1) % photos.length
      if (photos[nextIndex]) {
        preloadImage(photos[nextIndex].url)
      }
    }

    preloadNextImages()
  }, [activeIndex, photos, photoBuffer, preloadedImages])

  useEffect(() => {
    if (!showImage && messageRef.current && photos[activeIndex]) {
      const message = photos[activeIndex].message || ''
      const messageLength = message.length

      if (messageLength > 300) {
        setTextSize('text-2xl sm:text-3xl md:text-4xl lg:text-5xl')
      } else if (messageLength > 200) {
        setTextSize('text-3xl sm:text-4xl md:text-5xl lg:text-6xl')
      } else if (messageLength > 100) {
        setTextSize('text-4xl sm:text-5xl md:text-6xl lg:text-7xl')
      } else {
        setTextSize('text-5xl sm:text-6xl md:text-7xl lg:text-8xl')
      }
    }
  }, [showImage, photos, activeIndex])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen()
        setIsFullscreen(true)
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
        setIsFullscreen(false)
      }
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const bottomAreaHeight = 100
      const windowHeight = window.innerHeight

      if (e.clientY > windowHeight - bottomAreaHeight) {
        setShowControls(true)
        setLastActivityTime(Date.now())

        if (controlsTimeout) {
          clearTimeout(controlsTimeout)
        }
      } else if (showControls) {
        if (controlsTimeout) {
          clearTimeout(controlsTimeout)
        }

        const timeout = setTimeout(() => {
          setShowControls(false)
        }, 500)

        setControlsTimeout(timeout)
      }
    }

    const handleMouseLeave = () => {
      if (controlsTimeout) {
        clearTimeout(controlsTimeout)
      }

      const timeout = setTimeout(() => {
        setShowControls(false)
      }, 500)

      setControlsTimeout(timeout)
    }

    window.addEventListener('mousemove', handleMouseMove)
    document.body.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      document.body.removeEventListener('mouseleave', handleMouseLeave)
      if (controlsTimeout) {
        clearTimeout(controlsTimeout)
      }
    }
  }, [controlsTimeout, showControls])

  useEffect(() => {
    let inactivityChecker: NodeJS.Timeout

    const checkInactivity = () => {
      const now = Date.now()
      const timeSinceLastActivity = now - lastActivityTime
      const hasNoBufferedPhotos = photoBuffer.length === 0

      if (
        hasNoBufferedPhotos &&
        timeSinceLastActivity >= INACTIVITY_TIMEOUT &&
        !isAutoAdvancing &&
        showImage &&
        !isPaused
      ) {
        setIsAutoAdvancing(true)
        const nextIndex = (activeIndex + 1) % photos.length
        setActiveIndex(nextIndex)
        setShowImage(false)
        setLastChangeTime(now)
        setTimeRemaining(TEXT_DISPLAY_TIME)
        setStarState('flyAway')
        setTimeout(() => setStarState('normal'), 1500)
      }
    }

    const updateTimer = () => {
      if (isPaused) {
        progressTimerRef.current = setTimeout(updateTimer, 50)
        return
      }

      const now = Date.now()
      const elapsed = now - lastChangeTime
      const currentDisplayTime = showImage ? IMAGE_DISPLAY_TIME : TEXT_DISPLAY_TIME
      const remaining = Math.max(0, currentDisplayTime - elapsed)

      setTimeRemaining(remaining)

      if (remaining === 0) {
        if (!showImage) {
          setShowImage(true)
          setLastChangeTime(now)
          setTimeRemaining(IMAGE_DISPLAY_TIME)
          setStarState('heart')
        } else {
          if (photoBuffer.length > 0) {
            setIsAutoAdvancing(false)
            onPhotoComplete()
            setShowImage(false)
            setLastChangeTime(now)
            setTimeRemaining(TEXT_DISPLAY_TIME)
            setIsProcessingBuffer(false)
            setStarState('flyAway')
            setTimeout(() => setStarState('normal'), 1500)
          } else if (isAutoAdvancing && photos.length > 1) {
            const nextIndex = (activeIndex + 1) % photos.length
            setActiveIndex(nextIndex)
            setShowImage(false)
            setLastChangeTime(now)
            setTimeRemaining(TEXT_DISPLAY_TIME)
            setStarState('flyAway')
            setTimeout(() => setStarState('normal'), 1500)
          } else {
            setIsProcessingBuffer(false)
          }
        }
      }

      progressTimerRef.current = setTimeout(updateTimer, 50)
    }

    progressTimerRef.current = setTimeout(updateTimer, 50)
    inactivityChecker = setInterval(checkInactivity, 1000)

    return () => {
      if (progressTimerRef.current) {
        clearTimeout(progressTimerRef.current)
      }
      clearInterval(inactivityChecker)
    }
  }, [
    activeIndex,
    isAutoAdvancing,
    lastActivityTime,
    lastChangeTime,
    onPhotoComplete,
    photoBuffer.length,
    photos.length,
    setIsProcessingBuffer,
    showImage,
    isPaused,
  ])

  useEffect(() => {
    if (currentPhoto) {
      const index = photos.findIndex((p) => p.id === currentPhoto.id)
      if (index !== -1) {
        setTransitionEnabled(false)
        setActiveIndex(index)
        setLastChangeTime(Date.now())
        setTimeRemaining(TEXT_DISPLAY_TIME)
        setShowImage(false)
        setLastActivityTime(Date.now())
        setIsAutoAdvancing(false)
        setStarState('flyIn')
        setTimeout(() => setStarState('normal'), 1500)
        setTimeout(() => setTransitionEnabled(true), 50)
      }
    }
  }, [currentPhoto, photos])

  const handlePrevious = () => {
    if (photos.length <= 1) return

    const prevIndex = (activeIndex - 1 + photos.length) % photos.length
    setActiveIndex(prevIndex)
    setShowImage(false)
    setLastChangeTime(Date.now())
    setTimeRemaining(TEXT_DISPLAY_TIME)
    setLastActivityTime(Date.now())
    setStarState('flyAway')
    setTimeout(() => setStarState('normal'), 1500)
  }

  const handleNext = () => {
    if (photos.length <= 1) return

    const nextIndex = (activeIndex + 1) % photos.length
    setActiveIndex(nextIndex)
    setShowImage(false)
    setLastChangeTime(Date.now())
    setTimeRemaining(TEXT_DISPLAY_TIME)
    setLastActivityTime(Date.now())
    setStarState('flyAway')
    setTimeout(() => setStarState('normal'), 1500)
  }

  const handlePlayPause = () => {
    setIsPaused(!isPaused)
    setLastActivityTime(Date.now())

    if (isPaused) {
      setLastChangeTime(Date.now() - (showImage ? IMAGE_DISPLAY_TIME : TEXT_DISPLAY_TIME) + timeRemaining)
    }
  }

  const handleBarClick = (index: number) => {
    if (index === activeIndex) return

    setActiveIndex(index)
    setShowImage(false)
    setLastChangeTime(Date.now())
    setTimeRemaining(TEXT_DISPLAY_TIME)
    setLastActivityTime(Date.now())
    setStarState('flyAway')
    setTimeout(() => setStarState('normal'), 1500)
  }

  const controlsHoverArea = <div className="absolute right-0 bottom-0 left-0 z-40 h-24" ref={controlsAreaRef} />

  if (photos.length === 0) {
    return (
      <div
        ref={containerRef}
        className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-black"
      >
        <StarField starState="normal" />
        <div className="relative z-10 mx-auto max-w-md space-y-4 rounded-xl border border-pink-500/20 bg-black/20 px-4 py-8 text-center backdrop-blur-md">
          <div className="relative mx-auto h-24 w-24">
            <div className="animate-spin-slow absolute inset-0 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 opacity-70 blur-md"></div>
            <div className="absolute inset-1 rounded-full bg-black"></div>
            <div className="absolute inset-3 animate-spin rounded-full border-4 border-pink-500 border-t-transparent"></div>
          </div>
          <h2 className="mt-4 text-4xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
            Momentos para recordar
          </h2>
          <p className="text-2xl font-medium text-pink-300" style={{ fontFamily: "'Dancing Script', cursive" }}>
            Esperando fotos...
          </p>
        </div>

        {controlsHoverArea}

        <AnimatePresence>
          {showControls && (
            <PlaybackControls
              isPaused={isPaused}
              onPlayPause={handlePlayPause}
              onPrev={handlePrevious}
              onNext={handleNext}
              onFullscreen={toggleFullscreen}
            />
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative h-screen w-full overflow-hidden">
      <div className="">
        <StarField starState={starState} />
      </div>

      <StoryProgressBars
        totalPhotos={photos.length}
        activeIndex={activeIndex}
        showImage={showImage}
        timeRemaining={timeRemaining}
        textDisplayTime={TEXT_DISPLAY_TIME}
        imageDisplayTime={IMAGE_DISPLAY_TIME}
        onBarClick={handleBarClick}
        isPaused={isPaused}
      />

      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="absolute top-6 right-0 left-0 z-50 px-4 sm:top-8 sm:px-8 md:top-10"
      >
        <div className="mx-auto max-w-7xl">
          <div className="relative flex items-center gap-4 sm:gap-6">
            <div className="z-10">
              <motion.div
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                key={`title-${photos[activeIndex]?.id}`}
                className="mb-0.5 flex items-center gap-1.5 sm:mb-1"
              >
                <div className="flex items-center gap-4">
                  <img
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                    className="h-12 w-12 rounded-full shadow-lg ring-4 ring-pink-500/80 sm:h-14 sm:w-14"
                  />
                  <div>
                    <p className="mb-0.5 text-base font-medium text-pink-400 sm:text-lg">Invitado</p>
                    <h3 className="text-lg font-bold text-white sm:text-xl">{photos[activeIndex]?.author}</h3>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="relative z-10 flex h-full items-center justify-center pt-8">
        <AnimatePresence mode="wait">
          {!showImage ? (
            <motion.div
              key="message"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.5, type: 'spring', bounce: 0.2 }}
              className="relative mx-auto w-full px-4 text-center sm:px-6"
            >
              <div className="absolute inset-0 -z-10 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-pink-500/10 opacity-50 blur-3xl"></div>
              <div className="relative mx-auto max-w-5xl">
                <div ref={messageRef} className="py-4">
                  <TypewriterEffect
                    text={photos[activeIndex]?.message || '¡Felicidades!'}
                    className={`mb-6 bg-gradient-to-r from-pink-200 via-white to-pink-200 bg-clip-text text-7xl leading-tight tracking-wide text-transparent`}
                    style={{ fontFamily: "'Playfair Display', serif" }}
                    speed={80}
                    delay={300}
                  />
                </div>

                <div className="mx-auto mt-6 h-0.5 w-32 bg-gradient-to-r from-transparent via-pink-300/70 to-transparent sm:w-48 md:w-64"></div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="image"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{
                duration: 0.5,
                ease: 'easeOut',
              }}
              className="relative z-10 flex h-full w-full items-center justify-center"
            >
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-pink-500/5 via-purple-500/5 to-pink-500/5 blur-2xl"></div>
              <div className="relative mx-auto max-h-[80vh] max-w-[90vw] rounded-xl border border-white/10 bg-black/10 p-2 shadow-[0_0_30px_rgba(236,72,153,0.2)] backdrop-blur-md">
                <LazyLoadImage
                  src={generateImageUrl(photos[activeIndex]?.url, RESOLUTIONS.HD)}
                  srcSet={`
                    ${generateImageUrl(photos[activeIndex]?.url, RESOLUTIONS.HD)} 1920w,
                    ${generateImageUrl(photos[activeIndex]?.url, RESOLUTIONS.QHD)} 2560w,
                    ${generateImageUrl(photos[activeIndex]?.url, RESOLUTIONS.UHD)} 3840w
                  `}
                  sizes="(min-width: 3840px) 70vw, (min-width: 2560px) 75vw, (min-width: 1920px) 80vw, 90vw"
                  alt={`Photo ${activeIndex + 1}`}
                  effect="blur"
                  className="max-h-[70vh] w-auto max-w-full rounded-xl object-contain"
                  loading="eager"
                  threshold={0}
                  beforeLoad={() => {
                    const nextIndex = (activeIndex + 1) % photos.length
                    if (photos[nextIndex]) {
                      preloadImage(photos[nextIndex].url)
                    }
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {controlsHoverArea}

      <AnimatePresence>
        {showControls && (
          <PlaybackControls
            isPaused={isPaused}
            onPlayPause={handlePlayPause}
            onPrev={handlePrevious}
            onNext={handleNext}
            onFullscreen={toggleFullscreen}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
