import React from 'react';
export default function Button({children, kind='default', size='md', ...props}) {
    const cls = [
        'btn',
        kind==='primary'?'btn-primary':'',
        kind==='ghost'?'btn-ghost':'',
        size==='sm'?'btn-small':'',
    ].join(' ');
    return <button className={cls} {...props}>{children}</button>;
}
