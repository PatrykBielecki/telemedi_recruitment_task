import React, { useEffect, useMemo, useState } from 'react';
import { getRates, getHistory } from '../api';
import Sparkline from './Sparkline';
import Snackbar from './Snackbar';
import Modal from './Modal';
import Button from './Button';
import Tag from './Tag';
import DatePickerLite from './DatePickerLite';
import { isWeekend, formatPL } from '../utils/date';

const SUPPORTED = ['EUR','USD','CZK','IDR','BRL'];

function fmt(n){ return (typeof n === 'number' ? n.toFixed(4) : '—'); }
function stats(arr){
    if(!arr?.length) return {min:null,max:null,avg:null};
    let min=arr[0], max=arr[0], sum=0;
    for(const v of arr){ if(v<min) min=v; if(v>max) max=v; sum+=v; }
    return {min, max, avg: sum/arr.length};
}
function addDays(iso, delta){
    const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate()+delta);
    return d.toISOString().slice(0,10);
}

export default function ExchangeDashboard() {
    const [date, setDate] = useState(()=> new Date().toISOString().slice(0,10));
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [sel, setSel] = useState(null);     // wybrany kod do historii
    const [hist, setHist] = useState(null);   // payload historii lub null (ładowanie) / [] (brak)
    const [error, setError] = useState(null);
    const [snack, setSnack] = useState(null);

    const fetchRates = async (d) => {
        setLoading(true);
        try {
            const payload = await getRates(d);
            setData(payload);
            if (payload?.effectiveDate && payload?.requestedDate && payload.effectiveDate !== payload.requestedDate) {
                const msg = isWeekend(payload.requestedDate)
                    ? `Kursy NBP nie aktualizują się w weekendy. Wyświetlono notowania z ${formatPL(payload.effectiveDate)}.`
                    : `Brak notowań w wybranym dniu. Wyświetlono notowania z ${formatPL(payload.effectiveDate)}.`;
                setSnack(msg);
            }
        } catch (e) { setError(e.message); }
        finally { setLoading(false); }
    };
    useEffect(()=> { fetchRates(date); }, [date]);

    useEffect(() => {
        if (!sel) return;
        (async () => {
            try {
                const r = await getHistory(sel, date, 14);
                setHist(r);
                if (!r?.items?.length) setSnack(`Brak danych historycznych dla ${sel} przed ${formatPL(date)}.`);
            } catch (e) { setError(e.message); }
        })();
    }, [sel, date]);

    const items = useMemo(()=> (data?.items || []).sort((a,b)=>SUPPORTED.indexOf(a.code)-SUPPORTED.indexOf(b.code)), [data]);
    const effectiveInfo = data?.effectiveDate ? `Pokazano notowania z ${formatPL(data.effectiveDate)}` : null;

    return (
        <div className="container">
            <h1>Kursy walut (kantor)</h1>

            {/* Górny pasek z szybkim wyborem zakresu i informacją o effectiveDate */}
            <div className="toolbar">
                <div className="spacer" />
                {effectiveInfo && <Tag>{effectiveInfo}</Tag>}
                {loading && <span className="subtle">Ładowanie…</span>}
            </div>

            {/* DWIE KOLUMNY: LEWO (kalendarz), PRAWO (tabela) */}
            <div className="layout">
                {/* LEWA: sidebar z kalendarzem i info */}
                <aside className="sidebar">
                    <div className="dpl-panel">
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
                            <strong>Data notowań</strong>
                            <Tag>{date}</Tag>
                        </div>
                        <DatePickerLite value={date} onChange={setDate} />
                        <div style={{display:'flex', gap:8, marginTop:10}}>
                            <Button size="sm" onClick={()=>setDate(new Date().toISOString().slice(0,10))}>Dziś</Button>
                            <Button size="sm" onClick={()=>setDate(addDays(date,-1))}>-1d</Button>
                            <Button size="sm" onClick={()=>setDate(addDays(date,-7))}>-7d</Button>
                        </div>
                    </div>

                    <div className="card">
                        <div className="subtle" style={{fontSize:13, marginBottom:6}}>Info</div>
                        <div className="subtle" style={{fontSize:13}}>
                            Kursy NBP są publikowane w dni robocze (około południa).<br/>
                            W weekendy i święta używamy ostatniego dostępnego notowania.
                        </div>
                    </div>
                </aside>

                {/* PRAWA: tabela z kursami */}
                <div className="card">
                    <table className="table">
                        <thead>
                        <tr>
                            <th>Waluta</th>
                            <th className="t-right">Kurs średni</th>
                            <th className="t-right">Kupno</th>
                            <th className="t-right">Sprzedaż</th>
                            <th className="t-right">Spread</th>
                            <th className="t-center">Akcje</th>
                        </tr>
                        </thead>
                        <tbody>
                        {items.map(row=>(
                            <tr key={row.code}>
                                <td><span className="code">{row.code}</span></td>
                                <td className="t-right">{fmt(row.mid)}</td>
                                <td className="t-right">{row.buy!==null ? fmt(row.buy) : '—'}</td>
                                <td className="t-right">{row.sell!==null ? fmt(row.sell) : '—'}</td>
                                <td className="t-right">
                                    {(row.buy!=null && row.sell!=null)
                                        ? fmt(row.sell - row.buy)                // EUR, USD
                                        : (row.sell!=null ? fmt(row.sell - row.mid) : '—')} {/* pozostałe: marża vs mid */}
                                </td>
                                <td className="t-center">
                                    <Button kind="primary" size="sm" onClick={() => { setHist(null); setSel(row.code); }}>
                                        Historia
                                    </Button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal: otwieramy od razu po wyborze waluty; pokazujemy loading, potem treść */}
            <Modal open={!!sel} onClose={()=>{ setSel(null); setHist(null); }}>
                <header>
                    <h3 style={{margin:0}}>
                        Historia: {sel} <span className="subtle">(14 dni przed {formatPL(date)})</span>
                    </h3>
                    <Button kind="ghost" onClick={()=>{ setSel(null); setHist(null); }}>Zamknij ✕</Button>
                </header>

                {/* Stan ładowania */}
                {!hist && (
                    <div className="card card-ghost">Ładowanie danych historycznych…</div>
                )}

                {/* Gdy są dane */}
                {hist && hist.items && hist.items.length > 0 && (
                    <>
                        {/* KPIs */}
                        <div className="kpis">
                            {(() => {
                                const mids = hist.items.map(x=>x.mid);
                                const sells = hist.items.map(x=>x.sell).filter(v=>v!=null);
                                const buys = hist.items.map(x=>x.buy).filter(v=>v!=null);
                                const mS = stats(mids), sS = stats(sells), bS = stats(buys);
                                return (
                                    <>
                                        <div className="kpi">
                                            <div className="label">ŚREDNI (mid) — min/avg/max</div>
                                            <div className="value">{fmt(mS.min)} / {fmt(mS.avg)} / {fmt(mS.max)}</div>
                                        </div>
                                        <div className="kpi">
                                            <div className="label">SPRZEDAŻ — min/avg/max</div>
                                            <div className="value">{fmt(sS.min)} / {fmt(sS.avg)} / {fmt(sS.max)}</div>
                                        </div>
                                        <div className="kpi">
                                            <div className="label">KUPNO — min/avg/max</div>
                                            <div className="value">{buys.length? `${fmt(bS.min)} / ${fmt(bS.avg)} / ${fmt(bS.max)}`:'—'}</div>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>

                        {/* Wykresy */}
                        {(() => {
                            const items = hist.items || [];
                            const start = items[0]?.date ? formatPL(items[0].date) : '';
                            const end   = items[items.length - 1]?.date ? formatPL(items[items.length - 1].date) : '';

                            const mids  = items.map(x => Number.isFinite(x.mid)  ? x.mid  : null);
                            const sells = items.map(x => Number.isFinite(x.sell) ? x.sell : null);
                            const buys  = items.map(x => Number.isFinite(x.buy)  ? x.buy  : null);

                            const hasMid  = mids.some(Number.isFinite);
                            const hasSell = sells.some(Number.isFinite);
                            const hasBuy  = buys.some(Number.isFinite);

                            return (
                                <div style={{display:'grid', gridTemplateColumns:'1fr', gap:10}}>
                                    {hasMid ? (
                                        <div className="spark-wrap">
                                            <strong>Średni (mid)</strong>
                                            <Sparkline data={mids} width={880} height={64} startLabel={start} endLabel={end} />
                                        </div>
                                    ) : (
                                        <div className="card card-ghost">Brak danych dla „Średni (mid)”.</div>
                                    )}

                                    {hasSell ? (
                                        <div className="spark-wrap">
                                            <strong>Sprzedaż</strong>
                                            <Sparkline data={sells} width={880} height={64} startLabel={start} endLabel={end} />
                                        </div>
                                    ) : (
                                        <div className="card card-ghost">Brak danych dla „Sprzedaż”.</div>
                                    )}

                                    {hasBuy ? (
                                        <div className="spark-wrap">
                                            <strong>Kupno</strong>
                                            <Sparkline data={buys} width={880} height={64} startLabel={start} endLabel={end} />
                                        </div>
                                    ) : null}
                                </div>
                            );
                        })()}

                        {/* Tabela szczegółowa */}
                        <div style={{marginTop:12, overflowX:'auto'}}>
                            <table className="table">
                                <thead>
                                <tr>
                                    <th>Data</th><th className="t-right">Mid</th><th className="t-right">Kupno</th><th className="t-right">Sprzedaż</th>
                                </tr>
                                </thead>
                                <tbody>
                                {hist.items.map(x=>(
                                    <tr key={x.date}>
                                        <td>{formatPL(x.date)}</td>
                                        <td className="t-right">{fmt(x.mid)}</td>
                                        <td className="t-right">{x.buy!==null ? fmt(x.buy) : '—'}</td>
                                        <td className="t-right">{x.sell!==null ? fmt(x.sell) : '—'}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* Gdy brak danych */}
                {hist && (!hist.items || hist.items.length === 0) && (
                    <div className="card card-ghost">
                        Brak danych historycznych dla {sel} przed {formatPL(date)}.
                    </div>
                )}
            </Modal>

            {/* Snacki */}
            {error && <Snackbar message={error} onClose={()=>setError(null)} type="error" />}
            {snack && <Snackbar message={snack} onClose={()=>setSnack(null)} type="info" />}
        </div>
    );
}
