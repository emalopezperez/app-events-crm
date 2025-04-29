'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { motion } from 'framer-motion'
import { Download, MessageSquare } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useState } from 'react'

interface WhatsAppQRGeneratorProps {
  eventName: string
  whatsAppNumber: string
  verificationCode: string
}

export default function WhatsAppQRGenerator({ eventName, whatsAppNumber, verificationCode }: WhatsAppQRGeneratorProps) {
  const [qrValue, setQrValue] = useState('')
  const [qrTimestamp, setQrTimestamp] = useState(Date.now())
  const [justUpdated, setJustUpdated] = useState(false)

  const fixedMessage = `¡Hola! Quiero registrarme para ${eventName}. Mi código de verificación es: ${verificationCode}`

  useEffect(() => {
    generateWhatsAppQR()
  }, [eventName, whatsAppNumber, verificationCode])

  useEffect(() => {
    if (justUpdated) {
      const timer = setTimeout(() => {
        setJustUpdated(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [justUpdated])

  const generateWhatsAppQR = () => {
    const whatsAppUrl = `https://wa.me/${whatsAppNumber}?text=${encodeURIComponent(fixedMessage)}`
    setQrValue(whatsAppUrl)
    setQrTimestamp(Date.now())
    setJustUpdated(true)
  }

  const svgToPng = async (svgElement: SVGElement, width: number, height: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        const svgData = new XMLSerializer().serializeToString(svgElement)
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          reject(new Error('No se pudo obtener el contexto 2D del canvas'))
          return
        }

        const url = URL.createObjectURL(svgBlob)
        const img = new Image()
        img.crossOrigin = 'anonymous'

        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          try {
            const pngUrl = canvas.toDataURL('image/png')
            URL.revokeObjectURL(url)
            resolve(pngUrl)
          } catch (err) {
            reject(err)
          }
        }

        img.onerror = (err) => {
          URL.revokeObjectURL(url)
          reject(err)
        }

        img.src = url
      } catch (err) {
        reject(err)
      }
    })
  }

  const handleDownload = () => {
    const svg = document.getElementById('whatsapp-qr') as SVGElement
    if (!svg) return

    try {
      svgToPng(svg, 1000, 1000)
        .then((pngUrl) => {
          const downloadLink = document.createElement('a')
          downloadLink.download = `qr-${eventName.replace(/\s+/g, '-')}.png`
          downloadLink.href = pngUrl
          downloadLink.click()
        })
        .catch((err) => {
          console.error('Error al convertir a PNG:', err)
          alert('Error al generar la imagen para descargar. Intente con otro navegador.')
        })
    } catch (err) {
      console.error('Error en la descarga:', err)
      alert('Error al preparar la descarga. Intente con otro navegador.')
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Card className="border border-[#333333] bg-[#0f0f18] text-white shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
          <MessageSquare className="text-primary h-6 w-6 sm:h-7 sm:w-7" />
          QR para {eventName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg bg-[#252530] p-4">
          <p className="text-center text-sm text-gray-400">Número del bot: {whatsAppNumber}</p>
          <p className="mt-1 text-center text-sm text-gray-400">Código: {verificationCode}</p>
        </div>

        {qrValue && (
          <motion.div
            initial={justUpdated ? { scale: 0.9, opacity: 0.5 } : false}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className={`${
              justUpdated ? 'ring-primary ring-2 ring-offset-2 ring-offset-[#0f0f18]' : ''
            } rounded-lg bg-white p-4 shadow-lg`}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-md bg-white p-2 shadow-md">
                <QRCodeSVG
                  id="whatsapp-qr"
                  value={qrValue}
                  size={250}
                  level="H"
                  includeMargin
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                />
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">Generado: {formatDate(qrTimestamp)}</p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button className="bg-primary hover:bg-primary/90 mt-2 cursor-pointer" onClick={handleDownload}>
                        <Download className="mr-2 h-4 w-4" />
                        Descargar QR
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="border-[#333333] bg-[#252530] text-white">
                      <p>Descargar como imagen PNG</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}
