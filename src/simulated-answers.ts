export const starterQuestions = ['帮我规划一个预算 300 元的周末出游', '展示最近三个月的销售数据', '帮我列一个聚餐购物清单', '比较一下三种 Markdown 渲染方案'];
export type SimulatedAnswer = { markdown: string; code: string; scenario: string };
export function simulateAnswer(question: string): SimulatedAnswer {
  if (/旅行|出游|旅游|预算|周末/.test(question)) {
    const match = question.match(/(?:预算|改为|改成|调整到|调整为)\s*[¥￥]?\s*(\d+(?:\.\d+)?)/);
    const budget = Math.min(10000, Math.max(50, Number(match?.[1] ?? 300)));
    return { scenario:'预算出游', markdown:`可以。下面模拟一份 **预算 ${budget} 元的周末出游安排**。\n\n- 上午：公园散步与城市摄影\n- 中午：在附近用餐\n- 下午：参观展览、喝一杯咖啡\n\n拖动下方预算滑块，费用分配会实时更新。这里的地点和费用均为演示数据。`, code:`root = Card([Title("周末出游预算", "lg"), Text("拖动预算，费用会自动重新分配。", "sm", "muted"), Slider($budget, 50, 10000, 50, "总预算", "¥"), Table(["项目", "费用"], [["交通", "¥" + @Round($budget * 0.2)], ["午餐", "¥" + @Round($budget * 0.35)], ["展览", "¥" + @Round($budget * 0.25)], ["咖啡与备用", "¥" + @Round($budget * 0.2)]]), Badge("模拟规划 · 不含实时价格", "warning")])
$budget = ${budget}` };
  }
  if (/销售|数据|图表|收入/.test(question)) return {scenario:'销售图表',markdown:'这是一组 **最近三个月的模拟销售数据**。销售额从 12,000 元增长到 18,000 元。\n\n你可以在下方切换柱状图、折线图和面积图，检查数据是否保持一致。',code:`root = Card([Title("季度销售概览", "lg"), SegmentedControl($type, ["bar", "line", "area"]), Chart($type, rows, "month", ["销售额"], "currency", "CNY"), Table(["月份", "销售额", "订单数"], [["七月", "¥12,000", 60], ["八月", "¥15,000", 75], ["九月", "¥18,000", 90]]), Caption("固定模拟数据，不是实时经营数据")])
$type = "bar"
rows = [{month: "七月", 销售额: 12000}, {month: "八月", 销售额: 15000}, {month: "九月", 销售额: 18000}]`};
  if (/购物|聚餐|清单|采购/.test(question)) return {scenario:'购物清单',markdown:'给你准备了一份 **四人聚餐的模拟购物清单**。\n\n点击复选框，可以标记已购买的食材；完成数量会跟着变化。',code:`root = Card([Title("四人聚餐购物清单", "lg"), Checkbox($vegetable, "时令蔬菜 · 2 份"), Checkbox($protein, "豆腐或肉类 · 600 g"), Checkbox($rice, "大米 · 400 g"), Checkbox($fruit, "水果 · 1 份"), Badge("已购买 " + done + " / 4", done == 4 ? "success" : "neutral"), Button("重新开始", @Reset($vegetable, $protein, $rice, $fruit), "outline")])
$vegetable = false
$protein = false
$rice = false
$fruit = false
done = ($vegetable ? 1 : 0) + ($protein ? 1 : 0) + ($rice ? 1 : 0) + ($fruit ? 1 : 0)`};
  if (/Markdown|markdown|渲染|比较|表格/.test(question)) return {scenario:'方案对比',markdown:'可以，下面用表格模拟回答。\n\n| 方案 | 主要用途 | 交互能力 |\n| --- | --- | --- |\n| 基础 Markdown | 简单文档 | 静态展示 |\n| 视码 SCHEMA | 表格、代码、图片、公式 | 复制、图片放大 |\n| Open Intelligent UI | 图表、表单、交互工具 | 状态与数据联动 |\n\n**结论：** 如果只是舒适阅读，视码 SCHEMA适合；如果希望回答中有能操作的工具，可以使用 OpenUI。',code:'root = Card([Title("你更关注什么？", "md"), RadioGroup($goal, ["阅读体验", "交互工具"], "选择需求", "pills"), Text($goal == "阅读体验" ? "可以体验视码 SCHEMA的 Markdown 排版、代码复制和图片放大。" : "可以体验 OpenUI 的图表切换、表单输入和状态联动。"), Badge("模拟推荐", "info")])\n$goal = "阅读体验"'};
  return {scenario:'范围提示',markdown:'我收到了你的问题。这是一个 **预设场景问答演示**，不会调用真实 AI，也不会为任意问题生成答案。\n\n可以试试：\n\n1. 帮我规划一个预算 300 元的周末出游\n2. 展示最近三个月的销售数据\n3. 帮我列一个聚餐购物清单\n4. 比较一下三种 Markdown 渲染方案',code:'root = Card([Title("选择一个模拟场景继续", "md"), Text("在下方点选问题即可体验实际渲染与交互。", "sm", "muted")])'};
}
