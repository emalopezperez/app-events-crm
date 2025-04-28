'use client'

import {
  createQrEvent,
  deleteEvent,
  EventData,
  getEvents,
  toggleEventStatus,
  updateQrEvent,
} from '@/app/actions/event.config.actions'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

import { Edit, Eye, Loader2, Plus, Power, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ScrollArea } from '../ui/scroll-area'
import EventDetails from './EventDetails'
import EventForm from './EventForm'

const formatEventDate = (date: Date | string | undefined) => {
  if (!date) return 'Sin fecha'
  try {
    return new Date(date).toLocaleDateString('es-ES')
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'Fecha no disponible'
  }
}

export default function EventDashboard() {
  const [events, setEvents] = useState<EventData[]>([])
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isTogglingStatus, setIsTogglingStatus] = useState(false)
  const [showNewEventDialog, setShowNewEventDialog] = useState(false)
  const [showEditEventDialog, setShowEditEventDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

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
      // Use the default WhatsApp number from env if not provided
      if (!eventData.number_bot || eventData.number_bot.trim() === '') {
        eventData.number_bot = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER_BOT || ''
      }

      await createQrEvent(eventData)

      // Refresh events list
      await fetchEvents()

      // Close the dialog
      setShowNewEventDialog(false)
    } catch (error) {
      console.error('Error creating event:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateEvent = async (eventData: EventData) => {
    if (!selectedEvent?._id) return

    try {
      setIsLoading(true)

      // Asegurarse de que el ID esté incluido
      const dataToUpdate = {
        ...eventData,
        _id: selectedEvent._id,
      }

      // Si el número de WhatsApp está vacío, usar el valor por defecto
      if (!dataToUpdate.number_bot || dataToUpdate.number_bot.trim() === '') {
        dataToUpdate.number_bot = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER_BOT || ''
      }

      await updateQrEvent(selectedEvent._id, dataToUpdate)

      // Refresh events list
      await fetchEvents()

      // Close the dialog
      setShowEditEventDialog(false)
    } catch (error) {
      console.error('Error updating event:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    try {
      setIsDeleting(true)
      const result = await deleteEvent(eventId)

      if (result.success) {
        await fetchEvents()

        setShowDeleteDialog(false)
      } else {
        throw new Error('Failed to delete event')
      }
    } catch (error) {
      console.error('Error deleting event:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleToggleEventStatus = async (eventId: string, enable: boolean) => {
    try {
      setIsTogglingStatus(true)
      const result = await toggleEventStatus(eventId, enable)

      if (result.success) {
        // Refresh events list
        await fetchEvents()
      } else {
        throw new Error('Failed to update event status')
      }
    } catch (error) {
      console.error('Error updating event status:', error)
    } finally {
      setIsTogglingStatus(false)
    }
  }

  const handleViewDetails = (event: EventData) => {
    setSelectedEvent(event)
    setShowDetailsDialog(true)
  }

  const handleEditClick = (event: EventData) => {
    setSelectedEvent(event)
    setShowEditEventDialog(true)
  }

  const handleDeleteClick = (event: EventData) => {
    setSelectedEvent(event)
    setShowDeleteDialog(true)
  }

  // Ordenar eventos para mostrar primero el activado
  const sortedEvents = [...events].sort((a, b) => {
    // Si a está activado y b no, a va primero
    if (a.enabled && !b.enabled) return -1
    // Si b está activado y a no, b va primero
    if (!a.enabled && b.enabled) return 1
    // Si ambos tienen el mismo estado de activación, ordenar por fecha de creación (más reciente primero)
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  })

  // Determinar si necesitamos scroll basado en la cantidad de eventos
  const needsScroll = events.length > 2

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-white">Lista de Eventos</h2>
        <Dialog open={showNewEventDialog} onOpenChange={setShowNewEventDialog}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-gray-9to00 cursor-pointer bg-white text-black">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Evento
            </Button>
          </DialogTrigger>
          <DialogContent className="border-[#333333] bg-[#1a1a25] text-white sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Evento</DialogTitle>
              <DialogDescription className="text-gray-400">
                Completa el formulario para crear un nuevo evento
              </DialogDescription>
            </DialogHeader>
            <EventForm onSubmit={handleCreateEvent} isLoading={isLoading} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && !events.length ? (
        <div className="flex h-60 items-center justify-center">
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <Card className="border border-[#333333] bg-[#0f0f18] text-white shadow-lg">
          <CardContent className="flex h-60 flex-col items-center justify-center">
            <p className="mb-4 text-gray-400">No hay eventos disponibles</p>
            <Button
              className="bg-primary hover:bg-primary/90 cursor-pointer"
              onClick={() => setShowNewEventDialog(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Crear Primer Evento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className={needsScroll ? 'h-[500px] pr-4' : ''}>
          <div className="grid gap-4">
            {sortedEvents.map((event) => (
              <Card
                key={event._id}
                className={`border ${
                  event.enabled ? 'border-primary/50 bg-[#1e1e2d]' : 'border-[#333333] bg-[#0f0f18]'
                } text-white shadow-lg transition-all`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl text-white">
                        {event.eventName}
                        {event.enabled && (
                          <span className="bg-primary ml-2 rounded-full px-2 py-0.5 text-xs text-white">
                            Evento Actual
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription className="text-gray-400">Código: {event.code}</CardDescription>
                    </div>
                    <Badge
                      className={`${
                        event.enabled
                          ? 'bg-success hover:bg-success/80 bg-blue-400 text-white'
                          : 'bg-red-500 text-gray-300'
                      } cursor-default`}
                    >
                      {event.enabled ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <p className="text-sm text-gray-400">Fecha: {formatEventDate(event.eventDate)}</p>
                </CardContent>
                <CardFooter className="flex justify-between pt-2">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-primary/50 text-primary hover:bg-primary/10 hover:text-primary cursor-pointer"
                      onClick={() => handleViewDetails(event)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Ver
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-primary/50 text-primary hover:bg-primary/10 hover:text-primary cursor-pointer bg-green-700 hover:bg-green-800"
                      onClick={() => handleEditClick(event)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer bg-red-600 hover:bg-red-700"
                      onClick={() => handleDeleteClick(event)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </Button>
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    className={`${
                      event.enabled
                        ? 'bg-success hover:bg-success/90 bg-orange-500 hover:bg-orange-600'
                        : 'bg-destructive hover:bg-destructive/90 bg-blue-400 hover:bg-blue-400'
                    } cursor-pointer text-white`}
                    onClick={() => handleToggleEventStatus(event._id as string, !event.enabled)}
                    disabled={isTogglingStatus}
                  >
                    {isTogglingStatus ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Power className="mr-2 h-4 w-4" />
                    )}
                    {event.enabled ? 'Desactivar' : 'Activar'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Event Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="border-[#333333] bg-[#1a1a25] text-white sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalles del Evento</DialogTitle>
          </DialogHeader>
          {selectedEvent && <EventDetails event={selectedEvent} />}
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={showEditEventDialog} onOpenChange={setShowEditEventDialog}>
        <DialogContent className="border-[#333333] bg-[#1a1a25] text-white sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Evento</DialogTitle>
            <DialogDescription className="text-gray-400">Modifica los datos del evento</DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <EventForm onSubmit={handleUpdateEvent} isLoading={isLoading} initialData={selectedEvent} isEditing />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="border-[#333333] bg-[#1a1a25] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Esta acción no se puede deshacer. Se eliminará permanentemente el evento
              {selectedEvent && <span className="font-semibold"> "{selectedEvent.eventName}"</span>}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer bg-[#252530] text-white hover:bg-[#252530]/80">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 cursor-pointer"
              onClick={() => selectedEvent && handleDeleteEvent(selectedEvent._id as string)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
