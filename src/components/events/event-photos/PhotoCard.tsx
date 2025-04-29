export default function PhotoCard({ message }) {
  return (
    <div className="overflow-hidden rounded-md border border-[#333333] bg-[#252530] p-2">
      <div className="relative aspect-square w-full overflow-hidden rounded-md">
        <img
          src={message.image || '/placeholder.svg'}
          alt={`Photo by ${message.user}`}
          className="object-cover transition-transform hover:scale-105"
        />
      </div>
      <div className="mt-2 p-2">
        <p className="text-sm font-medium text-gray-200">{message.user}</p>
        {message.text && <p className="mt-1 truncate text-xs text-gray-400">{message.text}</p>}
      </div>
    </div>
  )
}
