export function isWeekend(isoDate) {
    const d = new Date(isoDate + 'T00:00:00');
    const dow = d.getDay(); // 0=nd, 6=sb
    return dow === 0 || dow === 6;
}

export function formatPL(isoDate) {
    try {
        const d = new Date(isoDate + 'T00:00:00');
        return d.toLocaleDateString('pl-PL', { year:'numeric', month:'long', day:'numeric' });
    } catch {
        return isoDate;
    }
}
