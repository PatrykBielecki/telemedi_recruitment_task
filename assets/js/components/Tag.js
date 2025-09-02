import React from 'react';
export default function Tag({children}) {
    return <span className="badge"><span className="dot" />{children}</span>;
}
