import {publicLink,sourceLabel} from '../packages/moyue/src/source-components';
import type {CitationSource} from '../packages/moyue/src/citation-data';
export type CapturedCitation={element:Element;sources:CitationSource[]};
/** Expand only source chips in selected replies; never navigate citation URLs. */
export async function collectCitations(roots:Element[],progress?:(s:string)=>void){
 const groups:CapturedCitation[]=[];const warnings:string[]=[];const end=Date.now()+20000;const pause=()=>new Promise<void>(r=>setTimeout(r,140));
 const candidates=roots.flatMap(root=>[...root.querySelectorAll<HTMLElement>('[data-moyue-group=citation],button,[role=button],[data-state]')]).filter(el=>{const text=sourceLabel(el);return text.length<120&&/\+\s*\d+\s*$/.test(text)&&!!(el.querySelector('img,svg')||el.hasAttribute('aria-haspopup'));}).filter((el,_,all)=>!all.some(other=>other!==el&&el.contains(other)));
 for(const chip of candidates){if(Date.now()>end){warnings.push('部分多来源引用超过采集时限，请展开来源后重新导出。');break;}progress?.('正在读取引用中的多条来源…');const expected=Number(sourceLabel(chip).match(/\+\s*(\d+)\s*$/)?.[1]||0)+1;const before=new Set(document.querySelectorAll('[role=tooltip],[role=dialog],[data-radix-popper-content-wrapper],[data-state=open]'));
  chip.dispatchEvent(new MouseEvent('mouseover',{bubbles:true}));chip.dispatchEvent(new MouseEvent('mouseenter',{bubbles:false}));chip.dispatchEvent(new Event('pointerover',{bubbles:true}));chip.dispatchEvent(new Event('pointerenter',{bubbles:false}));
  let found:CitationSource[]=[];
  try{for(let attempt=0;attempt<10&&Date.now()<end;attempt++){await pause();const ids=(chip.getAttribute('aria-describedby')||chip.getAttribute('aria-controls')||'').split(/\s+/).filter(Boolean);const linked=ids.map(id=>document.getElementById(id)).filter((e):e is HTMLElement=>!!e);const fresh=[...document.querySelectorAll('[role=tooltip],[role=dialog],[data-radix-popper-content-wrapper],[data-state=open]')].filter(e=>!before.has(e)&&!e.contains(chip));const panels=[...linked,...fresh];const options=panels.map(panel=>{const map=new Map<string,CitationSource>();for(const a of panel.querySelectorAll<HTMLAnchorElement>('a[href]')){if((a.getAttribute('href')||'').startsWith('#'))continue;const href=publicLink(a.href);if(!href)continue;const img=a.querySelector('img');const title=a.querySelector('h3,h4,strong,[data-title]')?.textContent?.trim()||a.textContent?.trim()||new URL(href).hostname;map.set(href,{href,label:new URL(href).hostname,title:title.slice(0,4000),icon:img?.currentSrc||img?.src||'',date:a.querySelector('time')?.textContent?.trim().slice(0,200)});}return [...map.values()];}).filter(items=>items.length>0&&items.length<=50);
   // Only a unique candidate is attributable; do not mix unrelated open panels.
   if(options.length){const distinct=options.filter((a,i)=>options.findIndex(b=>JSON.stringify(a)===JSON.stringify(b))===i);if(distinct.length===1)found=distinct[0];}if(found.length>=expected)break;
  }}finally{chip.dispatchEvent(new MouseEvent('mouseout',{bubbles:true}));chip.dispatchEvent(new MouseEvent('mouseleave',{bubbles:false}));chip.dispatchEvent(new Event('pointerout',{bubbles:true}));chip.dispatchEvent(new Event('pointerleave',{bubbles:false}));}
  if(found.length)groups.push({element:chip,sources:found});if(found.length<expected)warnings.push(`多来源引用未完整读取：预计 ${expected} 条，读取 ${found.length} 条。原包不会猜测缺失链接。`);
 }
 return {groups,warnings};
}
