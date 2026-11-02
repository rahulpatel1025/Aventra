import React, { useEffect } from 'react';

export default function Spinner() {
    useEffect(() => {
        const timer = setTimeout(() => {
            const el = document.getElementById('spinner');
            if (el) {
                el.classList.remove('show');
            }
            if (typeof window !== 'undefined' && window.$ && window.$('#spinner').length > 0) {
                window.$('#spinner').removeClass('show');
            }
        }, 1);

        return () => clearTimeout(timer);
    }, []);

    return (
        <div id="spinner" className="show bg-white position-fixed translate-middle w-100 vh-100 top-50 start-50 d-flex align-items-center justify-content-center">
            <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
                <span className="sr-only">Loading...</span>
            </div>
        </div>
    );
}
