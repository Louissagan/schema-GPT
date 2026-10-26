import {PortableImage} from './portable-media';
import { Children, isValidElement, useEffect, useRef, useState, type ReactNode } from 'react';
import ReactMarkdown, { defaultUrlTransform, type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import hljs from 'highlight.js/lib/common';
import { Check, Copy } from 'lucide-react';
import 'katex/dist/katex.min.css';
import './markdown.css';
import { normalizeMathDelimiters } from './normalize-math';

export async function copyText(value: string) {
  if (navigator.clipboard && window.isSecureContext) {try{await navigator.clipboard.writeText(value);return;}catch{/* Fall back to the selected document's copy command. */}}
  const input = document.createElement('textarea');
  input.value = value; input.style.position = 'fixed'; input.style.opacity = '0'; document.body.append(input);
  try {input.select(); if (!document.execCommand('copy')) throw new Error('无法复制，请手动选择文本。');} finally {input.remove();}
}

export function CodeBlock({ children }: { children?: ReactNode }) {
  const child = Children.toArray(children).find(isValidElement);
  const props = child?.props as { className?: string; children?: ReactNode } | undefined;
  const language = props?.className?.match(/language-([\w+-]+)/)?.[1] || 'text';
  const code = String(props?.children ?? '').replace(/\n$/, '');
  const element = useRef<HTMLElement>(null);
  const [status, setStatus] = useState('复制代码');
  useEffect(() => {
    if (!element.current) return;
    element.current.textContent = code;
    delete element.current.dataset.highlighted;
    element.current.className = hljs.getLanguage(language) ? `language-${language}` : 'language-plaintext';
    hljs.highlightElement(element.current);
  }, [code, language]);
  useEffect(() => { if (status === '复制代码') return; const id = setTimeout(() => setStatus('复制代码'), 2000); return () => clearTimeout(id); }, [status]);
  return <div className="md-code"><div className="md-code-bar"><span>{language}</span><button onClick={async () => { try { await copyText(code); setStatus('已复制'); } catch { setStatus('复制失败'); } }}>{status === '已复制' ? <Check size={14}/> : <Copy size={14}/>}<span aria-live="polite">{status}</span></button></div><pre><code ref={element} className={'language-'+language}>{code}</code></pre></div>;
}

function MarkdownImage({src,alt,title}:{src?:string;alt?:string;title?:string}){return <PortableImage src={src||''} alt={alt} caption={alt||title} inline/>;}

const components: Components = {
  pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
  table: ({ children }) => <div className="md-table-wrap" role="region" aria-label="表格，可横向滚动" tabIndex={0}><table>{children}</table></div>,
  img: ({ src, alt, title }) => <MarkdownImage src={src} alt={alt} title={title}/>,
  a: ({ children, href }) => <a href={href} target={href?.startsWith('#') ? undefined : '_blank'} rel="noopener noreferrer">{children}</a>,
};

/** Drop-in renderer: import this component and pass a Markdown string. Raw HTML is disabled. */
export function MarkdownRenderer({ content, className = '', resolveAsset }: { content: string; className?: string; resolveAsset?: (path:string)=>string|undefined }) {
  return <article className={`markdown-body ${className}`}><ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={components} urlTransform={(url,key)=>resolveAsset?.(url)||(key==='src' && /^data:image\/(png|jpeg|webp|gif|avif);base64,[A-Za-z0-9+/=]+$/.test(url)?url:defaultUrlTransform(url))}>{normalizeMathDelimiters(content)}</ReactMarkdown></article>;
}
