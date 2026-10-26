import type {ComponentNode} from './component-model';
import {publicLink} from './source-components';
const plain=(html='')=>{const t=document.createElement('template');t.innerHTML=html;return t.content.textContent?.trim()||'';};
const emphasized=(n:ComponentNode)=>!!n.html&&(/<(strong|b)(\s|>)/i.test(n.html)||/data-moyue-weight="(?:600|650|700)"/.test(n.html));
const label=(n:ComponentNode)=>['paragraph','text'].includes(n.kind)&&plain(n.html).length>0&&plain(n.html).length<=100&&(n.attrs['data-moyue-size']==='caption'||n.attrs['data-moyue-tone']==='muted');
const pairs=(items:ComponentNode[])=>items.length>=2&&items.length%2===0&&items.every((n,i)=>i%2===0?label(n):['paragraph','text'].includes(n.kind)&&emphasized(n));
/** Recognize repeated structural relationships, never document names or topic words. */
export function contentLayout(node:ComponentNode):ComponentNode|undefined{
 if(node.kind!=='container'||node.card)return;
 const children=node.children||[];
 if(node.layout==='stack'&&children.length>=2&&children.length<=100&&children.every(c=>c.kind==='container'&&!c.card&&c.layout==='row'&&pairs(c.children||[]))){const width=(children[0].children?.length||4)/2;if(children.every(c=>(c.children?.length||0)/2===width)&&width<=4)return {kind:'facts',attrs:{},columns:width,entries:children.flatMap(c=>(c.children||[]).filter((_,i)=>i%2===0).map((l,i)=>({label:l.html||'',value:c.children![i*2+1].html||''})))};}
 if(node.layout==='grid'&&children.length>=2&&children.every(c=>c.kind==='container'&&!c.card&&c.children?.length===2&&pairs(c.children))){return {kind:'facts',attrs:{},columns:node.columns||2,entries:children.map(c=>({label:c.children![0].html||'',value:c.children![1].html||''}))};}
 // Repeated title/value headers plus descriptive bodies form a dedicated detail list.
 // Support both preserved item wrappers and legacy exports with alternating siblings.
 const header=(n:ComponentNode)=>n.kind==='container'&&n.layout==='row'&&!n.card&&n.children?.length===2&&n.children.every(c=>['paragraph','text'].includes(c.kind))&&emphasized(n.children[0]);
 const description=(n:ComponentNode)=>['paragraph','text'].includes(n.kind)&&plain(n.html).length>0;
 const row=(head:ComponentNode,body:ComponentNode):ComponentNode=>({kind:'item',attrs:{},children:[{...head,attrs:{...head.attrs,'data-moyue-part':'detail-header','data-moyue-justify':'space-between','data-moyue-align':'start'}},{...body,attrs:{...body.attrs,'data-moyue-part':'detail-description'}}]});
 if(node.layout==='stack'&&children.length>=4&&children.length%2===0&&children.every((c,i)=>i%2===0?header(c):description(c)))return {kind:'list',attrs:{'data-moyue-part':'detail-list'},ordered:false,children:children.filter((_,i)=>i%2===0).map((head,i)=>row(head,children[i*2+1]))};
 if(node.layout==='stack'&&children.length>=2&&children.every(c=>c.kind==='container'&&!c.card&&c.layout==='stack'&&c.children?.length===2&&header(c.children[0])&&description(c.children[1])))return {kind:'list',attrs:{'data-moyue-part':'detail-list'},ordered:false,children:children.map(c=>row(c.children![0],c.children![1]))};
 const thumbnail=(n:ComponentNode):ComponentNode|undefined=>n.kind==='image'?n:n.kind==='container'&&!n.card&&n.children?.length===1?thumbnail(n.children[0]):undefined;
 const mediaRow=(row:ComponentNode)=>{if(row.kind!=='container'||row.layout!=='row'||row.children?.length!==2||row.card)return false;const [image,body]=row.children;const first=body.children?.[0];return !!thumbnail(image)&&body.kind==='container'&&!body.card&&(body.children?.length||0)>=2&&!!first&&(first.kind==='heading'||emphasized(first)||(['paragraph','text'].includes(first.kind)&&plain(first.html).length>0&&plain(first.html).length<=200));};
 if(node.layout!=='grid'&&node.layout!=='row'&&children.length>=2&&children.length<=100&&children.every(mediaRow))return {kind:'list',attrs:{'data-moyue-part':'media-list'},ordered:false,children:children.map(row=>({kind:'item',attrs:{},children:[{...row,attrs:{...row.attrs,'data-moyue-align':'start','data-moyue-part':'media-row'},children:row.children?.map((c,i)=>i===0?{...thumbnail(c)!,attrs:{...thumbnail(c)!.attrs,'data-moyue-part':'thumbnail'}}:c)}]}))};
}
/** A small source badge immediately following its image belongs on that image. */
export function imageSourceLink(node:ComponentNode){
 if(!['paragraph','text'].includes(node.kind)||!node.html)return;
 const t=document.createElement('template');t.innerHTML=node.html;const anchors=[...t.content.querySelectorAll('a[href]')];if(anchors.length!==1)return;
 const a=anchors[0],text=a.textContent?.trim()||'';const href=publicLink(a.getAttribute('href')||'');
 if(!href||!text||text.length>100||t.content.textContent?.trim()!==text)return;
 if(a.getAttribute('data-moyue-badge')!=='true'&&a.getAttribute('data-moyue-size')!=='caption'&&node.attrs['data-moyue-size']!=='caption')return;
 return {href,label:text};
}
