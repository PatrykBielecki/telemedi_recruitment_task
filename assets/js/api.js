export async function getRates(dateStr) {
    const url = `/api/rates${dateStr ? `?date=${dateStr}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch rates');
    return res.json();
}

export async function getHistory(code, dateStr, days=14) {
    const url = `/api/rates/${code}/history?days=${days}${dateStr ? `&date=${dateStr}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch history');
    return res.json();
}
