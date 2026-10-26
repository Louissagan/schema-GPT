/** Shared by popup inspection and export. Selectors are intentionally independent of one ChatGPT release. */
export const ASSISTANT = '[data-message-author-role="assistant"], [data-turn="assistant"], [data-role="assistant"], [data-author="assistant"], [data-testid="assistant-message"], [data-testid="assistant-turn"]';
const OTHER = '[data-message-author-role="user"], [data-turn="user"], [data-role="user"], [data-author="user"], [data-testid="user-message"], [data-message-author-role="system"], [data-message-author-role="tool"]';
const TURN = 'article, [data-testid^="conversation-turn"], [data-turn-id]';
const CONTENT = '.markdown, .prose, [data-message-content], [data-testid="message-content"], [data-testid="assistant-message-content"]';
const EXCLUDE = 'nav, aside, form, pre, code, [contenteditable="true"], [data-moyue-ui], [hidden], [aria-hidden="true"]';
export type ReplyCandidate = { element:Element; method:string };
export type ReplySummary = {key:string;label:string;origins:string[];method:string};

function roleLabel(el:Element) {return (el.getAttribute('aria-label')||'').trim();}
function userOwned(el:Element) {
  if(el.closest(OTHER))return true;
  const turn=el.closest(TURN);
  if(turn && !turn.matches(ASSISTANT) && turn.querySelector(OTHER) && !turn.querySelector(ASSISTANT))return true;
  return Boolean(turn && /^(you said|you:|你的消息|你说|您说|用户)/i.test(roleLabel(turn)));
}
function valid(el:Element) {
  return !el.closest(EXCLUDE) && !userOwned(el) && Boolean(el.textContent?.trim() || el.querySelector('img,canvas,svg'));
}
function rootsWithin(root:ParentNode) {
  const roots:ParentNode[]=[root];
  // Some versions put content inside open shadow roots. Closed trees cannot be inspected.
  for(let i=0;i<roots.length;i++) for(const el of roots[i].querySelectorAll('*')) if(el.shadowRoot)roots.push(el.shadowRoot);
  return roots;
}
export function detectReplies(root:ParentNode=document):ReplyCandidate[] {
  const candidates:ReplyCandidate[]=[];
  const add=(el:Element,method:string)=>{if(valid(el)&&!candidates.some(c=>c.element===el))candidates.push({element:el,method});};
  for(const scope of rootsWithin(root)) {
    scope.querySelectorAll('[data-moyue-picked="true"]').forEach(el=>add(el,'手动定位'));
    scope.querySelectorAll(ASSISTANT).forEach(el=>add(el,'消息角色'));
    scope.querySelectorAll(TURN).forEach(turn=>{
      if(userOwned(turn))return;
      const label=roleLabel(turn);
      if(/^(chatgpt|assistant|助手|chatgpt 说)/i.test(label) || turn.querySelector('[data-testid="copy-turn-action-button"], [data-testid="good-response-turn-action-button"]'))add(turn,'回复区块');
    });
    // A semantic content fallback is needed when author-role attributes are absent.
    // It never falls back to exporting the whole page or main container.
    scope.querySelectorAll(CONTENT).forEach(el=>{
      const turn=el.closest(TURN);
      if(turn && !userOwned(turn))add(turn,'正文区块');
      else if(!turn && el.closest('main, [role="main"], #thread, [data-testid="conversation"]'))add(el,'正文区块');
    });
  }
  // Keep the outer reply once, with images and cards outside its Markdown paragraph.
  const manual=candidates.filter(c=>c.method==='手动定位');
  const eligible=candidates.filter(c=>c.method==='手动定位'||!manual.some(m=>m.element.contains(c.element)||c.element.contains(m.element)));
  const deduped=eligible.filter(c=>!eligible.some(other=>other.element!==c.element&&other.element.contains(c.element)));
  const path=(el:Element)=>{const result:Element[]=[];let current:Element|null=el;while(current){result.unshift(current);current=current.parentElement||(current.getRootNode() instanceof ShadowRoot?(current.getRootNode() as ShadowRoot).host:null);}return result;};
  return deduped.sort((a,b)=>{const aa=path(a.element),bb=path(b.element);let i=0;while(i<aa.length&&aa[i]===bb[i])i++;if(!aa[i]||!bb[i])return 0;const relation=aa[i].compareDocumentPosition(bb[i]);return relation&Node.DOCUMENT_POSITION_FOLLOWING?-1:relation&Node.DOCUMENT_POSITION_PRECEDING?1:0;});
}
export function keyForReply(el:Element) {
  let key=el.getAttribute('data-moyue-reply-key');
  if(!key){key='reply-'+crypto.randomUUID();el.setAttribute('data-moyue-reply-key',key);}
  return key;
}
export function summarizeReplies(candidates:ReplyCandidate[]):ReplySummary[] {
  return candidates.map(({element,method},index)=>({key:keyForReply(element),label:`回复 ${index+1} · ${(element.textContent||'图片回复').trim().replace(/\s+/g,' ').slice(0,55)}`,method,origins:[...new Set([...element.querySelectorAll('img')].flatMap(img=>{try{const url=new URL(img.currentSrc||img.src);return /^https?:$/.test(url.protocol)?[url.origin+'/*']:[];}catch{return [];}}))]}));
}
export function pickCandidate(target:Element):Element|null {
  if(target.closest('[data-moyue-ui], nav, aside, form')||userOwned(target))return null;
  const candidate=target.closest(ASSISTANT)||target.closest(CONTENT)||target.closest('article, [role="article"], [data-testid^="conversation-turn"], [data-message-id]');
  if(candidate&&valid(candidate))return candidate;
  // Last resort is a visible content div under main, selected deliberately by the user.
  const main=target.closest('main, [role="main"], #thread');
  const block=target.closest('section, div');
  return main&&block&&block!==main&&valid(block)?block:null;
}
