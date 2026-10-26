import {NativeDiagram} from '../../packages/moyue/src/widgets';
export const answerFlow = `flowchart TB
  question("用户问题") --> choose("选择回答格式")
  choose --> text(["文本内容"])
  choose --> structured(["结构化内容"])
  choose --> external(["需要外部数据"])
  text --> markdown("Markdown 渲染")
  structured --> ui("UI 组件渲染")
  external --> search("搜索或工具调用")
  search --> ui
  markdown --> answer("最终回答")
  ui --> answer
  classDef primary fill:#e3f2ff,stroke:#d5e0e8,color:#075b9f,font-weight:bold
  classDef secondary fill:#f3f9ff,stroke:#cddfeb,color:#075b9f
  class question,markdown,ui,search,answer primary
  class text,structured,external secondary
  class choose secondary
  style choose stroke-dasharray:3 3`;
export function Diagram({theme}:{theme:string}){return <div className="moyue-document moyue-embedded" data-theme={theme}><NativeDiagram source={answerFlow} dark={theme==='dark'} darkSource={answerFlow.replaceAll('#e3f2ff','#19364a').replaceAll('#f3f9ff','#1b2b38').replaceAll('#075b9f','#b2daf9').replaceAll('#d5e0e8','#395165').replaceAll('#cddfeb','#395165')}/></div>;}
