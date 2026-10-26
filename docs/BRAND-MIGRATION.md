# 视码 SCHEMA · 品牌迁移记录

## 范围与审计

迁移前工作区干净。首次仓库扫描得到 744 个匹配行（含重复生成文档与大量技术标识，并非 744 个界面文案）。先按用途分类再修改，未对 `moyue` 做全局机械替换。

| 位置 | 实际使用 | 处理 |
| --- | --- | --- |
| `src/DocumentStudio.tsx`, `ReplyReplica.tsx`, `FoundationLab.tsx`, `Lab.tsx`, `Legacy.tsx` | Logo、导航、页脚、产品名、下载显示 | 主标识 SCHEMA，中文辅助视码，完整介绍视码 SCHEMA |
| `src/SimulatedChat.tsx`, `ReplayChat.tsx`, `simulated-answers.ts`, `function-examples.ts` | 渲染器标签与项目自有示例名称 | 更新展示名称，保留内部 engine 枚举 |
| `src/portable-sample.ts` | 默认示例附件说明 | 更新文字，重新计算实际字节长度 |
| `extension/manifest.json`, `popup.html`, `content.ts` | 扩展管理名称、说明、Popup、通知、点选帮助 | 统一新品牌；权限与通信协议不变 |
| 四个网站 HTML 入口、React 接入示例 HTML | 浏览器标题与网站元数据 | 更新标题、description、Open Graph、Twitter、application-name、Apple 标题 |
| `public/reply/demo.html` | 自有独立演示标题 | 更新标题与元数据，正文和交互不变 |
| `README.md`, `docs/*`, SDK README/FORMAT 与下载文档 | 产品介绍、用户说明、格式名称 | 展示名称更新，技术示例保留兼容名称 |
| 项目自己的 LICENSE 与 SDK LICENSE | 项目 contributor 品牌署名 | 更新为 SCHEMA contributors，MIT 条款不变；第三方许可证未修改 |
| SVG、图标及 vendor | 没有旧品牌文字 Logo；包含第三方资源及历史参考截图 | 不重绘，不改第三方内容及历史参考图片 |

`brand-audit.json` 提供初始匹配文件清单与匹配行计数。源码中的测试故意包含旧品牌内容以验证历史数据兼容；本记录中提到旧名称用于审计说明，不属于当前产品 Logo 或文案。

## 保留的兼容性标识

- npm 包及导入路径：`@moyue/document-kit`，目录 `packages/moyue`，公开类型 `MoyueDocument` / `MoyueBlock`。
- 数据格式：`moyue-document`、`.moyue.zip`、`moyue-reading-v1`、`moyue-components-v2`，已有版本与字段不变。
- DOM/CSS 命名空间：`data-moyue-*`、`moyue-*`，以及扩展全局函数与 `moyue-image` 消息。
- localStorage、偏好与地图缓存键保持不变。
- 现有路由、站点域名与下载文件路径不变。新发行版为 2.2.5，旧扩展下载地址继续返回当前扩展。
- 历史 SDK、参考 ZIP 与已发布 2.2.4 源码包保留原始内容和地址，不伪造历史版本；它们可能保留历史品牌文字。当前 UI 只指向新版本。
- JSON Schema、Zod schema、schema.org 等普通技术用语没有更名。没有更改依赖版本，也没有新增权限。

## 验证方式与限制

执行现有 Vitest 测试、TypeScript 检查、SDK/扩展发行构建、打包扩展导出测试以及网站生产构建。新增品牌检查验证主要页面文本和中英文元信息，兼容检查验证旧文档、公开技术标识与扩展权限。

仓库没有 Lint 脚本或配置，不临时安装或声称执行 Lint。当前工具没有可操作的浏览器，不能宣称完成真实浏览器截图或 Console 验收；以服务器渲染、元数据与打包工作流检查代替，并明确此限制。

## 本次执行结果

- 当前界面/说明源码审计：97 个文件，0 个未分类的旧展示品牌；53 个文件中保留了兼容性引用或迁移记录。
- 自动化测试：33 个测试文件、558 项通过，包含页面品牌、中文/英文元数据、旧格式、存储/消息标识与权限检查。
- TypeScript、SDK、扩展发行构建与打包扩展工作流检查通过；旧扩展下载入口还会逐一检查名称、版本与权限一致性。
- 网站生产构建已通过；浏览器视觉与 Console 检查因工具不可用未执行。

## 扩展安装包名称（2.2.11）

新下载入口使用 schema-chrome-2.2.11.zip，扩展管理名称为「视码 SCHEMA · ChatGPT 文档导出」。历史 moyue-chrome 下载 URL 保留为同一新包的兼容别名。协议、存储键和 .moyue.zip 文档格式继续兼容；它们不用于扩展产品名称。已加载的解压扩展需覆盖文件后在 chrome://extensions 重新加载，Chrome 才会读取新名称。

## 文档文件名（2.2.12）

新导出文档采用 .schema.zip，保留年月日和时分秒。导入继续按 ZIP 内容校验，兼容历史 .moyue.zip；内部 format 标识、持久化键和公开协议不变。

## 官方 Logo（2.2.13）

使用用户提供的透明 PNG 横版与图形版；public/brand 保存原始设计与按比例缩放的网页/图标资源。横版用于各主页面和扩展弹窗，图形版用于 favicon、Apple 图标和 Chrome 扩展 16/32/48/128 图标。深色页头提供浅色底以保证原始深色字标可读，不改变 Logo 配色。
