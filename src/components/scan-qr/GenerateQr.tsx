'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { saveAs } from 'file-saver'
import { AnimatePresence, motion } from 'framer-motion'
import JSZip from 'jszip'
import { Archive, Download, QrCode, Trash } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useState } from 'react'

interface QRItem {
  id: string
  text: string
  timestamp: number
}

export default function QRGenerator() {
  const [text, setText] = useState('')
  const [qrItems, setQrItems] = useState<QRItem[]>([])
  const [justGenerated, setJustGenerated] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    if (justGenerated) {
      const timer = setTimeout(() => {
        setJustGenerated(null)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [justGenerated])

  const handleGenerate = () => {
    if (!text.trim()) return

    const newItem: QRItem = {
      id: Date.now().toString(),
      text: text.trim(),
      timestamp: Date.now(),
    }

    setQrItems((prev) => [newItem, ...prev])
    setJustGenerated(newItem.id)
    setText('')
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

  const dataURLtoBlob = (dataURL: string): Blob => {
    const arr = dataURL.split(',')
    const mime = arr[0].match(/:(.*?);/)![1]
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }

    return new Blob([u8arr], { type: mime })
  }

  const handleDownload = (item: QRItem) => {
    const svg = document.getElementById(`qr-${item.id}`) as SVGElement
    if (!svg) return

    try {
      svgToPng(svg, 200, 200)
        .then((pngUrl) => {
          const downloadLink = document.createElement('a')
          downloadLink.download = `qr-${item.text.replace(/\s+/g, '-')}.png`
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

  const handleDownloadAll = async () => {
    if (qrItems.length === 0) return

    setIsExporting(true)

    try {
      const zip = new JSZip()
      const promises: Promise<void>[] = []

      const qrFolder = zip.folder('codigos-qr')

      if (!qrFolder) {
        throw new Error('No se pudo crear la carpeta en el ZIP')
      }

      qrItems.forEach((item, index) => {
        const svg = document.getElementById(`qr-${item.id}`) as SVGElement
        if (!svg) return

        const promise = svgToPng(svg, 200, 200)
          .then((pngUrl) => {
            const blob = dataURLtoBlob(pngUrl)
            const fileName = `qr-${index + 1}-${item.text.replace(/\s+/g, '-').substring(0, 30)}.png`
            qrFolder.file(fileName, blob, { binary: true })
          })
          .catch((err) => {
            console.error(`Error al procesar QR ${item.id}:`, err)
          })

        promises.push(promise)
      })

      await Promise.all(promises)

      const content = await zip.generateAsync({ type: 'blob' })

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      saveAs(content, `todos-los-qr-${timestamp}.zip`)
    } catch (err) {
      console.error('Error al crear el archivo ZIP:', err)
      alert('Error al crear el archivo ZIP. Intente con otro navegador.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleRemoveItem = (id: string) => {
    setQrItems((prev) => prev.filter((item) => item.id !== id))
  }

  const handleRemoveAll = () => {
    setQrItems([])
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
    <main className="mx-auto my-12">
      <div className="mx-auto max-w-4xl">
        <div className="text-gray-100">
          <div className="">
            <div className="flex items-center gap-2 text-lg text-white sm:text-xl">
              <QrCode className="h-5 w-5 text-cyan-400 sm:h-6 sm:w-6" />
              Crear nuevo código QR
            </div>
          </div>
          <div className="">
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <div className="flex-1">
                <Label htmlFor="qr-text" className="text-sm text-gray-200 sm:text-base">
                  Texto para QR
                </Label>
                <div className="mt-1 sm:mt-1.5">
                  <Input
                    id="qr-text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Ingresa texto"
                    className="h-10 border-gray-600 bg-gray-700 text-sm text-white placeholder:text-gray-400 focus:border-cyan-400 focus:ring-cyan-400 sm:h-12 sm:text-base"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && text.trim()) {
                        handleGenerate()
                      }
                    }}
                  />
                </div>
              </div>
              <div className="mt-1 flex items-end sm:mt-0">
                <Button
                  onClick={handleGenerate}
                  disabled={!text.trim()}
                  size="default"
                  className="h-10 w-full cursor-pointer rounded-md bg-cyan-600 text-white transition-all hover:bg-cyan-500 disabled:bg-gray-600 sm:h-12 sm:w-auto sm:px-6"
                >
                  Generar QR
                </Button>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {qrItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mt-4"
            >
              <div className="mb-4 flex flex-col justify-between gap-3 rounded-xl bg-gray-800 p-3 text-white sm:flex-row sm:items-center sm:gap-0">
                <h2 className="text-xl font-semibold sm:text-2xl">
                  Códigos QR Generados{' '}
                  <span className="ml-2 rounded-full bg-cyan-600 px-2.5 py-0.5 text-xs text-white sm:text-sm">
                    {qrItems.length}
                  </span>
                </h2>
                <div className="flex gap-2 sm:gap-3">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          onClick={handleDownloadAll}
                          disabled={isExporting}
                          className="h-8 cursor-pointer rounded-md bg-green-600 text-white transition-all hover:bg-green-500 disabled:bg-gray-600 sm:h-9"
                        >
                          <Archive className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
                          <span className="text-xs sm:text-sm">
                            {isExporting ? 'Exportando...' : 'Descargar Todos'}
                          </span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Descargar todos los QR como archivo ZIP</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          onClick={handleRemoveAll}
                          className="h-8 cursor-pointer rounded-md bg-red-600 text-white transition-all hover:bg-red-500 sm:h-9"
                        >
                          <Trash className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
                          <span className="text-xs sm:text-sm">Eliminar Todos</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Eliminar todos los códigos QR generados</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              <ScrollArea className="h-[calc(100vh-340px)]">
                <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3">
                  {qrItems.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={justGenerated === item.id ? { scale: 0.8, opacity: 0 } : false}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className={`${justGenerated === item.id ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-gray-900' : ''}`}
                    >
                      <Card className="hover:bg-gray-750 h-full overflow-hidden border-gray-700 bg-gray-800 text-gray-100 transition-all duration-200 hover:shadow-md">
                        <CardHeader className="px-2">
                          <CardTitle className="line-clamp-1 text-xs font-medium text-white">{item.text}</CardTitle>
                          <CardDescription className="text-[10px] text-gray-400">
                            {formatDate(item.timestamp)}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-center p-1">
                          <div className="rounded-md bg-white p-1 shadow-md">
                            <QRCodeSVG
                              id={`qr-${item.id}`}
                              value={item.text}
                              size={140}
                              level="H"
                              includeMargin
                              bgColor="#FFFFFF"
                              fgColor="#000000"
                            />
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-between gap-3">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  className="h-6 flex-1 cursor-pointer rounded-sm bg-cyan-600 px-1 text-[10px] text-white transition-all hover:bg-cyan-500"
                                  onClick={() => handleDownload(item)}
                                >
                                  <Download className="mr-1 h-3 w-3" />
                                  Descargar
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Descargar como imagen PNG</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  className="h-6 flex-1 cursor-pointer rounded-sm bg-red-600 px-1 text-[10px] text-white transition-all hover:bg-red-500"
                                  onClick={() => handleRemoveItem(item.id)}
                                >
                                  <Trash className="mr-1 h-3 w-3" />
                                  Eliminar
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Eliminar este código QR</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>

        {qrItems.length === 0 && (
          <div className="mt-6 rounded-lg border-2 border-dashed p-22 text-center">
            <QrCode className="mx-auto h-10 w-10 text-gray-500" />
            <h3 className="mt-3 text-base font-semibold text-gray-200">No hay códigos QR generados</h3>
            <p className="mt-1 text-sm text-gray-400">
              Comienza generando tu primer código QR con el formulario de arriba.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
