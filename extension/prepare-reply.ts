/** Let existing lazy visuals load without clicking controls or opening hidden panels. */
export async function prepareReplies(roots:Element[],progress?:(text:string)=>void){
 const deadline=Date.now()+18000;const pause=(ms:number)=>new Promise<void>(r=>setTimeout(r,ms));
 const saved=new Map<Element|Window,{left:number;top:number}>();
 const remember=(target:Element|Window)=>{if(!saved.has(target))saved.set(target,target===window?{left:window.scrollX,top:window.scrollY}:{left:(target as Element).scrollLeft,top:(target as Element).scrollTop});};
 const scroll=(target:Element|Window,left:number,top:number)=>{remember(target);if(target===window)window.scrollTo({left,top,behavior:'instant'});else{(target as Element).scrollLeft=left;(target as Element).scrollTop=top;}};
 try{for(const root of roots){
  if(Date.now()>deadline)break;const rect=root.getBoundingClientRect();if(rect.height<1)continue;
  let parent=root.parentElement;while(parent&&!(parent.clientHeight>100&&parent.scrollHeight>parent.clientHeight+10&&/auto|scroll/.test(getComputedStyle(parent).overflowY)))parent=parent.parentElement;
  const port:Element|Window=parent||window;const height=parent?.clientHeight||window.innerHeight||800;
  const top=parent?rect.top-parent.getBoundingClientRect().top+parent.scrollTop:rect.top+window.scrollY;
  const end=top+Math.min(rect.height,60000);progress?.('正在加载回复中的轮播、图片和图解…');
  for(let y=top;y<end&&Date.now()<deadline;y+=Math.max(300,height*.8)){
   scroll(port,parent?.scrollLeft||window.scrollX,y);await pause(120);
   for(const track of root.querySelectorAll<HTMLElement>('div,section')){
    if(Date.now()>deadline)break;if(track.clientWidth<100||track.scrollWidth<=track.clientWidth+20||!/auto|scroll/.test(getComputedStyle(track).overflowX))continue;
    const b=track.getBoundingClientRect();if(b.bottom<0||b.top>window.innerHeight)continue;
    const old=track.scrollLeft;remember(track);for(let x=0;x<track.scrollWidth&&Date.now()<deadline;x+=Math.max(100,track.clientWidth*.9)){track.scrollLeft=x;await pause(80);}track.scrollLeft=old;
   }
  }
 }
 // Image completion is bounded; failed resources are reported by the normal exporter.
 const images=roots.flatMap(root=>[...root.querySelectorAll('img')]).filter(img=>!img.complete);
 if(images.length&&Date.now()<deadline)await Promise.race([Promise.all(images.map(img=>new Promise<void>(resolve=>{img.addEventListener('load',()=>resolve(),{once:true});img.addEventListener('error',()=>resolve(),{once:true});}))),pause(Math.min(1800,deadline-Date.now()))]);
 }finally{for(const [target,position] of [...saved].reverse()){if(target===window)window.scrollTo({left:position.left,top:position.top,behavior:'instant'});else{(target as Element).scrollLeft=position.left;(target as Element).scrollTop=position.top;}}}
}
