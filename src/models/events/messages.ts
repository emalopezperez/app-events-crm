import { connectToEventData } from "@/lib/mongoose.events"
import { Schema } from "mongoose"


const messageSchema = new Schema(
  {
    imgProfile: String,
    phone: Number,
    user: String,
    text: String,
    image: String,
  },
  {
    collection: "messages", 
    strict: false, 
  },
)


export const getMessageModel = async () => {
  const connection = await connectToEventData()
  return connection.models.Message || connection.model("Message", messageSchema)
}

export default messageSchema
