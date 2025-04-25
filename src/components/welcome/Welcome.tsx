'use client'

import { StarField } from '@/components/animations/AnimationWelcome'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import io from 'socket.io-client'

const deploy = 'https://events-backend-bot-app-production.up.railway.app'
const token = process.env.NEXT_PUBLIC_BACKEND_SOCKET_TOKEN
if (!token) {
  throw new Error('Authentication token not found in environment variables')
}

const socket = io(deploy, {
  reconnection: false,
  timeout: 5000,
  transports: ['websocket', 'polling'],
  auth: {
    token: `Bearer ${token}`,
  },
  extraHeaders: {
    Authorization: `Bearer ${token}`,
  },
})

function Welcome() {
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState([])
  const [currentView, setCurrentView] = useState('welcome')
  const [tableNumber, setTableNumber] = useState({})
  const [starState, setStarState] = useState('normal')
  const [showFullscreenButton, setShowFullscreenButton] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const fullscreenTimerRef = useRef(null)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    function onConnect() {
      console.log('✅ Conectado al servidor')
      setIsConnected(true)
    }

    function onDisconnect() {
      console.log('❌ Desconectado del servidor')
      setIsConnected(false)
    }

    function onMessageReceived(data) {
      console.log('📩 Mensaje recibido:', data)
      setMessages((prev) => [...prev, data])

      if (data.text) {
        let tableData = data.text

        if (typeof data.text === 'string') {
          try {
            tableData = JSON.parse(data.text)
          } catch (e) {
            const nameMatch = data.text.match(/name:\s*"([^"]+)"/)
            const tableMatch = data.text.match(/table:\s*(\d+)/)

            if (nameMatch && tableMatch) {
              tableData = {
                name: nameMatch[1],
                table: Number.parseInt(tableMatch[1], 10),
              }
            } else {
              console.error('No se pudo parsear el texto:', data.text)

              tableData = { text: data.text }
            }
          }
        }

        setTableNumber(tableData)
        showTableAnimation()
      }
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('eventsWelcome', onMessageReceived)

    if (socket.connected) {
      setIsConnected(true)
    }

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('eventsWelcome', onMessageReceived)
    }
  }, [])

  useEffect(() => {
    const handleMouseMove = () => {
      resetFullscreenButtonTimer()
    }

    resetFullscreenButtonTimer()

    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (fullscreenTimerRef.current) {
        clearTimeout(fullscreenTimerRef.current)
      }
    }
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .then(() => {
          setIsFullscreen(true)
        })
        .catch((err) => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`)
        })
    } else {
      if (document.exitFullscreen) {
        document
          .exitFullscreen()
          .then(() => {
            setIsFullscreen(false)
          })
          .catch((err) => {
            console.error(`Error attempting to exit fullscreen: ${err.message}`)
          })
      }
    }
  }

  const resetFullscreenButtonTimer = () => {
    setShowFullscreenButton(true)

    if (fullscreenTimerRef.current) {
      clearTimeout(fullscreenTimerRef.current)
    }

    fullscreenTimerRef.current = setTimeout(() => {
      setShowFullscreenButton(false)
    }, 1000)
  }

  const showTableAnimation = () => {
    setIsTransitioning(true)
    setStarState('flyAway')

    setTimeout(() => {
      setCurrentView('table')

      setTimeout(() => {
        setStarState('flyIn')

        setTimeout(() => {
          setCurrentView('welcome')

          setTimeout(() => {
            setIsTransitioning(false)
            setStarState('normal')
          }, 800)
        }, 1500)
      }, 6000)
    }, 800)
  }

  return (
    <main className="relative h-screen w-full overflow-hidden bg-black">
      <div className="absolute inset-0">
        <StarField starState={starState} />
      </div>

      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/20">
        <AnimatePresence mode="wait">
          {currentView === 'welcome' && !isTransitioning && (
            <motion.h1
              key="main-title"
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50, transition: { duration: 0.5 } }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="mb-12 bg-gradient-to-r from-pink-200 via-white to-pink-300 bg-clip-text px-4 text-center text-4xl font-bold text-transparent md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-7xl"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Bienvenidos a este evento
            </motion.h1>
          )}
        </AnimatePresence>
        <AnimatePresence mode="wait">
          {currentView === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{
                opacity: 0,
                scale: 1.1,
                filter: 'blur(8px)',
                transition: { duration: 0.5 },
              }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="flex flex-col items-center justify-center"
            >
              <div className="relative mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
                <div className="absolute top-0 left-0 h-12 w-12 border-t-2 border-l-2 border-pink-300/70 sm:h-16 sm:w-16 md:h-24 md:w-24"></div>
                <div className="absolute top-0 right-0 h-12 w-12 border-t-2 border-r-2 border-pink-300/70 sm:h-16 sm:w-16 md:h-24 md:w-24"></div>
                <div className="absolute bottom-0 left-0 h-12 w-12 border-b-2 border-l-2 border-pink-300/70 sm:h-16 sm:w-16 md:h-24 md:w-24"></div>
                <div className="absolute right-0 bottom-0 h-12 w-12 border-r-2 border-b-2 border-pink-300/70 sm:h-16 sm:w-16 md:h-24 md:w-24"></div>

                <div className="relative z-10 text-center">
                  <h2
                    className="mb-6 bg-gradient-to-r from-pink-200 via-white to-pink-200 bg-clip-text text-2xl font-medium text-transparent sm:mb-8 sm:text-3xl md:text-4xl lg:text-5xl xl:text-5xl"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    Escanea tu QR con nuestro asesor
                  </h2>

                  <motion.p
                    initial={{ opacity: 0.6 }}
                    animate={{ opacity: 1 }}
                    transition={{
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: 'reverse',
                      duration: 1.5,
                    }}
                    className="mt-6 text-xl text-pink-200/90 sm:mt-8 sm:text-2xl md:text-3xl"
                    style={{ fontFamily: "'Dancing Script', cursive" }}
                  >
                    Preparando un evento mágico
                  </motion.p>
                </div>
              </div>
            </motion.div>
          )}

          {currentView === 'table' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.8 } }}
              transition={{ duration: 0.8 }}
              className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden"
            >
              <div className="absolute inset-0 z-0">
                <div className="bg-gradient-radial absolute inset-0 from-purple-900/30 via-black to-black"></div>

                <div className="absolute inset-0">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <motion.div
                      key={`particle-${i}`}
                      className="absolute rounded-full bg-pink-500/20 blur-sm"
                      initial={{
                        x: Math.random() * window.innerWidth,
                        y: Math.random() * window.innerHeight,
                        scale: Math.random() * 0.5 + 0.5,
                      }}
                      animate={{
                        y: [
                          Math.random() * window.innerHeight,
                          Math.random() * window.innerHeight - 100,
                          Math.random() * window.innerHeight,
                        ],
                        opacity: [0.2, 0.5, 0.2],
                        scale: [Math.random() * 0.5 + 0.2, Math.random() * 0.7 + 0.3, Math.random() * 0.5 + 0.2],
                      }}
                      transition={{
                        duration: Math.random() * 10 + 15,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: 'easeInOut',
                      }}
                      style={{
                        width: `${Math.random() * 8 + 4}px`,
                        height: `${Math.random() * 8 + 4}px`,
                      }}
                    />
                  ))}
                </div>

                <motion.div
                  className="bg-gradient-radial absolute top-1/2 left-1/2 h-[150%] w-[150%] -translate-x-1/2 -translate-y-1/2 from-pink-500/10 via-transparent to-transparent"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: 'easeInOut',
                  }}
                />
              </div>

              <motion.div
                className="relative z-10 mx-auto w-full max-w-5xl px-6 py-12 text-center"
                initial={{ y: 20 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
              >
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                  className="mb-8"
                >
                  <h2
                    className="mb-3 text-4xl font-bold text-white sm:text-5xl md:text-6xl"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    <span className="bg-gradient-to-r from-pink-200 via-white to-pink-200 bg-clip-text text-transparent">
                      Bienvenidos
                    </span>
                  </h2>

                  <div className="mx-auto my-5 h-0.5 w-32 bg-gradient-to-r from-transparent via-pink-300 to-transparent"></div>

                  <p className="text-xl font-light tracking-wide text-pink-200/90 sm:text-2xl md:text-3xl">
                    Gracias por acompañarnos en este día especial
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 0.7,
                    delay: 0.4,
                    type: 'spring',
                    stiffness: 100,
                  }}
                  className="relative mb-10"
                >
                  <div className="bg-gradient-radial absolute -inset-10 from-pink-500/10 via-transparent to-transparent blur-xl"></div>
                  <h1
                    className="text-5xl font-bold tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {tableNumber.name}
                  </h1>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.8,
                    delay: 0.6,
                    type: 'spring',
                    stiffness: 50,
                  }}
                  className="relative"
                >
                  <div className="absolute -inset-10 rounded-full bg-gradient-to-r from-pink-500/5 via-purple-500/10 to-pink-500/5 blur-xl"></div>

                  <div className="relative inline-block">
                    <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-pink-500/30 to-purple-500/30 blur-md"></div>
                    <div className="relative rounded-full border border-pink-500/20 bg-black/80 px-10 py-8 backdrop-blur-sm sm:px-14 sm:py-10">
                      <p className="mb-2 text-2xl font-light text-pink-200/90 sm:text-3xl md:text-4xl">Mesa</p>
                      <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{
                          duration: 2,
                          repeat: Number.POSITIVE_INFINITY,
                          repeatType: 'reverse',
                          ease: 'easeInOut',
                        }}
                      >
                        <span className="bg-gradient-to-r from-pink-300 via-white to-pink-300 bg-clip-text text-8xl font-bold text-transparent">
                          {tableNumber.table}
                        </span>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute right-0 bottom-6 left-0 flex flex-col items-center sm:bottom-5">
          <div className="mb-3 h-0.5 w-32 bg-gradient-to-r from-transparent via-pink-300/70 to-transparent sm:mb-4 sm:w-48 md:w-64"></div>
          <p
            className="text-lg text-pink-200/80 sm:text-xl md:text-2xl lg:text-3xl"
            style={{ fontFamily: "'Dancing Script', cursive" }}
          >
            Momentos para recordar
          </p>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 z-10">
        <div className="absolute top-0 right-0 left-0 h-32 bg-gradient-to-b from-purple-900/20 to-transparent"></div>
        <div className="absolute right-0 bottom-0 left-0 h-32 bg-gradient-to-t from-purple-900/20 to-transparent"></div>
      </div>

      <div
        className="pointer-events-none absolute inset-0 z-5"
        style={{
          background: 'radial-gradient(circle, transparent 30%, rgba(0,0,0,0.6) 100%)',
        }}
      ></div>
      <AnimatePresence>
        {showFullscreenButton && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={toggleFullscreen}
            className="absolute right-6 bottom-20 z-50 rounded-full bg-pink-500/30 p-3 transition-colors hover:bg-pink-500/50"
          >
            {isFullscreen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white"
              >
                <path d="M8 3v3a2 2 0 0 1-2 2H3"></path>
                <path d="M21 8h-3a2 2 0 0 1-2-2V3"></path>
                <path d="M3 16h3a2 2 0 0 1 2 2v3"></path>
                <path d="M16 21v-3a2 2 0 0 1 2-2h3"></path>
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white"
              >
                <path d="M3 8V5a2 2 0 0 1 2-2h3"></path>
                <path d="M16 3h3a2 2 0 0 1 2 2v3"></path>
                <path d="M21 16v3a2 2 0 0 1-2 2h-3"></path>
                <path d="M8 21H5a2 2 0 0 1-2-2v-3"></path>
              </svg>
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </main>
  )
}

export default Welcome
