export async function getRates(dateStr) {
    try {
        const url = `/api/rates${dateStr ? `?date=${dateStr}` : ''}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(res.status === 502
            ? 'NBP jest chwilowo niedostępne.'
            : `Błąd serwera (${res.status}).`);
        return await res.json();
    } catch (e) {
        throw new Error(`Nie udało się pobrać kursów. ${e.message}`);
    }
}

export async function getHistory(code, dateStr, days = 14) {
    try {
        const url = `/api/rates/${code}/history?days=${days}${dateStr ? `&date=${dateStr}` : ''}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(res.status === 502
            ? 'NBP jest chwilowo niedostępne.'
            : `Błąd serwera (${res.status}).`);
        return await res.json();
    } catch (e) {
        throw new Error(`Nie udało się pobrać historii dla ${code}. ${e.message}`);
    }
}
