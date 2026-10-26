// Cross-origin image download only after Chrome has granted that image origin.
chrome.runtime.onMessage.addListener((message,sender,reply)=>{
 if(message?.type!=='moyue-image')return;
 (async()=>{try{
  const page=new URL(sender.tab?.url||'');if(!['chatgpt.com','chat.openai.com'].includes(page.hostname))throw new Error('不支持的来源页面');
  let url=new URL(message.url);if(!['https:','http:'].includes(url.protocol))throw new Error('不支持的图片地址');
  const limit=10*1024*1024;let response;
  // Do not follow redirects into another origin without an explicit permission check.
  for(let n=0;n<4;n++){
   if(!await chrome.permissions.contains({origins:[url.origin+'/*']}))throw new Error('未获准访问图片域名');
   response=await fetch(url.href,{credentials:'omit',redirect:'manual',signal:AbortSignal.timeout(12000)});
   if(response.status>=300&&response.status<400){const next=response.headers.get('location');if(!next)throw new Error('图片重定向不可读取');url=new URL(next,url);continue;}break;
  }
  if(!response?.ok||!response.body)throw new Error('图片无法下载');
  const mime=(response.headers.get('content-type')||'').split(';')[0];if(!/^image\/(png|jpeg|gif|webp|avif|svg\+xml)$/.test(mime))throw new Error('不是支持的图片格式');
  if(Number(response.headers.get('content-length')||0)>limit)throw new Error('图片超过 10 MB');
  const reader=response.body.getReader();const chunks=[];let size=0;while(true){const p=await reader.read();if(p.done)break;size+=p.value.length;if(size>limit){await reader.cancel();throw new Error('图片超过 10 MB');}chunks.push(p.value);}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  let binary='';for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));
  reply({data:btoa(binary),mime});
 }catch(error){reply({error:error.message});}})();return true;
});
