import type {WidgetSpec} from './widget-model';
import type {CitationSource} from './citation-data';
import {markDownloadLinks,captureDisclosures} from './capture-links';
import {validateWidget,encodeWidget} from './widget-model';
import {migrateToComponents} from './recognize';
import { createDocument, LIMITS, rasterMime, type DocumentBundle } from './document';
import { sanitizeHTML } from './html';
import { capturePresentation, finalizePresentation } from './presentation';

function imageKey(src:string){try{const u=new URL(src);for(const k of ['w','h','width','height','quality','q','fit','format','fm'])u.searchParams.delete(k);return u.href;}catch{return src;}}

/** Operates only on a user-selected, currently loaded answer element. No private API or session-token access. */
export async function captureHTMLSnapshot(roots: Element[], sourceURL: string, title: string, fetchImage?: (url:string)=>Promise<Blob>, galleries?:{groups:{element:Element;images:{src:string;alt:string}[];expected:number}[];warnings:string[];citations?:{element:Element;sources:CitationSource[]}[];visualStates?:{element:Element;spec:Extract<WidgetSpec,{type:'visual-states'}>}[]}): Promise<DocumentBundle> {
  const doc=createDocument('',title); doc.blocks=[];doc.source={url:sourceURL,title,exporter:'moyue-dom/2.2.13',presentation:'moyue-reading-v1'};
  const files: Record<string,Uint8Array>={}; const seen=new Map<string,string>(); let total=0;
  const warn=(s:string)=>{if(!doc.warnings.includes(s)) doc.warnings.push(s);};
  async function imageData(src:string, original?:HTMLImageElement):Promise<string> {
    if(seen.has(src)) return seen.get(src)!;
    if(!/^(https?:|blob:|data:image\/(png|jpeg|webp|gif|avif);base64,|data:image\/svg\+xml(?:;[^,]*)?,)/i.test(src)||src.length>LIMITS.asset*2){warn('发现不可读取的图片地址，已保留缺失提示。');return '';}
    try {
      let blob:Blob;
      try {const response=await fetch(src,{signal:AbortSignal.timeout(12000),credentials:'same-origin'});if(!response.ok)throw new Error();const declared=Number(response.headers.get('content-length')||0);if(declared>LIMITS.asset)throw new Error();if(response.body){const reader=response.body.getReader();const chunks:Uint8Array[]=[];let size=0;while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>LIMITS.asset){await reader.cancel();throw new Error();}chunks.push(part.value);}blob=new Blob(chunks.map(c=>new Uint8Array(c)),{type:(response.headers.get('content-type')||'').split(';')[0]});}else blob=await response.blob();}
      catch(error) {
        if(fetchImage){try{blob=await fetchImage(src);return await storeImage(src,blob);}catch{/* Fall back to already decoded pixels. */}}
        if(!original?.complete || !original.naturalWidth || original.naturalWidth*original.naturalHeight>40000000) throw error;
        const canvas=document.createElement('canvas');canvas.width=original.naturalWidth;canvas.height=original.naturalHeight;canvas.getContext('2d')!.drawImage(original,0,0);
        blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error()),'image/png'));
      }
      return await storeImage(src,blob);
    } catch {warn('部分图片未能打包（网络权限、格式或大小限制）；文档保留外链，可能需要登录或重新添加。');return src.startsWith('http')?src:'';}
  }
  async function storeImage(src:string,blob:Blob){
      if(blob.type==='image/svg+xml'){const svg=sanitizeHTML(await blob.text(),undefined,false);if(!svg.includes('<svg'))throw new Error();blob=new Blob([svg],{type:'image/svg+xml'});}
      if((!rasterMime(blob.type)&&blob.type!=='image/svg+xml')||blob.size>LIMITS.asset||total+blob.size>LIMITS.expanded||doc.assets.length>=LIMITS.entries-1) throw new Error();
      total+=blob.size; const path=`assets/image-${doc.assets.length+1}.${blob.type==='image/svg+xml'?'svg':blob.type.split('/')[1]}`;
      files[path]=new Uint8Array(await blob.arrayBuffer());doc.assets.push({path,mime:blob.type,bytes:blob.size});seen.set(src,path);return path;
  }
  for(const warning of galleries?.warnings||[])warn(warning);
  for(const root of roots) {
    const clone=root.cloneNode(true) as Element;
    const originalElements=[root,...root.querySelectorAll('*')],clonedElements=[clone,...clone.querySelectorAll('*')];
    const galleryTargets=(galleries?.groups||[]).filter(g=>root.contains(g.element)).map(g=>({...g,target:clonedElements[originalElements.indexOf(g.element)],visible:new Set([...g.element.querySelectorAll('img')].map(img=>imageKey(img.currentSrc||img.src)))}));
    for(const citation of galleries?.citations||[]){const target=clonedElements[originalElements.indexOf(citation.element)];if(target){target.setAttribute('data-moyue-source-items',JSON.stringify(citation.sources));target.setAttribute('data-moyue-group','citation');}}
    const visualTargets=(galleries?.visualStates||[]).map(g=>({...g,target:clonedElements[originalElements.indexOf(g.element)]})).filter(g=>g.target);
    captureDisclosures(root,clone);
    capturePresentation(root,clone);
    markDownloadLinks(clone,sourceURL);
    if([...clone.querySelectorAll('[role=link]')].some(el=>!/^(https?:|blob:)/.test(el.getAttribute('href')||el.getAttribute('data-href')||el.getAttribute('data-url')||'')&&/下载|download|打开.*文件/i.test(el.textContent||'')))warn('部分文件入口只有点击行为，没有可读取的 href 或文件字节；无法从 DOM 自动恢复，请在原页面另存附件。');
    for(const host of clone.querySelectorAll('[data-moyue-widget]')){
     try{const spec=validateWidget(JSON.parse(host.getAttribute('data-moyue-widget')||''));
      if(spec.type==='file'&&spec.src&&!spec.src.startsWith('assets/')){const url=new URL(spec.src,sourceURL).href;if(!/^(https?:|blob:)/.test(url))throw new Error();try{const response=await fetch(url,{credentials:'same-origin',signal:AbortSignal.timeout(12000)});if(!response.ok||Number(response.headers.get('content-length')||0)>LIMITS.asset)throw new Error();let data:Uint8Array;if(response.body){const reader=response.body.getReader();const chunks:Uint8Array[]=[];let size=0;while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>LIMITS.asset){await reader.cancel();throw new Error();}chunks.push(part.value);}data=new Uint8Array(size);let offset=0;for(const part of chunks){data.set(part,offset);offset+=part.length;}}else data=new Uint8Array(await response.arrayBuffer());if(data.length>LIMITS.asset||total+data.length>LIMITS.expanded||doc.assets.length>=LIMITS.entries-1)throw new Error();const ext=spec.name.match(/\.([a-zA-Z0-9]+)$/)?.[1]||'bin';const path=`assets/attachment-${doc.assets.length+1}.${ext}`;files[path]=data;doc.assets.push({path,mime:(response.headers.get('content-type')||'application/octet-stream').split(';')[0],bytes:data.length});total+=data.length;spec.src=path;}catch{spec.src=url;warn('部分附件无法打包，保留已知原地址；地址可能需要登录或已失效。');}}
      if(spec.type==='map')for(const place of spec.places){if(place.url)place.url=new URL(place.url,sourceURL).href;if(place.photo)place.photo=new URL(place.photo,sourceURL).href;}
      host.setAttribute('data-moyue-widget',encodeWidget(spec));
     }catch{warn('有交互组件声明不完整，保留可见内容而不执行未知动作。');}
    }
    for(const el of clone.querySelectorAll('[data-moyue-background-image]')){const value=el.getAttribute('data-moyue-background-image')||'';const match=value.match(/^url\(["']?(.*?)["']?\)$/);if(match){const img=document.createElement('img');img.src=await imageData(match[1]);img.alt=el.getAttribute('aria-label')||'轮播图片';img.setAttribute('data-moyue-packed-image','true');el.prepend(img);}el.removeAttribute('data-moyue-background-image');}
    // Normalize sources before removing controls so DOM image positions remain aligned.
    const originals=[...root.querySelectorAll('img')]; const copies=[...clone.querySelectorAll('img:not([data-moyue-packed-image])')];
    for(let i=0;i<copies.length;i++) {if(copies[i].closest('[data-moyue-omit],[data-moyue-widget]'))continue;const original=originals[i];const candidate=original.currentSrc||original.src||original.getAttribute('data-src')||original.getAttribute('data-original')||'';copies[i].setAttribute('src',await imageData(candidate?new URL(candidate,sourceURL).href:'',original));copies[i].removeAttribute('srcset');}
    for(const group of galleryTargets){if(!group.target)continue;const sample=group.target.querySelector('img');const presentation=[...(sample?.attributes||[])].filter(a=>a.name.startsWith('data-moyue-'));group.target.setAttribute('data-moyue-group','gallery');group.target.setAttribute('data-moyue-columns',String(Math.min(4,group.visible.size)||3));
     // Materialize one real image node per gallery item, including the cover behind
     // the count button. Keeping that button as inline HTML loses its image semantics.
     group.target.replaceChildren();
     for(const image of group.images){const figure=document.createElement('figure');const img=document.createElement('img');for(const attr of presentation)img.setAttribute(attr.name,attr.value);img.src=await imageData(image.src);img.alt=image.alt;figure.append(img);group.target.append(figure);}
    }
    const canvases=[...root.querySelectorAll('canvas')];
    for(const [i,canvas] of [...clone.querySelectorAll('canvas')].entries()) {
      if(canvas.closest('[data-moyue-omit],[data-moyue-widget]'))continue;
      try {const src=canvases[i].toDataURL('image/png');const img=document.createElement('img');img.src=await imageData(src);img.alt='图表或画布的静态快照';canvas.replaceWith(img);warn('画布已保存为静态图片；原图表数据及交互未导出。');}
      catch {canvas.replaceWith(document.createTextNode('[画布无法导出：请另存图片后添加]'));warn('有画布无法读取，已在对应位置保留提示。');}
    }
    clone.querySelectorAll('.katex').forEach(el=>{const tex=el.querySelector('annotation[encoding="application/x-tex"]')?.textContent;if(tex){const span=document.createElement('span');span.dataset.math=tex;span.dataset.display=el.closest('.katex-display')?'true':'false';span.textContent=tex;el.replaceWith(span);}});
    clone.querySelectorAll('pre').forEach(pre=>{const code=pre.querySelector('code');if(code){const next=document.createElement('pre');const child=document.createElement('code');child.textContent=code.textContent;const language=pre.getAttribute('data-moyue-language')||code.getAttribute('data-moyue-language');if(language)next.setAttribute('data-moyue-language',language);next.append(child);pre.replaceWith(next);}});
    clone.querySelectorAll('[role="checkbox"],[role="radio"]').forEach(control=>{const state=control.getAttribute('aria-checked');if(state!=='true'&&state!=='false')return;const span=document.createElement('span');span.setAttribute('data-moyue-check',state);span.setAttribute('data-moyue-field',control.getAttribute('role')==='radio'?'radio':'checkbox');span.setAttribute('aria-label',(control.getAttribute('aria-label')||'')+(state==='true'?' 已选中':' 未选中'));if(control.textContent?.trim())span.append(document.createTextNode(control.textContent));control.replaceWith(span);});
    const sourceInputs=[...root.querySelectorAll('input')];
    clone.querySelectorAll('input').forEach((copy,i)=>{const input=sourceInputs[i]||copy;const span=document.createElement('span');if(input.type==='hidden'||input.type==='password'){copy.remove();return;}if(input.type==='range'){span.setAttribute('aria-valuemin',input.min||'0');span.setAttribute('aria-valuemax',input.max||'100');span.setAttribute('aria-valuenow',input.value);if(input.step!=='any')span.setAttribute('data-moyue-step',input.step||'1');}
    span.setAttribute('data-moyue-field',['checkbox','radio','range','date','number'].includes(input.type)?input.type:'text');if(input.type==='checkbox'||input.type==='radio'){span.setAttribute('data-moyue-check',String(input.checked));span.setAttribute('aria-label',input.checked?'已完成':'未完成');}else span.textContent=input.value;copy.replaceWith(span);});
    const fields=[...root.querySelectorAll<HTMLTextAreaElement|HTMLSelectElement>('textarea,select')];
    clone.querySelectorAll('textarea,select').forEach((el,i)=>{const p=document.createElement('p');p.textContent=fields[i].value;p.setAttribute('data-moyue-field',el.tagName.toLowerCase());if(fields[i].tagName==='SELECT'){const select=fields[i] as HTMLSelectElement;const options=[...select.options].map(o=>({label:o.label,value:o.value}));if(options.length<=100&&options.every(o=>o.label.length<=2000&&o.value.length<=2000))p.setAttribute('data-moyue-options',JSON.stringify(options));}el.replaceWith(p);});
    clone.querySelectorAll('iframe,video,audio').forEach(el=>{const p=document.createElement('p');p.textContent='[嵌入内容未导出，请从原页面另存]';el.replaceWith(p);warn('嵌入页面、音视频和封闭组件不能通过 DOM 完整还原。');});
    clone.querySelectorAll('button').forEach(button=>{const label=(button.textContent||'').trim();if(button.closest('[role=toolbar]')||/^(复制|分享|重试|朗读|赞|踩|copy|share|retry|read aloud)(\s|$)/i.test(label))return;if(label||button.querySelector('img')){const span=document.createElement('span');for(const attr of [...button.attributes])if(attr.name.startsWith('data-moyue-'))span.setAttribute(attr.name,attr.value);if(!button.querySelector('img')&&button.getAttribute('data-moyue-part')!=='thinking')span.setAttribute('data-moyue-badge','true');span.append(...button.childNodes);button.replaceWith(span);}});
    clone.querySelectorAll('button,nav,[role="toolbar"],script,style,textarea,select').forEach(el=>el.remove());
    clone.querySelectorAll('a').forEach(a=>{try{a.setAttribute('href',new URL(a.getAttribute('href')||'',sourceURL).href);}catch{a.removeAttribute('href');}});
    for(const group of visualTargets){group.target.setAttribute('data-moyue-widget',encodeWidget(group.spec));group.target.replaceChildren();}
    finalizePresentation(clone);
    if(clone.querySelector('svg')) warn('SVG 图解保留静态矢量内容；网页中的点击与悬浮行为不包含在文档中。');
    // Preserve asset references while sanitizing by using a neutral public placeholder then restoring.
    const html=sanitizeHTML(clone.innerHTML, path=>path.startsWith('assets/')?'https://moyue.invalid/'+path:undefined).replaceAll('https://moyue.invalid/assets/','assets/');
    doc.blocks.push({type:'html',content:html});
  }
  warn('只导出已加载的所选回复。未展开、未加载的内容及应用内部数据不在导出范围内；交互控件保存为静态内容。');
  return {document:doc,files};
}

/** Public export always emits typed components. HTML snapshots are an explicit compatibility boundary. */
export async function captureElements(...args:Parameters<typeof captureHTMLSnapshot>):Promise<DocumentBundle>{
 const bundle=await captureHTMLSnapshot(...args);bundle.document=migrateToComponents(bundle.document);return bundle;
}
