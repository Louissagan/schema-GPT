export const examples = {
  overview: `# 让内容，自然地被阅读。

好的排版不必引人注目。它让文字有呼吸，让复杂的信息变得清楚，让你专注于**内容本身**。

这是一份可以直接编辑的 Markdown。试着切换示例，或打开右上角的「编辑源码」，写下你的想法。

## 从细节开始

阅读的舒适感，藏在那些恰到好处的细节里：

- **清晰的层级**：标题、正文与注释，各有自己的节奏。
- **适度的留白**：段落之间留一点空间，思绪也能从容展开。
- **一致的体验**：文字、表格、代码和图片，说同一种视觉语言。

> 设计的目的，是让内容更容易被理解。

## 把信息，整理清楚

简洁的分隔线、舒展的单元格，让每一行信息都容易找到。表格超出屏幕时，可以横向滚动。

| 内容类型 | 呈现方式 | 适合的场景 |
| :--- | :--- | :--- |
| 正文与标题 | 自然行距 · 清晰层级 | 文章、笔记、对话 |
| 表格 | 轻量边框 · 横向滚动 | 参数比较、信息整理 |
| 代码块 | 语法高亮 · 一键复制 | 技术文档、开发教程 |
| 图片 | 自适应尺寸 · 点击放大 | 灵感收集、图文说明 |

## 代码，也可以很好读

行内代码像 \`renderMarkdown()\` 一样，轻轻地融入正文。大段代码有独立的空间，点击右上角即可复制。

\`\`\`javascript
// 让想法，变成清晰的表达
const reading = {
  typography: "舒适的阅读节奏",
  theme: "light",
  details: ["留白", "层级", "对比度"],
};

function createExperience(content) {
  return { ...reading, content };
}
\`\`\`

## 给画面，留一点空间

![山间湖泊 · 安静的留白，也是一种表达](/landscape.svg)

## 还有一些，值得记录

- [x] 找到舒服的字体与行距
- [x] 让表格和代码在手机上也能阅读
- [ ] 写下你的第一段内容

你也可以使用 *斜体*、~~删除线~~、[链接](https://www.markdownguide.org/)，或写下一个公式：

$$
E = mc^2
$$

---

从一段文字开始，让表达简单一点。
`,
  table: `# 信息，有条有理。

表格支持对齐、行内格式和横向滚动。试着编辑某个单元格。

| 功能 | 基础版 | 专业版 | 团队版 |
| :--- | :---: | :---: | :---: |
| Markdown 渲染 | ✓ | ✓ | ✓ |
| 语法高亮 | ✓ | ✓ | ✓ |
| 自定义主题 | — | ✓ | ✓ |
| 多人协作 | — | — | ✓ |
| 每月费用 | ¥0 | **¥29** | ¥99 |

## 对齐与格式

| 名称（左对齐） | 状态（居中） | 数量（右对齐） |
| :--- | :---: | ---: |
| **设计文档** | 已完成 | 12 |
| \`components/\` | 进行中 | 8 |
| 参考图片 | 已整理 | 36 |

> 在小屏幕上，表格会保留列宽；向左右滑动即可查看全部内容。
`,
  code: `# 代码，清晰可读。

自动识别已标注的编程语言；未识别的语言按纯文本显示。每个代码块都可以独立复制。

## JavaScript

\`\`\`javascript
async function fetchNotes() {
  const response = await fetch('/api/notes');
  if (!response.ok) throw new Error('读取失败');
  return response.json();
}
\`\`\`

## Python

\`\`\`python
from dataclasses import dataclass

@dataclass
class Note:
    title: str
    content: str

def welcome(name: str) -> str:
    return f"你好，{name}。开始记录吧。"
\`\`\`

## CSS

\`\`\`css
.reading {
  max-width: 720px;
  margin-inline: auto;
  line-height: 1.85;
  color: #242424;
}
\`\`\`

行内代码 \`const note = "你好"\` 也有自己的样式。
`,
  image: `# 画面，自然融入。

图片保留原始比例，自动适应内容宽度。点击图片可以放大，按 **Esc** 或点击关闭按钮返回。

![远山、湖水与一抹晨光](/landscape.svg)

*让图片周围的留白，成为阅读节奏的一部分。*

## 使用你自己的图片

打开「编辑源码」，将图片地址替换为你的图片链接：

\`\`\`markdown
![这是一段图片说明](https://example.com/your-image.jpg)
\`\`\`

也可以通过「导入文件」打开你自己的 Markdown 文档。相对图片路径需要在网站上有对应资源。
`,
};
export type ExampleKey = keyof typeof examples;
