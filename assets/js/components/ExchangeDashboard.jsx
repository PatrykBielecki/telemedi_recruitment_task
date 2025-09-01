import React, { useEffect, useMemo, useState } from 'react';
import { getRates, getHistory } from '../api';
import Sparkline from './Sparkline';
import Snackbar from './Snackbar';
import { isWeekend, formatPL } from '../utils/date';

const SUPPORTED = ['EUR','USD','CZK','IDR','BRL'];

export default function ExchangeDashboard() {
    const [date, setDate] = useState(()=> new Date().toISOString().slice(0,10));
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [sel, setSel] = useState(null); // wybrany kod do historii
    const [hist, setHist] = useState(null);
    const [error, setError] = useState(null);
    const [snack, setSnack] = useState(null);

    const fetchRates = async (d) => {
        setLoading(true);
        try {
            const payload = await getRates(d);
            setData(payload);

            // Weekend/święto fallback – jeśli effectiveDate != requestedDate
            if (payload?.effectiveDate && payload?.requestedDate && payload.effectiveDate !== payload.requestedDate) {
                const weekendMsg = isWeekend(payload.requestedDate)
                    ? `Kursy NBP nie aktualizują się w weekendy. Wyświetlono notowania z ${formatPL(payload.effectiveDate)}.`
                    : `Brak notowań w wybranym dniu. Wyświetlono notowania z ${formatPL(payload.effectiveDate)}.`;
                setSnack(weekendMsg);
            }
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(()=> { fetchRates(date); }, [date]);

    useEffect(() => {
        if (!sel) return;
        (async () => {
            try {
                const r = await getHistory(sel, date, 14);
                setHist(r);
                if (!r?.items?.length) {
                    setSnack(`Brak danych historycznych dla ${sel} przed ${formatPL(date)}.`);
                }
            } catch (e) {
                setError(e.message);
            }
        })();
    }, [sel, date]);

    const items = useMemo(()=> (data?.items || []).sort((a,b)=>SUPPORTED.indexOf(a.code)-SUPPORTED.indexOf(b.code)), [data]);

    return (
        <div className="container" style={{maxWidth:960, margin:'2rem auto', fontFamily:'system-ui, sans-serif'}}>
            <h1>Kursy walut (kantor)</h1>
            <div style={{display:'flex', gap:'1rem', alignItems:'center', marginBottom:'1rem'}}>
                <label>Data:&nbsp;
                    <input type="date" value={date} onChange={e=>setDate(e.target.value)} />
                </label>
                {loading && <span>Ładowanie…</span>}
            </div>

            <table style={{width:'100%', borderCollapse:'collapse'}}>
                <thead>
                <tr>
                    <th style={{textAlign:'left'}}>Waluta</th>
                    <th style={{textAlign:'right'}}>Kurs średni</th>
                    <th style={{textAlign:'right'}}>Kupno</th>
                    <th style={{textAlign:'right'}}>Sprzedaż</th>
                    <th style={{textAlign:'center'}}>Historia (14 dni)</th>
                </tr>
                </thead>
                <tbody>
                {items.map(row=>(
                    <tr key={row.code} style={{borderTop:'1px solid #ddd'}}>
                        <td>{row.code}</td>
                        <td style={{textAlign:'right'}}>{row.mid.toFixed(4)}</td>
                        <td style={{textAlign:'right'}}>{row.buy!==null ? row.buy.toFixed(4) : '—'}</td>
                        <td style={{textAlign:'right'}}>{row.sell!==null ? row.sell.toFixed(4) : '—'}</td>
                        <td style={{textAlign:'center'}}>
                            <button onClick={()=>setSel(row.code)}>Pokaż</button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            {sel && hist && (
                <div style={{marginTop:'2rem', padding:'1rem', border:'1px solid #ddd', borderRadius:8}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
                        <h2>Historia: {sel} (ostatnie 14 dni przed {date})</h2>
                        <button onClick={()=>{ setSel(null); setHist(null); }}>Zamknij</button>
                    </div>
                    <div style={{display:'grid', gridTemplateColumns:'1fr', gap:'1rem'}}>
                        <div>
                            <strong>Średni (mid)</strong>
                            <Sparkline data={hist.items.map(x=>x.mid)} />
                        </div>
                        <div>
                            <strong>Sprzedaż</strong>
                            <Sparkline data={hist.items.map(x=>x.sell)} />
                        </div>
                        {hist.items[0]?.buy !== null && (
                            <div>
                                <strong>Kupno</strong>
                                <Sparkline data={hist.items.map(x=>x.buy)} />
                            </div>
                        )}
                    </div>
                    <div style={{marginTop:'1rem', overflowX:'auto'}}>
                        <table>
                            <thead><tr><th>Data</th><th>Mid</th><th>Kupno</th><th>Sprzedaż</th></tr></thead>
                            <tbody>
                            {hist.items.map(x=>(
                                <tr key={x.date}>
                                    <td>{x.date}</td>
                                    <td>{x.mid.toFixed(4)}</td>
                                    <td>{x.buy!==null ? x.buy.toFixed(4) : '—'}</td>
                                    <td>{x.sell!==null ? x.sell.toFixed(4) : '—'}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            {error && <Snackbar message={error} onClose={() => setError(null)} type="error" />}
            {snack && <Snackbar message={snack} onClose={() => setSnack(null)} type="info" />}
        </div>
    );
}
