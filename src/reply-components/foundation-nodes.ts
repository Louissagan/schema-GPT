import type {ComponentNode} from '../../packages/moyue/src/component-model';
const svg=(body:string)=>`<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
const file=svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h6"/>');
const images=svg('<rect x="7" y="3" width="14" height="14" rx="2"/><path d="M3 7v12a2 2 0 0 0 2 2h12M7 12l4-4 10 8"/>');
const sparkle=svg('<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5ZM3 3v4M1 5h4"/>');
export const layerNodes:ComponentNode[]=[{kind:'layers',attrs:{},rows:[
 {icon:file,title:'第一层：Markdown / 富文本渲染',children:[{kind:'paragraph',attrs:{},html:'标题、表格、代码块、引用、公式、列表、超链接、分割线等。'}]},
 {icon:images,title:'第二层：结构化内容与可视化组件',children:[{kind:'paragraph',attrs:{},html:'图片画廊、横向轮播、信息卡片、商品与地点展示、图表、地图、文件附件等。'}]},
 {icon:sparkle,title:'第三层：生成式交互界面（Generative UI）',children:[{kind:'paragraph',attrs:{},html:'模型根据问题组织界面，生成可以操作的按钮、表单、筛选器、计算器，以及能够随输入变化的可视化。'}]},
]}];
export const metricNodes:ComponentNode[]=[{kind:'metrics',attrs:{},metrics:[
 {icon:svg('<circle cx="6" cy="6" r="3.3"/><circle cx="17" cy="6" r="3.3"/><circle cx="6" cy="17" r="3.3"/><circle cx="17" cy="17" r="3.3"/>'),value:'12',label:'柱跨数量示例'},
 {icon:svg('<path d="m12 3 10 6-10 6L2 9ZM2 15l10 6 10-6M2 12l10 6 10-6"/>'),value:'03',label:'分析层级示例'},
 {icon:images,value:'24',label:'照片数量示例'},
]}];
