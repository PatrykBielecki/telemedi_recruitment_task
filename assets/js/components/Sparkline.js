import React from 'react';

export default function Sparkline({
                                      data = [],
                                      width = 180,
                                      height = 48,
                                      pad = 4,
                                      startLabel,
                                      endLabel
                                  }) {
    const nums = data.filter(v => Number.isFinite(v));
    const hasAny = nums.length > 0;

    if (!data.length || !hasAny) {
        // pusty stan: sam obrys + etykiety (jeśli podano)
        return (
            <div>
                <svg width={width} height={height}>
                    <rect x="0" y="0" width={width} height={height} fill="none" stroke="currentColor" opacity="0.15"/>
                </svg>
                {(startLabel || endLabel) && (
                    <div className="spark-meta">
                        <span>{startLabel || ''}</span>
                        <span>{endLabel || ''}</span>
                    </div>
                )}
            </div>
        );
    }

    const min = Math.min(...nums);
    const max = Math.max(...nums);
    const scaleX = (i) => pad + (i * (width - 2 * pad) / (data.length - 1 || 1));
    const scaleY = (v) => {
        if (max === min) return height / 2;
        return height - pad - ((v - min) * (height - 2 * pad) / (max - min));
    };

    let d = '';
    let drawing = false;
    for (let i = 0; i < data.length; i++) {
        const v = data[i];
        if (Number.isFinite(v)) {
            const x = scaleX(i), y = scaleY(v);
            d += (drawing ? ` L ${x},${y}` : `M ${x},${y}`);
            drawing = true;
        } else {
            drawing = false;
        }
    }

    return (
        <div>
            <svg width={width} height={height}>
                <path d={d} fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
            {(startLabel || endLabel) && (
                <div className="spark-meta">
                    <span>{startLabel || ''}</span>
                    <span>{endLabel || ''}</span>
                </div>
            )}
        </div>
    );
}
