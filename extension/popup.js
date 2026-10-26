const scope=document.querySelector('#scope');
const exportButton=document.querySelector('#export');
const refreshButton=document.querySelector('#refresh');
const pickButton=document.querySelector('#pick');
const status=document.querySelector('#status');
let tab;let replies=[];let scanning=false;
function emptyOption(label){scope.replaceChildren();const option=document.createElement('option');option.textContent=label;scope.append(option);scope.disabled=true;exportButton.disabled=true;}
async function getTab(){
 const [current]=await chrome.tabs.query({active:true,currentWindow:true});
 if(!current?.id)throw new Error('无法读取当前标签页，请重新打开插件。');
 const url=new URL(current.url||'');
 if(!['chatgpt.com','chat.openai.com'].includes(url.hostname))throw new Error('请在 ChatGPT 对话页面打开此扩展。');
 return current;
}
async function install(){await chrome.scripting.executeScript({target:{tabId:tab.id},files:['content.js']});}
async function scan(){
 if(scanning)return;scanning=true;refreshButton.disabled=true;pickButton.disabled=true;emptyOption('正在读取回复…');status.textContent='正在扫描当前页面…';
 try{
  tab=await getTab();await install();
  const [result]=await chrome.scripting.executeScript({target:{tabId:tab.id},func:()=>window.__moyueList(2500)});
  if(result.error)throw new Error(result.error.message||'页面读取失败');
  replies=result.result||[];
  if(!replies.length){emptyOption('未自动识别，请点选回复');status.textContent='自动扫描没有匹配到回复。可以重新扫描，或点击「在页面点选回复」手动定位。';return;}
  scope.replaceChildren();scope.disabled=false;
  for(const reply of replies){const option=document.createElement('option');option.value=reply.key;option.textContent=reply.label;scope.append(option);}
  scope.value=replies[replies.length-1].key;
  const all=document.createElement('option');all.value='all';all.textContent=`全部已加载回复（${replies.length} 条，仅助手）`;scope.append(all);
  exportButton.disabled=false;status.textContent=`找到 ${replies.length} 条回复。默认选择最后一条。`;
 }catch(error){emptyOption('页面读取失败');status.textContent=error.message||String(error);}
 finally{scanning=false;refreshButton.disabled=false;pickButton.disabled=false;}
}
refreshButton.addEventListener('click',scan);
pickButton.addEventListener('click',async()=>{
 try{tab=await getTab();await install();await chrome.scripting.executeScript({target:{tabId:tab.id},func:()=>window.__moyuePick()});window.close();}
 catch(error){status.textContent=error.message||String(error);}
});
exportButton.addEventListener('click',async()=>{
 exportButton.disabled=true;
 try{
  const selected=scope.value==='all'?replies:replies.filter(reply=>reply.key===scope.value);
  if(!selected.length)throw new Error('请先选择回复。');
  if(document.querySelector('#images').checked){const origins=[...new Set(selected.flatMap(reply=>reply.origins))];if(origins.length)await chrome.permissions.request({origins});}
  status.textContent='正在打包。进度显示在 ChatGPT 页面右下角，关闭弹窗也可以继续。';
  // Export keys identify the same DOM nodes inspected above; no second, different selector.
  const [result]=await chrome.scripting.executeScript({target:{tabId:tab.id},func:keys=>{window.__moyueExport(keys);},args:[selected.map(reply=>reply.key)]});
  if(result.error)throw new Error(result.error.message||'无法开始导出');
 }catch(error){status.textContent=error.message||String(error);}
 finally{exportButton.disabled=!replies.length;}
});
void scan();
