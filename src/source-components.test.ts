// @vitest-environment jsdom
import {it,expect,afterEach,vi} from 'vitest';
import {createElement} from 'react';
import {render,cleanup,fireEvent,screen} from '@testing-library/react';
import {readFileSync} from 'node:fs';
import {ComponentRenderer} from '../packages/moyue/src/ComponentRenderer';
import {migrateToComponents,recognizeHTML} from '../packages/moyue/src/recognize';
import {captureElements} from '../packages/moyue/src/extract';
import {createDocument,packDocument,unpackDocument} from '../packages/moyue/src/document';
import type {ComponentNode} from '../packages/moyue/src/component-model';
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
const source=(name:string,domain:string):ComponentNode=>({kind:'container',attrs:{'data-moyue-size':'caption'},layout:'row',gap:0,children:[{kind:'container',attrs:{},children:[{kind:'image',attrs:{'data-moyue-size':'caption'},src:`https://www.google.com/s2/favicons?domain=https://${domain}&sz=32`,alt:''}]},{kind:'container',attrs:{},children:[{kind:'paragraph',attrs:{},html:name}]}]});
it.each([['Documentation','docs.example.test'],['Another source','news.example.test']])('migrates arbitrary source rows into compact working site links: %s',(label,host)=>{
 const old={...createDocument(),source:{exporter:'moyue-chrome/2.0.0'},blocks:[{type:'components' as const,nodes:[source(label,host)]}]};const fixed=migrateToComponents(old);expect(fixed.blocks[0].type).toBe('components');if(fixed.blocks[0].type!=='components')throw new Error();expect(fixed.blocks[0].nodes[0]).toMatchObject({kind:'citation',label,href:`https://${host}/`,scope:'site'});expect(migrateToComponents(fixed)).toBe(fixed);
 const {container}=render(createElement('article',{className:'moyue-document'},createElement(ComponentRenderer,{nodes:fixed.blocks[0].nodes})));const a=container.querySelector('a')!;expect(a.href).toBe(`https://${host}/`);expect(a.target).toBe('_blank');expect(a.title).toContain('来源站点');expect(container.querySelectorAll('figure')).toHaveLength(0);
});
it('uses a real card link for its citation rather than a generic domain or a different source',()=>{
 const node:ComponentNode={kind:'container',attrs:{},layout:'stack',children:[{kind:'heading',level:3,attrs:{},html:'<a href="https://github.com/example/project">Project</a>'},source('GitHub','github.com'),source('Other','other.test')]};const doc=migrateToComponents({...createDocument(),blocks:[{type:'components',nodes:[node]}]});if(doc.blocks[0].type!=='components')throw new Error();expect(doc.blocks[0].nodes[0].children?.[1]).toMatchObject({kind:'citation',scope:'page',href:'https://github.com/example/project'});expect(doc.blocks[0].nodes[0].children?.[2]).toMatchObject({kind:'citation',scope:'site',href:'https://other.test/'});
});
it('restores badges from short semantic status labels and keeps ordinary prose as prose',()=>{
 const node:ComponentNode={kind:'container',attrs:{},layout:'row',children:[{kind:'paragraph',attrs:{'data-moyue-size':'caption','data-moyue-tone':'success'},html:'Reviewed'},{kind:'paragraph',attrs:{},html:'Ordinary sentence'}]};const doc=migrateToComponents({...createDocument(),blocks:[{type:'components',nodes:[node]}]});if(doc.blocks[0].type!=='components')throw new Error();expect(doc.blocks[0].nodes[0].children?.map(n=>n.kind)).toEqual(['badge','paragraph']);
});
it('preserves explicit semantic and painted hairline separators through capture and ZIP',async()=>{
 const el=document.createElement('article');el.innerHTML='<h1>Title</h1><div role="separator"></div><p>A</p><div style="height:1px;width:700px;background-color:rgb(220,220,220)"></div><p>B</p><hr><p>C</p>';const doc=unpackDocument(packDocument(await captureElements([el],'https://chatgpt.com/c/test','test'))).document;if(doc.blocks[0].type!=='components')throw new Error();expect(doc.blocks[0].nodes.filter(n=>n.kind==='rule')).toHaveLength(3);
});
it('shows canonical chapter dividers and avoids doubling explicit separators',()=>{
 const nodes:ComponentNode[]=[{kind:'heading',attrs:{},level:2,html:'First'},{kind:'paragraph',attrs:{},html:'A'},{kind:'heading',attrs:{},level:2,html:'Second'},{kind:'rule',attrs:{}},{kind:'heading',attrs:{},level:2,html:'Third'}];const {container}=render(createElement(ComponentRenderer,{nodes}));expect(container.querySelectorAll('hr')).toHaveLength(2);
});
it('keeps unknown targets honest and actionable instead of inventing a page URL',()=>{
 render(createElement(ComponentRenderer,{nodes:[{kind:'citation',attrs:{},label:'Missing',scope:'unavailable'}]}));expect(screen.queryByRole('link')).toBeNull();fireEvent.click(screen.getByRole('button'));expect(screen.getByRole('status').textContent).toContain('没有保存在文档');
});
it('uses compact citation geometry and removes stacked-heading margin inflation',()=>{
 const style=document.createElement('style');style.textContent=readFileSync('packages/moyue/src/style.css','utf8')+readFileSync('packages/moyue/src/reading.css','utf8');document.head.append(style);const nodes:ComponentNode[]=[{kind:'citation',attrs:{},label:'Source',href:'https://example.test/',scope:'page',icon:'https://example.test/icon.png'},{kind:'container',attrs:{},layout:'stack',gap:8,children:[{kind:'heading',attrs:{},level:3,html:'Link title'}]}];const {container}=render(createElement('article',{className:'moyue-document'},createElement(ComponentRenderer,{nodes})));expect(getComputedStyle(container.querySelector('.moyue-citation')!).fontSize).toBe('10px');expect(getComputedStyle(container.querySelector('img')!).width).toBe('12px');expect(getComputedStyle(container.querySelector('h3')!).marginTop).toBe('0px');style.remove();
});
it('keeps explicit page links from source markup and strips decorative arrows from labels',()=>{
 const nodes=recognizeHTML('<a data-moyue-group="citation" data-moyue-source-href="https://example.test/article" data-moyue-source-scope="page" href="https://example.test/article">Article<span aria-hidden="true">↗</span></a>');expect(nodes[0]).toMatchObject({kind:'citation',label:'Article',href:'https://example.test/article',scope:'page'});
});

it('captures new source rows and colored badges before page CSS and image URLs are stripped',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('offline')));const el=document.createElement('article');el.innerHTML='<div style="display:flex;font-size:12px;gap:4px"><div><img src="https://www.google.com/s2/favicons?domain=https://docs.example.test&sz=32"></div><div>Example Docs</div></div><span style="font-size:12px;border-radius:4px;background-color:rgb(220,250,230);color:rgb(20,130,60)">Verified</span>';const doc=unpackDocument(packDocument(await captureElements([el],'https://chatgpt.com/c/test','test'))).document;if(doc.blocks[0].type!=='components')throw new Error();expect(doc.blocks[0].nodes[0]).toMatchObject({kind:'citation',label:'Example Docs',href:'https://docs.example.test/',scope:'site'});expect(doc.blocks[0].nodes[1]).toMatchObject({kind:'badge',html:'Verified'});
});
it('does not treat empty bordered square controls as horizontal separators',async()=>{const el=document.createElement('article');el.innerHTML='<div style="width:24px;height:24px;border:1px solid gray"></div><div style="width:700px;height:1px;background-color:gray"></div>';const doc=(await captureElements([el],'https://chatgpt.com/c/test','test')).document;if(doc.blocks[0].type!=='components')throw new Error();expect(doc.blocks[0].nodes.filter(n=>n.kind==='rule')).toHaveLength(1);});
