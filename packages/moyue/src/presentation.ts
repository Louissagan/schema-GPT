import {publicLink,faviconSite} from './source-components';
/** Small, versioned presentation vocabulary. No copied page CSS or executable style values. */
export const PRESENTATION:Record<string,readonly string[]>={
 'data-moyue-layout':['row','inline-row','stack','grid'],
 'data-moyue-columns':['2','3','4'],
 'data-moyue-gap':['0','8','12','16','20','24'],
 'data-moyue-pad':['8','12','16','24'],
 'data-moyue-card':['true'],
 'data-moyue-group':['layers','metrics','gallery','carousel','files','repositories','citation'],
 'data-moyue-part':['row','icon','content','title','subtitle','thumbnail','metric-value','thinking','inline-prose','flow-arrow','media-list','media-row','detail-list','detail-header','detail-description'],
 'data-moyue-weight':['600','650','700'],
 'data-moyue-tone':['muted','success','warning','info','neutral'],
 'data-moyue-size':['caption','small','body','lead','title'],
 'data-moyue-align':['center','end','start'],
 'data-moyue-rule':['top','bottom'],
 'data-moyue-text-align':['start','center','end'],
 'data-moyue-justify':['start','center','end','space-between'],
 'data-moyue-outline':['solid','dashed','dotted'],
 'data-moyue-min-height':['80','120','160','200','240','320'],
 'data-moyue-badge':['true'],
 'data-moyue-heading':['1','2','3','4','5','6'],
 'data-moyue-fit':['cover'],
 'data-moyue-ratio':['1','1.333','1.5','1.778'],
 'data-moyue-check':['true','false'],
 'data-moyue-field':['checkbox','radio','text','textarea','select','range','date','number'],
 'data-moyue-separator':['true'],
 'data-moyue-source-scope':['page','site','unavailable'],
 'data-moyue-emphasis':['italic'],
 'data-moyue-decoration':['underline','line-through','underline line-through'],
};
export const PRESENTATION_ATTRIBUTES=[...Object.keys(PRESENTATION),'data-moyue-language','data-moyue-source-href','data-moyue-widget','data-moyue-options','data-moyue-step','data-moyue-action-content','data-moyue-source-items'];
export function cleanPresentation(root:ParentNode){
 for(const el of root.querySelectorAll('*'))for(const attr of [...el.attributes]){
  if(Object.hasOwn(PRESENTATION,attr.name)&&!PRESENTATION[attr.name].includes(attr.value))el.removeAttribute(attr.name);
  if(attr.name==='data-moyue-source-href'&&!/^https?:\/\//i.test(attr.value))el.removeAttribute(attr.name);
  if(attr.name==='data-moyue-language'&&!/^[\w+-]{1,30}$/.test(attr.value))el.removeAttribute(attr.name);
 }
}
const set=(el:Element,key:string,value:string)=>el.setAttribute('data-moyue-'+key,value);
const nearest=(n:number,options:number[])=>String(options.reduce((a,b)=>Math.abs(b-n)<Math.abs(a-n)?b:a));
function icon(el:Element){const svg=el.matches('svg')?el:el.querySelector('svg');if(!svg)return false;const view=(svg.getAttribute('viewBox')||'').split(/\s+/).map(Number);return !view[2]||view[2]<=48;}
function emptyDivider(el:Element){return el.matches('div')&&!el.attributes.length&&!el.children.length&&!(el.textContent||'').trim();}
function meaningfulChildren(el:Element){return [...el.children].filter(c=>!c.matches('hr,style,script,[role=separator],[data-moyue-separator]')&&!emptyDivider(c));}
function removeDividers(parent:Element){for(const child of [...parent.children])if(emptyDivider(child))child.remove();}
function numericValue(row:Element){return [...row.querySelectorAll('h1,h2,h3,strong,b,span,p')].find(el=>/^\d+[\d.,%+\-\s]*$/.test((el.textContent||'').trim()));}
/** Code editors use one block per line; textContent alone erases line breaks. */
function normalizeEditors(root:ParentNode){
 for(const editor of root.querySelectorAll('[role="textbox"][aria-multiline="true"]')){
  if(!/code|代码/i.test(editor.getAttribute('aria-label')||'')&&!editor.matches('.cm-content,[data-language]'))continue;
  const lines=[...editor.children];if(!lines.length||!lines.every(el=>el.matches('div,p')))continue;
  const pre=editor.ownerDocument.createElement('pre');const code=editor.ownerDocument.createElement('code');
  code.textContent=lines.map(line=>line.textContent||'').join('\n');
  const lang=editor.getAttribute('data-moyue-language')||editor.getAttribute('data-language');if(lang&&/^[\w+-]{1,30}$/.test(lang))set(pre,'language',lang);
  pre.append(code);editor.replaceWith(pre);
 }
}
function markRows(parent:Element,rows:Element[]){
 set(parent,'group','layers');set(parent,'card','true');removeDividers(parent);
 for(const row of rows){
  const children=[...row.children];let slot=children.find(c=>icon(c)&&!(c.textContent||'').trim());
  if(!slot)continue;
  set(row,'part','row');set(slot,'part','icon');
  const rest=children.filter(c=>c!==slot);
  let content:Element;
  if(rest.length===1)content=rest[0];else{content=row.ownerDocument.createElement('div');for(const node of [...row.childNodes])if(node!==slot)content.append(node);row.append(content);}
  set(content,'part','content');
  let title=content.querySelector('strong,b,h3,h4,h5,h6,[data-moyue-weight]');
  if(!title)title=[...content.children].find(c=>(c.textContent||'').trim()&&!c.querySelector('svg'))||null;
  if(!title){const text=[...content.childNodes].find(n=>n.nodeType===3&&n.textContent?.trim());if(text){title=row.ownerDocument.createElement('strong');title.textContent=text.textContent;text.replaceWith(title);}}
  if(title)set(title,'part','title');
 }
}
/** Recovers semantic structures even in old v1 packages whose classes have already been removed. */
export function normalizePresentation(root:ParentNode){
 cleanPresentation(root);normalizeEditors(root);
 for(const container of root.querySelectorAll('div,section,article')){
  if(container.getAttribute('data-moyue-group')==='layers'){markRows(container,meaningfulChildren(container));continue;}
  if(container.getAttribute('data-moyue-group')==='repositories'){removeDividers(container);for(const row of meaningfulChildren(container)){set(row,'part','row');const slot=meaningfulChildren(row)[0];if(slot&&(slot.matches('img')||slot.querySelector('img'))){for(const nested of slot.querySelectorAll('[data-moyue-part=thumbnail]'))nested.removeAttribute('data-moyue-part');set(slot,'part','thumbnail');}}continue;}
  if(container.closest('pre,table,svg,[data-moyue-group]'))continue;
  const children=meaningfulChildren(container);
  if(children.length<2||children.length>12)continue;
  if(children.some(c=>c.matches('h4'))&&children.some(c=>c.matches('blockquote,hr'))){set(container,'card','true');for(const heading of container.querySelectorAll(':scope > h4'))set(heading,'size','title');}
  // Real exports wrap metric values in nested stacks and often use H1 for numbers.
  const values=children.map(numericValue);
  if(children.length<=4&&values.every(Boolean)&&children.every(c=>icon(c)&&!c.querySelector('table,pre,img')&&(c.textContent||'').length<100)){
   set(container,'group','metrics');set(container,'columns',String(children.length));removeDividers(container);
   for(const value of values)if(value){set(value,'part','metric-value');value.removeAttribute('data-moyue-heading');value.removeAttribute('role');value.removeAttribute('aria-level');}
   continue;
  }
  const repoRows=children.every(child=>{const parts=meaningfulChildren(child);return parts.length===2&&!!parts[0].querySelector('img')&&!!parts[1].querySelector('a')&&!!parts[1].querySelector('p,[data-moyue-weight],h3,h4');});
  if(repoRows){set(container,'group','repositories');removeDividers(container);for(const row of children){set(row,'part','row');set(meaningfulChildren(row)[0],'part','thumbnail');}continue;}
  const rows=children.every(child=>{
   const parts=[...child.children];
   return parts.length>=2&&parts.some(p=>icon(p)&&!(p.textContent||'').trim())&&(child.textContent||'').trim().length>0&&(child.textContent||'').length<600&&!child.querySelector('table,pre,canvas,img,h1,h2');
  });
  if(rows&&container.getAttribute('data-moyue-layout')!=='grid'){
   const metricValues=children.map(child=>[...child.querySelectorAll('strong,b,span,div,p')].find(el=>/^\d+[\d.,%+\-\s]*$/.test((el.textContent||'').trim())));
   const metric=children.length<=4&&metricValues.every(Boolean);
   if(metric){set(container,'group','metrics');set(container,'columns',String(children.length));for(const value of metricValues)if(value)set(value,'part','metric-value');}
   else markRows(container,children);
   continue;
  }
  if(children.length===2&&children[0].querySelector('img')&&children[1].querySelector('h3,h4')){set(container,'layout','row');set(container,'gap','16');set(children[0],'part','thumbnail');}
  const figures=children.every(child=>child.matches('figure')&&child.querySelector('img'));
  if(figures&&children.length<=4){set(container,'group','gallery');set(container,'columns',children.length>=3?'3':'2');}

 }
 const headings=[...root.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(el=>!el.closest('svg,pre,[data-moyue-card],[data-moyue-group=metrics],[data-moyue-group=repositories]'));
 const hasChapters=headings.some(el=>/^[一二三四五六七八九十百]+[、．.]/.test((el.textContent||'').trim()));
 const first=headings[0];const offset=first?Number(first.tagName.slice(1))-1:0;
 headings.forEach((el,i)=>{
  const text=(el.textContent||'').trim();let rank=Number(el.tagName.slice(1));
  if(i===0)rank=1;
  else if(/^[一二三四五六七八九十百]+[、．.]/.test(text))rank=2;
  else if(/^\d{2}[.、．]\s*/.test(text))rank=3;
  else rank=Math.max(hasChapters?3:2,rank-offset);
  set(el,'heading',String(Math.min(rank,6)));el.setAttribute('role','heading');el.setAttribute('aria-level',String(Math.min(rank,6)));
 });
 if(first){const next=[...root.querySelectorAll('p')].find(p=>Boolean(first.compareDocumentPosition(p)&Node.DOCUMENT_POSITION_FOLLOWING));if(next?.matches('p')&&(next.textContent||'').length<300&&(/\d{4}/.test(next.textContent||'')||/[|｜]/.test(next.textContent||'')))set(next,'part','subtitle');}
 for(const pre of root.querySelectorAll('pre')){
  const code=pre.querySelector('code');const lang=pre.getAttribute('data-moyue-language')||code?.getAttribute('data-moyue-language');
  if(lang&&/^[\w+-]{1,30}$/.test(lang))set(pre,'language',lang);
 }
}
function colorTone(value:string){
 const values=value.match(/[\d.]+/g)?.map(Number);if(!values||values.length<3)return;
 const [r,g,b,a=1]=values;if(a===0)return;
 if(Math.max(r,g,b)-Math.min(r,g,b)<25&&r>=85&&r<=190)return 'muted';
 if(g>r*1.2&&g>b*1.08)return 'success';
 if(r>g*1.18&&g>b*1.2)return 'warning';
 if(b>r*1.3&&b>g*1.05)return 'info';
}
function columns(value:string){const repeat=value.match(/repeat\(\s*(\d+)/);if(repeat)return Math.min(4,Number(repeat[1]));return Math.min(4,(value.match(/(?:[\d.]+px|[\d.]+fr)/g)||[]).length);}
/** Read computed layout while the original page is still available, before sanitization. */
export function capturePresentation(original:Element,clone:Element){
 let baseSize=16;try{baseSize=parseFloat(getComputedStyle(original.querySelector('.markdown,.prose')||original).fontSize)||16;}catch{}
 const source=[original,...original.querySelectorAll('*')];const targets=[clone,...clone.querySelectorAll('*')];
 for(let i=0;i<source.length;i++){
  const from=source[i],to=targets[i];if(!to)continue;
  const classes=from.getAttribute('class')||'';
  if(from.matches('pre,code')){const lang=classes.match(/language-([\w+-]+)/)?.[1];if(lang)set(to,'language',lang);}
  if(from.matches('svg *')){
   try{const css=getComputedStyle(from);for(const prop of ['fill','stroke','stroke-width','stroke-linecap','stroke-linejoin','stroke-dasharray','stroke-dashoffset','rx','ry','opacity','font-size','font-weight','font-family','text-anchor']){let value=css.getPropertyValue(prop);if(prop==='fill'||prop==='stroke'){const rgb=value.match(/^rgba?\(\s*([\d.]+)[, ]+([\d.]+)[, ]+([\d.]+)/i);if(rgb&&!value.startsWith('rgba')&&!value.includes('/')){const colors=rgb.slice(1,4).map(Number);if(Math.max(...colors)-Math.min(...colors)<20)value=colors[0]>235?'var(--paper)':colors[0]>180?'var(--line)':colors[0]>80?'var(--muted)':'currentColor';}}if(value&&value!=='auto'&&!/[<>;]/.test(value)&&(!/url\(/i.test(value)||/^url\(["']?#[\w:.-]+["']?\)$/.test(value)))to.setAttribute(prop,value);}}catch{/* Semantic SVG attributes remain. */}
   continue;
  }
  if(from.closest('svg,pre,code,.katex'))continue;
  // Our own components expose stable public semantics too; no fixture text matching.
  for(const [name,group] of [['reply-layers','layers'],['reply-metrics','metrics'],['reply-image-grid','gallery'],['reply-carousel','carousel'],['reply-files','files'],['reply-repos','repositories']])if(from.classList.contains(name))set(to,'group',group);
  if(from.matches('[hidden],.sr-only,.visually-hidden,dialog:not([open])')||from.classList.contains('reply-check-visual')||from.classList.contains('reply-radio-visual'))to.setAttribute('data-moyue-omit','true');
  if(from.classList.contains('reply-thinking')||(from.matches('button')&&/^(思考了|已思考|thought for)\s*.{1,50}/i.test((from.textContent||'').trim())))set(to,'part','thinking');
  if(from.classList.contains('reply-card'))set(to,'card','true');
  if(from.classList.contains('reply-subtitle'))set(to,'part','subtitle');
  if(from.classList.contains('reply-badge'))set(to,'badge','true');
  if(from.classList.contains('reply-repo-thumbnail'))set(to,'part','thumbnail');
  try{
   const css=getComputedStyle(from);const children=from.children.length;if(to.closest('[data-moyue-group=carousel]')&&!from.querySelector('img')&&/^url\(/.test(css.backgroundImage))to.setAttribute('data-moyue-background-image',css.backgroundImage);if(css.display==='none')to.setAttribute('data-moyue-omit','true');
   if(i>0&&children>=2){
    if(css.display==='grid'){const count=columns(css.gridTemplateColumns);if(count>=2){set(to,'layout','grid');set(to,'columns',String(count));}}
    else if(/flex/.test(css.display)&&css.flexDirection!=='column')set(to,'layout',css.display==='inline-flex'?'inline-row':'row');
    else if(/flex/.test(css.display)&&css.flexDirection==='column')set(to,'layout','stack');
    if(to.hasAttribute('data-moyue-layout')){set(to,'gap',nearest(parseFloat(css.gap||css.columnGap)||0,[0,8,12,16,20,24]));if(css.alignItems==='center'||css.alignItems==='end')set(to,'align',css.alignItems);else if(css.alignItems==='start'||css.alignItems==='flex-start')set(to,'align','start');}
    if(/auto|scroll/.test(css.overflowX)&&css.flexDirection!=='column')set(to,'group','carousel');
   }
   // A grid/flex item is a semantic grouping boundary even when its own display is block.
   // Preserve it before the importer removes inert wrappers.
   if(i>0&&from.matches('div,section,article,aside')&&from.parentElement){
    const parent=getComputedStyle(from.parentElement);
    if((parent.display==='grid'||/flex/.test(parent.display))&&!to.hasAttribute('data-moyue-layout'))set(to,'layout','stack');
   }
   if(['center','end','right'].includes(css.textAlign))set(to,'text-align',css.textAlign==='right'?'end':css.textAlign);
   if(to.hasAttribute('data-moyue-layout')&&['center','end','flex-end','space-between'].includes(css.justifyContent))set(to,'justify',css.justifyContent==='flex-end'?'end':css.justifyContent);
   const content=(from.textContent||'').trim();const empty=!content&&!from.querySelector('svg,img,canvas,input');
   const bounds=from.getBoundingClientRect();const height=bounds.height||parseFloat(css.height)||0;const width=bounds.width||parseFloat(css.width)||0;
   const background=css.backgroundColor||'';const painted=background!==''&&!/transparent|rgba\(0, 0, 0, 0\)/.test(background);
   if(from.matches('hr,[role=separator]')||(empty&&width>40&&height<=2&&((parseFloat(css.borderTopWidth)||parseFloat(css.borderBottomWidth)||0)>.5||(height>0&&painted))))set(to,'separator','true');
   if(content.length>0&&content.length<=80&&from.matches('a,button,span,div')&&/flex/.test(css.display)&&css.flexDirection!=='column'&&parseFloat(css.fontSize)<=14){
    const image=from.querySelector('img');const site=image&&faviconSite(image.getAttribute('src')||'');
    if(site&&from.querySelectorAll('img').length===1&&!from.querySelector('h1,h2,h3,h4,table,pre')){const anchor=from.matches('a[href]')?from:from.querySelector('a[href]');const page=anchor&&publicLink(anchor.getAttribute('href')||'');set(to,'group','citation');set(to,'source-scope',page?'page':'site');set(to,'source-href',page||site);}
   }
   const radius=parseFloat(css.borderRadius)||0;const border=parseFloat(css.borderTopWidth)||0;
   if(i>0&&from.matches('div,section,article,figure')&&radius>=8&&border>=.5&&(children>=2||(from.textContent||'').trim().length>0||from.querySelector('img'))){set(to,'card','true');const pad=parseFloat(css.paddingLeft)||parseFloat(css.paddingTop)||0;if(pad)set(to,'pad',nearest(pad,[8,12,16,24]));}
   else if(i>0&&border>=.5)set(to,'rule','top');
   if(i>0&&from.matches('div,section,article,figure')&&border>=.5&&parseFloat(css.borderRightWidth)>=.5&&parseFloat(css.borderBottomWidth)>=.5&&parseFloat(css.borderLeftWidth)>=.5){
    set(to,'outline',['dashed','dotted'].includes(css.borderTopStyle)?css.borderTopStyle:'solid');to.removeAttribute('data-moyue-rule');
    // Preserve bounded display areas as minimum heights, so long/mobile text can grow.
    if(height>=80&&!from.querySelector('img,video,canvas,table,input,textarea')&&children<=4)set(to,'min-height',nearest(height,[80,120,160,200,240,320]));
   }
   if(css.fontStyle==='italic')set(to,'emphasis','italic');
   const decoration=(css.textDecorationLine||'')+' '+(css.textDecoration||'');const lines=['underline','line-through'].filter(line=>decoration.includes(line));if(lines.length)set(to,'decoration',lines.join(' '));
   const weight=parseInt(css.fontWeight);if(weight>=600&&!from.matches('h1,h2,h3,h4,h5,h6,strong,b'))set(to,'weight',nearest(weight,[600,650,700]));
   const size=parseFloat(css.fontSize)*16/baseSize;if(from.matches('h4,h5,h6')&&size>=21)set(to,'size','title');if(size>0&&!from.matches('h1,h2,h3,h4,h5,h6')&&!from.querySelector('h1,h2,h3,h4,h5,h6')){
    if(size<=12)set(to,'size','caption');else if(size<15)set(to,'size','small');else if(size>16&&size<=20)set(to,'size','lead');
   }
   const tone=colorTone(css.color);if(tone)set(to,'tone',tone);
   if(from.matches('span,div,a')&&radius>=3&&painted&&parseFloat(css.fontSize)<=14&&content.length>0&&content.length<=80&&!from.querySelector('p,h1,h2,h3,h4,img,svg'))set(to,'badge','true');
   if(to.getAttribute('data-moyue-part')!=='thinking'&&from.matches('span,a,button')&&radius>=16&&children<5&&(from.textContent||'').length<100&&parseFloat(css.paddingLeft)>0)set(to,'badge','true');
   if(from.matches('img')){
    if(css.objectFit==='cover'){set(to,'fit','cover');const ratio=from.getBoundingClientRect().width/from.getBoundingClientRect().height;if(Number.isFinite(ratio)&&ratio>0)set(to,'ratio',nearest(ratio,[1,1.333,1.5,1.778]));}
   }
  }catch{/* Missing styles do not prevent semantic extraction. */}
 }
}
export function finalizePresentation(clone:Element){
 clone.querySelectorAll('[data-moyue-omit]').forEach(el=>el.remove());
 // SVG foreignObject labels otherwise disappear at the security boundary. Convert their text to plain SVG text.
 for(const object of clone.querySelectorAll('svg foreignObject')){
  const text=(object.textContent||'').trim();if(!text){object.remove();continue;}
  const label=object.ownerDocument.createElementNS('http://www.w3.org/2000/svg','text');
  label.setAttribute('x',String((parseFloat(object.getAttribute('x')||'0')||0)+(parseFloat(object.getAttribute('width')||'0')||0)/2));
  label.setAttribute('y',String((parseFloat(object.getAttribute('y')||'0')||0)+(parseFloat(object.getAttribute('height')||'0')||0)/2));
  label.setAttribute('text-anchor','middle');label.setAttribute('dominant-baseline','middle');label.setAttribute('fill','currentColor');label.textContent=text;object.replaceWith(label);
 }
 normalizePresentation(clone);
}
