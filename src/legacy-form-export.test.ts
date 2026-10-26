// @vitest-environment jsdom
import {expect,it} from 'vitest';
import {captureElements} from '../packages/moyue/src/extract';
import {createDocument,packDocument,unpackDocument} from '../packages/moyue/src/document';
import {legacyWidget} from '../packages/moyue/src/legacy-widgets';
import type {ComponentNode} from '../packages/moyue/src/component-model';
function form(type: 'select'|'radio',value:string):ComponentNode{return {kind:'container',attrs:{},card:true,children:[0,1,2].map(i=>({kind:'container',attrs:{},children:[{kind:'text',attrs:{},html:`<label>Field ${i}</label>`},{kind:'field',attrs:{},fieldType:i===0?type:'text',value:i===0?value:'Visible'}]}))};}
for(const type of ['select','radio'] as const)it(`keeps an inferred ${type} with unavailable options exportable without inventing options`,()=>{const node=legacyWidget(form(type,'Current visible value'));expect(node?.spec?.type).toBe('form');if(node?.spec?.type!=='form')throw Error();expect(node.spec.fields[0]).toMatchObject({type:'text',value:'Current visible value'});expect(node.spec.provenance).toContain('选项');const doc=createDocument();doc.blocks=[{type:'components',nodes:[node]}];expect(()=>unpackDocument(packDocument({document:doc,files:{}}))).not.toThrow();});
it('captures and ZIP round trips a real native select in an inferred form',async()=>{const root=document.createElement('article');root.innerHTML='<div style="border:1px solid #ddd;border-radius:16px;padding:16px"><div><label>Format · Select</label><select><option>Markdown</option><option selected>HTML</option></select></div><div><label>Name · Input</label><input value="Example"></div><div><label>Notes · Textarea</label><textarea>Visible notes</textarea></div></div>';const bundle=await captureElements([root],'https://chatgpt.com/c/test','Form');const restored=unpackDocument(packDocument(bundle));expect(JSON.stringify(restored.document)).toContain('HTML');});

it('keeps the original tree when inferred fields exceed the widget schema limits',()=>{const node=form('select','x'.repeat(10001));expect(legacyWidget(node)).toBeUndefined();});
