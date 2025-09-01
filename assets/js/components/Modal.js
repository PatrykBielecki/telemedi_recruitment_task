import React, { useEffect } from 'react';

export default function Modal({open, onClose, children}) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e)=> e.key==='Escape' && onClose?.();
        document.addEventListener('keydown', onKey);
        return ()=> document.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    if (!open) return null;
    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={(e)=>e.stopPropagation()}>
                {children}
            </div>
        </div>
    );
}
