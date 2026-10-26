import {SourceCitation} from '../../packages/moyue/src/Citation';
import {ComponentRenderer} from '../../packages/moyue/src/ComponentRenderer';
import {metricNodes} from './foundation-nodes';
import { useState } from 'react';
import { BookOpen, Check, CodeXml, ExternalLink, FileArchive, FileJson, FileText, Globe, Images, Layers3 } from 'lucide-react';
import { MarkdownRenderer } from '../MarkdownRenderer';
export function SourcePill({label='GitHub',href='https://github.com/thesysdev/open-intelligent-ui'}:{label?:string;href?:string}) {return <SourceCitation label={label} href={href} icon={label==='GitHub'?<img src="/reply/previews/github.svg" alt=""/>:<Globe size={12}/>}/>;}
export function RichTextDemo() {return <><div className="reply-card reply-richtext"><h4>建筑的适应性再利用</h4><div className="reply-richtext-kicker">ADAPTIVE REUSE / TYPOGRAPHY DEMO</div><div className="reply-richtext-paragraph">这是一段普通文字，其中可以混合 <strong>加粗</strong>、<em>斜体</em>、<u>下划线</u>、<del>删除线</del>、<code>inline code</code>，以及数学公式 <MarkdownRenderer content={'\\(E=mc^2\\)'} className="reply-inline-math"/>。</div><hr/><p>下面是一个引用模块：</p><blockquote>Adaptive reuse is not merely the preservation of a building, but the reinterpretation of its existing spatial and cultural meanings.</blockquote><div className="reply-badge-row"><span className="reply-badge neutral">标签 Badge</span><span className="reply-badge green">完成</span><span className="reply-badge orange">待复核</span><span className="reply-inline-icons" aria-label="建筑、阅读及外链图标"><Layers3 size={16}/><BookOpen size={16}/><ExternalLink size={16}/></span></div></div><p>常见的文本变体还包括不同字号、字重、文本颜色、行内链接、脚注、编号列表、任务清单、分隔线和提示信息。</p><div className="reply-card reply-tasks"><p>任务清单</p>{['收集历史图纸','分析结构体系','形成最终图解'].map((v,i)=><label key={v} className="reply-check"><input type="checkbox" defaultChecked={i===0}/><span className="reply-check-visual"><Check size={14}/></span>{v}</label>)}<small>上面的清单可直接勾选。这与纯 Markdown 的静态任务清单不同。</small></div></>;}
export function Metrics(){return <ComponentRenderer nodes={metricNodes}/>;}
export function FileTypeIcon({url}:{url:string}) {const Icon=url.endsWith('html')?CodeXml:url.endsWith('json')?FileJson:url.endsWith('zip')?FileArchive:FileText;return <Icon className="reply-filetype-icon" size={22} strokeWidth={1.7}/>;}
export function RepoThumbnail({index,name,url}:{index:number;name:string;url:string}) {
 const [remote,setRemote]=useState(false),[failed,setFailed]=useState(false);
 const slug=url.replace('https://github.com/','');
 // Local website snapshots extracted from the supplied reference are stable.
 // An occluded reference (assistant-ui) uses GitHub's public repository cover.
 const local=index===2?null:`/reply/previews/repo-${index}.jpg`;
 const src=local&&!remote?local:`https://opengraph.githubassets.com/1/${slug}`;
 return <a className="reply-repo-thumbnail" href={url} target="_blank" rel="noreferrer" aria-label={`打开 ${name} 项目`}>{failed?<div><img src="/reply/previews/github.svg" alt=""/><span>{name}</span></div>:<img src={src} loading="lazy" alt={`${name} 网页预览`} onError={()=>{if(local&&!remote)setRemote(true);else setFailed(true);}}/>}</a>;
}
