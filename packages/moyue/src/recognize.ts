import {readCitationSources} from './citation-data';
import {readCapturedField} from './control-data';
import {validateWidget} from './widget-model';
import {repairLayout} from './repair-layout';
import {normalizeSourceComponents,publicLink,sourceLabel} from './source-components';
import type {ComponentNode} from './component-model';
import {sanitizeHTML} from './html';
import {PRESENTATION} from './presentation';
import type {MoyueDocument} from './document';
const attrs=(el:Element)=>Object.fromEntries([...el.attributes].filter(a=>Object.hasOwn(PRESENTATION,a.name)&&PRESENTATION[a.name].includes(a.value)).map(a=>[a.name,a.value]));
const blank=(el:Element)=>!el.textContent?.trim()&&!el.querySelector('img,svg,[data-math],[data-moyue-check]')&&!el.matches('img,svg,hr,[data-moyue-check],[data-moyue-field],[role=slider],[role=separator],[data-moyue-separator],[data-moyue-widget]');
const media=(el:Element)=>el.matches('svg')||el.matches('img')||el.matches('[role=application]')||el.matches('[data-moyue-snapshot]');
/** Recognition happens at the export/migration boundary, never during semantic rendering. */
export function recognizeHTML(content:string):ComponentNode[]{
 const template=document.createElement('template');template.innerHTML=sanitizeHTML(content,p=>p.startsWith('assets/')?'https://moyue.invalid/'+p:undefined).replaceAll('https://moyue.invalid/assets/','assets/');
 let count=0;
 function children(el:ParentNode,depth:number):ComponentNode[]{const result:ComponentNode[]=[];for(const child of [...el.childNodes]){if(child.nodeType===3){if(child.textContent?.trim())result.push({kind:'text',html:escapeText(child.textContent),attrs:{}});}else if(child.nodeType===1)result.push(...read(child as Element,depth+1));}return result;}
 function read(el:Element,depth:number):ComponentNode[]{
  if(++count>12000||depth>32)throw new Error('组件数量或嵌套层级超出限制');if(blank(el))return [];
  const base={attrs:attrs(el)};const html=el.innerHTML;const group=el.getAttribute('data-moyue-group');
  if(el.hasAttribute('data-moyue-widget')){try{return [{kind:'widget',attrs:{},spec:validateWidget(JSON.parse(el.getAttribute('data-moyue-widget')||''))}];}catch{el.removeAttribute('data-moyue-widget');return [{kind:'snapshot',attrs:{},html:el.outerHTML,reason:'交互组件声明无效，未执行原网页逻辑'}];}}
  if(el.matches('hr,[role=separator],[data-moyue-separator]'))return [{...base,kind:'rule'}];
  if(el.getAttribute('data-moyue-group')==='citation')return [{kind:'citation',attrs:{},sources:readCitationSources(el.getAttribute('data-moyue-source-items')),label:sourceLabel(el),icon:el.querySelector('img')?.getAttribute('src')||'',href:publicLink(el.getAttribute('data-moyue-source-href')||''),scope:(el.getAttribute('data-moyue-source-scope')||'unavailable') as ComponentNode['scope']}];
  if(el.getAttribute('data-moyue-badge')==='true')return [{...base,kind:'badge',html:el.hasAttribute('data-moyue-action-content')?el.outerHTML:html}];
  if(el.hasAttribute('data-moyue-field')||el.hasAttribute('data-moyue-check'))return [{...readCapturedField(el),attrs:base.attrs}];
  if(el.getAttribute('role')==='slider')return [{...base,kind:'field',fieldType:'range',value:el.getAttribute('aria-valuenow')||'',min:Number(el.getAttribute('aria-valuemin')||'0'),max:Number(el.getAttribute('aria-valuemax')||'100')}];
  if(el.matches('svg')){const view=(el.getAttribute('viewBox')||'').trim().split(/[ ,]+/).map(Number);if(view.length===4&&view[2]>0&&view[2]<=48&&view[3]>0&&view[3]<=48)return [{...base,kind:'icon',html:el.outerHTML}];}
  if(media(el)&&!el.matches('img'))return [{...base,kind:'snapshot',html:el.outerHTML,reason:el.matches('svg')?'矢量图缺少可验证的原始数据，保留静态矢量快照':'复杂应用缺少公开数据，保留静态快照'}];
  if(group==='metrics'){
   const items=[...el.children].filter(c=>!blank(c)).map(row=>{const value=row.querySelector('[data-moyue-part=metric-value],strong,h1,h2');const label=[...row.querySelectorAll('small,p')].find(p=>p!==value);return {icon:row.querySelector('svg')?.outerHTML||'',value:value?.textContent||'',label:label?.innerHTML||''};});
   if(items.length&&items.every(i=>i.value.trim()))return [{...base,kind:'metrics',metrics:items}];
  }
  if(group==='layers'){
   const rows=[...el.children].filter(c=>c.getAttribute('data-moyue-part')==='row').map(row=>{const body=row.querySelector('[data-moyue-part=content]')?.cloneNode(true) as Element|undefined;const title=body?.querySelector('[data-moyue-part=title]');const titleHTML=title?.innerHTML||'';title?.remove();return {icon:row.querySelector('svg')?.outerHTML||'',title:titleHTML,children:body?children(body,depth):[]};});
   if(rows.length)return [{...base,kind:'layers',rows}];
  }
  if(group==='repositories'||group==='files')return [{...base,kind:group,children:children(el,depth)}];
  if(group==='gallery'||group==='carousel')return [{...base,kind:'gallery',mode:group==='carousel'?'carousel':'grid',columns:Number(el.getAttribute('data-moyue-columns'))||2,children:children(el,depth)}];
  if(/^H[1-6]$/.test(el.tagName)){const local=!el.hasAttribute('data-moyue-heading')&&!!el.closest('[data-moyue-card]');return [{...base,attrs:local?{...base.attrs,'data-moyue-size':'title'}:base.attrs,kind:'heading',level:local?4:Number(el.getAttribute('data-moyue-heading'))||Number(el.tagName[1]),html}];}
  if(el.matches('pre'))return [{...base,kind:'code',language:el.getAttribute('data-moyue-language')||'text',text:el.querySelector('code')?.textContent||el.textContent||''}];
  if(el.matches('dl')){const parts=[...el.children].flatMap(c=>c.matches('div')?[...c.children]:[c]);if(parts.length>=2&&parts.length<=800&&parts.every((c,i)=>c.tagName===(i%2===0?'DT':'DD')))return [{kind:'facts',attrs:base.attrs,columns:Number(el.getAttribute('data-moyue-columns'))||(parts.length>2?2:1),entries:parts.filter((_,i)=>i%2===0).map((dt,i)=>({label:dt.innerHTML,value:parts[i*2+1].innerHTML}))}];}
  if(el.matches('[role=grid]')&&!el.querySelector('[role=columnheader],[role=rowheader]')){const cells=[...el.querySelectorAll('[role=gridcell],[role=cell]')].filter(c=>c.closest('[role=grid]')===el);if(cells.length>=2&&cells.every(c=>c.querySelectorAll('img').length===1&&!c.querySelector('table,pre,[data-moyue-field]'))){const row=el.querySelector('[role=row]');const width=Number(el.getAttribute('data-moyue-columns'))||Number(el.getAttribute('aria-colcount'))||row?.querySelectorAll('[role=gridcell],[role=cell]').length||cells.length;return [{kind:'gallery',attrs:base.attrs,mode:'grid',columns:Math.max(1,Math.min(4,width)),children:cells.map(c=>{const img=c.querySelector('img')!;const body=c.cloneNode(true) as Element;body.querySelector('img')?.remove();return {kind:'image',attrs:attrs(img),src:img.getAttribute('src')||'',alt:img.getAttribute('alt')||'',...(body.textContent?.trim()?{caption:body.innerHTML}:{})};})}];}}
  if(el.matches('[role=table],[role=grid]')&&!(el.matches('[role=grid]')&&el.querySelector('img')&&!el.querySelector('[role=columnheader],[role=rowheader]'))){const rows=[...el.querySelectorAll('[role=row]')].filter(row=>row.closest('[role=table],[role=grid]')===el);const cells=rows.map(row=>[...row.querySelectorAll('[role=cell],[role=gridcell],[role=columnheader],[role=rowheader]')].filter(c=>c.closest('[role=row]')===row).map(c=>({html:c.innerHTML,header:c.matches('[role=columnheader],[role=rowheader]'),colSpan:Math.max(1,Math.min(1000,Number(c.getAttribute('aria-colspan'))||1)),rowSpan:Math.max(1,Math.min(1000,Number(c.getAttribute('aria-rowspan'))||1))})));if(cells.length&&cells.every(row=>row.length))return [{kind:'table',attrs:base.attrs,cells}];}
  if(el.matches('table'))return [{...base,kind:'table',cells:[...(el as HTMLTableElement).rows].map(row=>[...row.cells].map(cell=>({html:cell.innerHTML,header:cell.tagName==='TH',colSpan:Math.min(cell.colSpan,1000),rowSpan:Math.max(1,Math.min(cell.rowSpan,1000))})))}];
  if(el.matches('img'))return [{...base,kind:'image',src:el.getAttribute('src')||'',alt:el.getAttribute('alt')||''}];
  if(el.matches('figure')&&el.querySelectorAll('img').length===1&&!el.querySelector('table,pre')){const image=el.querySelector('img')!;return [{...base,kind:'image',src:image.getAttribute('src')||'',alt:image.getAttribute('alt')||'',caption:el.querySelector('figcaption')?.innerHTML||''}];}
  if(el.matches('hr'))return [{...base,kind:'rule'}];
  if(el.matches('blockquote'))return [{...base,kind:'quote',children:children(el,depth)}];
  if(el.matches('ul,ol'))return [{...base,kind:'list',ordered:el.matches('ol'),start:Math.max(1,Math.min(100000,Number(el.getAttribute('start'))||1)),children:children(el,depth)}];
  if(el.matches('li'))return [{...base,kind:'item',children:children(el,depth)}];
  if(el.matches('label')&&el.querySelectorAll('[data-moyue-field]').length===1){const control=el.querySelector('[data-moyue-field]')!;const type=control.getAttribute('data-moyue-field') as ComponentNode['fieldType'];if(type==='checkbox'||type==='radio')return [{kind:'field',attrs:{},fieldType:type,checked:control.getAttribute('data-moyue-check')==='true',value:sourceLabel(el)}];}
  if(el.matches('p'))return [{...base,kind:'paragraph',html}];
  if(el.matches('div,section,article,main,header,aside,details')){
   if(!el.hasAttribute('data-moyue-layout')&&!el.hasAttribute('data-moyue-card')&&!el.querySelector('div,section,article,table,pre,figure,ul,ol,blockquote,h1,h2,h3,h4,h5,h6,p,svg,img'))return [{...base,kind:'paragraph',html}];
   const layout=el.getAttribute('data-moyue-layout') as ComponentNode['layout'];const card=el.getAttribute('data-moyue-card')==='true';const parts=children(el,depth);
   // Flatten inert wrappers. Component layout is stored as data, never inferred on import.
   if(!layout&&!card&&!Object.keys(base.attrs).length&&!el.parentElement?.matches('[data-moyue-layout=grid],[data-moyue-layout=row]'))return parts;
   return [{...base,kind:'container',layout:layout||'stack',gap:Number(el.getAttribute('data-moyue-gap'))||0,...(Number(el.getAttribute('data-moyue-columns'))?{columns:Number(el.getAttribute('data-moyue-columns'))}:{}),card,children:parts}];
  }
  // Inline rich text remains sanitized HTML; it cannot select a component or execute page code.
  if(el.matches('a,span,strong,b,em,i,u,del,s,code,label,small,summary,br'))return [{...base,kind:'text',html:el.outerHTML}];
  return [{...base,kind:'snapshot',html:el.outerHTML,reason:'未支持的功能块，保留静态内容'}];
 }
 return repairLayout(normalizeSourceComponents(children(template.content,0)));
}
function escapeText(text:string){const el=document.createElement('span');el.textContent=text;return el.innerHTML;}
/** Explicit, one-time legacy conversion; never changes the caller's object. */
export function migrateToComponents(doc:MoyueDocument):MoyueDocument{
 if(!doc.blocks.some(b=>b.type==='html')&&doc.source?.componentRevision===7)return doc;
 return {...doc,version:2,source:{...doc.source,presentation:'moyue-components-v2',componentRevision:7},blocks:doc.blocks.map(b=>b.type==='html'?{type:'components' as const,nodes:recognizeHTML(b.content)}:b.type==='components'?{...b,nodes:repairLayout(normalizeSourceComponents(b.nodes))}:b)};
}
