export type FoundationBlock={id:string;title:string;annotations:number[];note:string;markdown?:string;code:string};
export const sourceProject='https://github.com/thesysdev/open-intelligent-ui';
export const typography=`## 让内容清晰地被阅读

这是唯一的基础检查样例。用一小段正文观察**强调文字**、*斜体*、~~删除线~~与行内代码 \`renderBlock()\` 的层次。

### 一段正文，一个明确重点

段落之间留出舒适的间距；标题表达层级，分隔线区分内容。

> 保留必要的信息，让形式服务于阅读。

---

- 无序列表：检查缩进与项目符号。
- 包含 **强调** 的第二项。

1. 先阅读内容。
2. 再操作组件，检查是否有效。`;
export const tableMarkdown='| 模块 | 展示内容 | 状态 |\n| :--- | :--- | :---: |\n| 文字 | 标题、段落、强调 | 可检查 |\n| 图像 | 三张本地示意图 | 可检查 |\n| 数据 | 表格、交互图表 | 可检查 |';
export const codeSample='const blocks = ["text", "table", "image"];\n\nfunction renderPage(theme = "light") {\n  return blocks.map(type => ({ type, theme }));\n}';
export function foundationBlocks(origin:string):FoundationBlock[]{
  const url=(p:string)=>`${origin}${p}`;const md=(text:string)=>`root = Col([Markdown(${JSON.stringify(text)})])`;
  return [
    {id:'typography',title:'正文与层级',annotations:[1,14],note:'段落、标题、强调、引用、分隔线、列表与行内代码。',markdown:typography,code:md(typography)},
    {id:'math',title:'公式',annotations:[2],note:'行内公式与独立公式；整合版同时识别 ChatGPT 常用的数学分隔符。',markdown:'行内公式：\\( E = mc^2 \\)。\n\n\\[\nD \\models P_1 \\land P_2 \\land P_3\n\\]\n\n其中 \\( P_1(D) \\) 表示模型中的一个明确约束。',code:'root = Col([Text(["行内公式：", Math("E = mc^2", true)]), Math("D \\models P_1 \\land P_2 \\land P_3"), Caption("用独立 Math 组件展示公式")])'},
    {id:'citation',title:'引用来源',annotations:[3],note:'点击来源胶囊查看详情；链接指向真实的开源项目。',code:`root = Row([Text("组件实现参考开源项目。", "sm"), Popover(Badge("Open Intelligent UI ↗"), [Title("Open Intelligent UI", "sm"), Text("Thesys 开源交互组件库，MIT 许可证。", "sm", "muted"), Link("查看原始项目", "${sourceProject}")])], 2, null, null, true)`},
    {id:'table',title:'表格',annotations:[4,16],note:'检查单元格与长文本；整合版提供复制和展开。',markdown:tableMarkdown,code:md(tableMarkdown)},
    {id:'code',title:'代码',annotations:[5],note:'语言标签、语法高亮与复制；整合版提供展开查看。',markdown:'```javascript\n'+codeSample+'\n```',code:`root = Col([Code(${JSON.stringify(codeSample)}, "javascript")])`},
    {id:'gallery',title:'图片组',annotations:[3,15],note:'三张本地示意图，用于检查比例、圆角、留白和点击放大。',code:`root = Grid([Image("${url('/demo/city.svg')}", "城市示意图"), Image("${url('/demo/nature.svg')}", "自然示意图"), Image("${url('/demo/product.svg')}", "产品示意图")], 3, 140, 2)`},
    {id:'map',title:'地图',annotations:[3],note:'上游真实 Map 组件；底图依赖外部地图服务，连线不是道路导航。',code:'root = Col([Map([MapMarker("地点 A", 53.4808, -2.2426, "参考地点", "📍"), MapMarker("地点 B", 53.4852, -2.2346, "参考地点", "📍")], false, $place, 300), Caption("当前选择：" + $place)])\n$place = "地点 A"'},
    {id:'flow',title:'步骤与逻辑关系',annotations:[6,9],note:'用顺序、箭头和简短说明呈现关系。',code:'root = Card([Col([Label("01 · 阅读"), Title("理解现有条件", "sm"), Caption("记录事实与来源"), Text("↓", "lg", "muted", null, false, false, true), Label("02 · 分析"), Title("识别关键关系", "sm"), Caption("区分证据与解释"), Text("↓", "lg", "muted", null, false, false, true), Label("03 · 回应"), Title("提出下一步行动", "sm"), Caption("让判断可以被讨论")], 2, "center")])'},
    {id:'cards',title:'分层信息卡片',annotations:[7,8],note:'同一容器中区分三类内容；每层包含图标、标题与说明。',code:'root = Card([Row([Icon("file-text", "lg"), Col([Title("第一层 · Markdown / 富文本渲染", "sm"), Text("标题、表格、代码、引用、公式、列表与链接。", "sm", "muted")], 1)], 4), Divider(), Row([Icon("layout-grid", "lg"), Col([Title("第二层 · 结构化内容与可视化", "sm"), Text("图片组、信息卡片、图表、地图与文件附件。", "sm", "muted")], 1)], 4), Divider(), Row([Icon("mouse-pointer-2", "lg"), Col([Title("第三层 · 可交互界面", "sm"), Text("按钮、选项、状态，以及随输入变化的可视化。", "sm", "muted")], 1)], 4)])'},
    {id:'writing',title:'可复制的内容块',annotations:[10],note:'复制的是已排版的内容对应的纯文本。',code:'root = Card([Caption("写作"), Title("READING THE BUILDING", "lg"), Text("理解现有建筑，是形成下一步设计判断的开始。", "sm"), Button("复制内容", @CopyToClipboard("READING THE BUILDING\\n理解现有建筑，是形成下一步设计判断的开始。"), "outline", null, "sm", "copy")])'},
    {id:'choices',title:'交互选项',annotations:[11],note:'选择一个方向并提交，下方状态会随之更新。',code:'root = Card([Title("你希望优先检查哪一种体验？", "md"), RadioGroup($choice, [{value: "阅读排版", label: "阅读排版", description: "正文、表格、图片和公式"}, {value: "交互组件", label: "交互组件", description: "选项、图表与状态反馈"}], null, "cards"), Button("确认选择", @Set($confirmed, $choice), "solid", null, null, null, false, true), $confirmed == "" ? Caption("选择后点击确认。") : Badge("已确认：" + $confirmed, "success")])\n$choice = "阅读排版"\n$confirmed = ""'},
    {id:'artifact',title:'文件与操作卡片',annotations:[12,13],note:'含封面、标题、说明、指标和可用操作，使用真实的检查样例文件。',code:`root = Card([Image("${url('/demo/city.svg')}", "样例封面", 3), Title("基础块检查样例", "lg"), Text("用于检查下载与信息卡片，不是实际研究交付物。", "sm", "muted"), Row([Link("查看 Markdown", "${url('/files/basic-blocks.md')}"), Link("查看开源项目", "${sourceProject}")], 3), Divider(), Grid([Col([Title("1", "lg"), Caption("检查样例")], 1), Col([Title("18", "lg"), Caption("基础块")], 1), Col([Title("2", "lg"), Caption("文件格式")], 1)], 3, 70, 2)])`},
    {id:'metrics',title:'信息层级与指标分栏',annotations:[15,19,22],note:'用标签、数字、主说明和次要说明区分信息层级。',code:'root = Card([Grid([Col([Caption("检查项"), Title("18", "2xl"), Text("基础内容块", "sm", null, "semibold"), Caption("同一个样例中逐项检查")], 1), Col([Caption("主题"), Title("2", "2xl"), Text("浅色与深色", "sm", null, "semibold"), Caption("可以在同一页面对照")], 1)], 2, 150, 5)])'},
    {id:'linked-image',title:'带来源链接的图片',annotations:[17],note:'这是可点击的来源图片，与图片组中的“放大图片”操作区分。',code:`root = Col([Image("${url('/demo/city.svg')}", "带来源的本地示意图", 2.4), Link("图片来源：本地示意图 · 查看开源项目 ↗", "${sourceProject}")], 2)`},
    {id:'chart',title:'交互图表',annotations:[18],note:'切换柱状图和折线图；数值是固定模拟数据。',code:'root = Card([Row([Title("模拟检查数据", "md"), Spacer(), SegmentedControl($type, ["line", "bar"])], 2, null, null, true), Chart($type, [{label: "A", value: 12}, {label: "B", value: 31}, {label: "C", value: 56}], "label", ["value"], "number", null, false, 200), Caption("固定模拟数据；图表会响应切换与指针操作。")])\n$type = "line"'},
    {id:'svg',title:'可识别、可交互的 SVG',annotations:[21],note:'选择时间阶段，示意图中的新增体量随状态变化。',code:'root = Card([SegmentedControl($phase, ["1860", "2008", "2019"]), Svg([Rect(90, 70, 150, 100, "surface", "muted", 2), Path("M80 70L165 25L250 70", null, "muted", 3), $phase != "1860" ? Rect(25, 100, 55, 70, "info", "muted", 2) : null, $phase == "2019" ? Rect(245, 80, 50, 90, "warning", "muted", 2) : null, SvgText("阶段：" + $phase, 160, 200, 12, "muted", "middle")], "0 0 320 220"), Caption("仅演示 SVG 状态联动，不是建筑实测图。")])\n$phase = "1860"'},
    {id:'composition',title:'组合信息块',annotations:[16,20,23],note:'一个容器内组织示意图、双栏说明与结论。',code:`root = Card([Caption("一个容器，多种内容"), Image("${url('/demo/nature.svg')}", "组合块示意图", 3), Grid([Col([Label("观察"), Text("保留可以核对的事实。", "sm")], 1), Col([Label("解释"), Text("说明由事实形成的判断。", "sm")], 1)], 2, 140, 3), Divider(), Text("内容保持完整，视觉层级保持清楚。", "sm", null, "semibold")])`},
    {id:'downloads-status',title:'下载文件与状态反馈',annotations:[24,25],note:'提供真实 Markdown 与单页 PowerPoint 样例；不代表外部系统已执行任务。',code:`root = Card([Badge("检查样例已准备", "success"), Title("下载基础检查文件", "md"), Link("basic-blocks.md · Markdown", "${url('/files/basic-blocks.md')}"), Link("basic-blocks.pptx · PowerPoint", "${url('/files/basic-blocks.pptx')}"), Caption("文件由本检查样例生成，未调用 Canva 等外部服务。")])`},
  ];
}
