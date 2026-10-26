import {collectVisualStates} from './collect-visual-states';
import {collectCitations} from './collect-citations';
import {collectGalleries} from './collect-galleries';
import {prepareReplies} from './prepare-reply';
import {exportFilename} from './export-name';
import {captureElements} from '../packages/moyue/src/extract';
import {packDocument} from '../packages/moyue/src/document';
import {detectReplies, summarizeReplies, keyForReply, pickCandidate, type ReplySummary} from './detect';
declare const chrome:{runtime:{sendMessage:(message:unknown)=>Promise<{data?:string;mime?:string;error?:string}>}};
declare global {interface Window {
 __moyueVersion?:string;__moyueBusy?:boolean;
 __moyueList:(timeout?:number)=>Promise<ReplySummary[]>;
 __moyueExport:(keys:string[])=>Promise<void>;
 __moyuePick:()=>void;__moyueCancelPick?:()=>void;
}}
const VERSION='2.2.13';
function panel(text:string){
 const el=document.createElement('div');el.dataset.moyueUi='true';el.setAttribute('role','status');el.textContent=text;
 Object.assign(el.style,{position:'fixed',right:'20px',bottom:'20px',zIndex:'2147483647',padding:'20px',borderRadius:'14px',background:'#fcfcfc',color:'#0d0d0d',boxShadow:'0 6px 35px #0004',font:'14px/1.6 system-ui,sans-serif',maxWidth:'390px'});document.body.append(el);return el;
}
function closeButton(el:HTMLElement,cleanup=()=>{}){const button=document.createElement('button');button.textContent='关闭';button.style.marginLeft='12px';button.onclick=()=>{cleanup();el.remove();};el.append(button);}
function install(){
 if(window.__moyueVersion===VERSION)return;
 window.__moyueCancelPick?.();window.__moyueVersion=VERSION;
 window.__moyueList=async(timeout=0)=>{
  const initial=summarizeReplies(detectReplies());if(initial.length||!timeout)return initial;
  return new Promise(resolve=>{
   let finished=false;const finish=(result:ReplySummary[])=>{if(finished)return;finished=true;observer.disconnect();clearTimeout(timer);resolve(result);};
   const observer=new MutationObserver(()=>{const found=summarizeReplies(detectReplies());if(found.length)finish(found);});
   const timer=setTimeout(()=>finish(summarizeReplies(detectReplies())),Math.min(timeout,5000));observer.observe(document.body,{childList:true,subtree:true});
  });
 };
 window.__moyueExport=async keys=>{
  if(window.__moyueBusy)return;window.__moyueBusy=true;
  const progress=panel('视码 SCHEMA：正在读取所选回复并保存图片，请保持页面打开…');
  try{
   const available=detectReplies();const selected=keys.map(key=>available.find(c=>keyForReply(c.element)===key)?.element);
   if(!selected.length||selected.some(el=>!el))throw new Error('所选回复已被页面重新加载，请打开插件重新扫描。');
   await prepareReplies(selected as Element[],text=>{progress.textContent=text;});
   const galleries=await collectGalleries(selected as Element[],text=>{progress.textContent=text;});
   const citations=await collectCitations(selected as Element[],text=>{progress.textContent=text;});
   const visualStates=await collectVisualStates(selected as Element[],text=>{progress.textContent=text;});
   const bundle=await captureElements(selected as Element[],location.href,document.title.replace(/\s*[-–]\s*ChatGPT$/,''),async url=>{
    const result=await chrome.runtime.sendMessage({type:'moyue-image',url});if(!result.data||!result.mime)throw new Error(result.error||'图片下载失败');return new Blob([Uint8Array.from(atob(result.data),c=>c.charCodeAt(0))],{type:result.mime});
   },{...galleries,citations:citations.groups,visualStates:visualStates.groups,warnings:[...galleries.warnings,...citations.warnings,...visualStates.warnings]});
   bundle.document.source={...bundle.document.source,exporter:'moyue-chrome/'+VERSION};
   const bytes=packDocument(bundle);const url=URL.createObjectURL(new Blob([new Uint8Array(bytes)],{type:'application/zip'}));
   progress.textContent=`已保存 ${selected.length} 条回复、${bundle.document.assets.length} 个图片与附件资源。${bundle.document.warnings.length} 条导出说明已写入文档。`;
   const link=document.createElement('a');link.href=url;link.download=exportFilename();link.textContent=' 点击重新下载';progress.append(link);link.click();closeButton(progress,()=>URL.revokeObjectURL(url));
  }catch(error){progress.textContent='导出失败：'+(error instanceof Error?error.message:String(error));closeButton(progress);}
  finally{window.__moyueBusy=false;}
 };
 window.__moyuePick=()=>{
  window.__moyueCancelPick?.();
  const hint=panel('在要保存的回复正文上移动鼠标，确认蓝框范围后单击。按 Esc 取消。');
  let hovered:Element|null=null;let previousOutline='';let previousOffset='';
  const clear=()=>{if(hovered instanceof HTMLElement){hovered.style.outline=previousOutline;hovered.style.outlineOffset=previousOffset;}hovered=null;};
  const stop=()=>{clear();document.removeEventListener('pointermove',move,true);document.removeEventListener('click',click,true);document.removeEventListener('keydown',key,true);hint.remove();window.__moyueCancelPick=undefined;};
  const move=(event:PointerEvent)=>{const next=event.target instanceof Element?pickCandidate(event.target):null;if(next===hovered)return;clear();hovered=next;if(hovered instanceof HTMLElement){previousOutline=hovered.style.outline;previousOffset=hovered.style.outlineOffset;hovered.style.outline='2px solid #3a83f7';hovered.style.outlineOffset='4px';}};
  const click=(event:MouseEvent)=>{if(event.target instanceof Element&&event.target.closest('[data-moyue-ui]'))return;const candidate=event.target instanceof Element?pickCandidate(event.target):null;event.preventDefault();event.stopImmediatePropagation();if(!candidate)return;
   document.querySelectorAll('[data-moyue-picked]').forEach(el=>el.removeAttribute('data-moyue-picked'));candidate.setAttribute('data-moyue-picked','true');keyForReply(candidate);stop();
   const done=panel('已定位所选回复。再次点击视码 SCHEMA扩展，选择该回复即可下载。');closeButton(done);
  };
  const key=(event:KeyboardEvent)=>{if(event.key==='Escape')stop();};
  window.__moyueCancelPick=stop;document.addEventListener('pointermove',move,true);document.addEventListener('click',click,true);document.addEventListener('keydown',key,true);
  const cancel=document.createElement('button');cancel.textContent='取消点选';cancel.onclick=stop;hint.append(cancel);
 };
}
install();
