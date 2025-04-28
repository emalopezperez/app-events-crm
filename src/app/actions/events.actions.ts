
"use server"


import { handleError } from "@/lib/utils"
import { getMessageModel } from "@/models/events/messages"


export async function getMessages() {
  try {
  
    const Message = await getMessageModel()
    const messages = await Message.find({})

    return JSON.parse(JSON.stringify(messages))
  } catch (error) {
    console.error("Error fetching messages:", error)
    handleError(error)
    return []
  }
}
