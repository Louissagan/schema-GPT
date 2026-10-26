import {describe,it,expect,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync('extension/background.js','utf8');
async function request({granted=true,page='https://chatgpt.com/c/test',mime='image/png'}={}) {
 let listener:Function=()=>{};const fetch=vi.fn().mockResolvedValue(new Response(new Uint8Array([137,80,78,71]),{headers:{'content-type':mime}}));
 const permission=vi.fn().mockResolvedValue(granted);
 vm.runInNewContext(source,{chrome:{runtime:{onMessage:{addListener:(fn:Function)=>listener=fn}},permissions:{contains:permission}},URL,fetch,AbortSignal,Uint8Array,String,btoa});
 const result=await new Promise<Record<string,unknown>>(resolve=>listener({type:'moyue-image',url:'https://images.example.test/test.png'},{tab:{url:page}},resolve));return {result,fetch,permission};
}
describe('Extension download boundary',()=>{
 it('downloads only after permission and omits cookies',async()=>{const r=await request();expect(r.result.data).toBe('iVBORw==');expect(r.permission).toHaveBeenCalledWith({origins:['https://images.example.test/*']});expect(r.fetch).toHaveBeenCalledWith('https://images.example.test/test.png',expect.objectContaining({credentials:'omit',redirect:'manual'}));});
 it('does not fetch if the domain was not granted',async()=>{const r=await request({granted:false});expect(r.result.error).toBeTruthy();expect(r.fetch).not.toHaveBeenCalled();});
 it('does not serve arbitrary page senders',async()=>{const r=await request({page:'https://example.test'});expect(r.result.error).toBeTruthy();expect(r.fetch).not.toHaveBeenCalled();});
 it('rejects non-image response content',async()=>{const r=await request({mime:'text/html'});expect(r.result.error).toBeTruthy();expect(r.result.data).toBeUndefined();});
 it('requests no always-on host permissions and no external script source',()=>{const manifest=JSON.parse(readFileSync('extension/manifest.json','utf8'));expect(manifest.manifest_version).toBe(3);expect(manifest.permissions).toEqual(['activeTab','scripting']);expect(manifest.host_permissions).toBeUndefined();expect(manifest.content_security_policy.extension_pages).not.toContain('unsafe-eval');});
});
