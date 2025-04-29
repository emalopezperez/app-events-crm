'use server'

import { handleError } from '@/lib/utils'
import { getMessageModel } from '@/models/events/messages'
import { auth } from '@clerk/nextjs/server'

export const isAdmin = async (): Promise<boolean> => {
  const { sessionClaims } = await auth()

  if (!sessionClaims?.metadata?.role || sessionClaims.metadata.role !== 'admin') {
    return false
  }

  return true
}

export async function getMessages() {
  const isAdminCheck = await isAdmin()

  if (!isAdminCheck) {
    throw new Error('No autorizado: Se requieren permisos de administrador')
  }

  try {
    const Message = await getMessageModel()
    const messages = await Message.find({})

    return JSON.parse(JSON.stringify(messages))
  } catch (error) {
    console.error('Error fetching messages:', error)
    handleError(error)
    return []
  }
}
