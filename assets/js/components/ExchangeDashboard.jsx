import React, { useEffect, useMemo, useState } from 'react';
import { getRates, getHistory } from '../api';
import Sparkline from './Sparkline';

const SUPPORTED = ['EUR','USD','CZK','IDR','BRL'];

export default function ExchangeDashboard() {
    const [date, setDate] = useState(()=> new Date().toISOString().slice(0,10));
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [sel, setSel] = useState(null); // wybrany kod do historii
    const [hist, setHist] = useState(null);

    const fetchRates = async (d)=> {
        setLoading(true);
        try { setData(await getRates(d)); }
        finally { setLoading(false); }
    };

    useEffect(()=> { fetchRates(date); }, [date]);

    useEffect(()=> {
        if (!sel) return;
        (async ()=>{
            const r = await getHistory(sel, date, 14);
            setHist(r);
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
        </div>
    );
}
