import mongoose, { Schema } from "mongoose"


const eventQrSchema = new Schema(
  {
    code: String,
    eventName: String,
    eventDate: Date,
    number_bot: String,
    enabled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
)


const EventQr = mongoose.models.EventQr || mongoose.model("EventQr", eventQrSchema)

export default EventQr
