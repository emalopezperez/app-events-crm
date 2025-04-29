import PhotoCard from './PhotoCard'

export default function PhotoGrid({ photos }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {photos.map((message) => (
          <PhotoCard key={message._id} message={message} />
        ))}
      </div>
    </>
  )
}
