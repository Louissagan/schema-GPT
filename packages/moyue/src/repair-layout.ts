import {contentLayout,imageSourceLink} from './content-layout';
import {readCapturedField} from './control-data';
import {chartFromSVG} from './svg-chart';
import {legacyWidget} from './legacy-widgets';
import type {ComponentNode} from './component-model';
function flatten(nodes:ComponentNode[]):ComponentNode[]{return nodes.flatMap(n=>[n,...flatten(n.children||[])]);}
/** Content-independent upgrades for legacy presentation trees. No fixture titles or values. */
export function repairLayout(nodes:ComponentNode[],context?:{title:string;url:string}):ComponentNode[]{
 if(!context){let url='';for(const n of flatten(nodes).filter(n=>n.kind==='heading')){const t=document.createElement('template');t.innerHTML=n.html||'';const href=t.content.querySelector('a[href]')?.getAttribute('href');if(href){url=href;break;}}const title=nodes.find(n=>n.kind==='heading'&&n.level===1)?.html?.replace(/<[^>]*>/g,'')||'';context={title,url};}
 const repaired=nodes.map((node):ComponentNode=>{
  let n:ComponentNode={...node,...(node.children?{children:repairLayout(node.children,context)}:{}),...(node.rows?{rows:node.rows.map(row=>({...row,children:repairLayout(row.children,context)}))}:{})};
  if(n.kind==='container'&&n.attrs['data-moyue-part']==='inline-prose'&&n.children?.length===1&&n.children[0].kind==='container'&&n.children[0].attrs['data-moyue-part']==='inline-prose')n={...n,children:n.children[0].children};
  if(n.kind==='snapshot'){const chart=chartFromSVG(n.html||'');if(chart)return {kind:'widget',attrs:{},spec:chart};}
  if(n.kind==='layers'&&n.rows?.length&&n.rows.every(r=>r.children.some(c=>c.spec?.type==='file'||/role="link"|<a /i.test(c.html||'')))){
   return {kind:'container',attrs:{},layout:'stack',gap:0,card:true,children:n.rows.map(r=>{
    const packed=r.children.find(c=>c.spec?.type==='file');
    const title=r.title.replace(/<[^>]+>/g,'').slice(0,2000);
    const description=(r.children.find(c=>c.kind==='paragraph'&&!/role="link"|<a /i.test(c.html||''))?.html||'').replace(/<[^>]+>/g,'').slice(0,2000);
    if(packed?.spec?.type==='file')return {...packed,spec:{...packed.spec,title,description:description||packed.spec.description}};
    const t=document.createElement('template');t.innerHTML=r.children.map(c=>c.html||'').join(' ');
    return {kind:'widget',attrs:{},spec:{type:'file',name:title,src:t.content.querySelector('a[href]')?.getAttribute('href')||'',description}};
   })};
  }
  if(n.kind==='container'){const specialized=contentLayout(n);if(specialized)return specialized;
   const content=(n.children||[]).map(c=>(c.html||c.value||'').replace(/<[^>]*>/g,'')).join(' ');
   if(n.layout==='row'&&/复制|copy/i.test(content)&&/打开|open/i.test(content)&&/解释|explain/i.test(content)&&context?.title&&context.url){const data=document.createElement('template');data.innerHTML=flatten(n.children||[]).map(c=>c.html||'').join(' ');let explanation='';try{const value=JSON.parse(data.content.querySelector('[data-moyue-action-content]')?.getAttribute('data-moyue-action-content')||'null');if(typeof value==='string'&&value.length<=200000)explanation=value;}catch{}return {kind:'widget',attrs:{},spec:{type:'actions',items:[{action:'copy',label:'复制文档标题',text:context.title},{action:'open',label:'打开项目',url:context.url},{action:'toggle',label:explanation?'ⓘ 术语解释':'术语解释（内容未导出）',content:explanation||'原页面的解释内容未保存。请展开原文的解释面板再导出，或在结构化文档中提供明确的解释内容。'}]}};}
   // Old packages contain only the selected SVG. Keep missing states explicit.
   const stageControls=n.children?.[0];const stageImage=n.children?.[1];const options=stageControls?.children||[];
   if(n.card&&stageControls?.kind==='container'&&stageControls.layout==='row'&&options.length>=2&&options.length<=12&&options.every(c=>c.kind==='field'&&c.fieldType==='radio')&&options.filter(c=>c.checked).length===1&&(stageImage?.kind==='image'&&/\.svg(?:$|[?#])/.test(stageImage.src||'')||stageImage?.kind==='snapshot'&&stageImage.html?.includes('<svg'))&&(n.children||[]).slice(2).every(c=>['paragraph','text'].includes(c.kind))){
    const index=options.findIndex(c=>c.checked);const picture=document.createElement('img');if(stageImage.kind==='image')picture.setAttribute('src',stageImage.src||'');
    const html=(stageImage.kind==='snapshot'?stageImage.html:picture.outerHTML)+(n.children||[]).slice(2).map(c=>'<p>'+(c.html||'')+'</p>').join('');
    return {kind:'widget',attrs:{},spec:{type:'visual-states',selected:String(index),allowClear:true,states:options.map((c,i)=>({id:String(i),label:c.value||String(i+1),...(i===index?{html}:{})}))}};
   }
   const widget=legacyWidget(n);if(widget)return widget;
   // Legacy exports flattened block children of grids. Recover only repeated, complete
   // icon/title/description groups; arbitrary grids must retain their original cell order.
   if(n.layout==='grid'&&n.children&&n.children.length>=6&&n.children.length%3===0&&n.children.every((c,i)=>i%3===0?c.kind==='icon':i%3===1?c.kind==='paragraph':c.kind==='text')){
    const groups:ComponentNode[]=[];
    for(let i=0;i<n.children.length;i+=3)groups.push({kind:'container',attrs:{'data-moyue-layout':'stack'},layout:'stack',gap:8,children:n.children.slice(i,i+3)});
    n={...n,children:groups};
   }
   const own=n.children||[];
   const quote=own.findIndex(c=>c.kind==='quote');if(n.card&&quote>1&&!own.some(c=>c.kind==='rule')&&own[quote-1].kind==='paragraph'&&own[quote-2].kind==='paragraph')own.splice(quote-1,0,{kind:'rule',attrs:{}});const fields=own.filter(c=>c.kind==='field');const labels=own.filter(c=>c.kind==='text');
   if(n.layout==='row'&&fields.length===1&&labels.length===1&&own.length===2){const el=document.createElement('template');el.innerHTML=labels[0].html||'';return {...fields[0],value:el.content.textContent?.trim()||fields[0].value||''};}
   const flat=flatten(n.children||[]);const codes=flat.filter(c=>c.kind==='code');
   const charts=flat.filter(c=>c.kind==='widget'&&c.spec?.type==='chart');
   if(charts.length===1&&!n.card&&!flat.some(c=>['paragraph','text','image','field'].includes(c.kind)))return charts[0];
   if(charts.length>=1&&n.card&&!flat.some(c=>['image','field','code','table'].includes(c.kind))){let title='';const items:ComponentNode[]=[];for(const child of n.children||[]){if(child.kind==='paragraph'){const el=document.createElement('template');el.innerHTML=child.html||'';title=el.content.textContent?.trim()||'';}else{const chart=flatten([child]).find(c=>c.kind==='widget'&&c.spec?.type==='chart');if(chart?.spec?.type==='chart')items.push({...chart,spec:{...chart.spec,title:title||chart.spec.title}});}}if(items.length===charts.length)return {kind:'container',attrs:{},layout:'stack',gap:20,children:items};}
   if(codes.length===1&&n.card&&!flat.some(c=>['table','image','quote','field','heading'].includes(c.kind)))return codes[0];
   if(n.layout==='grid'&&!(n.children||[]).some(c=>c.kind==='container'&&c.layout==='row')&&flat.filter(c=>c.kind==='image').length>=2&&!flat.some(c=>['table','field','code','heading'].includes(c.kind))){
    const entries:ComponentNode[]=[];let image:ComponentNode|undefined;
    for(const child of flat){if(child.kind==='image'){image={...child};entries.push(image);}else if(image&&['text','paragraph'].includes(child.kind)&&child.html)image.caption=(image.caption?image.caption+'<br>':'')+child.html;}
    return {kind:'gallery',attrs:{},mode:'grid',columns:n.columns||2,children:entries};
   }
   // A single inline field inside a former P must be a real control, not inert HTML.
   if(n.children?.length===1&&n.children[0].kind==='container'&&!n.card&&n.layout==='stack'&&!Object.keys(n.attrs).length)n=n.children[0];
  }
  if(n.kind==='paragraph'||n.kind==='text'){
   const template=document.createElement('template');template.innerHTML=n.html||'';
   if(/^[↓↑→←↘↙]$/.test(template.content.textContent?.trim()||''))return {...n,attrs:{...n.attrs,'data-moyue-part':'flow-arrow'}};const fields=[...template.content.querySelectorAll('[data-moyue-field]')];
   if(fields.length===1&&(template.content.textContent||'').trim()===(fields[0].textContent||'').trim())return readCapturedField(fields[0]);
  }
  if(n.kind==='badge'&&!n.attrs['data-moyue-badge'])n.attrs={...n.attrs,'data-moyue-badge':'true'};
  return n;
 });
 const out:ComponentNode[]=[];
 for(const n of repaired){
  // Citation source rows follow their paragraph in old packages. Render them on that same line.
  const prev=out[out.length-1];const source=prev?.kind==='image'?imageSourceLink(n):undefined;if(source){out[out.length-1]={...prev,sourceLink:source};continue;}if(n.kind==='citation'&&prev?.kind==='paragraph'){out[out.length-1]={kind:'container',attrs:{'data-moyue-part':'inline-prose'},layout:'inline-row',children:[prev,n]};}else out.push(n);
 }
 return out;
}
