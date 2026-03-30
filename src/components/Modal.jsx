import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-md' }) {
  const overlayRef = useRef()

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && open) onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/50 animate-fade-in"
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className={`bg-card rounded-2xl shadow-2xl w-full ${maxWidth} animate-scale-in overflow-hidden`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-text-muted cursor-pointer transition-colors" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4">
          {children}
        </div>
      </div>
    </div>
  )
}
