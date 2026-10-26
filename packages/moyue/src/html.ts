import DOMPurify from 'dompurify';
import {PRESENTATION_ATTRIBUTES, normalizePresentation} from './presentation';
export function safeURL(url:string,image=false){
 if(/^https?:\/\//i.test(url))return url;
 if(!image&&/^(mailto:|#)/i.test(url))return url;
 if(image&&/^data:image\/(png|jpeg|webp|gif|avif);base64,[A-Za-z0-9+/=]+$/.test(url))return url;
 return '';
}
let svgSerial=0;
/** Keep a validated layout vocabulary, never arbitrary page CSS or scripts. */
export function sanitizeHTML(html:string,resolve:(path:string)=>string|undefined=()=>undefined,normalize=true){
 const payload=document.createElement('template');payload.innerHTML=html;payload.content.querySelectorAll('[data-moyue-widget]').forEach(el=>{const value=el.getAttribute('data-moyue-widget')||'';el.setAttribute('data-moyue-widget',value.replace(/[<>&]/g,c=>c==='<'?'\\u003c':c==='>'?'\\u003e':'\\u0026'));});
 const clean=DOMPurify.sanitize(payload.innerHTML,{USE_PROFILES:{html:true,svg:true,svgFilters:false},FORBID_TAGS:['style','script','iframe','object','embed','form','input','button','textarea','select','foreignObject','use','image','animate','animateMotion','animateTransform','set','video','audio'],FORBID_ATTR:['style','srcset','class'],ADD_ATTR:['data-math','data-display',...PRESENTATION_ATTRIBUTES],ALLOW_DATA_ATTR:false});
 const template=document.createElement('template');template.innerHTML=clean;
 // Namespaced SVG IDs preserve local gradients / clip paths without DOM-clobbering IDs.
 template.content.querySelectorAll('[id]').forEach(el=>{if(!el.closest('svg'))el.removeAttribute('id');});
 template.content.querySelectorAll('svg').forEach(svg=>{
  const prefix='moyue-svg-'+(++svgSerial)+'-';const ids=new Map<string,string>();
  for(const el of [svg,...svg.querySelectorAll('[id]')])if(el.id){const next=prefix+ids.size;ids.set(el.id,next);el.id=next;}
  for(const el of [svg,...svg.querySelectorAll('*')])for(const attr of [...el.attributes]){
   if(/url\(/i.test(attr.value)){const match=attr.value.match(/^url\(["']?#([^)'"\s]+)["']?\)$/);const id=match&&ids.get(match[1]);if(id)el.setAttribute(attr.name,`url(#${id})`);else el.removeAttribute(attr.name);}
   if((attr.name==='href'||attr.name==='xlink:href')&&el.tagName.toLowerCase()!=='a'){const id=attr.value.startsWith('#')&&ids.get(attr.value.slice(1));if(id)el.setAttribute(attr.name,'#'+id);else el.removeAttribute(attr.name);}
  }
 });
 template.content.querySelectorAll('[role=button]').forEach(el=>{if(!el.textContent?.trim()&&!el.querySelector('svg,img,[data-math]'))el.remove();});
 template.content.querySelectorAll('a').forEach(a=>{
  // A link gets one canonical dotted decoration, including captured underline wrappers.
  const strip=(el:Element)=>{const value=el.getAttribute('data-moyue-decoration')||'';if(value.includes('underline')){if(value.includes('line-through'))el.setAttribute('data-moyue-decoration','line-through');else el.removeAttribute('data-moyue-decoration');}if(el.tagName==='U')el.replaceWith(...el.childNodes);};
  for(const child of a.querySelectorAll('u,[data-moyue-decoration]'))strip(child);strip(a);
  for(let parent=a.parentElement;parent&&parent.textContent===a.textContent&&parent.querySelectorAll('a').length===1;){const next=parent.parentElement;if(parent.matches('u,[data-moyue-decoration]'))strip(parent);parent=next;}
  const url=resolve(a.getAttribute('href')||'')||safeURL(a.getAttribute('href')||'');if(url)a.href=url;else a.removeAttribute('href');a.target='_blank';a.rel='noopener noreferrer';});
 template.content.querySelectorAll('img').forEach(img=>{const src=resolve(img.getAttribute('src')||'')||safeURL(img.getAttribute('src')||'',true);if(src)img.src=src;else{img.removeAttribute('src');img.alt=img.alt||'图片未包含在文档中';}img.loading='lazy';});
 if(normalize)normalizePresentation(template.content);
 return template.innerHTML;
}
export function hasReplyHeading(blocks:{type:string;content?:string;nodes?:import('./component-model').ComponentNode[]}[]){
 const first=blocks.find(b=>b.type==='components'?b.nodes?.length:b.content?.trim());if(!first)return false;
 if(first.type==='components'){const stack=[...((first as unknown as {nodes:import('./component-model').ComponentNode[]}).nodes||[])];while(stack.length){const node=stack.shift()!;if(node.kind==='heading'&&(node.level||2)<=3)return true;if(node.kind==='container'&&!node.card)stack.unshift(...node.children||[]);}return false;}
 if(first.type==='markdown')return /^\s*#{1,3}\s+\S/.test(first.content||'');
 if(first.type==='html')return /<(?:h[1-3])(?:\s|>)/i.test(first.content||'');
 return false;
}
