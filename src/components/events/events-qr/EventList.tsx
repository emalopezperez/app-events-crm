'use client'

import { EventData } from '@/app/actions/event.config.actions'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Loader2 } from 'lucide-react'

interface EventListProps {
  events: EventData[]
  onSelectEvent: (event: EventData) => void
  selectedEventId?: string
  isLoading: boolean
}

export default function EventList({ events, onSelectEvent, selectedEventId, isLoading }: EventListProps) {
  if (isLoading) {
    return (
      <div className="flex h-60 items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-400">No hay eventos disponibles</p>
        <p className="mt-2 text-sm text-gray-500">Crea un nuevo evento para comenzar</p>
      </div>
    )
  }

  const formatEventDate = (date: Date | string | undefined) => {
    if (!date) return 'Sin fecha'
    try {
      return format(new Date(date), 'PPP', { locale: es })
    } catch (error) {
      console.error('Error formatting date:', error)
      return 'Fecha no disponible'
    }
  }

  return (
    <ScrollArea className="h-60 rounded-md">
      <div className="space-y-2 pr-3">
        {events.map((event) => (
          <Button
            key={event._id}
            variant="outline"
            className={`w-full cursor-pointer justify-start p-3 text-left ${
              selectedEventId === event._id
                ? 'bg-primary border-primary/50 text-white'
                : 'border-[#333333] bg-[#252530] text-white hover:bg-[#252530]/80'
            }`}
            onClick={() => onSelectEvent(event)}
          >
            <div className="flex flex-col">
              <span className="font-medium">{event.eventName}</span>
              <span className="text-xs opacity-80">{formatEventDate(event.eventDate)}</span>
              <span className="mt-1 text-xs">Código: {event.code}</span>
            </div>
          </Button>
        ))}
      </div>
    </ScrollArea>
  )
}
