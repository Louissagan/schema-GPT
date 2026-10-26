// @vitest-environment jsdom
import {describe,it,expect,afterEach,vi} from 'vitest';
import {createElement} from 'react';
import {render,cleanup} from '@testing-library/react';
import {renderToStaticMarkup} from 'react-dom/server';
import {captureElements} from '../packages/moyue/src/extract';
import {recognizeHTML,migrateToComponents} from '../packages/moyue/src/recognize';
import {componentReport,type ComponentNode} from '../packages/moyue/src/component-model';
import {ComponentRenderer} from '../packages/moyue/src/ComponentRenderer';
import {DocumentRenderer} from '../packages/moyue/src/DocumentRenderer';
import {createDocument,packDocument,unpackDocument,validateDocument} from '../packages/moyue/src/document';
import {layerNodes,metricNodes} from './reply-components/foundation-nodes';
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();});
const svg='<svg viewBox="0 0 24 24"><path d="M2 2h20v20H2z"/></svg>';
const root=(html:string)=>{const el=document.createElement('article');el.innerHTML=html;return el;};
const flatten=(nodes:ComponentNode[]):ComponentNode[]=>nodes.flatMap(n=>[n,...flatten(n.children||[]),...n.rows?.flatMap(r=>flatten(r.children))||[]]);
describe('semantic export, archive, import and shared rendering',()=>{
 it.each(['建筑案例','Product research','另一篇完全不同的回答'])('recognizes arbitrary content once and serializes explicit types: %s',async title=>{
 const el=root(`<h1>${title}</h1><p>Normal <em>italic</em> and <u>underlined</u>.</p><div>${[1,2,3].map(n=>`<div><span>${svg}</span><div><strong>${title} ${n}</strong><p>Different description ${n}</p></div></div>`).join('<div></div>')}</div><pre><code class="language-python">x = 42\nprint(x)</code></pre><table><tr><th>Name</th><th>Value</th></tr><tr><td>A</td><td>42</td></tr></table>`);
 const bundle=await captureElements([el],'https://chatgpt.com/c/example',title);expect(bundle.document.version).toBe(2);expect(bundle.document.blocks.every(b=>b.type==='components')).toBe(true);const doc=unpackDocument(packDocument(bundle)).document;expect(doc).toEqual(bundle.document);
 const nodes=doc.blocks.flatMap(b=>b.type==='components'?b.nodes:[]);expect(componentReport(nodes).counts).toMatchObject({heading:1,layers:1,code:1,table:1});expect(flatten(nodes).find(n=>n.kind==='code')?.language).toBe('python');
 const {container}=render(createElement(DocumentRenderer,{document:doc}));expect(container.querySelector('[data-component=layers]')?.textContent).toContain(title+' 3');expect(container.querySelector('table')?.textContent).toContain('A42');expect(container.querySelectorAll('h1')).toHaveLength(1);
 });
 it('renders reference data and its exported/imported result through the same component implementation in both themes',async()=>{
 const reference=root(renderToStaticMarkup(createElement(ComponentRenderer,{nodes:[...layerNodes,...metricNodes]})));
 const doc=unpackDocument(packDocument(await captureElements([reference],'https://chatgpt.com/c/reference','reference'))).document;
 for(const theme of ['light','dark'] as const){const before=render(createElement('article',{className:'moyue-document','data-theme':theme},createElement(ComponentRenderer,{nodes:[...layerNodes,...metricNodes]})));const expected=before.container.querySelector('[data-component=layers]')?.textContent;const values=[...before.container.querySelectorAll('[data-moyue-part=metric-value]')].map(e=>e.textContent);before.unmount();const after=render(createElement(DocumentRenderer,{document:doc,theme}));expect(after.container.querySelector('[data-component=layers]')?.textContent).toBe(expected);expect([...after.container.querySelectorAll('[data-moyue-part=metric-value]')].map(e=>e.textContent)).toEqual(values);after.unmount();}
 });
 it('preserves rich table cells, spans, links and images as table data',()=>{
 const nodes=recognizeHTML('<table><tr><th colspan="2">Header</th></tr><tr><td><a href="https://example.test">Site</a></td><td><img src="assets/photo.png" alt="Photo"></td></tr></table>');expect(nodes[0].kind).toBe('table');expect(nodes[0].cells?.[0][0].colSpan).toBe(2);const {container}=render(createElement(ComponentRenderer,{nodes,resolveAsset:p=>p==='assets/photo.png'?'blob:test':undefined}));expect(container.querySelector('img')?.src).toBe('blob:test');expect(container.querySelector('th')?.colSpan).toBe(2);
 });
 it('migrates old HTML once without mutating the original or repeatedly guessing typed documents',()=>{
 const original={...createDocument(),version:1 as const,blocks:[{type:'html' as const,content:'<h1>Legacy</h1><p>Text</p>'}]};const upgraded=migrateToComponents(original);expect(upgraded.version).toBe(2);expect(original.version).toBe(1);expect(original.blocks[0].type).toBe('html');expect(migrateToComponents(upgraded)).toBe(upgraded);expect(validateDocument(upgraded)).toEqual(upgraded);
 });
 it('keeps unknown visualizations as explicit snapshots and explains their limits',()=>{
 const nodes=recognizeHTML('<h1>Chart</h1><svg viewBox="0 0 640 300"><text x="20" y="20">Data unavailable</text></svg>');expect(componentReport(nodes).counts.snapshot).toBe(1);expect(flatten(nodes).some(n=>n.kind==='metrics')).toBe(false);const {container}=render(createElement(ComponentRenderer,{nodes}));expect(container.textContent).toContain('静态快照');expect(container.querySelector('svg')).toBeTruthy();
 });
 it('validates semantic data and rejects executable fragments and arbitrary layout attributes on render',()=>{
 expect(()=>validateDocument({...createDocument(),blocks:[{type:'components',nodes:[{kind:'metrics',attrs:{}}]}]})).toThrow();const nodes:ComponentNode[]=[{kind:'paragraph',html:'<img src="javascript:alert(1)" onerror="alert(1)"><script>alert(1)</script>Safe',attrs:{constructor:'invalid',toString:'invalid',style:'position:fixed',onclick:'alert(1)','data-moyue-gap':'999'}}];const {container}=render(createElement(ComponentRenderer,{nodes}));expect(container.innerHTML).not.toMatch(/javascript:|onerror|onclick|position:fixed|data-moyue-gap/);
 });
 it('exports field types and their current values without reconstructing application behavior',async()=>{const el=root('<label>Task</label><button role="checkbox" aria-checked="true"></button><input type="text" value="Current"><textarea>Note</textarea><select><option selected>Choice</option></select>');const doc=(await captureElements([el],'https://chatgpt.com/c/fields','Fields')).document;const nodes=doc.blocks.flatMap(b=>b.type==='components'?b.nodes:[]);const fields=flatten(nodes).filter(n=>n.kind==='field');expect(fields.map(n=>n.fieldType)).toEqual(['checkbox','text','textarea','select']);expect(fields[0].checked).toBe(true);expect(fields[1].value).toBe('Current');const {container}=render(createElement(DocumentRenderer,{document:doc}));expect(container.querySelector('input[type=checkbox]')?.hasAttribute('disabled')).toBe(false);expect(container.querySelector('textarea')?.value).toBe('Note');});
 it('keeps card titles local instead of promoting them to document H1',()=>{const nodes=recognizeHTML('<div data-moyue-card="true"><h1>Card title</h1><p>Body</p></div>');const headings=flatten(nodes).filter(n=>n.kind==='heading');expect(headings[0].level).toBe(4);const doc={...createDocument('','Document title'),blocks:[{type:'components' as const,nodes}]};const {container}=render(createElement(DocumentRenderer,{document:doc}));expect(container.querySelector('h1')?.textContent).toBe('Document title');expect(container.querySelector('h4')?.textContent).toBe('Card title');});
 it('rejects excessive recursive depth before schema traversal',()=>{
 let node:ComponentNode={kind:'text',html:'x',attrs:{}};for(let i=0;i<40;i++)node={kind:'container',attrs:{},children:[node]};expect(()=>validateDocument({...createDocument(),blocks:[{type:'components',nodes:[node]}]})).toThrow('嵌套');
 });
});
