const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function IssueMediaGallery({ media = [] }) {
  if (!media.length) {
    return <p className="text-xs text-slate-500">No media attached.</p>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {media.map((item) => {
        const src = `${apiBaseUrl}${item.url}`;
        const isVideo = item.type === 'video';

        return (
          <div key={item.url} className="rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
            {isVideo ? (
              <video src={src} controls className="w-full h-32 object-cover bg-black" />
            ) : (
              <a href={src} target="_blank" rel="noreferrer">
                <img src={src} alt={item.filename || 'Issue attachment'} className="w-full h-32 object-cover" />
              </a>
            )}
            <p className="px-2 py-1 text-[10px] text-slate-600 truncate">{item.filename || 'Attachment'}</p>
          </div>
        );
      })}
    </div>
  );
}
