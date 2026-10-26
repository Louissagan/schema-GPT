// @vitest-environment jsdom
import {describe,it,expect} from 'vitest';
import {sanitizeHTML} from '../packages/moyue/src/html';
import {captureHTMLSnapshot as captureElements} from '../packages/moyue/src/extract';
import {exportFilename} from '../extension/export-name';
const icon='<svg width="1em" height="1em" viewBox="0 0 24 24"><path d="M2 2h20v20H2z"/></svg>';
function parse(s:string){const el=document.createElement('article');el.innerHTML=s;return el;}
describe('real export structure regressions (anonymized)',()=>{
 it('recognizes icon rows separated by empty dividers and nested semibold titles',()=>{
 const row=(n:number)=>`<div data-moyue-layout="row"><div>${icon}</div><div data-moyue-layout="stack" data-moyue-gap="0"><p><span data-moyue-weight="600">Layer ${n}</span></p><p>Description ${n}</p></div></div>`;
 const el=parse(sanitizeHTML(`<h1>Document</h1><div data-moyue-card="true">${[1,2,3].map(row).join('<div></div>')}</div>`));
 const card=el.querySelector('[data-moyue-group=layers]')!;expect(card.children).toHaveLength(3);expect(card.querySelectorAll('[data-moyue-part=row]')).toHaveLength(3);expect(card.querySelector('[data-moyue-part=title]')?.tagName).toBe('SPAN');
 });
 it('recognizes nested metric headings without adding them to the chapter outline',()=>{
 const el=parse(sanitizeHTML(`<h1>Document</h1><h2>一、Chapter</h2><div data-moyue-layout="grid" data-moyue-columns="3">${['12','03','24'].map(n=>`<div><div data-moyue-layout="stack">${icon}<h1 data-moyue-heading="2" role="heading" aria-level="2">${n}</h1><p>Count</p></div></div>`).join('')}</div>`));
 expect(el.querySelector('[data-moyue-group=metrics]')).toBeTruthy();expect(el.querySelectorAll('[data-moyue-part=metric-value]')).toHaveLength(3);expect(el.querySelectorAll('[data-moyue-heading="2"]')).toHaveLength(1);
 });
 it('recovers thumbnail rows with paragraph titles and empty separators',()=>{
 const row=(n:number)=>`<div data-moyue-layout="row"><div><div><img src="https://example.test/${n}.png"></div></div><div><p><span data-moyue-weight="600"><a href="https://example.test/${n}">Project ${n}</a></span></p><p>Description</p></div></div>`;
 const el=parse(sanitizeHTML(`<div>${[1,2,3,4,5,6].map(row).join('<div></div>')}</div>`));expect(el.querySelector('[data-moyue-group=repositories]')?.children).toHaveLength(6);expect(el.querySelectorAll('[data-moyue-part=thumbnail]')).toHaveLength(6);const again=parse(sanitizeHTML(el.innerHTML));expect(again.querySelectorAll('[data-moyue-part=thumbnail]')).toHaveLength(6);expect(again.querySelector('img')?.hasAttribute('data-moyue-part')).toBe(false);
 });
 it('retains editor line breaks, blank lines and indentation on legacy import',()=>{
 const el=parse(sanitizeHTML('<div role="textbox" aria-multiline="true" aria-label="编辑代码"><div><br></div><div>class Building:</div><div>    def report(self):</div><div>        return 42</div></div>'));
 expect(el.querySelector('pre code')?.textContent).toBe('\nclass Building:\n    def report(self):\n        return 42');expect(el.querySelector('[role=textbox]')).toBeNull();
 });
 it('captures custom checkbox state and inline typography before sanitization',async()=>{
 const el=parse('<div><button role="checkbox" aria-checked="true"></button><label>Done</label></div><p><span style="font-style:italic">Italic</span><span style="text-decoration:underline line-through">Decorated</span></p>');
 const result=await captureElements([el],'https://chatgpt.com/c/example','Example');const block=result.document.blocks[0];if(block.type!=='html')throw new Error();const html=parse(block.content);expect(html.querySelector('[data-moyue-check=true]')).toBeTruthy();expect(html.querySelector('[data-moyue-emphasis=italic]')?.textContent).toBe('Italic');expect(html.querySelector('[data-moyue-decoration="underline line-through"]')?.textContent).toBe('Decorated');
 });
 it('uses local date and zero-padded hours, minutes and seconds in export names',()=>{
 expect(exportFilename(new Date(2026,9,24,0,5,9))).toBe('chatgpt-2026-10-24_00-05-09.schema.zip');
 expect(exportFilename(new Date(2026,9,24,23,59,58))).toBe('chatgpt-2026-10-24_23-59-58.schema.zip');
 expect(exportFilename(new Date(2026,9,24,23,59,59))).not.toBe(exportFilename(new Date(2026,9,24,23,59,58)));
 });
});
