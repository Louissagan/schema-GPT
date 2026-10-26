import {ImageViewerProvider,collectViewerImages,type ViewerImage} from './image-viewer';
import {PortableImage} from './portable-media';
import {NativeDiagram,NativeChart} from './widgets';
import {ComponentRenderer} from './ComponentRenderer';
import { memo, useEffect, useId, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import katex from 'katex';
import { MarkdownRenderer, CodeBlock } from './MarkdownRenderer';
import { sanitizeHTML, safeURL, hasReplyHeading } from './html';
import { validateDocument, type MoyueBlock, type MoyueDocument } from './document';
import './style.css';
import './reading.css';

type Resolver = (path:string)=>string|undefined;
export type RendererProps = { document: MoyueDocument; theme?: 'light'|'dark'; resolveAsset?: Resolver; renderCustom?: (block:Extract<MoyueBlock,{type:'custom'}>)=>ReactNode };
const HTMLSurface=memo(function HTMLSurface({html,element}:{html:string;element:RefObject<HTMLDivElement|null>}){
 return <div className="markdown-body moyue-html" ref={element} dangerouslySetInnerHTML={{__html:html}}/>;
});
function HTMLBlock({content,resolve,dark}:{content:string;resolve:Resolver;dark:boolean}) {
 const element=useRef<HTMLDivElement>(null);
 const parsed=useMemo(()=>{
  const template=document.createElement('template');template.innerHTML=sanitizeHTML(content,resolve);
  const widgets:[string,string][]=[];
  for(const pre of template.content.querySelectorAll('pre')){
   const code=pre.querySelector('code');if(!code)continue;
   const language=pre.getAttribute('data-moyue-language')||'text';widgets.push([language,code.textContent||'']);
   const host=document.createElement('div');host.setAttribute('data-moyue-widget-index',String(widgets.length-1));pre.replaceWith(host);
  }
  return {html:template.innerHTML,widgets};
 },[content,resolve]);
 const [hosts,setHosts]=useState<Element[]>([]);
 useEffect(()=>{
  element.current?.querySelectorAll<HTMLElement>('[data-math]').forEach(el=>katex.render(el.dataset.math||'',el,{throwOnError:false,trust:false,displayMode:el.dataset.display==='true'}));
  setHosts([...(element.current?.querySelectorAll('[data-moyue-widget-index]')||[])]);
 },[parsed]);
 return <><HTMLSurface html={parsed.html} element={element}/>{hosts.map((host,i)=>{
  const widget=parsed.widgets[i];if(!widget||!host.isConnected)return null;const [language,code]=widget;
  return createPortal(language==='mermaid'?<Diagram source={code} dark={dark}/>:<CodeBlock><code className={'language-'+language}>{code}</code></CodeBlock>,host,String(i));
 })}</>;
}
function Diagram({source,dark}:{source:string;dark:boolean}){return <NativeDiagram source={source} dark={dark}/>;}
function Chart({block,dark}:{block:Extract<MoyueBlock,{type:'chart'}>;dark:boolean}){const [table,setTable]=useState(false);return <div className="moyue-chart"><button type="button" onClick={()=>setTable(!table)}>{table?'查看图表':'查看数据表'}</button>{table?<table><thead><tr><th>项目</th>{block.series.map((s,i)=><th key={i}>{s.name}</th>)}</tr></thead><tbody>{block.labels.map((label,i)=><tr key={i}><td>{label}</td>{block.series.map((s,j)=><td key={j}>{s.values[i]}</td>)}</tr>)}</tbody></table>:<NativeChart spec={{...block,type:'chart'}} dark={dark}/>}</div>;}
const noAsset:Resolver=()=>undefined;
export function DocumentRenderer({document:input,theme='light',resolveAsset=noAsset,renderCustom}:RendererProps) {
  const doc=useMemo(()=>validateDocument(input),[input]);
  const images=useMemo(()=>doc.blocks.flatMap((b):ViewerImage[]=>b.type==='components'?collectViewerImages(b.nodes,resolveAsset):b.type==='image'?[{src:resolveAsset(b.src)||safeURL(b.src,true),alt:b.alt}]:b.type==='gallery'?b.images.map(i=>({src:resolveAsset(i.src)||safeURL(i.src,true),alt:i.alt})):[]),[doc,resolveAsset]);
  const url=(src:string)=>resolveAsset(src)||safeURL(src,true);
  return <ImageViewerProvider items={images} dark={theme==='dark'} scoped={false}><article className={`moyue-document ${theme==='dark'?'dark':''}`} data-theme={theme}>
    {!hasReplyHeading(doc.blocks)&&<h1>{doc.title}</h1>}
    {doc.blocks.map((b,i)=>{
      switch(b.type){
        case 'components':return <div key={i} className="markdown-body moyue-html"><ComponentRenderer dark={theme==='dark'} nodes={b.nodes} resolveAsset={resolveAsset} renderDiagram={source=><Diagram source={source} dark={theme==='dark'}/>}/></div>;
        case 'markdown':return <MarkdownRenderer key={i} content={b.content} resolveAsset={resolveAsset}/>;
        case 'html':return <HTMLBlock key={i} content={b.content} resolve={resolveAsset} dark={theme==='dark'}/>;
        case 'image':return <PortableImage key={i} src={url(b.src)} alt={b.alt} caption={b.alt}/>;
        case 'gallery':return <ImageViewerProvider key={i} scoped dark={theme==='dark'} items={b.images.map(img=>({src:url(img.src),alt:img.alt}))}><div className="moyue-gallery">{b.images.map((img,j)=><PortableImage key={j} src={url(img.src)} alt={img.alt} caption={img.alt}/>)}</div></ImageViewerProvider>;
        case 'chart':return <Chart key={i} block={b} dark={theme==='dark'}/>;
        case 'mermaid':return <Diagram key={i} source={b.content} dark={theme==='dark'}/>;
        case 'file':return <p className="moyue-file" key={i}><a href={resolveAsset(b.src)||safeURL(b.src)||undefined} download={b.name}>↓ {b.name}</a></p>;
        case 'custom':return <div key={i}>{renderCustom?.(b)??<MarkdownRenderer content={b.fallback}/>}</div>;
      }
    })}
  </article></ImageViewerProvider>;
}
