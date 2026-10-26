import {encodeWidget} from './widget-model';
/** Export known file addresses, never replay an opaque page click handler. */
export function markDownloadLinks(clone:Element,sourceURL:string){
 for(const link of clone.querySelectorAll('a[href],[role=link][data-href],[role=link][data-url]')){
  if(link.closest('[data-moyue-widget]'))continue;
  const raw=link.getAttribute('href')||link.getAttribute('data-href')||link.getAttribute('data-url')||'';
  let url:URL;try{url=new URL(raw,sourceURL);}catch{continue;}
  if(!/^(https?:|blob:)$/.test(url.protocol))continue;
  const name=link.getAttribute('download')||decodeName(url.pathname.split('/').pop()||'');
  const downloadable=link.hasAttribute('download')||/\.(?:html?|md|json|zip|csv|pdf|txt|xlsx?|docx?|pptx?|svg)$/i.test(name);
  if(!downloadable)continue;
  const label=link.textContent?.trim()||name;
  link.setAttribute('data-moyue-widget',encodeWidget({type:'file',name:name||'attachment',src:url.href,title:label,linkLabel:label}));
 }
}
function decodeName(value:string){try{return decodeURIComponent(value);}catch{return value;}}
/** Preserve already expanded information tied to a selected reply's disclosure button. */
export function captureDisclosures(root:Element,clone:Element){
 const originals=[...root.querySelectorAll('button,[role=button]')],copies=[...clone.querySelectorAll('button,[role=button]')];
 originals.forEach((button,i)=>{
  if(!copies[i]||button.closest('[data-moyue-widget]')||button.getAttribute('aria-expanded')==='false')return;
  const id=button.getAttribute('aria-controls');
  if(!id&&button.getAttribute('aria-expanded')!=='true'&&!/解释|explain|definition/i.test(button.textContent||''))return;
  let panel:Element|null=id?root.ownerDocument.getElementById(id):null;
  if(!panel){const sibling=button.parentElement?.nextElementSibling;if(sibling?.matches('aside,[role=note],[data-moyue-card],.reply-card'))panel=sibling;}
  if(!panel||panel.closest('[hidden],[aria-hidden=true]')||!panel.textContent?.trim()||panel.innerHTML.length>200000)return;
  try{for(let ancestor:Element|null=panel;ancestor&&ancestor!==root;ancestor=ancestor.parentElement)if(getComputedStyle(ancestor).display==='none')return;}catch{/* Semantic visibility checks still apply. */}
  copies[i].setAttribute('data-moyue-action-content',JSON.stringify(panel.innerHTML));
  // The same visible panel will be rendered by the imported toggle, once.
  if(root.contains(panel)){const index=[...root.querySelectorAll('*')].indexOf(panel);const twin=[...clone.querySelectorAll('*')][index];twin?.setAttribute('data-moyue-omit','true');}
 });
}
