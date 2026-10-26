/** Read only explicit image-gallery controls inside selected replies. No private APIs. */
export type CapturedGallery={element:Element;images:{src:string;alt:string}[];expected:number};
export type GalleryCapture={groups:CapturedGallery[];warnings:string[]};
export function imageIdentity(src:string){try{const u=new URL(src,location.href);for(const k of ['w','h','width','height','quality','q','fit','format','fm'])u.searchParams.delete(k);return u.href;}catch{return src;}}
export function countedGalleries(roots:Element[]){
 const result:{element:Element;button:HTMLElement;expected:number}[]=[];
 for(const root of roots)for(const button of root.querySelectorAll<HTMLElement>('button,[role=button]')){
  const labels=[button.getAttribute('aria-label')||'',button.textContent||''].map(s=>s.trim());
  const pattern=/^(?:\+?(\d{1,3})|(?:查看|显示|view|show)?\s*(?:全部|all)?\s*(\d{1,3})\s*(?:张图片|张照片|images|photos))$/i;
  const label=labels.find(s=>pattern.test(s))||'';const count=label.match(pattern);
  if(!count)continue;let group:Element|null=button;
  for(let i=0;group&&i<5;i++,group=group.parentElement){if(!root.contains(group))break;const imgs=group.querySelectorAll('img');if(imgs.length>=2&&imgs.length<=4&&!group.querySelector('p,h1,h2,h3,h4,table')){const expected=Number(count[1]||count[2])+(label.startsWith('+')?imgs.length:0);if(expected>imgs.length&&expected<=100&&!result.some(r=>r.element===group))result.push({element:group,button,expected});break;}}
 }
 return result;
}
export async function collectGalleries(roots:Element[],progress?:(s:string)=>void):Promise<GalleryCapture>{
 const result:GalleryCapture={groups:[],warnings:[]};const pause=()=>new Promise<void>(r=>setTimeout(r,180));const deadline=Date.now()+30000;
 for(const item of countedGalleries(roots)){
  if(Date.now()>deadline){result.warnings.push('部分折叠图库超过采集时间限制，请展开后重新导出。');break;}
  // Never commandeer an already-open dialog belonging to the user.
  if(document.querySelector('[role=dialog],dialog[open]')){result.warnings.push('已有弹窗打开，未展开折叠图库；请关闭弹窗后重新导出。');break;}
  const seen=new Map<string,{src:string;alt:string}>();
  const read=(scope:Element)=>{for(const img of scope.querySelectorAll<HTMLImageElement>('img')){const src=img.currentSrc||img.src;if(!/^(https?:|blob:|data:image\/)/i.test(src)||/favicon|\/avatar/i.test(src))continue;if(img.naturalWidth>0&&img.naturalWidth<=64&&img.naturalHeight<=64)continue;const key=imageIdentity(src);if(!seen.has(key))seen.set(key,{src,alt:img.alt});}};
  read(item.element);let dialog:Element|null=null;const focus=document.activeElement as HTMLElement|null;const scrolls:{element:Element;left:number;top:number}[]=[];for(let el:Element|null=item.element;el;el=el.parentElement)scrolls.push({element:el,left:el.scrollLeft,top:el.scrollTop});
  try{
   progress?.(`正在读取折叠图库（预计 ${item.expected} 张）…`);item.button.click();
   for(let i=0;i<10&&!dialog&&Date.now()<deadline;i++){await pause();dialog=document.querySelector('[role=dialog],dialog[open]');}
   if(!dialog)throw new Error('图库弹窗未打开');
   const frames=new Set<string>();
   for(let step=0;step<100&&Date.now()<deadline;step++){
    const signature=()=>[...dialog!.querySelectorAll<HTMLImageElement>('img')].map(im=>im.currentSrc||im.src).join('|');
    const frame=signature();if(frames.has(frame))break;frames.add(frame);read(dialog);if(seen.size>=item.expected)break;
    const next=[...dialog.querySelectorAll<HTMLElement>('button,[role=button]')].find(b=>/^(next(?: image| photo)?|下一张(?:图片|照片)?|下一个)$/i.test((b.getAttribute('aria-label')||b.getAttribute('title')||b.textContent||'').trim())&&!b.hasAttribute('disabled')&&b.getAttribute('aria-disabled')!=='true');
    if(!next)break;next.click();for(let wait=0;wait<10&&signature()===frame&&Date.now()<deadline;wait++)await pause();await pause();
   }
  }catch{/* Missing images are reported below, never silently invented. */}
  finally{if(dialog){const close=[...dialog.querySelectorAll<HTMLElement>('button,[role=button]')].find(b=>/^(close(?: image(?: viewer)?| preview| dialog)?|关闭(?:图片|预览|弹窗)?)$/i.test((b.getAttribute('aria-label')||b.getAttribute('title')||b.textContent||'').trim()));if(close)close.click();else dialog.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await pause();}focus?.focus?.({preventScroll:true});for(const s of scrolls){s.element.scrollLeft=s.left;s.element.scrollTop=s.top;}}
  result.groups.push({element:item.element,images:[...seen.values()].slice(0,100),expected:item.expected});
  if(seen.size<item.expected)result.warnings.push(`折叠图库未完整读取：预计 ${item.expected} 张，读取 ${seen.size} 张。请在原页面展开全部图片后重新导出。`);
 }
 return result;
}
