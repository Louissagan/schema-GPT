import { Children, isValidElement, useEffect, useRef, useState, type ReactNode } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import hljs from 'highlight.js/lib/common';
import { Check, Copy, X } from 'lucide-react';
import 'katex/dist/katex.min.css';
import './markdown.css';
import { normalizeMathDelimiters } from './normalize-math';

export async function copyText(value: string) {
  if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(value);
  const input = document.createElement('textarea');
  input.value = value; input.style.position = 'fixed'; input.style.opacity = '0'; document.body.append(input);
  input.select(); const success = document.execCommand('copy'); input.remove();
  if (!success) throw new Error('无法复制，请手动选择文本。');
}

function CodeBlock({ children }: { children?: ReactNode }) {
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
  return <div className="md-code"><div className="md-code-bar"><span>{language}</span><button onClick={async () => { try { await copyText(code); setStatus('已复制'); } catch { setStatus('复制失败'); } }}>{status === '已复制' ? <Check size={14}/> : <Copy size={14}/>}<span aria-live="polite">{status}</span></button></div><pre><code ref={element}>{code}</code></pre></div>;
}

function MarkdownImage({ src, alt, title }: { src?: string; alt?: string; title?: string }) {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { setFailed(false); }, [src]);
  useEffect(() => { if (open) dialog.current?.showModal(); else dialog.current?.close(); }, [open]);
  return <span className="md-image">{failed ? <span className="md-image-error">图片未能加载：{alt || '未命名图片'}</span> : <button className="md-image-button" onClick={() => setOpen(true)} aria-label={`放大图片：${alt || ''}`}><img src={src} alt={alt || ''} title={title} loading="lazy" onError={() => setFailed(true)}/><span className="md-image-hint">点击查看大图 ↗</span></button>}{alt && <span className="md-caption">{alt}</span>}<dialog ref={dialog} className="md-lightbox" onCancel={() => setOpen(false)} onClose={() => setOpen(false)} onClick={event => { if (event.target === event.currentTarget) setOpen(false); }}><button className="md-lightbox-close" aria-label="关闭大图" onClick={() => setOpen(false)}><X/></button><img src={open ? src : undefined} alt={alt || ''}/>{alt && <span>{alt}</span>}</dialog></span>;
}

const components: Components = {
  pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
  table: ({ children }) => <div className="md-table-wrap" role="region" aria-label="表格，可横向滚动" tabIndex={0}><table>{children}</table></div>,
  img: ({ src, alt, title }) => <MarkdownImage src={src} alt={alt} title={title}/>,
  a: ({ children, href }) => <a href={href} target={href?.startsWith('#') ? undefined : '_blank'} rel="noopener noreferrer">{children}</a>,
};

/** Drop-in renderer: import this component and pass a Markdown string. Raw HTML is disabled. */
export function MarkdownRenderer({ content, className = '' }: { content: string; className?: string }) {
  return <article className={`markdown-body ${className}`}><ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={components}>{normalizeMathDelimiters(content)}</ReactMarkdown></article>;
}
