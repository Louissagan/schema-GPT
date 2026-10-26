import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const base=new URL('../vendor/upstream-source-archive/',import.meta.url);
const manifest=JSON.parse(await readFile(new URL('manifest.json',base),'utf8'));
const target=new URL('../public/upstream-source.tar.gz',import.meta.url);
const valid=data=>data.length===manifest.bytes&&createHash('sha256').update(data).digest('hex')===manifest.sha256;
let current;try{current=await readFile(target);}catch{}
if(!current||!valid(current)){
 const data=Buffer.concat(await Promise.all(manifest.parts.map(name=>readFile(new URL(name,base)))));
 if(!valid(data))throw new Error('Upstream archive checksum mismatch');
 await mkdir(new URL('../public/',import.meta.url),{recursive:true});await writeFile(target,data);
}
console.log('Upstream source archive verified.');
