type DataViewOption = {
  xAxis?: { data?: unknown[] }[];
  series?: { type?: string; data?: unknown[] }[];
};
function cellValue(item: unknown): string {
  if (item && typeof item === 'object' && 'value' in item) return cellValue(item.value);
  return item == null ? '' : String(item);
}
/** ECharts' official read-only DataView hook; content comes from its current option. */
export function createChartDataView(option: DataViewOption): HTMLDivElement {
  const series = option.series?.[0];
  const pie = series?.type === 'pie';
  const wrapper = document.createElement('div');
  wrapper.className = 'reply-native-chart-table';
  const table = document.createElement('table');
  table.setAttribute('aria-label', pie ? '饼图数据表' : '折线图数据表');
  const header = table.createTHead().insertRow();
  for (const label of pie ? ['Name', 'Value'] : ['Week', 'Count']) {
    const th = document.createElement('th'); th.scope = 'col'; th.textContent = label; header.append(th);
  }
  const body = table.createTBody();
  for (const [index, item] of (series?.data ?? []).entries()) {
    const row = body.insertRow();
    const name = pie && item && typeof item === 'object' && 'name' in item ? item.name : option.xAxis?.[0]?.data?.[index];
    row.insertCell().textContent = cellValue(name);
    row.insertCell().textContent = cellValue(item);
  }
  wrapper.append(table);
  return wrapper;
}
