import { Card, CardFooter } from '@/components/ui/card'
import Image from 'next/image'

export default function PhotoCard({ message }) {
  return (
    <Card className="overflow-hidden border-[#333333] bg-[#252530] transition-all hover:shadow-md hover:shadow-gray-800/30">
      <div className="relative aspect-square w-full overflow-hidden">
        <Image
          src={message.image || '/placeholder.svg'}
          alt={`Photo by ${message.user}`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-all duration-300 hover:scale-105"
          loading="lazy"
        />
      </div>
      <CardFooter className="flex flex-col items-start space-y-1 p-3">
        <p className="line-clamp-1 text-sm font-medium text-gray-200">{message.user}</p>
        {message.text && <p className="line-clamp-2 w-full text-xs text-gray-400">{message.text}</p>}
      </CardFooter>
    </Card>
  )
}
