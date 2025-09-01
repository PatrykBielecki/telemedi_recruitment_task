import React from 'react';

export default function Sparkline({ data=[], width=180, height=48, pad=4 }) {
    if (!data.length) return <svg width={width} height={height} />;
    const xs = data.map((d,i)=>i);
    const ys = data.map(d=>d);
    const min = Math.min(...ys), max = Math.max(...ys);
    const scaleX = (i)=> pad + (i * (width-2*pad) / (xs.length-1||1));
    const scaleY = (v)=> {
        if (max===min) return height/2;
        return height - pad - ((v-min) * (height-2*pad) / (max-min));
    };
    const d = xs.map((x,i)=>`${i?'L':'M'}${scaleX(i)},${scaleY(ys[i])}`).join(' ');
    return (
        <svg width={width} height={height}>
            <polyline fill="none" stroke="currentColor" strokeWidth="2" points={xs.map((_,i)=>`${scaleX(i)},${scaleY(ys[i])}`).join(' ')} />
        </svg>
    );
}
