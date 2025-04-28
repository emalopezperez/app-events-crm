'use client'

import { createQrEvent, EventData, getEvents } from '@/app/actions/event.config.actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { useEffect, useState } from 'react'

import EventForm from './EventForm'
import EventList from './EventList'
import WhatsAppQRGenerator from './whatsapp-qr-generator'

export default function EventQRManager() {
  const [events, setEvents] = useState<EventData[]>([])
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('create')

  // Fetch events on component mount
  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      setIsLoading(true)
      const data = await getEvents()
      setEvents(data || [])
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateEvent = async (eventData: EventData) => {
    try {
      setIsLoading(true)
      const newEvent = await createQrEvent(eventData)

      if (newEvent) {
        // Refresh events list
        await fetchEvents()

        // Select the newly created event
        setSelectedEvent(newEvent)

        // Switch to the generate tab
        setActiveTab('generate')
      }
    } catch (error) {
      console.error('Error creating event:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectEvent = (event: EventData) => {
    setSelectedEvent(event)
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 grid w-full grid-cols-2 bg-[#252530]">
          <TabsTrigger
            value="create"
            className="data-[state=active]:bg-primary cursor-pointer data-[state=active]:text-white"
          >
            Crear Evento
          </TabsTrigger>
          <TabsTrigger
            value="generate"
            className="data-[state=active]:bg-primary cursor-pointer data-[state=active]:text-white"
          >
            Generar QR
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <Card className="border border-[#333333] bg-[#0f0f18] text-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-white sm:text-2xl">Crear Nuevo Evento</CardTitle>
            </CardHeader>
            <CardContent>
              <EventForm onSubmit={handleCreateEvent} isLoading={isLoading} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generate">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border border-[#333333] bg-[#0f0f18] text-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl text-white sm:text-2xl">Seleccionar Evento</CardTitle>
              </CardHeader>
              <CardContent>
                <EventList
                  events={events}
                  onSelectEvent={handleSelectEvent}
                  selectedEventId={selectedEvent?._id}
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>

            <div>
              {selectedEvent ? (
                <WhatsAppQRGenerator
                  eventName={selectedEvent.eventName}
                  whatsAppNumber={selectedEvent.number_bot}
                  verificationCode={selectedEvent.code}
                />
              ) : (
                <Card className="flex h-full items-center justify-center border border-[#333333] bg-[#0f0f18] text-white shadow-lg">
                  <CardContent className="p-8 text-center">
                    <p>Selecciona un evento para generar su código QR</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
