// @vitest-environment jsdom
import { expect, it } from 'vitest';
import { within } from '@testing-library/dom';
import { chartOption } from './reply-components/Charts';
import { createChartDataView } from './reply-components/chart-data-view';
it('formats the ECharts line DataView with headers and the current option values',()=>{
 const option=chartOption('line',false,true) as {toolbox:{feature:{dataView:{optionToContent:typeof createChartDataView}}}};
 const dom=option.toolbox.feature.dataView.optionToContent({xAxis:[{data:['W1','W2']}],series:[{type:'line',data:[99,{value:15}]}]});
 const table=within(dom).getByRole('table',{name:'折线图数据表'});
 expect(within(table).getAllByRole('columnheader').map(th=>th.textContent)).toEqual(['Week','Count']);
 expect(within(table).getAllByRole('row').map(row=>row.textContent)).toEqual(['WeekCount','W199','W215']);
 expect(dom.querySelector('textarea')).toBeNull();
});
it('formats the ECharts pie DataView in either theme without interpreting labels as HTML',()=>{
 for(const dark of [false,true]) {
  const option=chartOption('pie',dark,true) as {toolbox:{feature:{dataView:{optionToContent:typeof createChartDataView}}}};
  const dom=option.toolbox.feature.dataView.optionToContent({series:[{type:'pie',data:[{name:'历史图纸',value:35},{name:'<img src=x onerror=alert(1)>',value:15}]}]});
  expect(within(dom).getAllByRole('columnheader').map(th=>th.textContent)).toEqual(['Name','Value']);
  expect(within(dom).getByText('历史图纸')).toBeTruthy();expect(within(dom).getByText('35')).toBeTruthy();
  expect(dom.textContent).toContain('<img src=x onerror=alert(1)>');expect(dom.querySelector('img')).toBeNull();
 }
});
