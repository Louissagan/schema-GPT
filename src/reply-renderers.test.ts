import { expect, it } from 'vitest';
import { chartOption } from './reply-components/Charts';
import * as echarts from 'echarts/core';
import { LineChart, PieChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent, AriaComponent, ToolboxComponent } from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';
echarts.use([LineChart,PieChart,GridComponent,TooltipComponent,LegendComponent,AriaComponent,ToolboxComponent,SVGRenderer]);
for(const kind of ['line','pie'] as const)for(const dark of [false,true])it(`renders an actual ECharts ${kind} SVG in ${dark?'dark':'light'} mode`,()=>{
 const chart=echarts.init(null,null,{renderer:'svg',ssr:true,width:650,height:360});
 try{chart.setOption(chartOption(kind,dark,true));const svg=chart.renderToSVGString();expect(svg).toContain('<svg');expect(svg).toContain('<path');expect(svg).not.toContain('NaN');expect(svg).toContain(kind==='line'?'W3':'历史图纸');const option=chart.getOption() as {tooltip:{trigger:string;confine:boolean}[];toolbox:{feature:{saveAsImage:{type:string};dataView:{readOnly:boolean};restore:{show:boolean}}}[]};expect(option.tooltip[0].trigger).toBe(kind==='line'?'axis':'item');expect(option.tooltip[0].confine).toBe(true);expect(option.toolbox[0].feature.saveAsImage.type).toBe('svg');expect(option.toolbox[0].feature.dataView.readOnly).toBe(true);expect(option.toolbox[0].feature.restore.show).toBe(true);}finally{chart.dispose();}
});
