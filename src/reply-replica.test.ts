// @vitest-environment jsdom
import { expect,it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync,existsSync } from 'node:fs';
import ReplyReplica,{chapters} from './ReplyReplica';
it('renders the full seven-chapter reply with all thirteen demos in both isolated themes',()=>{
 const markup=renderToStaticMarkup(createElement(ReplyReplica));
 expect(chapters).toHaveLength(7);
 for(let i=1;i<=7;i++) for(const theme of ['light','dark']) expect(markup).toContain(`id="chapter-${i}-${theme}"`);
 for(let i=1;i<=13;i++) expect(markup.match(new RegExp(`data-demo="${i}"`,'g'))).toHaveLength(2);
 expect(markup).toContain('data-theme="light"');expect(markup).toContain('data-theme="dark"');
 expect(markup).toContain('class="katex"');expect(markup).not.toContain('katex-error');
 expect(markup).toContain('曼彻斯特地图，同时显示音乐厅、剧院和大学三处建筑');expect(markup).toContain('查看上传原图');
});
it('ships all screenshot photos and actual download assets, with a 59-item index',()=>{
 for(const name of ['church.jpg','extension.jpg','interior.jpg','hall.jpg','evening.jpg','facade.jpg','reference.jpg','demo.html','catalog.md','components.json','demo.zip']) expect(existsSync(`public/reply/${name}`),name).toBe(true);
 const data=JSON.parse(readFileSync('public/reply/components.json','utf8'));expect(Object.values(data.groups).flat()).toHaveLength(59);
 expect(readFileSync('public/reply/demo.zip').subarray(0,2).toString()).toBe('PK');
 const html=readFileSync('public/reply/demo.html','utf8');expect(html).toContain('data:image/jpeg;base64,');expect(html).toContain('function update()');
});
