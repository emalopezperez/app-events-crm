"use server"


import { connectToEventsConfig} from "@/lib/mongoose.events.config"
import { handleError } from "@/lib/utils"
import EventQr from "@/models/config-events/eventQr"
import { revalidatePath} from "next/cache"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export type EventData = {
  _id?: string
  eventName: string
  code: string
  number_bot: string
  eventDate: Date
  enabled?: boolean
}



export const isAdmin = async (): Promise<boolean> => {
  const { sessionClaims } = await auth();

  if (
    !sessionClaims?.metadata?.role ||
    sessionClaims.metadata.role !== "admin"
  ) {
    return false;
  }

  return true;
};



export async function createQrEvent(dataQr: EventData) {
  try {
  
    const isAdminCheck = await isAdmin();

    if (!isAdminCheck) {
      throw new Error("No autorizado: Se requieren permisos de administrador")
    }

    if (!dataQr) {
      throw new Error("Missing dataQr")
    }

    await connectToEventsConfig()

    const newQr = await EventQr.create({
      ...dataQr,
      enabled: false,
     
      createdAt: new Date(),
    })

    revalidatePath("/")

    return JSON.parse(JSON.stringify(newQr))
  } catch (error) {
    if (error instanceof Error && error.message.includes("No autorizado")) {
     
      redirect("/sign-in")
    }
    handleError(error)
  }
}

export async function updateQrEvent(eventId: string, dataQr: EventData) {
  try {
    const isAdminCheck = await isAdmin();

    if (!isAdminCheck) {
      throw new Error("No autorizado: Se requieren permisos de administrador")
    }


    if (!eventId || !dataQr) {
      throw new Error("Missing eventId or dataQr")
    }

    await connectToEventsConfig()

    const { _id, enabled, ...updateData } = dataQr

    const updatedQr = await EventQr.findByIdAndUpdate(eventId, updateData, { new: true })

    if (!updatedQr) {
      throw new Error("Event not found")
    }

    revalidatePath("/")

    return JSON.parse(JSON.stringify(updatedQr))
  } catch (error) {
    if (error instanceof Error && error.message.includes("No autorizado")) {
      redirect("/sign-in")
    }
    handleError(error)
  }
}


export async function getEvents() {
  try {
    const isAdminCheck = await isAdmin()

    if (!isAdminCheck) {
      throw new Error("No autorizado: Se requieren permisos de administrador")
    }

  
    await connectToEventsConfig()

    const events = await EventQr.find({}).sort({ createdAt: -1 })

    return JSON.parse(JSON.stringify(events))
  } catch (error) {
    if (error instanceof Error && error.message.includes("No autorizado")) {
      redirect("/sign-in")
    }
    handleError(error)
    return []
  }
}


export async function deleteEvent(eventId: string) {
  try {
    const isAdminCheck = await isAdmin();

    if (!isAdminCheck) {
      throw new Error("No autorizado: Se requieren permisos de administrador")
    }


    await connectToEventsConfig()

    await EventQr.findByIdAndDelete(eventId)

    revalidatePath("/")

    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message.includes("No autorizado")) {
      return { success: false, error: "No autorizado" }
    }
    handleError(error)
    return { success: false }
  }
}

export async function toggleEventStatus(eventId: string, enable: boolean) {
  try {
    const isAdminCheck = await isAdmin();

    if (!isAdminCheck) {
      throw new Error("No autorizado: Se requieren permisos de administrador")
    }


    await connectToEventsConfig()

    if (enable) {
      await EventQr.updateMany({}, { enabled: false })
    }

    await EventQr.findByIdAndUpdate(eventId, { enabled: enable })

    revalidatePath("/")

    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message.includes("No autorizado")) {
      return { success: false, error: "No autorizado" }
    }
    console.error("Error updating event status:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function getActiveEvent() {
  try {
    const isAdminCheck = await isAdmin();

    if (!isAdminCheck) {
      throw new Error("No autorizado: Se requieren permisos de administrador")
    }


    await connectToEventsConfig()

    const activeEvent = await EventQr.findOne({ enabled: true })

    if (!activeEvent) {
      return null
    }

    return JSON.parse(JSON.stringify(activeEvent))
  } catch (error) {
    handleError(error)
    return null
  }
}


export async function verifyEventCode(code: string) {
  try {

    const isAdminCheck = await isAdmin();

    if (!isAdminCheck) {
      throw new Error("No autorizado: Se requieren permisos de administrador")
    }

    await connectToEventsConfig()

    const event = await EventQr.findOne({ code, enabled: true })

    if (!event) {
      return { valid: false, message: "Código inválido o evento no activo" }
    }

    return { valid: true, eventName: event.eventName }
  } catch (error) {
    handleError(error)
    return { valid: false, message: "Error al verificar el código" }
  }
}
