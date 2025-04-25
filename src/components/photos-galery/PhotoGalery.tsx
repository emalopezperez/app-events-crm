'use client'

import { PhotoCarousel } from '@/components/photos-galery/PhotoCarousel'
import { useWebSocket } from '@/hooks/useWebSocke'
import { Photo } from '@/types'
import { useEffect, useState } from 'react'

export function PhotoGallery() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [currentPhoto, setCurrentPhoto] = useState<Photo | null>(null)
  const [lastPhotoTime, setLastPhotoTime] = useState<number>(Date.now())
  const [photoBuffer, setPhotoBuffer] = useState<Photo[]>([])
  const [isProcessingBuffer, setIsProcessingBuffer] = useState(false)

  const { newPhoto, setNewPhoto } = useWebSocket()

  const deleteDataState = () => {
    localStorage.removeItem('photos')
    setPhotos([])
    setCurrentPhoto(null)
    setPhotoBuffer([])
  }

  useEffect(() => {
    const storedPhotos = localStorage.getItem('photos')
    if (storedPhotos) {
      setPhotos(JSON.parse(storedPhotos))
    }
  }, [])

  useEffect(() => {
    if (photos.length > 0) {
      localStorage.setItem('photos', JSON.stringify(photos))
    }
  }, [photos])

  useEffect(() => {
    if (newPhoto) {
      if (photos.length === 0) {
        setPhotos([newPhoto])
        setCurrentPhoto(newPhoto)
        setLastPhotoTime(Date.now())
      } else {
        setPhotoBuffer((prev) => [...prev, newPhoto])
      }
      setNewPhoto(null)
    }
  }, [newPhoto])

  const processNextBufferItem = () => {
    if (photoBuffer.length > 0 && !isProcessingBuffer) {
      setIsProcessingBuffer(true)

      const [nextPhoto, ...remainingPhotos] = photoBuffer

      setPhotos((prevPhotos) => {
        if (prevPhotos.length >= 30) {
          return [...prevPhotos.slice(10), nextPhoto]
        }
        return [...prevPhotos, nextPhoto]
      })

      setCurrentPhoto(nextPhoto)
      setPhotoBuffer(remainingPhotos)
      setLastPhotoTime(Date.now())
    }
  }

  return (
    <div className="relative">
      <PhotoCarousel
        photos={photos}
        currentPhoto={currentPhoto}
        lastPhotoTime={lastPhotoTime}
        photoBuffer={photoBuffer}
        onPhotoComplete={processNextBufferItem}
        setIsProcessingBuffer={setIsProcessingBuffer}
      />
    </div>
  )
}
