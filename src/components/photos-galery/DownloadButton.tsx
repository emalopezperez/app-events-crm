'use client'

import { Button } from '@/components/ui/button'

import { Download, Loader2 } from 'lucide-react'
import { useState } from 'react'

interface Message {
  _id: string
  image: string
  user: string
  text: string
  phone?: number
  imgProfile?: string
}

export default function DownloadButton({ messages }: { messages?: Message[] }) {
  const [isDownloading, setIsDownloading] = useState(false)

  const downloadAllPhotos = async () => {
    if (!messages || messages.length === 0) {
      return
    }

    try {
      setIsDownloading(true)

      const JSZip = (await import('jszip')).default
      const zip = new JSZip()

      const imgFolder = zip.folder('imagenes')

      const infoFolder = zip.folder('informacion')

      const downloadPromises = messages.map(async (message, index) => {
        try {
          const response = await fetch(message.image)
          if (!response.ok) throw new Error(`Error al descargar imagen ${index + 1}`)

          const imageBlob = await response.blob()
          const fileName = `imagen_${message._id || index}.jpg`

          imgFolder?.file(fileName, imageBlob)

          const info = {
            id: message._id,
            usuario: message.user,
            mensaje: message.text,
            telefono: message.phone,
            perfilWhatsApp: message.imgProfile,
          }

          infoFolder?.file(`info_${message._id || index}.json`, JSON.stringify(info, null, 2))

          return true
        } catch (error) {
          console.error(`Error procesando imagen ${index + 1}:`, error)
          return false
        }
      })

      await Promise.all(downloadPromises)

      const content = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      })

      const url = window.URL.createObjectURL(content)
      const a = document.createElement('a')
      a.href = url
      a.download = `fotos_evento_${new Date().toISOString().split('T')[0]}.zip`
      document.body.appendChild(a)
      a.click()

      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error al descargar las fotos:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Button onClick={downloadAllPhotos} disabled={isDownloading} className="bg-[#2d2d3a] text-white hover:bg-[#3d3d4a]">
      {isDownloading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Descargando...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Descargar todas
        </>
      )}
    </Button>
  )
}
