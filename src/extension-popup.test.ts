// @vitest-environment jsdom
import {describe,it,expect,vi,afterEach} from 'vitest';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync('extension/popup.js','utf8');
const html=readFileSync('extension/popup.html','utf8');
afterEach(()=>document.body.replaceChildren());
function start(replies:unknown[]=[],scriptError?:string){
 document.documentElement.innerHTML=html;
 const close=vi.fn();const exported=vi.fn();const picked=vi.fn();
 const apiWindow={__moyueList:vi.fn().mockResolvedValue(replies),__moyuePick:picked,__moyueExport:exported,close};
 const executeScript=vi.fn(async(args:{files?:string[];func?:Function;args?:unknown[]})=>{
  if(args.files)return [{}];
  if(scriptError)return [{error:{message:scriptError}}];
  const value=await vm.runInNewContext('('+args.func!.toString()+')',{window:apiWindow})(...(args.args||[]));
  return [{result:value}];
 });
 vm.runInNewContext(source,{document,window:apiWindow,URL,chrome:{tabs:{query:async()=>[{id:1,url:'https://chatgpt.com/c/test'}]},scripting:{executeScript},permissions:{request:async()=>true}}});
 return {close,exported,picked,executeScript};
}
describe('Extension popup recovery',()=>{
 it('exits loading with a clear empty result and working recovery buttons',async()=>{const app=start();await vi.waitFor(()=>expect(document.querySelector('#scope')?.textContent).toBe('未自动识别，请点选回复'));expect((document.querySelector('#export') as HTMLButtonElement).disabled).toBe(true);expect((document.querySelector('#refresh') as HTMLButtonElement).disabled).toBe(false);expect(document.querySelector('#status')?.textContent).toContain('手动定位');const before=app.executeScript.mock.calls.length;(document.querySelector('#refresh') as HTMLButtonElement).click();await vi.waitFor(()=>expect(app.executeScript.mock.calls.length).toBeGreaterThan(before));});
 it('shows page script failures instead of leaving the loading option',async()=>{start([],'页面脚本不可访问');await vi.waitFor(()=>expect(document.querySelector('#status')?.textContent).toBe('页面脚本不可访问'));expect(document.querySelector('#scope')?.textContent).toBe('页面读取失败');});
 it('exports the exact stable reply keys and enables page picking',async()=>{const app=start([{key:'reply-first',label:'第一条',origins:[]},{key:'reply-last',label:'第二条',origins:[]}]);await vi.waitFor(()=>expect((document.querySelector('#export') as HTMLButtonElement).disabled).toBe(false));(document.querySelector('#export') as HTMLButtonElement).click();await vi.waitFor(()=>expect(app.exported).toHaveBeenCalledWith(['reply-last']));(document.querySelector('#pick') as HTMLButtonElement).click();await vi.waitFor(()=>expect(app.picked).toHaveBeenCalledTimes(1));expect(app.close).toHaveBeenCalledTimes(1);});
});
