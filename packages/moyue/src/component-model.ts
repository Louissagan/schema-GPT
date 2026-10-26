import {citationSourcesSchema,type CitationSource} from './citation-data';
import {widgetSchema,type WidgetSpec} from './widget-model';
import {z} from 'zod';
const html=z.string().max(2*1024*1024);
const attrs=z.record(z.string(),z.string().max(2000)).default({});
export type ComponentNode={
 kind:'text'|'heading'|'paragraph'|'code'|'table'|'quote'|'list'|'item'|'rule'|'image'|'gallery'|'layers'|'metrics'|'repositories'|'files'|'container'|'snapshot'|'field'|'icon'|'citation'|'badge'|'widget'|'facts';
 entries?:{label:string;value:string}[];sourceLink?:{href:string;label:string};
 min?:number;max?:number;step?:number;options?:{label:string;value:string}[];
 spec?:WidgetSpec;
 fieldType?:'checkbox'|'radio'|'text'|'textarea'|'select'|'range'|'date'|'number';value?:string;checked?:boolean;
 sources?:CitationSource[];
 label?:string;href?:string;icon?:string;scope?:'page'|'site'|'unavailable';
 text?:string;html?:string;level?:number;language?:string;src?:string;alt?:string;caption?:string;
 layout?:'row'|'stack'|'grid'|'inline-row';columns?:number;gap?:number;card?:boolean;
 mode?:'grid'|'carousel';ordered?:boolean;start?:number;reason?:string;
 attrs:Record<string,string>;children?:ComponentNode[];
 rows?:{icon:string;title:string;children:ComponentNode[]}[];
 metrics?:{icon:string;value:string;label:string}[];
 cells?:{html:string;header:boolean;colSpan:number;rowSpan:number}[][];
};
/** Finite semantic tree. Arbitrary page tags/styles are never interpreted as component definitions. */
export const componentNodeSchema:z.ZodType<ComponentNode>=z.lazy(()=>{
 const children=z.array(componentNodeSchema).max(2000);
 return z.discriminatedUnion('kind',[
  z.object({kind:z.enum(['text','paragraph','icon','badge']),attrs,html}),
  z.object({kind:z.literal('heading'),attrs,html,level:z.number().int().min(1).max(6)}),
  z.object({kind:z.literal('code'),attrs,text:html,language:z.string().regex(/^[\w+-]{1,30}$/).optional()}),
  z.object({kind:z.literal('rule'),attrs}),
  z.object({kind:z.literal('widget'),attrs,spec:widgetSchema}),
  z.object({kind:z.literal('citation'),attrs,sources:citationSourcesSchema.optional(),label:z.string().max(2000),href:z.string().max(2000).optional(),icon:z.string().max(2000).optional(),scope:z.enum(['page','site','unavailable'])}),
  z.object({kind:z.literal('facts'),attrs,columns:z.number().int().min(1).max(4),entries:z.array(z.object({label:html,value:html})).min(1).max(400)}),
  z.object({kind:z.literal('image'),attrs,sourceLink:z.object({href:z.string().max(2000),label:z.string().max(2000)}).optional(),src:z.string().max(2000),alt:z.string().max(2000).optional(),caption:html.optional()}),
  z.object({kind:z.literal('table'),attrs,cells:z.array(z.array(z.object({html,header:z.boolean(),colSpan:z.number().int().min(1).max(1000),rowSpan:z.number().int().min(1).max(1000)})).max(200)).max(2000)}),
  z.object({kind:z.enum(['quote','item','repositories','files']),attrs,children}),
  z.object({kind:z.literal('list'),attrs,children,ordered:z.boolean().optional(),start:z.number().int().min(1).max(100000).optional()}),
  z.object({kind:z.literal('gallery'),attrs,children,mode:z.enum(['grid','carousel']).optional(),columns:z.number().int().min(1).max(4).optional()}),
  z.object({kind:z.literal('layers'),attrs,rows:z.array(z.object({icon:html,title:html,children})).max(100)}),
  z.object({kind:z.literal('metrics'),attrs,metrics:z.array(z.object({icon:html,value:z.string().max(100),label:html})).max(4)}),
  z.object({kind:z.literal('container'),attrs,children,layout:z.enum(['row','stack','grid','inline-row']).optional(),columns:z.number().int().min(1).max(4).optional(),gap:z.union([z.literal(0),z.literal(8),z.literal(12),z.literal(16),z.literal(20),z.literal(24)]).optional(),card:z.boolean().optional()}),
  z.object({kind:z.literal('snapshot'),attrs,html,reason:z.string().max(2000).optional()}),
  z.object({kind:z.literal('field'),attrs,options:z.array(z.object({label:z.string().max(2000),value:z.string().max(2000)})).max(100).optional(),min:z.number().finite().optional(),max:z.number().finite().optional(),step:z.number().positive().optional(),fieldType:z.enum(['checkbox','radio','text','textarea','select','range','date','number']),value:html.optional(),checked:z.boolean().optional()}),
 ]);
});
/** Check iterative bounds before Zod traverses an untrusted recursive tree. */
export function checkComponentBounds(input:unknown){
 if(!input||typeof input!=='object')return;const blocks=(input as {blocks?:unknown}).blocks;if(!Array.isArray(blocks))return;
 const stack:{value:unknown;depth:number}[]=blocks.filter(b=>b?.type==='components').flatMap(b=>Array.isArray(b.nodes)?b.nodes.map((value:unknown)=>({value,depth:0})):[]);let count=0;
 while(stack.length){const {value,depth}=stack.pop()!;if(++count>12000||depth>32)throw new Error('组件数量或嵌套层级超出限制');if(!value||typeof value!=='object')continue;const node=value as ComponentNode;for(const child of Array.isArray(node.children)?node.children:[])stack.push({value:child,depth:depth+1});for(const row of Array.isArray(node.rows)?node.rows:[])for(const child of Array.isArray(row?.children)?row.children:[])stack.push({value:child,depth:depth+1});}
}
export function componentReport(nodes:ComponentNode[]){const counts:Record<string,number>={};const reasons=new Set<string>();const visit=(n:ComponentNode)=>{counts[n.kind]=(counts[n.kind]||0)+1;if(n.reason)reasons.add(n.reason);if(n.kind==='widget'&&n.spec){counts[n.spec.type]=(counts[n.spec.type]||0)+1;if('provenance' in n.spec&&n.spec.provenance)reasons.add(n.spec.provenance);if(n.spec.type==='map'&&n.spec.places.some(p=>p.longitude===undefined||p.latitude===undefined))reasons.add('地图只保存了地点名称，需联网检索坐标；有歧义的地点不会自动定位。');if(n.spec.type==='file'&&!n.spec.src)reasons.add('原包未保存部分附件的字节或地址，无法从当前包恢复原文件。');}if(n.kind==='citation'&&n.scope==='site')reasons.add('部分来源未保存原文地址，链接仅打开来源站点，并在悬浮提示中注明。');if(n.kind==='citation'&&n.scope==='unavailable')reasons.add('部分来源没有保存可用地址，点击标签可查看说明。');n.children?.forEach(visit);n.rows?.forEach(row=>row.children.forEach(visit));};nodes.forEach(visit);return {counts,reasons:[...reasons]};}

export const COMPONENT_LABELS:Record<string,string>={facts:'键值资料',form:'表单',map:'地图',actions:'动作',widget:'交互组件',citation:'来源链接',badge:'徽标',heading:'标题',paragraph:'段落',text:'富文本',code:'代码',table:'表格',quote:'引用',list:'列表',item:'列表项',rule:'分隔线',image:'图片',gallery:'图片组',layers:'说明卡片',metrics:'指标',repositories:'链接卡片',files:'文件组',container:'布局',snapshot:'静态快照',field:'表单字段',icon:'图标',chart:'图表',mermaid:'图解',markdown:'Markdown',html:'旧版 HTML',file:'文件',custom:'自定义组件'};
