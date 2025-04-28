import EventDashboard from '@/components/events-qr/EventDashboard'

export default function EventQr() {
  return (
    <main className="mx-auto min-h-screen px-4 py-8">
      <h1 className="mb-8 text-center text-3xl font-bold">Generador de QR del bot para Eventos</h1>
      <EventDashboard />
    </main>
  )
}
