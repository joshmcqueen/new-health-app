import { X } from "lucide-react";
import type { PropsWithChildren } from "react";

interface ModalProps extends PropsWithChildren {
  title: string;
  eyebrow?: string;
  onClose: () => void;
  wide?: boolean;
}

export function Modal({ title, eyebrow, onClose, children, wide }: ModalProps) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={`modal-card ${wide ? "modal-wide" : ""}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-handle" />
        <header className="modal-header">
          <div>
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            <h2 id="modal-title">{title}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close"><X size={20} /></button>
        </header>
        {children}
      </section>
    </div>
  );
}
