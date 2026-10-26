import {sanitizeHTML} from './html';
import { z } from 'zod';
import {componentNodeSchema,checkComponentBounds} from './component-model';
import { unzipSync, zipSync, strFromU8, strToU8 } from 'fflate';

export const FORMAT = 'moyue-document' as const;
export const VERSION = 2 as const;
export const LIMITS = { archive: 50 * 1024 * 1024, expanded: 80 * 1024 * 1024, asset: 10 * 1024 * 1024, entries: 500, text: 2 * 1024 * 1024 };
const text = z.string().max(LIMITS.text);
const caption = z.string().max(2000);
const series = z.object({ name: caption, values: z.array(z.number().finite()).max(10000) });
const image = z.object({ src: caption, alt: caption.default('') });
const block = z.discriminatedUnion('type', [
  z.object({type:z.literal('components'),nodes:z.array(componentNodeSchema).max(2000)}),
  z.object({ type: z.literal('markdown'), content: text }),
  z.object({ type: z.literal('html'), content: text }),
  z.object({ type: z.literal('image'), src: caption, alt: caption.default('') }),
  z.object({ type: z.literal('gallery'), images: z.array(image).max(100) }),
  z.object({ type: z.literal('mermaid'), content: text }),
  z.object({ type: z.literal('chart'), kind: z.enum(['line','bar','pie']), title: caption, labels: z.array(caption).max(10000), series: z.array(series).min(1).max(20) }),
  z.object({ type: z.literal('file'), src: caption, name: caption }),
  z.object({ type: z.literal('custom'), name: caption, fallback: text }),
]);
export const documentSchema = z.object({
  format: z.literal(FORMAT), version: z.union([z.literal(1),z.literal(2)]), title: caption,
  createdAt: z.string().datetime(), source: z.object({ url: caption.optional(), title: caption.optional(), exporter: caption.optional(), componentRevision:z.union([z.literal(2),z.literal(3),z.literal(4),z.literal(5),z.literal(6),z.literal(7)]).optional(), presentation:z.enum(['moyue-reading-v1','moyue-components-v2']).optional() }).optional(),
  blocks: z.array(block).max(2000),
  assets: z.array(z.object({ path: z.string().regex(/^assets\/[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/), mime: caption, bytes: z.number().int().min(0).max(LIMITS.asset) })).max(LIMITS.entries),
  warnings: z.array(caption).max(2000),
}).superRefine((doc, ctx) => {
  if(doc.version===1&&doc.blocks.some(b=>b.type==='components'))ctx.addIssue({code:'custom',message:'结构化组件需要文档 version 2'});
  if(new Set(doc.assets.map(a=>a.path)).size!==doc.assets.length) ctx.addIssue({code:'custom',message:'资源路径重复'});
  for(const b of doc.blocks) if(b.type==='chart' && b.series.some(s=>s.values.length!==b.labels.length)) ctx.addIssue({code:'custom',message:'图表标签与数值数量不匹配'});
});
export type MoyueDocument = z.infer<typeof documentSchema>;
export type MoyueBlock = MoyueDocument['blocks'][number];
export type DocumentBundle = { document: MoyueDocument; files: Record<string, Uint8Array> };
export function createDocument(content = '', title = '未命名文档'): MoyueDocument {
  return {format: FORMAT, version: VERSION, title, createdAt: new Date().toISOString(), blocks: [{type:'markdown',content}], assets:[], warnings:[]};
}
export function validateDocument(value: unknown): MoyueDocument {
  checkComponentBounds(value);
  const result = documentSchema.safeParse(value);
  if(!result.success) throw new Error('文档格式无效或版本不支持：'+result.error.issues.slice(0,3).map(x=>x.message).join('；'));
  return result.data;
}
function checkFiles(doc: MoyueDocument, files: Record<string, Uint8Array>) {
  for(const a of doc.assets) if(!files[a.path] || files[a.path].length!==a.bytes) throw new Error('图片或附件缺失 / 长度不符：'+a.path);
}
export function packDocument(bundle: DocumentBundle): Uint8Array {
  const doc = validateDocument(bundle.document); checkFiles(doc,bundle.files);
  let total=0; const json=strToU8(JSON.stringify(doc,null,2));if(json.length>LIMITS.text)throw new Error('文档 JSON 超过 2 MB'); const files: Record<string,Uint8Array> = {'document.json':json};
  for(const a of doc.assets) { total+=a.bytes; files[a.path]=bundle.files[a.path]; }
  if(total>LIMITS.expanded) throw new Error('资源总量超过 80 MB');
  const result=zipSync(files,{level:6}); if(result.length>LIMITS.archive) throw new Error('压缩包超过 50 MB'); return result;
}
export function unpackDocument(bytes: Uint8Array): DocumentBundle {
  if(bytes.length>LIMITS.archive) throw new Error('文件超过 50 MB');
  let total=0, count=0;
  const files = unzipSync(bytes,{filter(entry) {
    if(++count>LIMITS.entries+1 || !/^(document\.json|assets\/[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+)$/.test(entry.name)) throw new Error('压缩包包含非法路径或过多文件');
    total+=entry.originalSize;
    if(entry.originalSize>(entry.name==='document.json'?LIMITS.text:LIMITS.asset) || total>LIMITS.expanded) throw new Error('解压大小超出限制');
    return true;
  }});
  if(!files['document.json']) throw new Error('压缩包中没有 document.json');
  const document=validateDocument(JSON.parse(strFromU8(files['document.json']))); delete files['document.json']; checkFiles(document,files);
  return {document,files};
}
export function rasterMime(mime: string) { return /^image\/(png|jpeg|webp|gif|avif)$/.test(mime); }
export function createAssetResolver(bundle: DocumentBundle) {
  const urls = new Map<string,string>();
  for(const a of bundle.document.assets) { const file=bundle.files[a.path]; if(file) urls.set(a.path,URL.createObjectURL(a.mime==='image/svg+xml'?new Blob([sanitizeHTML(new TextDecoder().decode(file),undefined,false)],{type:'image/svg+xml'}):new Blob([new Uint8Array(file)], {type:rasterMime(a.mime)?a.mime:'application/octet-stream'}))); }
  return {resolve:(path:string)=>urls.get(path), dispose:()=>{urls.forEach(u=>URL.revokeObjectURL(u));urls.clear();}};
}

/** Parse an explicitly declared document, leaving ordinary JSON examples as prose/code. */
export function parsePastedDocument(input:string):MoyueDocument|undefined{
 const trimmed=input.trim();const raw=trimmed.match(/^```(?:json)?\s*\n([\s\S]*?)\n```$/i)?.[1]?.trim()||trimmed;if(!raw.startsWith('{'))return;let value:unknown;try{value=JSON.parse(raw);}catch{if(/"format"\s*:\s*"moyue-document"/.test(raw))throw new Error('SCHEMA JSON 语法无效');return;}if(!value||typeof value!=='object'||(value as {format?:string}).format!=='moyue-document')return;return validateDocument(value);
}
