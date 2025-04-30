import { getMessages } from '@/app/actions/events.actions'

import PhotoGrid from '@/components/events/event-photos/PhotoGrid'
import DownloadButton from '@/components/photos-galery/DownloadButton'

interface PageProps {
  params: {}
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function DownloadImagesByEvent({ searchParams }: PageProps) {
  const messages = await getMessages()
  const totalPhotos = messages.length

  return (
    <main className="mx-auto min-h-screen max-w-6xl border-none p-6 text-white shadow-none md:p-12">
      <div className="mx-auto max-w-6xl text-white shadow-lg">
        <div className="flex flex-row items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Fotos del Evento</h2>
          <DownloadButton messages={messages} />
        </div>
        <div>
          {messages && messages.length > 0 ? (
            <div className="space-y-6">
              <p className="mb-4 text-gray-400">Total de fotos: {totalPhotos}</p>
              <PhotoGrid photos={messages} />
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-gray-400">No se encontraron fotos</p>
              <p className="mt-2 text-sm text-gray-500">No hay fotos disponibles en la base de datos</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
