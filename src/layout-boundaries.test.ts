// @vitest-environment jsdom
import {describe,it,expect} from 'vitest';
import {capturePresentation} from '../packages/moyue/src/presentation';
import {recognizeHTML} from '../packages/moyue/src/recognize';
import {repairLayout} from '../packages/moyue/src/repair-layout';
import type {ComponentNode} from '../packages/moyue/src/component-model';
const icon='<svg viewBox="0 0 24 24"><path d="M1 1L9 9"/></svg>';
describe('portable layout boundaries',()=>{
 it.each([2,3,4])('preserves %i grid cells with unstyled block children',columns=>{
  const html=`<div data-moyue-layout="grid" data-moyue-columns="${columns}">${Array.from({length:columns},(_,i)=>`<div>${icon}<p>Topic ${i}</p><span>Detail ${i}</span></div>`).join('')}</div>`;
  const n=recognizeHTML(html)[0];expect(n.children).toHaveLength(columns);expect(n.children?.every(c=>c.kind==='container'&&c.children?.length===3)).toBe(true);
 });
 it('captures zero-gap flex columns, centered text and bounded dashed panels',()=>{
  const root=document.createElement('article');root.innerHTML=`<div style="display:flex;flex-direction:column;gap:0px;align-items:center;justify-content:center;text-align:center;border:1px dashed gray;height:160px">${icon}<span>Any placeholder text</span></div>`;document.body.append(root);
  const clone=root.cloneNode(true) as Element;capturePresentation(root,clone);const p=clone.firstElementChild!;
  expect(p.getAttribute('data-moyue-layout')).toBe('stack');expect(p.getAttribute('data-moyue-outline')).toBe('dashed');expect(p.getAttribute('data-moyue-text-align')).toBe('center');expect(p.getAttribute('data-moyue-min-height')).toBe('160');expect(p.hasAttribute('data-moyue-rule')).toBe(false);root.remove();
 });
 it('repairs repeated flattened groups without changing text and is idempotent',()=>{
  const nodes:ComponentNode[]=[{kind:'container',attrs:{},layout:'grid',columns:3,children:Array.from({length:3},(_,i):ComponentNode[]=>[{kind:'icon',attrs:{},html:icon},{kind:'paragraph',attrs:{},html:`Unrelated ${i}`},{kind:'text',attrs:{},html:`Value ${i}`}]).flat()}];
  const result=repairLayout(nodes);expect(result[0].children).toHaveLength(3);expect(result[0].children?.flatMap(c=>c.children)).toEqual(nodes[0].children);expect(repairLayout(result)).toEqual(result);
 });
 it('does not group arbitrary flat grids',()=>{
  const n:ComponentNode={kind:'container',attrs:{},layout:'grid',columns:2,children:Array.from({length:6},()=>({kind:'paragraph',attrs:{},html:'cell'}))};expect(repairLayout([n])).toEqual([n]);
 });
});
