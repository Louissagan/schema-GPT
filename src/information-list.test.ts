// @vitest-environment jsdom
import {it,expect} from 'vitest';
import {repairLayout} from '../packages/moyue/src/repair-layout';
import type {ComponentNode as N} from '../packages/moyue/src/component-model';
const p=(html:string,attrs={})=>({kind:'paragraph',attrs,html} as N);
for(const titles of [['Arbitrary item','Another item'],['设计进度','交付安排'],['α 01','β 02']])it(`recognizes unbold image-list titles: ${titles[0]}`,()=>{
 const rows=titles.map(title=>({kind:'container',attrs:{},layout:'row',children:[{kind:'image',attrs:{},src:'https://example.test/photo.jpg'},{kind:'container',attrs:{},layout:'stack',children:[p(title),p('Independent description')]}]} as N));
 const result=repairLayout([{kind:'container',attrs:{},layout:'stack',children:rows}]);expect(result[0].attrs['data-moyue-part']).toBe('media-list');expect(result[0].children).toHaveLength(2);expect(repairLayout(result)).toEqual(result);
});
for(const wrapped of [true,false])it(`recognizes information rows with wrapped=${wrapped}`,()=>{
 const groups=['Project A','Item B','计划 C'].map((name,i)=>[{kind:'container',attrs:{},layout:'row',children:[p(`<strong>${name}</strong>`),p(`Value ${i}`)]},p('Description',{ 'data-moyue-tone':'muted'})] as N[]);
 const children=wrapped?groups.map(children=>({kind:'container',attrs:{},layout:'stack',children} as N)):groups.flat();
 const result=repairLayout([{kind:'container',attrs:{},layout:'stack',children}]);expect(result[0].attrs['data-moyue-part']).toBe('detail-list');expect(result[0].children).toHaveLength(3);expect(repairLayout(result)).toEqual(result);
});
it('keeps ordinary prose and unrelated image comparisons unchanged',()=>{const nodes:N[]=[{kind:'container',attrs:{},layout:'stack',children:[p('A'),p('B'),p('C'),p('D')]},{kind:'container',attrs:{},layout:'grid',children:[{kind:'image',attrs:{},src:'https://example.test/a.jpg'},p('Comparison')]}];expect(repairLayout(nodes)).toEqual(nodes);});
