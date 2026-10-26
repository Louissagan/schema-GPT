# 2.2.4：通用内容布局复查

这次修复不检查文章题目、项目名称、年份或章节编号。生产代码只检查节点类型、重复结构、语义属性和安全地址。

| 类型 | 规则与结果 |
| --- | --- |
| 多图 | 使用节点声明的 2、3、4 列；修复全局 CSS 固定两列覆盖元数据的问题 |
| 键值资料 | 重复的短标签与强调值构成 facts/定义列表；支持标准 dl/dt/dd，不强行输出普通 table |
| 类表格 | 支持 ARIA table/grid/row/cell；不把普通散文或图文比较网格误识别成表格 |
| 字体与间距 | 正文行高 1.6，列表项紧凑排列；加粗统一 700，英语和数字不另行降低字重 |
| 链接 | 点线由链接本身统一绘制，移除捕获到的重复下划线包装；非链接下划线和删除线继续保留 |
| 图片来源 | 真实、相邻的简短来源徽标归属图片，呈现为图内悬浮链接；普通后续正文保持原样 |
| 图文记录 | 两条以上相同结构的缩略图—标题—说明组成紧凑列表，缩略图固定宽度、内容顶部对齐；不检查“第几章” |
| 图片查看 | 全屏浅/深主题、实际图片计数、前后切换、方向键、缩放、放大拖动、下载、Escape 关闭、焦点恢复 |

验证包含不同语言标签、任意数字和主题、2/3/4 列、多层图片包装、普通正文反例、图文比较网格反例、链接下划线保留/移除，以及真实图片字节下载。另对用户包进行私有的迁移/ZIP 往返/服务端渲染检查，上传内容不放入源码或公开示例。

上传的原包可以重新导入，无需为验证这些布局修复重新导出。实际可用图片之外的隐藏搜索结果、未保存的来源链接不会被编造。

当前工具没有可操作的登录浏览器，未宣称逐像素截图验收；DOM/结构验证不能代替真实浏览器中的最终视觉核对。

## 2.2.6 — Preserve nested layout boundaries

Component revision 5 preserves block children of grids and flex rows as independent
cells, including zero-gap vertical stacks. Explicit grids are no longer rewritten
as icon-row lists. Export records bounded text alignment, justification, complete
solid/dashed/dotted outlines and minimum heights for small placeholder panels.
Minimum heights allow text to expand on narrow screens; arbitrary page CSS is not
executed.

Revision 2–4 imports upgrade once. Legacy flattened grids are regrouped only when
all children form repeated icon / paragraph / text triples. This rule does not
inspect titles, subjects, dates or values. Ambiguous grids retain their order.
Old archives cannot recover alignment, border or dimensions that were never
exported; re-export with 2.2.6 for those properties. The archive extension, existing
routes and data fields remain compatible.

## 2.2.7 — Collapsed galleries and scoped preview

During explicit export, counted image-gallery controls within the selected reply
may be opened and advanced using their public next/close controls. Collection is
bounded to 30 seconds and 100 images per group; it avoids an existing user dialog,
closes the dialog it opened and restores focus/scroll. No private conversation API
is read. A partial result records expected/read counts in export warnings.
Only collected DOM image URLs are packed; failed downloads retain the normal
asset warning and external fallback. New domains may still need image permission.

Gallery/carousel viewers now own their navigation list. Tables own their inline
image group and standalone image tiles open independently. Repeated URLs in other
groups do not join those groups. Historical packages gain scoped previews when
rendered by this SDK, but missing hidden images require a new export.

## 多来源引用

来源标签悬浮或键盘聚焦时展开来源面板，指针进入面板不会关闭，离开后收起；Escape 可关闭。扩展仅在选定回复内尝试打开带 +N 的来源浮层，读取公开 DOM 中的链接，不访问内部接口。采集有时间上限；无法触发或读取不完整会记录报告。旧包没有保存的来源不能从数量标签恢复，需要重新导出。真实 ChatGPT 页面结构变化可能需要更新选择器。

## 2.2.7 — Reusable information lists (component revision 6)

Repeated image-plus-body rows support ordinary paragraph titles as well as
bold titles. The media-list variant fixes thumbnail size and aligns the text to
the top. Repeated title/value headers and descriptions use the detail-list
variant, with trailing metadata, separators and wrapping on narrow screens.
Both preserved wrappers and legacy alternating siblings are supported. Rules
inspect node relationships, not article titles, dates, names or monetary values.
Revision 2–5 documents migrate once; revision 6 is rendered directly.

## SVG 阶段切换

不再将单选阶段当作独立字段：分阶段图解组件使用一个共享选择状态，可切换或取消。扩展只对所选回复内、非表单、包含单个大型 SVG 的局部模块，采样显式 radio/tab 控件；原状态必须明确。最多 12 阶段，整体采样期限 20 秒，读取完成后恢复原选择。只有确认选中且图形/说明更新后的快照才标记为已保存；未响应、超时或缺失阶段明确报告。

这不是任意网页 JavaScript 的复制。远程数据、未挂载组件、无法访问的嵌入内容和自定义事件行为仍可能需要原应用提供结构化状态。当前验证覆盖模拟 DOM、状态切换、清理和 ZIP 往返，未在真实登录 ChatGPT 页面中实测。旧包没有保存的其他阶段必须重新导出。
