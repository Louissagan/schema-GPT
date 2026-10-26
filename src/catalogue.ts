import { programs, type Program } from '@/app/gallery/programs';
import { toolPrograms } from '@/app/gallery/tool-programs';
import { compositionPrograms } from '@/app/gallery/composition-programs';
import { exampleDashboard, exampleShoppingList, exampleSteps, exampleTrip } from '@/lib/prompt-options';
export const revision = '03213439358bf3408ad61a46ec9e3230c5572e48';
export const catalogue: (Program & {category:string})[] = [
  ...programs.map(p=>({...p,category:'基础组件'})),
  ...compositionPrograms.map(p=>({...p,category:'组合界面'})),
  ...toolPrograms.map(p=>({...p,category:'交互工具'})),
  ...[
    {id:'example-list',title:'Shopping list',note:'提示词中的购物清单示例。',code:exampleShoppingList},
    {id:'example-trip',title:'Composed trip',note:'图片、行布局与表单组合。',code:exampleTrip},
    {id:'example-steps',title:'Steps with drawings',note:'绘图随步骤状态切换。',code:exampleSteps},
    {id:'example-dashboard',title:'Dashboard',note:'通过 Query 调用模拟数据工具。',code:exampleDashboard},
  ].map(p=>({...p,category:'提示词示例'})),
];
export const translations: Record<string,[string,string]> = {
  answer:['图文回答','标题、正文、图片和信息卡片。'],text:['文字与排版','标题、行内标记、徽章、链接和 Markdown 表格。'],lists:['列表与时间线','项目符号、有序列表和带连接线的时间安排。'],buttons:['按钮与图标按钮','尝试按钮；向助手发送的事件显示在下方日志中。'],layout:['布局容器','行列、网格、卡片、Box、分隔线与留白。'],gdp:['滑块与状态绑定','拖动增长率和年数，查看 GDP 预测同步变化。'],segmented:['分段选择','切换选项，查看内容即时更新。'],checklist:['复选清单','勾选项目，观察完成数量变化。'],pressable:['可点击卡片','点击卡片，切换选中状态。'],inputs:['表单与输入','填写输入框、文本域和选择器，提交查看事件。'],svg:['动态 SVG 绘图','拖动曲柄角度，观察图形和数值联动。'],chart:['六种图表','切换柱、线、面积图；另有饼图、环图，组合示例含散点图。'],table:['富内容表格','表格单元格中可包含 Badge 等组件。'],images:['图片与搜索回退','模拟图片搜索、失效 URL 回退和空结果占位。'],map:['地图与地点联动','筛选地点、点击图钉和展开地图。底图依赖外部地图服务。'],html:['沙箱 HTML 游戏','点击 Start，在 15 秒内捕捉移动圆点。'],timer:['倒计时','选择预设时间，开始、暂停或重置倒计时。'],heatmap:['颜色插值','根据数值计算颜色，呈现热力色阶。'],icons:['动态图标','按名称加载 Lucide 图标。'], 'web-analytics':['网站分析仪表盘','日期范围、指标切换、渠道、漏斗和留存数据联动。'],'compare-phones':['手机对比','点击关注项，改变推荐结果。参数为上游示例数据。'],flashcards:['翻卡与答题','翻转词卡并完成测验；满分会触发庆祝动效。'],primitives:['扩展组件组合','轮播、Popover、Quote、Math、Code、RadioGroup、散点图、Flashcard、YouTube。'],recipe:['聚餐与购物清单','增减人数，食材数量同步计算；可勾选与复制清单。'],bill:['账单分摊','修改金额、人数和小费，结果实时计算。'],monty:['三门问题模拟','选择、换门并批量模拟 1,000 次游戏。'],savings:['储蓄计算器','修改本金、月存款和年限，图表与结果即时更新。'],'gdp-explained':['GDP 交互讲解','调整参数，理解经济数据关系。'],clt:['中心极限定理','改变样本参数，观察模拟分布。'],bicycle:['七速自行车','齿轮选择与交互图解。'],'bike-repair':['自行车组装指南','步骤切换、绘图与状态联动。'],route:['旧金山一日游','地图、景点与行程组合。'],roadtrip:['公路旅行计划','十天行程、地点卡片和交互地图。'],room:['房间配色','选择颜色，实时更新配色方案。'],origami:['折纸狐狸','切换步骤，查看 SVG 绘图指导。'],garden:['菜园规划','种植计划与参数联动。'],wardrobe:['胶囊衣橱','调整选择，组合穿搭建议。'],drones:['无人机市场分析','模拟市场数据、图表和业务比较。'],game:['复古街机游戏','在沙箱中运行上游的真实小游戏。'],'dash-sales':['销售仪表盘','Query 调用本地模拟订单，图表跟随筛选变化。'],'dash-support':['客服仪表盘','模拟工单、响应时长与分组统计。'],
};
export const titleOf = (p:Program) => translations[p.id]?.[0] || p.title;
export const noteOf = (p:Program) => translations[p.id]?.[1] || p.note;
