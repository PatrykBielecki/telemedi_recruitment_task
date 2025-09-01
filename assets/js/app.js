import React from 'react';
import { createRoot } from 'react-dom/client';
import ExchangeDashboard from './components/ExchangeDashboard';

const container = document.getElementById('root');
createRoot(container).render(<ExchangeDashboard />);
