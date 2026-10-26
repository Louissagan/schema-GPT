import './brand.css';
import '@/lib/devtools';
import { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { installDemoServices } from './mock-services';
installDemoServices();
const FoundationLab = lazy(() => new URLSearchParams(window.location.search).get('view') === 'import' ? import('./DocumentStudio') : new URLSearchParams(window.location.search).get('view') === 'blocks' ? import('./FoundationLab') : import('./ReplyReplica'));
createRoot(document.getElementById('root')!).render(<Suspense fallback={<p style={{padding:40,fontFamily:'sans-serif'}}>正在载入基础块检查…</p>}><FoundationLab/></Suspense>);
