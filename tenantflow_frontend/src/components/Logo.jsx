export default function Logo({
  size = 32,
  showText = true,
  className = '',
  textClassName = 'text-lg font-bold text-slate-900',
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`.trim()}>
      <div
        className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-blue-700 shadow-sm"
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <svg
          width={Math.max(16, Math.floor(size * 0.62))}
          height={Math.max(16, Math.floor(size * 0.62))}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5 20V8.5L12 4l7 4.5V20"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M9 20v-5h6v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8.5 11.5h2.5M13 11.5h2.5M8.5 14h2.5M13 14h2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </div>
      {showText && <span className={textClassName}>Tenant Flow</span>}
    </div>
  );
}
