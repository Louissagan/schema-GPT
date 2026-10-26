import {capturePresentation,finalizePresentation} from '../packages/moyue/src/presentation';
import {sanitizeHTML} from '../packages/moyue/src/html';
import type {WidgetSpec} from '../packages/moyue/src/widget-model';
export type CapturedVisualState={element:Element;spec:Extract<WidgetSpec,{type:'visual-states'}>};
const selector='[role=radio],[role=tab],input[type=radio]';
const controls=(el:Element)=>[...el.querySelectorAll<HTMLElement>(selector)];
const selected=(el:HTMLElement)=>el instanceof HTMLInputElement?el.checked:el.getAttribute('aria-checked')==='true'||el.getAttribute('aria-selected')==='true';
const label=(el:HTMLElement)=>el.getAttribute('aria-label')||el.textContent?.trim()||(el instanceof HTMLInputElement?[...(el.labels||[])].map(l=>l.textContent?.trim()).join(' '):'');
const diagrams=(el:Element)=>[...el.querySelectorAll('svg')].filter(svg=>{const box=(svg.getAttribute('viewBox')||'').split(/[ ,]+/).map(Number);const bounds=svg.getBoundingClientRect();return box[2]>80&&box[3]>60||bounds.width>80&&bounds.height>60||Number(svg.getAttribute('width'))>80&&Number(svg.getAttribute('height'))>60;});
/** Bounded sampling of local SVG panels with explicit single-select controls. */
export async function collectVisualStates(roots:Element[],progress?:(s:string)=>void){
 const groups:CapturedVisualState[]=[];const warnings:string[]=[];const seen=new Set<Element>();const deadline=Date.now()+20000;
 const pause=()=>new Promise<void>(r=>setTimeout(r,120));
 for(const root of roots)for(const first of root.querySelectorAll<HTMLElement>(selector)){
  let panel:Element|null=first.parentElement;let steps=0;
  while(panel&&panel!==root&&steps++<5&&diagrams(panel).length!==1)panel=panel.parentElement;
  if(!panel||panel===root||diagrams(panel).length!==1||panel.closest('form')||seen.has(panel))continue;
  seen.add(panel);const initial=controls(panel);if(initial.length<2||initial.length>12||initial.some(c=>c.hasAttribute('disabled')||c.getAttribute('aria-disabled')==='true'))continue;
  const labels=initial.map(label);if(labels.some(l=>!l||l.length>200)||new Set(labels).size!==labels.length)continue;
  const active=initial.map((c,i)=>selected(c)?i:-1).filter(i=>i>=0);if(active.length!==1)continue;
  // Only controls of one kind and, for native radios, one named group are safe to sample.
  if(initial.some(c=>c.tagName!==first.tagName||c.getAttribute('role')!==first.getAttribute('role')))continue;
  if(first instanceof HTMLInputElement&&(!first.name||initial.some(c=>!(c instanceof HTMLInputElement)||c.name!==first.name)))continue;
  const original=active[0];const states=labels.map((label,i)=>({id:String(i),label,html:undefined as string|undefined}));
  const capture=()=>{const copy=panel!.cloneNode(true) as Element;capturePresentation(panel!,copy);const live=[panel!,...panel!.querySelectorAll('*')],cloned=[copy,...copy.querySelectorAll('*')];for(const control of controls(panel!)){const c=cloned[live.indexOf(control)];const wrapper=c?.closest('label');(wrapper||c)?.remove();}copy.querySelectorAll('[role=radiogroup],[role=tablist],button,input,[data-moyue-ui]').forEach(el=>el.remove());finalizePresentation(copy);return sanitizeHTML(copy.innerHTML,undefined,false).replace(/moyue-svg-\d+-/g,'moyue-stage-');};
  states[original].html=capture();progress?.('正在保存图解的各个阶段…');
  try{for(let i=0;i<labels.length;i++){
   if(i===original)continue;if(Date.now()>deadline)break;
   const control=controls(panel)[i];if(!control||label(control)!==labels[i])break;
   const before=capture();control.click();let prior='';let stable=0;
   for(let attempt=0;attempt<10;attempt++){await pause();const current=controls(panel)[i];if(!current||!selected(current))continue;const html=capture();stable=html===prior?stable+1:0;prior=html;if(html!==before&&stable>=1){states[i].html=html;break;}}
  }}finally{const restore=controls(panel)[original];if(restore&&label(restore)===labels[original]&&!selected(restore)){restore.click();await pause();}}
  const count=states.filter(s=>s.html).length;if(count<labels.length)warnings.push(`分阶段图解读取不完整：${count}/${labels.length} 个状态；未读取的阶段需从原页面重新导出。`);
  groups.push({element:panel,spec:{type:'visual-states',states,selected:String(original),allowClear:true}});
 }
 return {groups,warnings};
}
