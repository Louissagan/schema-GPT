import type { Message, Thread } from '@openuidev/react-ui';
export type ReplayMessage = Message & { replayMarkdown?:string; replaySource?:string; replayStatus?:string };
export const replaySources = [
  {id:'6adbadb5-9d38-83eb-ab9b-90d558e68adf',title:'介绍历史资料',status:'仅获得标题；公开数据超过读取工具大小上限'},
  {id:'6adbadd6-72c4-83ed-9de7-9f83f41ee5d7',title:'阅读作业准备',status:'公开接口可访问，但尚未完整导入正文'},
  {id:'6adbade8-46c4-83eb-8418-2e10cb6aecb8',title:'数学程序化证明',status:'公开接口可访问，但尚未完整导入正文'},
  {id:'6adbadf4-aed4-83ed-9bf3-49e1a51480dc',title:'规划适应性再利用作业',status:'公开接口可访问，但尚未完整导入正文'},
];
const sampleContent = [
  {question:'模拟示例：如何整理历史资料，区分原始材料与后来的解释？',answer:`## 先把材料整理成可核对的线索

这是一段**按分享标题编写的模拟内容，不是分享原文**，用于比较长段落、引用、表格与列表的显示效果。

| 材料类型 | 可以记录什么 | 核对重点 |
| --- | --- | --- |
| 原始文献 | 当时的文字、图纸与记录 | 时间、作者与保存来源 |
| 后续研究 | 学者对材料的分析 | 论证与原始证据的关系 |
| 现场资料 | 建筑与空间的现状 | 现状和历史状态的区别 |

> 把“材料说了什么”和“我怎样理解它”分开记录。

1. 为每份材料建立来源条目。
2. 摘录能够支持研究问题的内容。
3. 标出矛盾、空缺与需要继续核对的地方。

### 一个资料条目的结构

\`\`\`json
{
  "title": "示例历史资料",
  "date": "待核对",
  "source": "档案或出版物",
  "observation": "可直接观察到的事实",
  "interpretation": "研究者的解释"
}
\`\`\`

![资料整理 · 模拟配图](https://moyue-markdown-studio.rockypanda2.chatgpt.site/demo/city.svg)`},
  {question:'模拟示例：怎样把建筑阅读整理成一次课堂讨论？',answer:`## 从摘要走向讨论

这段回答是**按标题编写的模拟内容，不是分享原文**。用于检查标题、重点、表格和任务清单的渲染。

先用一两句话写下作者的核心问题，再区分作者主张、引用的证据和小组自己的应用。

| 环节 | 任务 | 演示时间 |
| --- | --- | ---: |
| 背景 | 提出阅读的问题 | 1 分钟 |
| 核心概念 | 解释两个重要概念 | 2 分钟 |
| 案例 | 用空间案例检查概念 | 3 分钟 |
| 讨论 | 提出开放问题 | 2 分钟 |

### 阅读完成后检查

- [x] 写出作者的核心论点
- [x] 找到支持论点的证据
- [ ] 核对引用的页码
- [ ] 准备小组自己的批评问题

> 案例可以帮助解释文章，也可能暴露文章概念的局限。

**讨论问题示例：** 当一座建筑保留原有的工业痕迹，却改变了公众进入和使用的方式时，我们应该如何描述它的变化？

---

以上页码和时间安排都需要根据实际课程要求调整。`},
  {question:'模拟示例：数学证明能不能交给程序检查？',answer:`## 可以：把证明写成可检查的形式

这是**根据对话主题编写的模拟回答，不是分享原文**。公式和代码用于对比两个渲染器。

需要区分三个概念：

| 方法 | 主要工作 | 人与程序的关系 |
| --- | --- | --- |
| 形式化证明 | 把命题与推理写成精确表达 | 程序检查证明 |
| 自动定理证明 | 搜索满足规则的推理路径 | 程序尝试找出证明 |
| 计算机辅助证明 | 用计算支持特定论证 | 人与程序分担步骤 |

例如，一个整数性质可以写成：

$$
\\forall n \\in \\mathbb{N},\\quad n + 0 = n
$$

下面是一段 Lean 风格的演示代码，展示证明的书写形式：

\`\`\`lean
example (n : Nat) : n + 0 = n := by
  simp
\`\`\`

**注意：** 当前网页只负责渲染这段代码，并没有运行 Lean 检查器。

### 放到建筑与城市问题中

可明确表达的距离约束可以写为：

$$
\\forall h \\in H,\\quad \\exists s \\in S:\\ d(h,s) \\leq 800
$$

它表达的是某个模型中的可达性约束；模型是否贴近现实，仍需要另外验证。`},
  {question:'模拟示例：如何组织一份建筑适应性再利用作业？',answer:`## 把现状、价值与新用途连接起来

这是**按分享标题编写的模拟作业框架，不是分享原文**，用于对比图文内容与信息层级。

### 1. 记录现有条件

记录结构、空间、材料、出入口和周边关系。将现场观察与文献结论分别标注。

### 2. 判断保留与改变

| 对象 | 保留理由 | 可能的干预 |
| --- | --- | --- |
| 主体结构 | 空间尺度与建造特征 | 修复、局部加固 |
| 原有立面 | 建筑的历史识别性 | 修补、可逆补充 |
| 内部空间 | 适应新用途的潜力 | 调整流线与设施 |
| 公共界面 | 与城市生活的联系 | 增加可达入口 |

> 不只说明“保留了什么”，还要说明新的使用方式如何回应现有条件。

### 3. 形成图纸与论证

- 现状与价值分布图
- 保留、拆除、新增的对照图
- 新旧流线与功能关系图
- 关键节点的前后对比

![再利用案例 · 本地模拟插画](https://moyue-markdown-studio.rockypanda2.chatgpt.site/demo/city.svg)

**提交前：** 核对课程任务书、引用来源与图片署名。本示例不替代具体课程要求。`},
];
export function markdownProgram(markdown:string){return `root = Col([Markdown(${JSON.stringify(markdown)})])`;}
export function seedReplayThreads(storage:Pick<Storage,'getItem'|'setItem'>){
  const threads:Thread[]=JSON.parse(storage.getItem('oiu:threads')||'[]');
  for(let i=replaySources.length-1;i>=0;i--){
    const source=replaySources[i],id=`replay-${source.id}`;
    if(threads.some(t=>t.id===id))continue;
    const sample=sampleContent[i];
    const messages:ReplayMessage[]=[{id:`${id}-question`,role:'user',content:sample.question},{id:`${id}-answer`,role:'assistant',content:markdownProgram(sample.answer),replayMarkdown:sample.answer,replaySource:`https://chatgpt.com/share/${source.id}`,replayStatus:'按主题模拟，非分享原文'}];
    storage.setItem(`oiu:messages:${id}`,JSON.stringify(messages));
    threads.unshift({id,title:`${source.title} · 模拟`,createdAt:new Date().toISOString()});
  }
  storage.setItem('oiu:threads',JSON.stringify(threads));
}
/** Import only visible user/assistant text; never persist system/tool/reasoning records. */
export function extractVisibleShare(data:unknown):{title:string;messages:ReplayMessage[]}{
  if(!data||typeof data!=='object')throw new Error('文件不是有效的对话 JSON。');
  const root=data as Record<string,any>;
  let nodes:any[]=Array.isArray(root.linear_conversation)?root.linear_conversation:[];
  if(root.mapping&&root.current_node){nodes=[];let id=root.current_node;const seen=new Set<string>();while(id&&root.mapping[id]&&!seen.has(id)){seen.add(id);nodes.unshift(root.mapping[id]);id=root.mapping[id].parent;}}
  if(!nodes.length&&Array.isArray(root.messages))nodes=root.messages.map((message:any)=>({message}));
  const messages:ReplayMessage[]=[];
  for(const node of nodes){const m=node?.message;if(!m||!['user','assistant'].includes(m.author?.role??m.role)||m.metadata?.is_visually_hidden_from_conversation||m.metadata?.is_redacted)continue;
    const role=m.author?.role??m.role;
    if(role==='assistant'&&((m.channel&&m.channel!=='final')||(m.recipient&&m.recipient!=='all')))continue;
    const content=m.content;let text='';
    if(typeof content==='string')text=content;else if(content&&['text','multimodal_text'].includes(content.content_type))text=(content.parts??[]).filter((p:unknown)=>typeof p==='string').join('\n\n');
    if(!text.trim())continue;
    messages.push(role==='user'?{id:crypto.randomUUID(),role:'user',content:text}:{id:crypto.randomUUID(),role:'assistant',content:markdownProgram(text),replayMarkdown:text,replayStatus:'从用户提供的文件导入的正文'});
  }
  if(!messages.length)throw new Error('没有找到可见的用户问答正文。');
  return {title:typeof root.title==='string'?root.title:'导入的对话',messages};
}
