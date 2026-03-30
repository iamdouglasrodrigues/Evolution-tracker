import Modal from './Modal'
import { AlertTriangle } from 'lucide-react'

export default function ConfirmDialog({ open, onClose, onConfirm, title = 'Confirmar', message, confirmText = 'Confirmar', danger = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-sm">
      <div className="flex gap-3 items-start mb-5">
        <div className={`p-2 rounded-full shrink-0 ${danger ? 'bg-danger/10' : 'bg-warning/10'}`}>
          <AlertTriangle size={20} className={danger ? 'text-danger' : 'text-warning'} />
        </div>
        <p className="text-sm text-text-muted mt-1">{message}</p>
      </div>
      <div className="flex gap-2 justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 text-text cursor-pointer"
        >
          Cancelar
        </button>
        <button
          onClick={() => { onConfirm(); onClose() }}
          className={`px-4 py-2 rounded-lg text-sm font-medium text-white cursor-pointer ${danger ? 'bg-danger hover:bg-red-600' : 'bg-primary hover:bg-primary-dark'}`}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  )
}
