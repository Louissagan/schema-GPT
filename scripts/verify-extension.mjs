// Exercise the shipped, bundled content script rather than a second copy of its detector.
// This is a DOM harness; it does not replace a real Chrome session test.
import {readFile,readdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {unzipSync,strFromU8} from 'fflate';
const version=JSON.parse(await readFile('extension/manifest.json','utf8')).version;
const entries=unzipSync(new Uint8Array(await readFile(`public/downloads/schema-chrome-${version}.zip`)));
const manifest=JSON.parse(strFromU8(entries['manifest.json']));assert.equal(manifest.version,version);
for(const name of (await readdir('public/downloads')).filter(name=>/^(?:schema|moyue)-chrome-[\d.]+\.zip$/.test(name))){const alias=unzipSync(new Uint8Array(await readFile('public/downloads/'+name)));const aliasManifest=JSON.parse(strFromU8(alias['manifest.json']));assert.equal(aliasManifest.version,version,name);assert.equal(aliasManifest.name,manifest.name,name);assert.deepEqual(aliasManifest.permissions,manifest.permissions,name);}
for(const [size,path] of Object.entries(manifest.icons||{})){assert.ok(entries[path],path);const png=Buffer.from(entries[path]);assert.equal(png.readUInt32BE(16),Number(size));assert.equal(png.readUInt32BE(20),Number(size));}assert.ok(entries['logo.png']);
assert.ok(entries['content.js']);assert.ok(entries['popup.js']);assert.ok(entries['background.js']);
assert.match(strFromU8(entries['popup.html']),/id="refresh"/);assert.match(strFromU8(entries['popup.html']),/id="pick"/);
const script=strFromU8(entries['content.js']);
function page(html){
 const dom=new JSDOM(html,{url:'https://chatgpt.com/c/test',runScripts:'outside-only'});let saved;
 dom.window.Blob=Blob;dom.window.fetch=async url=>{if(String(url).startsWith('data:'))return fetch(url);if(String(url)==='https://chatgpt.com/files/test.json')return new Response('{"actual":true}',{headers:{'content-type':'application/json'}});throw new Error('Offline fixture');};
 dom.window.URL.createObjectURL=blob=>{saved=blob;return 'blob:export-test';};dom.window.URL.revokeObjectURL=()=>{};
 dom.window.HTMLAnchorElement.prototype.click=function(){};
 dom.window.chrome={runtime:{sendMessage:async()=>({error:'No images in this fixture'})}};
 dom.window.eval(script);
 return {dom,getSaved:()=>saved};
}
const first=page('<main><article data-message-author-role="assistant"><p>旧结构回答</p></article></main>');
assert.equal((await first.dom.window.__moyueList()).length,1);first.dom.window.close();
const rows='<div style="border:1px solid #ddd;border-radius:17px;padding:16px">'+[1,2,3].map(n=>'<div style="display:flex;gap:24px"><svg width="22" height="22" viewBox="0 0 24 24"><path d="M1 1h20v20H1z"/></svg><div><strong>信息层 '+n+'</strong><p>说明文字</p></div></div>').join('<div></div>')+'</div>';
const second=page('<main><article aria-label="你说：" data-testid="conversation-turn-1"><p>不要导出这个问题</p></article><article data-testid="conversation-turn-2"><div class="markdown"><h2>安装步骤</h2><p>目标回答</p>'+rows+'<table><tr><th>操作</th></tr><tr><td>加载扩展</td></tr></table></div></article></main>');
const summaries=await second.dom.window.__moyueList();assert.equal(summaries.length,1);
const historical=second.dom.window.document.createElement('article');historical.dataset.turn='assistant';historical.textContent='后加载的历史回答';second.dom.window.document.querySelector('main').prepend(historical);
await second.dom.window.__moyueExport([summaries[0].key]);assert.ok(second.getSaved(),'Download must be produced');assert.match(second.dom.window.document.querySelector('[data-moyue-ui] a').download,/^chatgpt-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.schema\.zip$/);
const exported=unzipSync(new Uint8Array(await second.getSaved().arrayBuffer()));const doc=JSON.parse(strFromU8(exported['document.json']));
assert.equal(doc.version,2);assert.equal(doc.source.presentation,'moyue-components-v2');assert.equal(doc.blocks[0].type,'components');assert.match(JSON.stringify(doc.blocks[0]),/"kind":"layers"/);
assert.equal(doc.blocks.length,1);assert.match(JSON.stringify(doc.blocks[0]),/目标回答/);assert.match(JSON.stringify(doc.blocks[0]),/"kind":"table"/);assert.doesNotMatch(JSON.stringify(doc.blocks[0]),/历史回答|不要导出/);second.dom.window.close();
// The full shipped export must succeed even when a form snapshot has no option list.
const form=page('<main><article data-message-author-role="assistant"><h2>Incomplete form</h2><div style="border:1px solid #ddd;border-radius:16px;padding:16px"><div><label>Output · Select</label><select><option selected>Visible selection</option></select></div><div><label>Name · Input</label><input value="Visible name"></div><div><label>Notes · Textarea</label><textarea>Visible notes</textarea></div></div></article></main>');
await form.dom.window.__moyueExport([(await form.dom.window.__moyueList())[0].key]);
assert.ok(form.getSaved(),'Incomplete form must not prevent ZIP download');
const formDoc=JSON.parse(strFromU8(unzipSync(new Uint8Array(await form.getSaved().arrayBuffer()))['document.json']));
assert.match(JSON.stringify(formDoc),/Visible selection/);assert.match(JSON.stringify(formDoc),/Visible name/);form.dom.window.close();
const media=page('<main><article data-message-author-role="assistant"><h2>Resources</h2><img alt="SVG" src="data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 30"><text x="1" y="20">Vector bytes</text></svg>')+'"><a href="/files/test.json" download="test.json">下载 JSON</a></article></main>');
await media.dom.window.__moyueExport([(await media.dom.window.__moyueList())[0].key]);assert.ok(media.getSaved(),'SVG and file export must download');
const mediaFiles=unzipSync(new Uint8Array(await media.getSaved().arrayBuffer()));const mediaDoc=JSON.parse(strFromU8(mediaFiles['document.json']));assert.equal(mediaDoc.assets.length,2);const svgAsset=mediaDoc.assets.find(a=>a.mime==='image/svg+xml');assert.ok(svgAsset);assert.match(strFromU8(mediaFiles[svgAsset.path]),/Vector bytes/);const attachment=mediaDoc.assets.find(a=>a.mime==='application/json');assert.equal(strFromU8(mediaFiles[attachment.path]),'{"actual":true}');media.dom.window.close();
const third=page('<main><section><div id="unknown"><h2>未知结构回答</h2><p id="pick-me">手动定位正文</p></div></section></main>');
assert.equal((await third.dom.window.__moyueList()).length,0);third.dom.window.__moyuePick();
third.dom.window.document.getElementById('pick-me').dispatchEvent(new third.dom.window.MouseEvent('click',{bubbles:true,cancelable:true}));
const picked=await third.dom.window.__moyueList();assert.equal(picked.length,1);assert.equal(picked[0].method,'手动定位');
await third.dom.window.__moyueExport([picked[0].key]);assert.ok(third.getSaved());third.dom.window.close();
console.log(`Packaged MV3 ${version}: legacy, markerless export, stable identity manual selection and incomplete-form, SVG data URI and file-byte ZIP exports passed.`);
