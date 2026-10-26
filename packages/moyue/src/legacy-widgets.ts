import type {ComponentNode} from './component-model';
import {widgetSchema,type WidgetSpec} from './widget-model';
const flat=(ns:ComponentNode[]):ComponentNode[]=>ns.flatMap(n=>[n,...flat(n.children||[])]);
function text(html=''){const t=document.createElement('template');t.innerHTML=html;return t.content.textContent?.trim()||'';}
export function legacyWidget(node:ComponentNode):ComponentNode|undefined{
 if(node.kind!=='container')return;const nodes=flat(node.children||[]);const html=nodes.map(n=>n.html||'').join(' ');
 if(/Use (two fingers|ctrl \+ scroll).*map/.test(html)){
  const t=document.createElement('template');t.innerHTML=html;const labels=[...t.content.querySelectorAll('span[aria-hidden=true]')].map(e=>e.textContent?.trim()||'').filter(Boolean);const names=[...new Set(labels)];if(names.length>=2&&names.length<=50)return {kind:'widget',attrs:{},spec:{type:'map',title:'地点地图',places:names.map(name=>{const target=[...t.content.querySelectorAll('span[aria-hidden=true]')].find(e=>e.textContent?.trim()===name);const category=target?.previousElementSibling?.textContent?.trim()||'';return {name,...(/\p{Extended_Pictographic}/u.test(category)?{category}:{})};})}};
 }
 const labelNodes=nodes.filter(n=>n.kind==='text'&&/<label/.test(n.html||''));if(!node.card||labelNodes.length<3)return;
 const fields:Extract<WidgetSpec,{type:'form'}>['fields']=[];
 const visit=(n:ComponentNode,span:1|2=2)=>{const children=n.children||[];const label=children[0]?.kind==='text'?text(children[0].html):'';if(label){const rest=flat(children.slice(1));const available=rest.filter(c=>c.kind==='field');const lower=label.toLowerCase();const id='field-'+fields.length;
  if(/segmented/.test(lower)&&available.length>=2){const options=available.map((f,i)=>({label:f.value||String(i+1),value:/table|表格/i.test(f.value||'')?'table':/card|卡片/i.test(f.value||'')?'card':f.value||String(i)}));fields.push({id,label,span,type:'segments',options,value:options[available.findIndex(f=>f.checked)]?.value||options[0].value});return;}
  if(/radio/.test(lower)&&available.filter(f=>f.fieldType==='radio').length>1){const radios=available.filter(f=>f.fieldType==='radio');const selected=radios.find(f=>f.checked);const options=radios.map(f=>({label:f.value||'',value:f.value||''}));if(selected){fields.push({id,label,span,type:'radio',options,value:selected.value||''});return;}}
  if(/radio/.test(lower)){const opts=rest.filter(c=>c.kind==='text'&&/data-moyue-field="radio"/.test(c.html||''));if(opts.length){fields.push({id,label,span,type:'radio',options:opts.map(c=>({label:text(c.html),value:text(c.html)})),value:text(opts.find(c=>/data-moyue-check="true"/.test(c.html||''))?.html||opts[0].html)});return;}}
  if(/slider/.test(lower)&&available.find(f=>f.fieldType==='range')){const f=available.find(f=>f.fieldType==='range')!;fields.push({id,label,span,type:'range',value:f.value||'0',min:f.min,max:f.max,step:f.step});return;}
  if(/slider/.test(lower)){const m=rest.map(c=>text(c.html)).join(' ').match(/([\d.]+)\s*\/\s*([\d.]+)/);if(m){fields.push({id,label,span,type:'range',value:m[1],min:0,max:Number(m[2]),step:1});return;}}
  if(/date\s*picker/.test(lower)){const values=rest.map(c=>text(c.html)).join(' ');const dates=[...new Set(html.match(/\b\d{4}-\d{2}-\d{2}\b/g)||[])];const direct=values.match(/\b\d{4}[-/]\d{2}[-/]\d{2}\b/)?.[0]?.replaceAll('/','-');fields.push({id,label,span,type:direct||dates.length===1?'date':'text',value:direct||(dates.length===1?dates[0]:values)});return;}
  if(available[0]){const f=available[0];fields.push({id,label,span,type:f.fieldType||'text',value:f.fieldType==='checkbox'?String(f.checked===true):f.value||'',...(f.options?{options:f.options}:{}),min:f.min,max:f.max,step:f.step});return;}
  if(/select/.test(lower)){const el=document.createElement('template');el.innerHTML=rest.map(c=>c.html||'').join(' ');const value=(el.content.querySelector('[data-moyue-field]')?.textContent||el.content.textContent||'').trim();if(value){fields.push({id,label,span,type:'text',value});return;}}
 }
 if(n.kind==='field'&&n.fieldType==='checkbox'){fields.push({id:'field-'+fields.length,label:n.value||'选项',type:'checkbox',value:String(n.checked)});return;}
 for(const c of children)visit(c,n.layout==='grid'&&n.columns===2?1:span);
 };visit(node);
 if(fields.length>=3){const heading=nodes.find(n=>n.kind==='heading');for(const field of fields){if(field.value&&field.value===text(heading?.html))field.role='title';else if(field.type==='textarea')field.role='description';else if(field.type==='radio'||/select/i.test(field.label))field.role='tag';}
 // Legacy snapshots can expose a current value without the underlying option list.
 // Never emit an invalid widget or invent hidden options; keep that visible value editable.
 const incomplete=fields.filter(field=>['select','radio','segments'].includes(field.type)&&(!field.options?.length||!field.options.some(option=>option.value===field.value)));
 for(const field of incomplete){field.type='text';delete field.options;}
 const title=nodes.find(n=>n.kind==='paragraph')?.html||'交互表单';
 const links=document.createElement('template');links.innerHTML=html;const reference=[...links.content.querySelectorAll('a[href]')].find(a=>/参考|reference/i.test(a.textContent||''));const referenceField=fields.find(f=>f.type==='checkbox'&&/参考|reference/i.test(f.label));if(referenceField&&reference)referenceField.role='reference';
 const parsed=widgetSchema.safeParse({type:'form',title:text(title),fields,...(reference?{reference:{label:reference.textContent?.trim()||'参考链接',url:reference.getAttribute('href')}}:{}),provenance:'基于包内可见字段重建本地预览；未导出的选项和原业务逻辑不在此预览中。'+(incomplete.length?' '+incomplete.map(f=>f.label).join('、')+'：选项未完整导出，保留当前可见值为文本字段。':'')});
 // An inference failure must preserve the original semantic tree, not abort the ZIP.
 if(parsed.success)return {kind:'widget',attrs:{},spec:parsed.data};}
}
