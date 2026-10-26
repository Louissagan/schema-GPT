import sampleImage from './portable-image.json';
import { createDocument, type DocumentBundle } from '../packages/moyue/src/document';
// One compact fixture covers the portable contract, without adding multiple chat examples.
const photo=Uint8Array.from(atob(sampleImage),c=>c.charCodeAt(0));
const note=new TextEncoder().encode('SCHEMA v1: 文档 + 本地图片 + 可移植渲染器。');
export const sampleBundle:DocumentBundle={document:{...createDocument('','基础块检查 · 可携带的回答'),blocks:[
 {type:'markdown',content:'这是一段普通文字，可以混合 **加粗**、*斜体*、~~删除线~~、`inline code` 和数学公式 \\(E=mc^2\\)。\n\n> 同一份文档，在不同项目中保持一致的阅读体验。\n\n| 模块 | 技术 |\n| --- | --- |\n| 正文与表格 | Markdown + GFM |\n| 图表 | Apache ECharts |\n\n- [x] 文档与主题分离\n- [ ] 导入你的第一份文档\n\n```js\nconst document = await importDocument(file);\n```'},
 {type:'html',content:'<p>富文本同样保留 <u>下划线</u>、<strong>强调</strong> 与 <a href="https://github.com/thesysdev/open-intelligent-ui">来源链接</a>。</p>'},
 {type:'chart',kind:'line',title:'研究资料积累量',labels:['W1','W2','W3','W4','W5'],series:[{name:'资料条目',values:[8,15,28,42,49]}]},
 {type:'mermaid',content:'flowchart LR\n A[ChatGPT 回复] --> B[文档包]\n B --> C[项目 A]\n B --> D[项目 B]'},
 {type:'image',src:'assets/hall.jpeg',alt:'随文档打包的建筑照片（来自此前上传的参考截图）'},
 {type:'gallery',images:[{src:'assets/hall.jpeg',alt:'图片集 · 同一个本地资源'}]},
 {type:'file',src:'assets/readme.txt',name:'文档说明.txt'},
 {type:'chart',kind:'pie',title:'资料分类',labels:['历史图纸','现场照片','历史文本','其他'],series:[{name:'数量',values:[35,30,20,15]}]},
 {type:'custom',name:'business-component',fallback:'业务地图、表单和专属卡片可以通过 `renderCustom` 接入；没有适配器时会显示这段后备内容。'}
],assets:[{path:'assets/hall.jpeg',mime:'image/jpeg',bytes:photo.length},{path:'assets/readme.txt',mime:'text/plain',bytes:note.length}]},files:{'assets/hall.jpeg':photo,'assets/readme.txt':note}};
