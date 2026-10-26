// Audit owned current text; historical archives and third-party code are not rewritten.
import {readFile,readdir,writeFile} from 'node:fs/promises';
const roots=['src','extension','packages/moyue/src','docs','examples'];
const files=['README.md','LICENSE','packages/moyue/LICENSE','packages/moyue/package.json','index.html','openui-chat.html','openui-gallery.html','openui-chat/index.html','public/reply/demo.html','public/qa-report.json'];
async function walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){if(e.name==='node_modules'||e.name==='dist'||e.name==='fixtures')continue;const path=dir+'/'+e.name;if(e.isDirectory())await walk(path);else if(/\.(tsx?|js|html|md|json|css|svg)$/.test(path)&&!path.includes('.test.'))files.push(path);}}
for(const root of roots)await walk(root);
const issues=[],retained=[];
for(const path of files){const text=await readFile(path,'utf8');if(!/墨阅|moyue/i.test(text))continue;
 if(path==='docs/BRAND-MIGRATION.md'||path==='docs/brand-audit.json'){retained.push({path,reason:'Migration history / audit inventory'});continue;}
 let display=text.replace(/MoyueDocument|MoyueBlock/g,'').replace(/packages\/moyue\b/g,'').replace(/\.moyue(?:\.zip)?/gi,'').replace(/https:\/\/moyue\.invalid\b/g,'COMPAT_ORIGIN').replace(/\bmoyue[-/][\w./-]*/gi,'').replace(/__moyue\w*/gi,'');
 if(path==='src/ReplayChat.tsx')display=display.replace(/(['"])moyue\1/g,''); // Existing renderer enum.
 if(/墨阅|\bmoyue\b/i.test(display))issues.push({path,reason:'Unclassified old display brand'});
 else retained.push({path,reason:'Compatibility path, namespace, format, public type or URL'});
}
const result={filesChecked:files.length,displayIssues:issues,retainedTechnicalReferences:retained,historicalArchives:'Versioned SDK/reference/source archives retain their original content.',thirdParty:'vendor and upstream licenses are excluded from brand rewriting.'};
if(process.argv[2])await writeFile(process.argv[2],JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({filesChecked:result.filesChecked,displayIssues:issues,retainedFiles:retained.length}));
if(issues.length)process.exitCode=1;
