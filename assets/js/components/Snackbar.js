import React, { useEffect } from 'react';

export default function Snackbar({ message, onClose, duration = 4500, type = 'info' }) {
    useEffect(() => {
        if (!message) return;
        const id = setTimeout(() => onClose(), duration);
        return () => clearTimeout(id);
    }, [message, onClose, duration]);

    if (!message) return null;

    const bg = type === 'error' ? '#c0392b' : type === 'warning' ? '#f39c12' : '#2c3e50';

    return (
        <div style={{
            position: 'fixed',
            bottom: '1rem',
            left: '50%',
            transform: 'translateX(-50%)',
            background: bg,
            color: '#fff',
            padding: '0.8rem 1.2rem',
            borderRadius: 6,
            boxShadow: '0 6px 18px rgba(0,0,0,.25)',
            zIndex: 10000,
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            maxWidth: '95%',
            lineHeight: 1.25
        }}>
            <span>{message}</span>
            <button onClick={onClose} aria-label="Zamknij" style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '1.1rem',
                cursor: 'pointer'
            }}>✕</button>
        </div>
    );
}
