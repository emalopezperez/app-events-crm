'use client'

import { EventData } from '@/app/actions/event.config.actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Download, MessageSquare } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useState } from 'react'
interface EventDetailsProps {
  event: EventData
}

export default function EventDetails({ event }: EventDetailsProps) {
  const [qrTimestamp] = useState(Date.now())

  const fixedMessage = `¡Hola! Quiero registrarme para ${event.eventName}. Mi código de verificación es: ${event.code}`
  const whatsAppUrl = `https://wa.me/${event.number_bot}?text=${encodeURIComponent(fixedMessage)}`

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
          downloadLink.download = `qr-${event.eventName.replace(/\s+/g, '-')}.png`
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

  const formatDate = (date: Date | string) => {
    try {
      return format(new Date(date), 'PPP', { locale: es })
    } catch (error) {
      console.error('Error formatting date:', error)
      return 'Fecha no disponible'
    }
  }

  return (
    <Tabs defaultValue="info">
      <TabsList className="grid w-full grid-cols-2 bg-[#252530]">
        <TabsTrigger
          value="info"
          className="data-[state=active]:bg-primary cursor-pointer data-[state=active]:text-white"
        >
          Información
        </TabsTrigger>
        <TabsTrigger
          value="qr"
          className="data-[state=active]:bg-primary cursor-pointer data-[state=active]:text-white"
        >
          Código QR
        </TabsTrigger>
      </TabsList>

      <TabsContent value="info" className="mt-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">{event.eventName}</h3>
            <Badge
              className={`${event.enabled ? 'bg-success hover:bg-success/80' : 'bg-[#333340] hover:bg-[#333340]/80'}`}
            >
              {event.enabled ? 'Activo' : 'Inactivo'}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400">Código de Seguridad</p>
              <p className="font-medium text-white">{event.code}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Fecha del Evento</p>
              <p className="font-medium text-white">{formatDate(event.eventDate)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Número de WhatsApp</p>
              <p className="font-medium text-white">{event.number_bot}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Fecha de Creación</p>
              <p className="font-medium text-white">{event.createdAt && formatDate(event.createdAt)}</p>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm text-gray-400">Mensaje de WhatsApp</p>
            <div className="mt-1 rounded-md bg-[#252530] p-3">
              <p className="text-sm text-white">{fixedMessage}</p>
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="qr" className="mt-4">
        <Card className="border-[#333333] bg-[#1a1a25]">
          <CardContent className="space-y-6 pt-6">
            <div className="flex items-center justify-center">
              <div className="rounded-lg bg-white p-4 shadow-lg">
                <QRCodeSVG
                  id="whatsapp-qr"
                  value={whatsAppUrl}
                  size={250}
                  level="H"
                  includeMargin
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                />
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-400">Generado: {new Date(qrTimestamp).toLocaleString('es-ES')}</p>
              <Button className="bg-primary hover:bg-primary/90 mt-4 cursor-pointer" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Descargar QR
              </Button>
            </div>

            <div className="rounded-lg bg-[#252530] p-4">
              <div className="mb-2 flex items-center gap-2">
                <MessageSquare className="text-primary h-4 w-4" />
                <p className="text-sm font-medium text-white">Información del QR</p>
              </div>
              <p className="text-xs text-gray-400">
                Este código QR redirige a WhatsApp con el número {event.number_bot} y un mensaje que incluye el código
                de verificación {event.code}.
              </p>
              <p className="mt-2 text-xs text-gray-400">
                {event.enabled
                  ? 'Este evento está ACTIVO y el bot permitirá el acceso con este código.'
                  : 'Este evento está INACTIVO. Actívalo para que el bot permita el acceso con este código.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
