'use client'

import { type Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode'
import { useEffect, useRef, useState } from 'react'
import io from 'socket.io-client'

const deploy = 'https://events-backend-bot-app-production.up.railway.app'
const token = process.env.NEXT_PUBLIC_BACKEND_SOCKET_TOKEN
if (!token) {
  throw new Error('Authentication token not found in environment variables')
}

const socket = io(deploy, {
  reconnection: true,
  timeout: 5000,
  transports: ['websocket', 'polling'],
  auth: {
    token: `Bearer ${token}`,
  },
  extraHeaders: {
    Authorization: `Bearer ${token}`,
  },
})

function QRScanner() {
  const [isConnected, setIsConnected] = useState(false)
  const [lastScanned, setLastScanned] = useState('')
  const [scanCount, setScanCount] = useState(0)
  const [scanMode, setScanMode] = useState<'none' | 'camera' | 'upload'>('none')
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null)
  const qrContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onConnect() {
      console.log('✅ Conectado al servidor')
      setIsConnected(true)
    }

    function onDisconnect() {
      console.log('❌ Desconectado del servidor')
      setIsConnected(false)
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
    }
  }, [])

  const cleanupScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error)
      scannerRef.current = null
    }

    if (html5QrCodeRef.current) {
      html5QrCodeRef.current.stop().catch(console.error)
      html5QrCodeRef.current = null
    }
  }

  useEffect(() => {
    return () => {
      cleanupScanner()
    }
  }, [])

  const processQrResult = (decodedText: string) => {
    try {
      let data
      try {
        data = JSON.parse(decodedText)
      } catch {
        data = { text: decodedText }
      }

      socket.emit('eventsWelcome', data)
      setLastScanned(decodedText)
      setScanCount((prev) => prev + 1)

      setSuccessMessage('QR escaneado correctamente')
      setShowSuccess(true)

      setTimeout(() => {
        setShowSuccess(false)
      }, 3000)

      resetScanner()
    } catch (error) {
      console.error('Error al procesar QR:', error)
      setLastScanned(`Error: ${error.message}`)
    }
  }

  const startCameraScanner = async () => {
    cleanupScanner()

    setScanMode('camera')

    setTimeout(() => {
      if (!qrContainerRef.current) return

      try {
        html5QrCodeRef.current = new Html5Qrcode('qr-reader')

        html5QrCodeRef.current
          .start(
            { facingMode: 'environment' },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
            },
            (decodedText) => {
              processQrResult(decodedText)
            },
            (errorMessage) => {
              console.log(errorMessage)
            }
          )
          .catch((error) => {
            console.error('Error starting camera:', error)
            setLastScanned('Error: No se pudo acceder a la cámara. Por favor, verifica los permisos.')
            setScanMode('none')
          })
      } catch (error) {
        console.error('Error initializing scanner:', error)
        setLastScanned('Error: No se pudo inicializar el escáner.')
        setScanMode('none')
      }
    }, 100)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setScanMode('upload')

    cleanupScanner()

    const html5QrCode = new Html5Qrcode('qr-reader')
    html5QrCodeRef.current = html5QrCode

    html5QrCode
      .scanFile(file, true)
      .then((decodedText) => {
        processQrResult(decodedText)
      })
      .catch((err) => {
        console.error('Error al escanear archivo:', err)
        setLastScanned(`Error: No se pudo leer el código QR de la imagen`)
        setScanMode('none')
      })
  }

  const resetScanner = () => {
    cleanupScanner()
    setScanMode('none')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const triggerFileUpload = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4 text-black">
      <div className="mx-auto w-full max-w-md overflow-hidden rounded-xl bg-white shadow-lg">
        <div className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-gray-800">Escáner QR</h1>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`inline-block h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm font-medium">{isConnected ? 'Conectado' : 'Desconectado'}</span>
            </div>
          </div>

          {showSuccess && (
            <div className="mb-4 flex items-center rounded-lg bg-green-100 p-3 text-green-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              {successMessage}
            </div>
          )}

          {scanMode === 'none' && (
            <div className="mb-6 grid grid-cols-2 gap-4">
              <button
                onClick={startCameraScanner}
                className="flex items-center justify-center rounded-lg bg-blue-500 p-4 text-white transition-colors hover:bg-blue-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="mr-2 h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z"
                    clipRule="evenodd"
                  />
                </svg>
                Escanear QR
              </button>
              <button
                onClick={triggerFileUpload}
                className="flex items-center justify-center rounded-lg bg-purple-500 p-4 text-white transition-colors hover:bg-purple-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="mr-2 h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                    clipRule="evenodd"
                  />
                </svg>
                Subir QR
              </button>
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
            </div>
          )}

          <div
            id="qr-reader"
            ref={qrContainerRef}
            className={`mb-6 ${scanMode === 'none' ? 'hidden' : ''}`}
            style={{ width: '100%' }}
          />

          {scanMode !== 'none' && (
            <button
              onClick={resetScanner}
              className="mb-6 w-full rounded-lg bg-gray-200 p-3 text-gray-700 transition-colors hover:bg-gray-300"
            >
              Cancelar
            </button>
          )}

          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-500">
                QRs escaneados: <span className="font-medium">{scanCount}</span>
              </p>
            </div>

            {lastScanned && (
              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="mb-2 text-sm font-medium text-gray-600">Último QR escaneado</h3>
                <div className="text-sm break-all text-gray-500">
                  {lastScanned.startsWith('Error') ? (
                    <p className="text-red-500">{lastScanned}</p>
                  ) : (
                    <p>{lastScanned}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default QRScanner
