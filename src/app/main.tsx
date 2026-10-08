import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';

function App() {
  return <h1 className="p-4 text-2xl font-semibold">Table for Little Ones</h1>;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
