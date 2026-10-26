// @vitest-environment jsdom
import {it,expect,afterEach,vi} from 'vitest';
import {collectGalleries,countedGalleries} from '../extension/collect-galleries';
import {captureElements} from '../packages/moyue/src/extract';
import {packDocument,unpackDocument} from '../packages/moyue/src/document';
import {Blob as NodeBlob} from 'node:buffer';
afterEach(()=>{document.body.innerHTML='';vi.unstubAllGlobals();});
function fixture(count=7){const root=document.createElement('article');root.innerHTML=`<h2>Any topic</h2><div data-moyue-group="gallery"><img src="https://images.test/0.png"><img src="https://images.test/1.png"><button aria-label="View image"><img src="https://images.test/2.png"><span>${count}</span></button></div>`;document.body.append(root);return root;}
it('reads all seven images through a counted gallery and keeps them through ZIP export',async()=>{
 const root=fixture();root.querySelector('button')!.onclick=()=>{
  let index=0;const dialog=document.createElement('div');dialog.setAttribute('role','dialog');dialog.innerHTML='<img><button aria-label="Next image">→</button><button aria-label="Close">×</button>';const update=()=>{dialog.querySelector('img')!.src=`https://images.test/${index}.png`;};update();const buttons=dialog.querySelectorAll('button');buttons[0].onclick=()=>{index=(index+1)%7;update();};buttons[1].onclick=()=>dialog.remove();document.body.append(dialog);
 };
 const galleries=await collectGalleries([root]);expect(galleries.groups[0].images).toHaveLength(7);expect(galleries.warnings).toEqual([]);expect(document.querySelector('[role=dialog]')).toBeNull();expect(root.querySelectorAll('img')).toHaveLength(3);
 vi.stubGlobal('Blob',NodeBlob);vi.stubGlobal('fetch',vi.fn().mockImplementation(()=>Promise.resolve(new Response(new Uint8Array([1,2,3]),{headers:{'content-type':'image/png'}}))));
 const exported=unpackDocument(packDocument(await captureElements([root],'https://chatgpt.com/c/test','Test',undefined,galleries)));
 const nodes=(exported.document.blocks[0] as any).nodes;const group=nodes.find((n:any)=>n.kind==='gallery');const images=(n:any):any[]=>[...(n.kind==='image'?[n]:[]),...(n.children||[]).flatMap(images)];expect(images(group)).toHaveLength(7);expect(exported.document.assets).toHaveLength(7);
});
it('reports incomplete galleries instead of claiming completeness',async()=>{
 const root=fixture();root.querySelector('button')!.onclick=()=>{const d=document.createElement('div');d.setAttribute('role','dialog');d.innerHTML='<img src="https://images.test/0.png"><button aria-label="Close">×</button>';d.querySelector('button')!.onclick=()=>d.remove();document.body.append(d);};const result=await collectGalleries([root]);expect(result.groups[0].images).toHaveLength(3);expect(result.warnings.join('')).toContain('预计 7 张，读取 3 张');
});
it('ignores unrelated numbered controls and groups outside the selected answer',()=>{const root=fixture();const other=fixture(9);root.insertAdjacentHTML('beforeend','<button>42</button>');expect(countedGalleries([root])).toHaveLength(1);expect(countedGalleries([root])[0].expected).toBe(7);expect(countedGalleries([root])[0].element).not.toBe(other);});
