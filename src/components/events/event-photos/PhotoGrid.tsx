import { ScrollArea } from '@/components/ui/scroll-area'
import PhotoCard from './PhotoCard'

export default function PhotoGrid({ photos }) {
  return (
    <ScrollArea className="h-[70vh] w-full rounded-md">
      <div className="grid grid-cols-1 gap-4 p-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {photos.map((message) => (
          <PhotoCard key={message._id} message={message} />
        ))}
      </div>
    </ScrollArea>
  )
}
