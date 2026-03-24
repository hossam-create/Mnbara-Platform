
interface ImageGalleryProps {
  images: string[];
  selected: number;
  onSelect: (i: number) => void;
}

export default function ImageGallery({ images, selected, onSelect }: ImageGalleryProps) {
  return (
    <div className="flex gap-3">
      {/* Thumbnails */}
      <div className="flex flex-col gap-2">
        {images.map((img, i) => (
          <button
            key={i}
            onMouseEnter={() => onSelect(i)}
            className={`w-[64px] h-[64px] border-2 rounded overflow-hidden ${
              selected === i ? 'border-brand-blue' : 'border-gray-200 hover:border-gray-400'
            }`}
          >
            <img src={img} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      {/* Main Image */}
      <div className="flex-1 relative">
        <div className="aspect-square bg-white border border-gray-200 rounded overflow-hidden">
          <img src={images[selected]} alt="" className="w-full h-full object-contain" />
        </div>
        {/* Image actions */}
        <div className="absolute bottom-3 right-3 flex gap-2">
          <button className="w-8 h-8 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
