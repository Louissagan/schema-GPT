# SCHEMA Document v2

目标：导出时识别功能块并保存类型与数据，跨项目、跨主题调用同一套组件。不是复制一段网页 HTML 后在每次渲染时重新猜布局。

## 包结构

`.moyue.zip` 是 ZIP，根目录为 `document.json`，图片/附件在 `assets/`。扩展导出文件名使用设备本地时间：`chatgpt-YYYY-MM-DD_HH-mm-ss.moyue.zip`。

```json
{
  "format": "moyue-document",
  "version": 2,
  "title": "任意研究文档",
  "createdAt": "2026-10-24T14:00:00.000Z",
  "source": { "presentation": "moyue-components-v2" },
  "blocks": [{
    "type": "components",
    "nodes": [
      { "kind": "heading", "level": 1, "html": "任意标题" },
      { "kind": "paragraph", "html": "正文与 <strong>加粗</strong>" },
      { "kind": "metrics", "metrics": [
        { "icon": "", "value": "42", "label": "任意指标" }
      ] },
      { "kind": "code", "language": "python", "text": "print(42)" }
    ]
  }],
  "assets": [],
  "warnings": []
}
```

可让生成端直接输出此格式，无须插件再猜测页面结构。`attrs` 可省略，校验后默认 `{}`；只允许有限展示属性，未知值不会成为 DOM 属性。

## 语义节点

| kind | 数据 | 统一渲染行为 |
|---|---|---|
| heading | level 1..6、html | 标题层级与共享字号 |
| paragraph / text | html | 段落 / 行内富文本、链接、公式与文字装饰 |
| icon | html | 安全 SVG 小图标 |
| code | language、text | 共享代码高亮与复制；Mermaid 源码交给图解组件 |
| table | cells 二维数组 | 真实表格；每格 html、header、colSpan、rowSpan |
| quote | children | 引用 |
| list / item | ordered、start、children | 有序 / 无序列表与列表项 |
| rule | 无 | 分隔线 |
| image | src、alt、caption | 本地资源解析、图片与说明 |
| gallery | mode grid/carousel、columns、children | 图片网格 / 横向轮播 |
| layers | rows，每行 icon、title、children | 图标说明卡片；与手动示例共用组件 |
| metrics | metrics，每项 icon、value、label | 数字指标；与手动示例共用组件 |
| repositories / files | children | 缩略图链接列表 / 文件列表 |
| container | layout、gap、columns、card、children | 有限的行列布局 |
| field | fieldType、value、checked | 导出时的只读字段状态；不声称恢复原网页业务逻辑 |
| snapshot | html、reason | 无法可靠识别的组件；显示静态内容及原因 |

HTML 字段仅作为清理后的内容片段使用，不负责选择组件。渲染端按 `kind` 分派，不调用识别器，不执行原页面 JS、事件、任意 CSS 或自定义标签。

## 原生数据块

`markdown`、`image`、`gallery`、`mermaid`、`chart`、`file`、`custom` 继续可用。`chart` 使用 Apache ECharts，字段为 `kind: line|bar|pie`、`title`、`labels` 和 `series: [{name,values}]`，每条序列长度必须等于 labels。`mermaid` 使用源码 `content`。这些数据必须由生成端或已知适配器提供；不从图形像素编造数据。

`custom` 包含 `name` 与 Markdown `fallback`，宿主可通过 `renderCustom` 适配地图与业务工具。不存在公共数据的地图、图表、计算器、应用状态不会自动变成可操作原组件。DOM 导出保留可见快照，并在报告中说明。

## 识别与迁移

1. 插件读取当前已加载、由用户选择的回答，提取图片、计算文字装饰与布局，读取可见控件状态。
2. 识别器在导出边界把安全 DOM 转成语义节点。识别依据是结构、HTML 语义、ARIA 和有限布局属性，不匹配某篇回答的标题或正文。
3. 保存 v2 节点、资源清单、来源和 warnings。
4. 导入校验后直接交给统一组件。新文件不重新分析 HTML 以决定它是什么组件。

SDK 2.1.0 同时读取 v1 与 v2。旧版 HTML 通过显式 `migrateToComponents(document)` 一次转换；不修改输入对象。网站导入端自动执行这一步，另存为 v2。旧包未保存的样式、控件状态、隐藏数据无法恢复。SDK 1.x 无法读取 v2，接入方应升级 SDK；不把新节点塞进旧 version 1。

## 资源与安全边界

- 最多 50 MiB ZIP、80 MiB 展开内容、单资源 10 MiB、500 个资源、document.json 2 MiB。
- 仅接受 document.json 与 `assets/[A-Za-z0-9_-]+.ext`；拒绝路径穿越、重复资源、缺失资源和长度不符。
- 组件深度最多 32，总节点最多 12000；节点数组、表格行列等也受 Schema 限制。
- 链接和图片清理、SVG 局部 ID 隔离、外部 paint URL 清除、脚本和事件移除。仅为图片创建可显示的 Blob URL，附件不执行。
- 资源 resolver 不再使用时必须 dispose。
- 导出的 source URL 与正文仍属文档内容；插件在本地打包，不上传聊天内容。

完整机器约束见随包 `document.schema.json`，字段必填及跨字段约束以 SDK `validateDocument` 为准。


## 2.1.0 组件扩展

- `citation`: 必填 label、scope (`page` 原文地址 / `site` 仅来源站点 / `unavailable` 无地址)；可选 href、icon。目标 URL 必须来自 DOM 中的公开链接或 favicon 的公开域名，不能从标签文字猜测。
- `badge`: html 与有限的 tone 展示属性；短状态标签采用统一圆角底色。
- source.componentRevision = 2 表示来源标签兼容处理已完成；格式仍为 v2。SDK 2.0 不识别新增节点，接入项目请升级到 SDK 2.1。
- 章节分割线属于统一阅读格式；导出的真实分隔元素另外存储为 rule，渲染时不重复添加。


## 2.2.0：交互声明与资源协议

`source.componentRevision = 3` 表示布局与交互兼容处理已完成。新增节点 `{kind:"widget",attrs:{},spec:{...}}`，spec 使用 widget-model.ts 的受约束联合类型：

- chart：kind、title、labels、series，Apache ECharts 原生工具栏；可附 unit、provenance。
- mermaid：source，可选 darkSource。严格模式 Mermaid 生成后保留引擎自带样式，允许放大和下载。
- map：title、places（name、category、longitude/latitude、url、photo）。坐标缺失时点击“联网补全坐标”，唯一地名结果可补充并提示核对；歧义不自动定位。
- form：title、fields（id、label、type、value、options、min/max/step）。segments 的 card/table 值控制本地结果布局；不执行未知业务回调。
- actions：copy(label/text)、open(label/url)、toggle(label/content)。不接受脚本。
- file：name、src、description。明确的 file 声明会尝试打包实际附件字节；失败时保留已知地址并报告，不能从没有 href 的占位文字恢复文件。

生产端可在组件根元素设置 `data-moyue-widget={encodeWidget(spec)}`。编码器保留合法 JSON，同时把 XML 敏感字符编码为 Unicode 转义，避免 Mermaid 箭头或 HTML 说明在安全清理时被当成注释边界删除。只有校验成功的 spec 才成为交互组件。

SVG 图片资源以清理后的 `image/svg+xml` 保存；导入时再次清理。KaTeX 使用安全源码生成最终标记，不依赖随后会被 React 覆盖的 DOM 修改。上传包中的 SVG 快照始终经过安全清理；严格模式 Mermaid 自身生成的 SVG 使用引擎样式。

旧包 SVG 图表可保守重建可见数据：折线根据刻度和点坐标；扇形仅恢复百分比，不能恢复未提供的绝对总量。均带 provenance，不视为原始数据。详见 ISSUES-18.md。

### 2.2.1 兼容字段推断

旧页面或 DOM 快照只有单选/下拉/分段字段的当前值、缺少完整选项时，推断器保留可见值为可编辑文本并记录来源限制。生成的表单须先通过组件校验；无法安全重建时保留原组件树，避免阻断整份导出。显式结构化声明仍执行严格选项校验。

### 2.2.2 可见控件与资源

field 节点可携带 options: [{label,value}]，范围控件保留 min/max/step 与实时 value；下拉选项及 checked 必须在移除原控件前读取。data:image/svg+xml 的 UTF-8 / Base64 图像先读取并清理 SVG，再作为本地资源保存，不能直接放宽最终图片地址的安全白名单。已展开、可见且通过 aria-controls 或紧邻 aside 关联的解释可保存为 toggle 内容，移除的只是重复静态面板。file 组件新增可选 title/linkLabel，普通已知下载地址与声明式附件使用同一大小限制和打包流程。只有 onClick、没有地址/字节的入口必须注明缺失，不执行未知代码或猜测下载接口。

### 2.2.3：展示与采集

格式仍为 v2，componentRevision 仍为 3。重建来源说明保存在 spec.provenance 和功能块报告，不显示在图表正文下。静态 SVG 保留可验证的 rx/ry/stroke-dasharray 属性；没有 Mermaid 源码时保持原 SVG 的节点与连线，不根据示例名称改写拓扑。扩展导出前最多 18 秒滚动已选回复与可见横向滚动容器，触发现有懒加载，不点击未知按钮；结束恢复滚动位置。已知 CSS 背景图片可作为轮播资源打包。名称地图自动尝试唯一地名检索，成功坐标在本机缓存 30 天，重新导出该地图时坐标写入 widget 声明；歧义或失败不填假坐标。


### 2.2.4：内容布局，组件修订 4

读取 v1/v2 与组件修订 2/3 的文档仍受支持。新的 `source.componentRevision = 4` 表示已进行一次通用布局迁移。旧文档先迁移再渲染，渲染器不根据文章标题、章节编号或特定词句猜布局。

新增节点：`{kind:"facts",attrs:{},columns:2,entries:[{label:"字段",value:"<strong>值</strong>"}]}`，用于定义列表和反复出现的标签—值资料。1–4 列，最多 400 项，HTML 经同一清理边界处理。新文档需使用 2.2.4 或更新 SDK。

图片新增可选 `sourceLink: {href,label}`，仅存真实来源地址。相邻的简短来源徽标可在迁移时归属于图片，不把普通正文链接归入图片。

`list` / `item` 搭配受约束的 `data-moyue-part=media-list/media-row` 表示有序排列的缩略图记录；保留图片、标题、说明与链接，使用顶部对齐。普通比较网格保持网格，避免被错误改写为相册。

新增识别标准 HTML `dl/dt/dd` 与 ARIA table/grid/row/cell。图组按声明列数显示；列表和资料区不依赖具体语言。链接仅保留一层标准点线装饰，原文中非链接的下划线仍保留。

全屏图片查看器按当前文档中的实际可用图片分组并去重，支持前后切换、键盘、缩放、拖动、下载、关闭与焦点恢复。图片来源存在时在图上和查看器底部显示；不会为未导出的搜索图片或来源编造数量和地址。

### 2.2.6：组件修订 5

保留网格与 flex 单元边界，以及零间距纵向容器。新增受限展示属性：
`data-moyue-text-align`、`data-moyue-justify`、`data-moyue-outline`、
`data-moyue-min-height`；具体枚举见 presentation.ts。它们不接受任意 CSS。
修订 2/3/4 的文档在导入时迁移一次；修订 5 直接渲染。旧包已丢弃的
样式无法凭空恢复，新导出可保留这些信息。

## 多来源引用（2.2.8）

citation 节点可包含可选 sources 数组（最多 50 项），每项包含 label、href，以及可选 title、icon、date。旧 label/href 保持兼容。来源数组保留实际读取的链接，不根据 +N 推测地址。内联引用通过 data-moyue-source-items 保存同样的数组，导入时校验。
### 2.2.7：组件修订 6

新增 detail-list / detail-header / detail-description 展示语义，使用现有
list、item 和 container 节点。保留 media-list 图片条目的独立布局。
修订 2–5 在导入边界一次迁移，历史数据和资源路径保持兼容。

## 分阶段图解（2.2.10 / 组件修订 7）

widget spec.type 为 visual-states，states 是 2–12 个 {id,label,html?}，selected 为可选的已有 ID，allowClear 指定再次点选当前阶段是否取消。html 是经过清理的 SVG 与文字快照，不包含可执行脚本。缺少 html 表示该阶段未被采集，不允许以其他阶段图形补齐。ID 必须唯一。旧 revision 6 及更早数据保留已保存的单帧并标明其他阶段缺失。
