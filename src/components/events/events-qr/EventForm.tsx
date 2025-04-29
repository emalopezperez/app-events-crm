'use client'

import type React from 'react'

import { EventData } from '@/app/actions/event.config.actions'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ModernCalendar } from '../ui/calendar'

interface EventFormProps {
  onSubmit: (data: EventData) => Promise<void>
  isLoading: boolean
  initialData?: EventData
  isEditing?: boolean
}

export default function EventForm({ onSubmit, isLoading, initialData, isEditing = false }: EventFormProps) {
  const [eventName, setEventName] = useState('')
  const [code, setCode] = useState('')
  const [numberBot, setNumberBot] = useState(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER_BOT || '')
  const [date, setDate] = useState<Date>(new Date())
  const [showCalendarDialog, setShowCalendarDialog] = useState(false)

  useEffect(() => {
    if (initialData) {
      setEventName(initialData.eventName || '')
      setCode(initialData.code || '')
      setNumberBot(initialData.number_bot || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER_BOT || '')

      if (initialData.eventDate) {
        const eventDate = new Date(initialData.eventDate)
        if (!isNaN(eventDate.getTime())) {
          setDate(eventDate)
        }
      }
    }
  }, [initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!eventName || !code) {
      return
    }

    const eventDate = date ? new Date(date) : new Date()

    if (isEditing && initialData) {
      const updatedFields: Partial<EventData> = {}

      if (eventName !== initialData.eventName) updatedFields.eventName = eventName
      if (code !== initialData.code) updatedFields.code = code
      if (numberBot !== initialData.number_bot) updatedFields.number_bot = numberBot

      const initialDateStr = new Date(initialData.eventDate).toISOString().split('T')[0]
      const newDateStr = eventDate.toISOString().split('T')[0]
      if (initialDateStr !== newDateStr) updatedFields.eventDate = eventDate

      if (Object.keys(updatedFields).length === 0) {
        return
      }

      updatedFields._id = initialData._id

      const eventData: EventData = {
        ...initialData,
        ...updatedFields,
      }

      await onSubmit(eventData)
    } else {
      const eventData: EventData = {
        eventName,
        code,
        number_bot: numberBot || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER_BOT || '',
        eventDate: eventDate,
      }

      await onSubmit(eventData)
    }
  }

  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      setDate(newDate)
      setShowCalendarDialog(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="eventName" className="text-white">
          Nombre del Evento
        </Label>
        <Input
          id="eventName"
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
          placeholder="Ej: Cumple de 15 de Ana"
          required
          className="cursor-text border-[#333333] bg-[#252530] text-white placeholder:text-gray-500"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="code" className="text-white">
          Código de Seguridad
        </Label>
        <Input
          id="code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Ej: ABC123"
          required
          className="cursor-text border-[#333333] bg-[#252530] text-white placeholder:text-gray-500"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="numberBot" className="text-white">
          Número del Bot (WhatsApp)
        </Label>
        <Input
          id="numberBot"
          value={numberBot}
          onChange={(e) => setNumberBot(e.target.value)}
          placeholder={process.env.NEXT_PUBLIC_WHATSAPP_NUMBER_BOT || 'Ej: 092738985'}
          className="cursor-text border-[#333333] bg-[#252530] text-white placeholder:text-gray-500"
        />
        <p className="text-xs text-gray-400">Si se deja vacío, se usará el número predeterminado del .env</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="date" className="text-white">
          Fecha del Evento
        </Label>
        <div className="flex gap-2">
          <Button
            id="date"
            type="button"
            variant="outline"
            onClick={() => setShowCalendarDialog(true)}
            className="w-full cursor-pointer justify-start border-[#333333] bg-[#252530] text-left font-normal text-white hover:bg-[#252530]/80"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {format(date, 'PPP', { locale: es })}
          </Button>
        </div>
      </div>

      <Button type="submit" className="bg-primary hover:bg-primary/90 w-full cursor-pointer" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isEditing ? 'Actualizando...' : 'Creando...'}
          </>
        ) : isEditing ? (
          'Actualizar Evento'
        ) : (
          'Crear Evento'
        )}
      </Button>

      <Dialog open={showCalendarDialog} onOpenChange={setShowCalendarDialog}>
        <DialogContent className="border-[#333333] bg-[#1a1a25] p-0 text-white">
          <DialogTitle className="px-4 pt-4">Seleccionar fecha</DialogTitle>
          <div className="p-4">
            <div className="rounded-lg border border-[#333333] bg-[#252530] p-2">
              <ModernCalendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                locale={es}
                className="text-white"
              />
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                type="button"
                onClick={() => setShowCalendarDialog(false)}
                className="bg-primary hover:bg-primary/90 cursor-pointer"
              >
                Aceptar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </form>
  )
}
