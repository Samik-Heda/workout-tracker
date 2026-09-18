import { createPortal } from 'react-dom'

export default function Modal({ title, onClose, children }) {
  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <strong>{title}</strong>
          <button className="btn-text" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  )
}
