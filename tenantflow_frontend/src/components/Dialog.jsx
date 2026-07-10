import { useEffect } from 'react';

export default function Dialog({ 
  isOpen, 
  title, 
  message, 
  type = 'success', // 'success', 'error', 'warning', 'info'
  onClose, 
  buttons = [],
  autoCloseIn = 0 // milliseconds, 0 = no auto close
}) {
  useEffect(() => {
    if (!isOpen || autoCloseIn === 0) return;

    const timer = setTimeout(onClose, autoCloseIn);
    return () => clearTimeout(timer);
  }, [isOpen, autoCloseIn, onClose]);

  if (!isOpen) return null;

  const typeStyles = {
    success: {
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      titleColor: 'text-green-900',
      messageColor: 'text-green-800',
      buttonColor: 'bg-green-600 hover:bg-green-700',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    error: {
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      titleColor: 'text-red-900',
      messageColor: 'text-red-800',
      buttonColor: 'bg-red-600 hover:bg-red-700',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600'
    },
    warning: {
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      titleColor: 'text-yellow-900',
      messageColor: 'text-yellow-800',
      buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600'
    },
    info: {
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      titleColor: 'text-blue-900',
      messageColor: 'text-blue-800',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600'
    }
  };

  const styles = typeStyles[type] || typeStyles.info;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 0v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 transition-opacity duration-200"
          onClick={onClose}
        />
      )}

      {/* Dialog Container */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-md mx-4 animate-in fade-in slide-in-from-top-3">
          <div className={`${styles.bgColor} border ${styles.borderColor} rounded-lg shadow-lg overflow-hidden`}>
            <div className="p-6">
              {/* Header with Icon */}
              <div className="flex items-start gap-4">
                <div className={`${styles.iconBg} rounded-full p-3 flex-shrink-0`}>
                  <div className={`${styles.iconColor}`}>
                    {getIcon()}
                  </div>
                </div>
                <div className="flex-1">
                  {title && (
                    <h3 className={`text-lg font-semibold ${styles.titleColor}`}>
                      {title}
                    </h3>
                  )}
                  {message && (
                    <p className={`${styles.messageColor} text-sm mt-1`}>
                      {message}
                    </p>
                  )}
                </div>

                {/* Close Button */}
                <button
                  onClick={onClose}
                  className={`flex-shrink-0 ${styles.messageColor} hover:opacity-75 transition-opacity`}
                  aria-label="Close dialog"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Buttons */}
              {buttons.length > 0 && (
                <div className="flex gap-3 mt-6">
                  {buttons.map((btn, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        btn.onClick?.();
                        if (btn.closeDialog !== false) {
                          onClose();
                        }
                      }}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200 ${
                        btn.variant === 'secondary'
                          ? `border ${styles.borderColor} ${styles.titleColor} hover:${styles.bgColor}`
                          : `${styles.buttonColor} text-white`
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Default Close Button if no buttons provided */}
              {buttons.length === 0 && (
                <button
                  onClick={onClose}
                  className={`w-full mt-6 py-2 px-4 ${styles.buttonColor} text-white rounded-lg text-sm font-medium transition-colors duration-200`}
                >
                  {type === 'success' ? 'Got it' : type === 'error' ? 'Try again' : 'OK'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
