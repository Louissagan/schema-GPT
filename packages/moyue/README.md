# 视码 SCHEMA：多项目接入

## 1. 安装

将下载的 `moyue-document-kit-2.2.13.tgz` 放进任意 React 18/19 项目：

```sh
npm install ./moyue-document-kit-2.2.13.tgz
```

尚未发布到公共 npm 注册表；此命令安装本地包。包内含 ESM 构建、TypeScript 声明与源码。使用 Vite 等支持 CSS 导入的打包器。Next.js App Router 请放在 `'use client'` 组件内；不要在服务端执行 HTML 清理和资源 Blob 解析。

```tsx
import { useEffect, useMemo } from 'react';
import { DocumentRenderer, createAssetResolver, unpackDocument, migrateToComponents } from '@moyue/document-kit';
import '@moyue/document-kit/style.css';

// 上传入口：const bundle = unpackDocument(new Uint8Array(await file.arrayBuffer()));
function Reader({bundle}) {
  const assets = useMemo(() => createAssetResolver(bundle), [bundle]);
  useEffect(() => () => assets.dispose(), [assets]);
  return <DocumentRenderer document={migrateToComponents(bundle.document)} resolveAsset={assets.resolve} theme="light" />;
}
```

`theme="dark"` 为深色。两个实例传同一个文档即可并排对比。文档与主题分离。

只渲染 Markdown：

```tsx
import { createDocument, DocumentRenderer } from '@moyue/document-kit';
const document = createDocument('# 你好\n\n**加粗** 与 $E=mc^2$', '我的回答');
<DocumentRenderer document={document} theme="light" />
```

## 2. 原样复制整站到其他开源项目

源码 ZIP 包含此站所有源码（含原来的 OpenUI 对比、地图、表单等）、SDK、扩展、MIT 许可、上游许可证和 React 最小示例。已排除本站托管身份、Git 信息、node_modules 和构建输出。

```sh
npm ci
npm run test
npm run build:distribution
npm run build
# 将 dist/ 发布到自己的静态托管
```

`/?view=import`：文档工作台；`/openui-chat`：完整复刻示例；`/?view=blocks`：OpenUI 对比。项目中保留 vendor/OpenUI 的许可证。无需本站账号、API Key 或视码 SCHEMA服务器。地图外部底图、远程图片仍需要网络。

SDK 构建与声明生成：`npm run build:distribution`。分发产物位于 `public/downloads`。在代码更新后重跑该命令，再构建站点。下载文件未在 npm / Chrome Web Store 发布。

## 3. Chrome 扩展

1. 下载并解压 `schema-chrome-2.2.13.zip`。
2. 打开 `chrome://extensions`，开启开发者模式，点击“加载已解压的扩展程序”。
3. 选择包含 `manifest.json` 的目录。
4. 打开 ChatGPT 对话，展开卡片、滚动加载图片。点击扩展，选择一条或全部已加载助手回复。
5. 等待页面右下角完成提示，下载 `.moyue.zip`，在工作台上传。

默认仅使用 activeTab / scripting，点击后才读取当前页面。若勾选保存跨站图片，按所选回复中实际图片的域名请求可选访问权限；拒绝后仍会尝试页面内捕获。后台下载通道不携带跨站 Cookie，也不上传内容。可在扩展设置里撤销已授予的域名权限。内容脚本自带依赖，不使用远程脚本。首次加载不需要登录本网站。1.0.1 使用消息角色、对话区块、正文结构和开放 Shadow DOM 多种识别路径；弹窗与导出共享同一套定位逻辑，并按稳定标记匹配所选回复。自动识别失败时点击“重新扫描”或“在页面点选回复”；蓝框确认后单击正文，再打开扩展下载。旧版请替换目录中的文件并在 chrome://extensions 点击重新加载，确认弹窗显示 2.0.0。无法获取的图片会进入报告；可在原页另存并由集成方补入 assets。此版本未在用户的登录 Chrome 实测，不宣称商店审核通过。

## 4. 让 GPT 直接输出可交互文档

可将 FORMAT.md 与 document.schema.json 提供给生成端，要求：

> 按 SCHEMA Document Format v1 生成一个 JSON 对象。文本放 markdown 块，图表使用 chart（kind/labels/series），流程图用 mermaid，图片用 image。必须有 format/version/title/createdAt/blocks/assets/warnings。不要输出 JavaScript 函数，不要编造图片二进制或未提供的资源路径。缺失的资源写入 warnings。

将输出保存为 `.json` 上传；无图片资源时可以直接导入。带图片需打包 ZIP。普通 Markdown 也可直接粘贴。网页剪贴板 HTML 保留可见格式，内嵌图片仍受浏览器跨域限制。

## 5. 业务扩展与能力边界

`renderCustom(block)` 可根据 name 映射到项目组件。为组件管理状态、请求数据与授权的职责属于宿主项目；来自文档的字符串绝不能 eval。

```tsx
<DocumentRenderer document={doc} renderCustom={block =>
  block.name === 'research-form' ? <MyResearchForm/> : undefined
}/>
```

SDK 内置 Markdown、代码、公式、表格、HTML、图片/图片集、附件、Mermaid、ECharts 与 custom 回退。原站中的业务地图、表单、指标卡片、来源卡片组件仍位于 `src/reply-components`，完整源码可在多个项目复用；这些应用组件不是 Chrome 扩展自动重建的交互。扩展导出的 HTML 统一使用 SDK 字体与主题，不是整页像素截图或网页应用克隆。

## 6. 校验与排错

`validateDocument` 校验格式；`packDocument` / `unpackDocument` 执行资源和 ZIP 检查；`createAssetResolver` 管理 Blob URL。无效版本、缺失资源、非法路径和超限输入会明确报错。保留 document.warnings 给用户查看。导入不会持久化或上传；刷新页面前下载文档包。

自动测试覆盖文档往返、图片字节保留、恶意 HTML、路径穿越、版本与资源错误、DOM 导出顺序、公式、表格和主题渲染。上线前仍应在目标浏览器检查真实 ChatGPT DOM、扩展下载、图片跨域与长文性能。


## 1.0.2 导出 / SDK 1.0.1：保留排版

旧导出只留下去除 class 和 style 的 HTML，无法完整表达卡片和布局。现在导出先把页面的可读取布局转换为有限的 `data-moyue-*` 标记，保留行列、间距、卡片边界、字重、文字级别、图片组、代码语言和勾选状态。渲染器与手动调优页共用 reading.css；正文 16px、主标题 26px、章节 22px、表格 14px、代码 12px。

导入正文已经带标题时，不再额外输出会话名称。HTML 代码使用与 Markdown 相同的高亮和复制控件；有 Mermaid 源码时使用 Mermaid。静态 SVG 保留局部渐变 / 裁切 ID，并命名隔离；代码不会恢复原网页脚本。

旧包可根据保留下来的 DOM 结构恢复图标行卡片、指标和图片网格，并规范标题层级。**已经删除的原始样式和组件状态无法精确找回**；要保留更完整布局，请安装扩展 1.0.2 并重新导出。已有文件可以继续导入，格式仍为 SCHEMA v1。新导出标明 source.presentation = moyue-reading-v1。

这套转换统一使用视码 SCHEMA主题，不声称对任意网页做像素级复原。图表原始数据、地图服务与应用交互仍需原生块或业务适配器；静态捕获不会变成原网页的应用程序。


## 1.0.3 导出 / SDK 1.0.2：真实文档包修复

- 导出文件名使用设备本地时间，含秒：`chatgpt-2026-10-24_21-08-35.moyue.zip`。
- 兼容行间空 div 分隔符、嵌套数字指标与段落标题的缩略图列表。数字指标不再进入章节层级。
- 将标为代码的多行编辑器恢复为代码块，保留缩进、空行和换行。
- 新导出记录斜体、下划线、删除线，以及 ARIA checkbox/radio 的已知选中状态。
- 修复栈容器段落间距叠加和内嵌卡片标题尺寸。已有 1.0.2 包可重新导入恢复结构；未保存的装饰、控件状态和交互数据无法从旧包找回。

此修复使用实际导出包进行本地导入核对，并加入匿名化结构回归。没有将用户对话内容加入示例或源码发行包，也没有在用户 Chrome 会话中实测。


## 2.0.0：按功能块渲染

插件默认导出 SCHEMA v2 的 components 节点，不再把整条回答作为一个 HTML 块。新文档导入后直接按 kind 调用组件；旧 HTML 文档可在导入时执行一次 `migrateToComponents`，请缓存转换后的文档而非每次 render 转换。上面的示例仅演示入口。

`ComponentRenderer`、`ComponentNode`、`recognizeHTML`、`componentReport` 为公开 API。识别器运行在导出或旧包迁移阶段。生成端也可直接给出 v2 JSON，具体字段见 FORMAT.md；宿主可在自己的组件库中复用同一个 ComponentRenderer。手动示例的说明卡片与指标已经使用此组件。

表格保存单元格、图组保存排列方式、代码保存语言与文本，表单保存只读字段值；图表数据需要显式 chart 数据块。没有可验证原始数据的可视化保留 snapshot 并显示原因，不能承诺恢复第三方闭源交互。导入页提供识别数量和静态降级报告。

现有 v1 文件仍可读取，但 SDK 1.x 不支持 v2，请所有接入项目升级至 2.0.0。插件重新加载并刷新 ChatGPT 页后导出新包。


## 2.1.0：来源链接、徽标与分隔线

新增 citation / badge 语义节点。来源标签保存 label、icon、href 与 scope (page/site/unavailable)，仅当 DOM 存在真实地址时保存原文链接；否则可由 favicon 的公开域名得到来源站点，并明确注明不是原文地址。相同卡片中存在同域的真实主链接时，可将该链接作为来源目标。没有地址时提供说明按钮，不编造链接。

`migrateToComponents` 兼容 2.0.0 的“图标 + caption 行”与简短状态标签，执行一次后标记 source.componentRevision = 2。已有 2.0.0 包可直接重新导入。新版导出保留语义分隔元素与有实际绘制的细线；同级章节使用统一分割线格式。紧凑栈布局的标题由 gap 控制，避免叠加通用标题 margin。

这些属于通用结构修复，无按回答标题或网站名称硬编码的样式规则。手动示例与导入页共用 SourceCitation。发行前核对了用户实际 ZIP 的来源地址、徽标、章节规则和资源数量；没有可用浏览器截图工具，未进行逐页截图视觉验收。


## 2.2.13：保留交互，验证真实操作

使用 `WidgetRenderer` 与 `encodeWidget` 声明可移植 chart/mermaid/map/form/actions/file。参考页组件已经提供声明；插件保留初值和可获取附件字节，导入后使用 ECharts、Mermaid、MapLibre 与受约束的本地表单/动作，不执行复制来的网页脚本。

可下载完整参考验收包 `moyue-reference-2.2.13.moyue.zip` 检查完整数据往返；它从参考源码构建。真实用户旧包另行用于兼容检查，不纳入公开示例和源码分发。旧包缺失的文件/坐标/原业务逻辑有明确报告。地图地名检索由“联网补全坐标”按钮启动，需向 OpenStreetMap 发送地点名称，采用共享队列与缓存，仅唯一结果可补充坐标。

本次 18 项处理、保留范围和可选 AI 适配路径见 ISSUES-18.md。没有可用的真实浏览器截图工具，验证包括 DOM、交互事件、引擎初始化、数据/资源往返和构建，不能代替逐页截图验收。


生成端输出完整 SCHEMA 文档 JSON 时，网站粘贴入口可直接读取 JSON 或带 json 代码围栏的完整文档。必须显式包含 format = moyue-document 并通过 Schema；普通 JSON 示例仍作为普通内容。引用本地 assets 的文档仍需上传带附件的 ZIP。


2.2.13 使用组件修订 7，保留嵌套网格边界和受限布局属性，并兼容旧包的重复分组。facts 节点继续受支持。消费新导出包的其他项目请同步更新 SDK；旧版文档继续可读。导入时调用 migrateToComponents 一次，再交给 DocumentRenderer。也可通过 ImageViewerProvider 让自定义内容共用图片查看器。
