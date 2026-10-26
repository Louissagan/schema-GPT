import type {ComponentNode} from './component-model';
/** Only a public URL actually present in the DOM can be a page target. */
export function publicLink(value:string){try{const url=new URL(value);return /^https?:$/.test(url.protocol)&&!url.username&&!url.password?url.href:'';}catch{return '';}}
export function faviconSite(src:string){try{const image=new URL(src);if(!/favicon/i.test(image.pathname))return '';const domain=image.searchParams.get('domain')||image.searchParams.get('domain_url');return domain?new URL(publicLink(domain.includes('://')?domain:'https://'+domain)).origin+'/':'';}catch{return '';}}
export function sourceLabel(el:Element){const clone=el.cloneNode(true) as Element;clone.querySelectorAll('[aria-hidden=true],svg,img').forEach(n=>n.remove());return clone.textContent?.trim()||'';}
function text(html=''){const template=document.createElement('template');template.innerHTML=html;return template.content.textContent?.trim()||'';}
function all(nodes:ComponentNode[]):ComponentNode[]{return nodes.flatMap(n=>[n,...all(n.children||[])]);}
function origin(url:string){try{return new URL(url).origin;}catch{return '';}}
/** One-time structural migration for v2.0 exports, not a reply-title lookup. */
export function normalizeSourceComponents(nodes:ComponentNode[]):ComponentNode[]{
 function visit(node:ComponentNode,parent?:ComponentNode,contextLinks:string[]=[]):ComponentNode{
  let links=[...contextLinks];
  // Scope real anchor targets to this card/list row, never to an unrelated answer paragraph.
  if(node.kind==='container'||node.kind==='repositories'){
   const children=node.children||[];const scoped=children.filter(n=>n.kind==='heading'||n.attrs['data-moyue-part']==='title'||(n.kind==='paragraph'&&text(n.html).length<160&&/data-moyue-weight=|<strong|<b[ >]/.test(n.html||'')));
   links=scoped.flatMap(n=>{const el=document.createElement('template');el.innerHTML=n.html||'';return [...el.content.querySelectorAll('a[href]')].map(a=>publicLink(a.getAttribute('href')||'')).filter(Boolean);});
   if(!links.length)links=contextLinks;
  }
  if(node.kind==='citation'&&node.scope==='site'&&node.href){const page=links.find(url=>origin(url)===origin(node.href||''));if(page)return {...node,href:page,scope:'page'};}
  if(node.kind==='container'&&node.layout==='row'){
   const flat=all(node.children||[]);const images=flat.filter(n=>n.kind==='image');const label=flat.filter(n=>n.kind==='text'||n.kind==='paragraph').map(n=>text(n.html)).join(' ').trim();
   if(images.length===1&&label.length>0&&label.length<=80&&(faviconSite(images[0].src||'')||(node.attrs['data-moyue-size']==='caption'&&images[0].attrs['data-moyue-size']==='caption'&&!images[0].attrs['data-moyue-fit']))){
    const site=faviconSite(images[0].src||'');const page=site&&links.find(url=>origin(url)===origin(site));
    return {kind:'citation',attrs:{},label,icon:images[0].src||'',...(page?{href:page,scope:'page' as const}:site?{href:site,scope:'site' as const}:{scope:'unavailable' as const})};
   }
  }
  if(node.kind==='paragraph'&&parent?.kind==='container'&&node.attrs['data-moyue-size']==='caption'&&['success','warning','info'].includes(node.attrs['data-moyue-tone'])&&text(node.html).length<=80)return {kind:'badge',attrs:node.attrs,html:node.html||''};
  return {...node,...(node.children?{children:node.children.map(n=>visit(n,node,links))}:{}),...(node.rows?{rows:node.rows.map(row=>({...row,children:row.children.map(n=>visit(n,undefined,links))}))}:{})};
 }
 return nodes.map(n=>visit(n));
}
