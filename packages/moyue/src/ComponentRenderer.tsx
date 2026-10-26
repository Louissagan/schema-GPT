import {createPortal} from 'react-dom';
import {readCitationSources} from './citation-data';
import {ImageViewerProvider,useImageViewer,collectViewerImages} from './image-viewer';
import {publicLink,sourceLabel} from './source-components';
import {WidgetRenderer} from './WidgetRenderer';
import {PortableImage,PortableVector,PortableCarousel} from './portable-media';
import {useState} from 'react';
import {SourceCitation} from './Citation';
import {Fragment,createElement,useEffect,useMemo,useRef,type ReactNode} from 'react';
import katex from 'katex';
import type {ComponentNode} from './component-model';
import {PRESENTATION} from './presentation';
import {sanitizeHTML,safeURL} from './html';
import {CodeBlock} from './MarkdownRenderer';
type Resolver=(path:string)=>string|undefined;
const noAsset:Resolver=()=>undefined;
function cleanAttrs(attrs:Record<string,string>){return Object.fromEntries(Object.entries(attrs).filter(([key,value])=>Object.hasOwn(PRESENTATION,key)&&PRESENTATION[key].includes(value)));}
/** Sanitize content only. No component recognition or page CSS is run here. */
function Inline({html='',resolve=noAsset}:{html?:string;resolve?:Resolver}){
 const viewer=useImageViewer();const root=useRef<HTMLSpanElement>(null);const [citationHosts,setCitationHosts]=useState<HTMLElement[]>([]);
 const clean=useMemo(()=>{const template=document.createElement('template');template.innerHTML=sanitizeHTML(html,resolve,false);for(const el of [...template.content.querySelectorAll<HTMLElement>('[data-moyue-group="citation"]')]){if(el.parentElement?.closest('[data-moyue-group="citation"]'))continue;if(el.hasAttribute('data-moyue-source-items')){const slot=document.createElement('span');slot.setAttribute('data-moyue-source-items',el.getAttribute('data-moyue-source-items')||'[]');slot.setAttribute('aria-label',sourceLabel(el));el.replaceWith(slot);continue;}const href=publicLink(el.getAttribute('data-moyue-source-href')||el.querySelector('a[href]')?.getAttribute('href')||'');const a=document.createElement(href?'a':'span');a.className='moyue-citation';if(href){a.setAttribute('href',href);a.setAttribute('target','_blank');a.setAttribute('rel','noopener noreferrer');}a.title=el.getAttribute('data-moyue-source-scope')==='site'?'打开来源站点（原文地址未导出）':href?'打开来源链接':'链接地址未包含在文档中';const img=el.querySelector('img');if(img){const icon=img.cloneNode(true) as HTMLImageElement;icon.className='moyue-source-icon';a.append(icon);}a.append(document.createTextNode(sourceLabel(el)+(href?' ↗':'')));el.replaceWith(a);}for(const el of template.content.querySelectorAll<HTMLElement>('[data-math]'))el.outerHTML=katex.renderToString(el.dataset.math||'',{throwOnError:false,trust:false,displayMode:el.dataset.display==='true'});return template.innerHTML;},[html,resolve]);
 useEffect(()=>{if(!viewer)return;const t=document.createElement('template');t.innerHTML=clean;for(const img of t.content.querySelectorAll('img'))if(img.src&&!img.closest('.moyue-citation,[data-moyue-group=citation]'))viewer.register({src:img.src,alt:img.alt});},[clean,viewer?.register]);
 useEffect(()=>{setCitationHosts([...(root.current?.querySelectorAll<HTMLElement>('[data-moyue-source-items]')||[])]);},[clean]);
 const markup=useMemo(()=><span ref={root} className="moyue-inline" onClick={e=>{if(e.target instanceof HTMLImageElement&&e.target.src&&!e.target.closest('a'))viewer?viewer.open({src:e.target.src,alt:e.target.alt}):window.open(e.target.src,'_blank','noopener,noreferrer');}} dangerouslySetInnerHTML={{__html:clean}}/>,[clean,viewer]);
 return <>{markup}{citationHosts.map((host,i)=>createPortal(<SourceCitation label={host.getAttribute('aria-label')||'参考来源'} sources={readCitationSources(host.getAttribute('data-moyue-source-items'))}/>,host,String(i)))}</>;
}
function Field({node}:{node:ComponentNode}){const [value,setValue]=useState(node.value||''),[checked,setChecked]=useState(node.checked===true);return <label className="moyue-field">{node.fieldType==='checkbox'||node.fieldType==='radio'?<input type={node.fieldType} checked={checked} aria-label={node.value||'勾选项目'} onChange={e=>setChecked(e.target.checked)}/>:node.fieldType==='select'&&node.options?.length?<select value={value} onChange={e=>setValue(e.target.value)} aria-label="字段值">{node.options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>:node.fieldType==='textarea'?<textarea value={value} onChange={e=>setValue(e.target.value)} aria-label="文本域"/>:<input min={node.min} max={node.max} step={node.step} type={node.fieldType==='select'?'text':node.fieldType} value={value} onChange={e=>setValue(e.target.value)} aria-label="字段值"/>}{(node.fieldType==='checkbox'||node.fieldType==='radio')&&node.value&&<span>{node.value}</span>}</label>;}

export function ComponentRenderer({nodes,resolveAsset=noAsset,renderDiagram,dark=false}:{nodes:ComponentNode[];resolveAsset?:Resolver;renderDiagram?:(source:string)=>ReactNode;dark?:boolean}){
 const viewer=useImageViewer();const images=useMemo(()=>collectViewerImages(nodes,resolveAsset),[nodes,resolveAsset]);
 const read=(n:ComponentNode,key:number):ReactNode=>{
  const a=cleanAttrs(n.attrs);const inline=(html?:string)=><Inline html={html} resolve={resolveAsset}/>;const children=()=>renderNodes(n.children||[]);const props={...a,'data-component':n.kind};
  switch(n.kind){
   case 'widget':return n.spec?<WidgetRenderer key={key} spec={n.spec} dark={dark} resolveAsset={resolveAsset}/>:null;
   case 'citation':return <SourceCitation key={key} label={n.label||''} sources={n.sources} href={n.href} scope={n.scope} imageSrc={n.icon} resolveAsset={resolveAsset}/>;
   case 'badge':return <span key={key} {...props} data-moyue-badge="true">{inline(n.html)}</span>;
   case 'field':return <Field key={key} node={n}/>;
   case 'icon':return <span key={key} {...props} className="moyue-icon">{inline(n.html)}</span>;
   case 'text':return <span key={key} {...props}>{inline(n.html)}</span>;
   case 'paragraph':return <p key={key} {...props}>{inline(n.html)}</p>;
   case 'heading':return createElement('h'+(n.level||2),{...props,key,'data-moyue-heading':String(n.level||2)},inline(n.html));
   case 'facts':return <dl key={key} {...props} className="moyue-facts" style={{gridTemplateColumns:`repeat(${n.columns||2},minmax(0,1fr))`}}>{n.entries?.map((entry,i)=><div key={i}><dt>{inline(entry.label)}</dt><dd>{inline(entry.value)}</dd></div>)}</dl>;
   case 'rule':return <hr key={key} {...props}/>;
   case 'code':return <div key={key} {...props}>{n.language==='mermaid'&&renderDiagram?renderDiagram(n.text||''):<CodeBlock><code className={'language-'+(n.language||'text')}>{n.text||''}</code></CodeBlock>}</div>;
   case 'table':{const rows=n.cells||[];const row=(cells:typeof rows[number],i:number)=><tr key={i}>{cells.map((cell,j)=>createElement(cell.header?'th':'td',{key:j,colSpan:cell.colSpan,rowSpan:cell.rowSpan},inline(cell.html)))}</tr>;const header=rows[0]?.every(c=>c.header);return <ImageViewerProvider key={key} dark={dark} scoped><div {...props} className="md-table-wrap"><table>{header&&<thead>{row(rows[0],0)}</thead>}<tbody>{rows.slice(header?1:0).map(row)}</tbody></table></div></ImageViewerProvider>;}
   case 'quote':return <blockquote key={key} {...props}>{children()}</blockquote>;
   case 'list':return <ImageViewerProvider key={key} items={collectViewerImages(n.children||[],resolveAsset)} scoped dark={dark}>{createElement(n.ordered?'ol':'ul',{...props,...(n.ordered?{start:n.start||1}:{})},children())}</ImageViewerProvider>;
   case 'item':return <li key={key} {...props}>{children()}</li>;
   case 'image':return <div key={key} {...props}><PortableImage src={resolveAsset(n.src||'')||safeURL(n.src||'',true)} alt={n.alt} sourceHref={n.sourceLink?.href} sourceLabel={n.sourceLink?.label} caption={n.caption?inline(n.caption):undefined} cover={a['data-moyue-fit']==='cover'}/></div>;
   case 'gallery':return <ImageViewerProvider key={key} items={collectViewerImages(n.children||[],resolveAsset)} dark={dark} scoped>{n.mode==='carousel'?<PortableCarousel>{children()}</PortableCarousel>:<div {...props} data-moyue-group="gallery" data-moyue-columns={String(n.columns||2)} style={{gridTemplateColumns:`repeat(${n.columns||2},minmax(0,1fr))`}}>{children()}</div>}</ImageViewerProvider>;
   case 'layers':return <div key={key} {...props} className="reply-layers" data-moyue-group="layers">{n.rows?.map((r,i)=><div key={i} data-moyue-part="row"><span data-moyue-part="icon">{inline(r.icon)}</span><div data-moyue-part="content"><strong data-moyue-part="title">{inline(r.title)}</strong>{r.children.map(read)}</div></div>)}</div>;
   case 'metrics':return <div key={key} {...props} className="reply-metrics" data-moyue-group="metrics" data-moyue-columns={String(n.metrics?.length||3)}>{n.metrics?.map((m,i)=><div key={i}>{inline(m.icon)}<strong data-moyue-part="metric-value">{m.value}</strong><small>{inline(m.label)}</small></div>)}</div>;
   case 'repositories':case 'files':return <div key={key} {...props} data-moyue-group={n.kind}>{children()}</div>;
   case 'snapshot':return /<svg[\s>]/i.test(n.html||'')?<PortableVector key={key} html={n.html||''} note={n.reason}/>:<div key={key} {...props} className="moyue-snapshot">{inline(n.html)}<small className="moyue-snapshot-note">{n.reason}</small></div>;
   case 'container':return <div key={key} {...props} data-moyue-layout={n.layout||'stack'} data-moyue-gap={String(n.gap||0)} data-moyue-columns={n.columns} data-moyue-card={n.card?'true':undefined}>{children()}</div>;
  }
 };
 function renderNodes(items:ComponentNode[]){let chapters=0;return items.map((node,i)=>{const chapter=node.kind==='heading'&&node.level===2;const divider=chapter&&chapters++>0&&items[i-1]?.kind!=='rule';return divider?<Fragment key={i}><hr data-component="rule" data-section-rule="true"/>{read(node,i)}</Fragment>:read(node,i);});}
 return viewer?<>{renderNodes(nodes)}</>:<ImageViewerProvider items={images} dark={dark} scoped={false}>{renderNodes(nodes)}</ImageViewerProvider>;
}
