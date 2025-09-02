import React, { useEffect, useMemo, useState } from 'react';

const MONTHS_PL = ['styczeń','luty','marzec','kwiecień','maj','czerwiec','lipiec','sierpień','wrzesień','październik','listopad','grudzień'];
const WDAYS_PL = ['Pn','Wt','Śr','Cz','Pt','So','Nd'];
function pad(n){ return String(n).padStart(2,'0'); }
function toISO(y,m,d){ return `${y}-${pad(m+1)}-${pad(d)}`; } // m: 0..11
function mon0(d){ return (d.getDay() + 6) % 7; } // Mon=0..Sun=6

export default function DatePickerLite({ value, onChange, maxToday = true }) {
    const [y, m, d] = (value || new Date().toISOString().slice(0,10)).split('-').map(Number);
    const [vy, setVy] = useState(y);
    const [vm, setVm] = useState(m-1);
    const todayISO = new Date().toISOString().slice(0,10);

    useEffect(()=>{ setVy(y); setVm(m-1); }, [value]); // gdy z zewnątrz zmieni się data

    const cells = useMemo(() => {
        const first = new Date(vy, vm, 1);
        const start = mon0(first);
        const daysInMonth = new Date(vy, vm+1, 0).getDate();
        const daysPrev = new Date(vy, vm, 0).getDate();
        const arr = [];
        for (let i=0;i<42;i++){
            let day, cm=vm, cy=vy, inCurr = true;
            if (i < start) { inCurr=false; cm=vm-1; if(cm<0){cm=11; cy=vy-1;} day = daysPrev - (start-1-i); }
            else if (i >= start + daysInMonth) { inCurr=false; cm=vm+1; if(cm>11){cm=0; cy=vy+1;} day = i-(start+daysInMonth)+1; }
            else { day = i-start+1; }
            const iso = toISO(cy, cm, day);
            const weekend = mon0(new Date(cy, cm, day)) >= 5;
            arr.push({ iso, day, inCurr, weekend });
        }
        return arr;
    }, [vy, vm]);

    const select = (iso) => {
        if (maxToday && iso > todayISO) return;
        onChange?.(iso);
    };
    const prevMonth = () => setVm(v => (v===0 ? (setVy(y=>y-1), 11) : v-1));
    const nextMonth = () => setVm(v => (v===11 ? (setVy(y=>y+1), 0) : v+1));

    const selectedISO = value;

    return (
        <div className="dpl-panel">
            <div className="dpl-header">
                <button type="button" className="dpl-navbtn" onClick={prevMonth}>‹</button>
                <div className="dpl-month">{MONTHS_PL[vm]} {vy}</div>
                <button
                    type="button"
                    className="dpl-navbtn"
                    onClick={nextMonth}
                    disabled={maxToday && toISO(vy, vm+1, 1) > todayISO}
                >›</button>
            </div>

            <div className="dpl-wdays">
                {WDAYS_PL.map(w => <div key={w}>{w}</div>)}
            </div>

            <div className="dpl-grid">
                {cells.map(c => {
                    const disabled = maxToday && c.iso > todayISO;
                    const cls = [
                        'dpl-cell',
                        c.inCurr ? '' : 'muted',
                        c.weekend ? 'weekend' : '',
                        disabled ? 'disabled' : '',
                        selectedISO === c.iso ? 'selected' : ''
                    ].join(' ').trim();
                    return (
                        <div
                            key={c.iso}
                            className={cls}
                            onClick={() => !disabled && select(c.iso)}
                            title={c.iso}
                        >
                            {c.day}
                        </div>
                    );
                })}
            </div>

            <div className="dpl-footer">
                <button type="button" className="dpl-today" onClick={()=>select(todayISO)}>Dziś</button>
            </div>
        </div>
    );
}
