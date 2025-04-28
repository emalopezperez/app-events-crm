'use client'

import type React from 'react'

import { EventData } from '@/app/actions/event.config.actions'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

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

  // Populate form with initial data if provided (for editing)
  useEffect(() => {
    if (initialData) {
      setEventName(initialData.eventName || '')
      setCode(initialData.code || '')
      setNumberBot(initialData.number_bot || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER_BOT || '')

      // Handle date conversion
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

    // Asegurarse de que la fecha sea un objeto Date válido
    const eventDate = date ? new Date(date) : new Date()

    // Si estamos editando, solo incluir los campos que han cambiado
    if (isEditing && initialData) {
      const updatedFields: Partial<EventData> = {}

      // Solo incluir campos que han cambiado
      if (eventName !== initialData.eventName) updatedFields.eventName = eventName
      if (code !== initialData.code) updatedFields.code = code
      if (numberBot !== initialData.number_bot) updatedFields.number_bot = numberBot

      // Comparar fechas (convertir a string para comparación consistente)
      const initialDateStr = new Date(initialData.eventDate).toISOString().split('T')[0]
      const newDateStr = eventDate.toISOString().split('T')[0]
      if (initialDateStr !== newDateStr) updatedFields.eventDate = eventDate

      // Si no hay cambios, no hacer nada
      if (Object.keys(updatedFields).length === 0) {
        return
      }

      // Incluir el ID para la actualización
      updatedFields._id = initialData._id

      // Mantener los campos que no se modificaron
      const eventData: EventData = {
        ...initialData,
        ...updatedFields,
      }

      await onSubmit(eventData)
    } else {
      // Para creación, enviar todos los campos
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

      {/* Diálogo del calendario */}
      <Dialog open={showCalendarDialog} onOpenChange={setShowCalendarDialog}>
        <DialogContent className="border-[#333333] bg-[#1a1a25] p-0 text-white">
          <DialogTitle className="px-4 pt-4">Seleccionar fecha</DialogTitle>
          <div className="p-4">
            <div className="rounded-lg border border-[#333333] bg-[#252530] p-2">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                locale={es}
                className="text-white"
                classNames={{
                  months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
                  month: 'space-y-4',
                  caption: 'flex justify-center pt-1 relative items-center',
                  caption_label: 'text-sm font-medium text-white',
                  nav: 'space-x-1 flex items-center',
                  nav_button:
                    'h-7 w-7 bg-[#333340] p-0 text-gray-300 hover:bg-[#444450] hover:text-white rounded-md cursor-pointer',
                  nav_button_previous: 'absolute left-1',
                  nav_button_next: 'absolute right-1',
                  table: 'w-full border-collapse space-y-1',
                  head_row: 'flex',
                  head_cell: 'text-gray-400 rounded-md w-9 font-normal text-[0.8rem]',
                  row: 'flex w-full mt-2',
                  cell: 'h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-primary/20 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
                  day: 'h-9 w-9 p-0 font-normal text-gray-300 aria-selected:opacity-100 hover:bg-[#333340] rounded-md cursor-pointer',
                  day_selected:
                    'bg-primary text-white hover:bg-primary hover:text-white focus:bg-primary focus:text-white',
                  day_today: 'bg-[#333340] text-white',
                  day_outside: 'text-gray-500 opacity-50',
                  day_disabled: 'text-gray-500 opacity-50',
                  day_range_middle: 'aria-selected:bg-primary/20 aria-selected:text-gray-300',
                  day_hidden: 'invisible',
                }}
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
