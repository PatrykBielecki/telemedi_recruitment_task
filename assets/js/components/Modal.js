import React, { useEffect } from 'react';

export default function Modal({ open, onClose, children }) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => e.key === 'Escape' && onClose?.();
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    if (!open) return null;

    const backdropStyle = {
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.5)',
        display: 'flex',
        alignItems: 'flex-end', // drawer z dołu
        justifyContent: 'center',
        zIndex: 10000
    };

    const panelStyle = {
        background: '#171b22',           // ciemny panel
        color: '#e9eef5',
        width: '100%',
        maxWidth: '1024px',
        maxHeight: '80vh',
        overflow: 'auto',
        borderRadius: '16px 16px 0 0',
        border: '1px solid #242a33',
        padding: '16px 16px 24px',
        boxShadow: '0 12px 32px rgba(0,0,0,.35)'
    };

    return (
        <div style={backdropStyle} onClick={onClose}>
            <div style={panelStyle} onClick={(e) => e.stopPropagation()}>
                {children}
            </div>
        </div>
    );
}
