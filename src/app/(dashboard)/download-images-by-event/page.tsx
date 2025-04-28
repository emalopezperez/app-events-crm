import { getMessages } from '@/app/actions/events.actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function DownloadImagesByEvent() {
  const messages = await getMessages()

  console.log(messages)

  return (
    <main className="min-h-screen bg-[#0f0f18] p-6 md:p-12">
      <Card className="mx-auto max-w-5xl border-[#333333] bg-[#1a1a25] text-white shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-white">Mensajes de WhatsApp</CardTitle>
        </CardHeader>
        <CardContent>
          {messages && messages.length > 0 ? (
            <div className="space-y-4">
              <p className="mb-4 text-gray-400">Total de mensajes: {messages.length}</p>

              <div className="grid gap-3">
                {messages.map((message, index) => (
                  <div key={message._id || index} className="rounded-md border border-[#333333] bg-[#252530] p-3">
                    {message.text && <p className="mt-2 text-sm text-gray-300">{message.text}</p>}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-gray-400">No se encontraron mensajes</p>
              <p className="mt-2 text-sm text-gray-500">No hay mensajes disponibles en la base de datos</p>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
