import '@/lib/devtools';
import '@openuidev/react-ui/styles/index.css';
import { AgentInterface, openAIResponsesAdapter, useThemeModePreference, useThreadList, type AssistantMessageComponent, type ChatLLM } from '@openuidev/react-ui';
import { Renderer, type ActionEvent } from '@openuidev/react-lang';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { library } from '@/lib/library';
import { demoTools } from '@/lib/demo-data';
import { localChatStorage, SaveMessages } from '@/lib/chat-storage';
import { runLibraryAction } from '@/lib/actions';
import { MarkdownRenderer } from './MarkdownRenderer';
import { extractVisibleShare, replaySources, seedReplayThreads, type ReplayMessage } from './shared-replays';
import { simulateAnswer, starterQuestions } from './simulated-answers';
import './openui-scopes.css';
import './replay-chat.css';
try { seedReplayThreads(localStorage); } catch {}
const storage=localChatStorage();
type Engine='native'|'moyue'|'both';
const ReplayContext=createContext<{engine:Engine;mode:'light'|'dark'}>({engine:'native',mode:'light'});
const generatedMarkdown=new Map<string,string>();
const llm:ChatLLM={streamProtocol:openAIResponsesAdapter(),async send({messages,signal}){
  if(signal.aborted)throw new DOMException('已取消','AbortError');
  const question=[...messages].reverse().find(m=>m.role==='user')?.content;
  const answer=simulateAnswer(typeof question==='string'?question:'');
  const id=crypto.randomUUID();generatedMarkdown.set(id,`> 新消息使用预设场景模拟，未调用模型。\n\n${answer.markdown}`);
  const events=[{type:'response.output_item.added',item:{type:'message',role:'assistant',id}},{type:'response.output_text.delta',item_id:id,delta:answer.code},{type:'response.output_text.done',item_id:id}];
  return new Response(events.map(e=>`data: ${JSON.stringify(e)}\n\n`).join('')+'data: [DONE]\n\n',{headers:{'Content-Type':'text/event-stream'}});
}};
const onAction=(event:ActionEvent)=>{void runLibraryAction(event);if(event.type==='open_url'){const url=(event.params as {url?:unknown})?.url;if(typeof url==='string'&&/^https?:\/\//.test(url))window.open(url,'_blank','noopener,noreferrer');}};
const ReplayAssistant:AssistantMessageComponent=({message,isStreaming})=>{
  const {engine,mode}=useContext(ReplayContext);const replay=message as ReplayMessage;
  const markdown=replay.replayMarkdown??generatedMarkdown.get(message.id);
  const [errors,setErrors]=useState<string[]>([]);
  const content=typeof message.content==='string'?message.content:'';
  return <section className={`replay-assistant ${mode==='dark'?'replay-dark':''}`}><div className="replay-message-label"><strong>回答回放</strong><span>{replay.replayStatus??'预设场景模拟 · 未调用模型'}</span>{replay.replaySource&&<a href={replay.replaySource} target="_blank" rel="noreferrer">查看原分享 ↗</a>}</div><div className={`replay-engines ${engine==='both'?'side-by-side':''}`}>{engine!=='moyue'&&<div><div className="replay-engine-label">OpenUI 原始组件</div><div className="openui-scope replay-native" data-theme={mode}><Renderer response={content} library={library} isStreaming={isStreaming} onAction={onAction} toolProvider={demoTools} onError={list=>setErrors(list.map(e=>e.message))}/></div></div>}{engine!=='native'&&<div><div className="replay-engine-label">视码 SCHEMA Markdown</div>{markdown?<MarkdownRenderer content={markdown} className={`theme-${mode}`}/>:<p>这条消息未保存 Markdown 原文，请切换到 OpenUI 查看交互组件。</p>}</div>}</div>{errors.length>0&&<p role="alert">{errors.join('; ')}</p>}</section>;
};
function Controls({engine,setEngine}:{engine:Engine;setEngine:(e:Engine)=>void}){
  const selected=useThreadList(s=>s.selectedThreadId);const select=useThreadList(s=>s.selectThread);const reload=useThreadList(s=>s.loadThreads);
  const [open,setOpen]=useState(false);const [notice,setNotice]=useState('');const file=useRef<HTMLInputElement>(null);
  return <><div className="replay-toolbar"><button onClick={()=>setOpen(!open)} aria-expanded={open}>四段分享对话</button><div role="group" aria-label="回答渲染器">{(['native','moyue','both'] as Engine[]).map((e,i)=><button key={e} aria-pressed={engine===e} onClick={()=>setEngine(e)}>{['OpenUI','视码 SCHEMA','并排对比'][i]}</button>)}</div><a href="/?view=compare">排版实验室 ↗</a></div>{open&&<section className="replay-source-panel"><strong>四段分享对话 · 可在左侧 Recent chats 中选择</strong><p>当前为按主题编写的模拟问答，尚未完整导入分享原文；不能当作原文一致性对照。</p>{replaySources.map(s=><div key={s.id}><button onClick={()=>{select(`replay-${s.id}`);setOpen(false);}}>{s.title}</button><small>{s.status}</small><a href={`https://chatgpt.com/share/${s.id}`} target="_blank" rel="noreferrer">原分享 ↗</a><a href={`https://chatgpt.com/backend-api/share/${s.id}`} target="_blank" rel="noreferrer">公开 JSON ↗</a></div>)}<p>如果你保存了分享页的公开 JSON，可以在这里导入可见问答，随后用相同正文比较两个渲染器。原文件只在当前浏览器处理。</p><button onClick={()=>file.current?.click()}>导入原文 JSON 到当前对话</button><input hidden type="file" accept=".json,application/json" ref={file} onChange={async e=>{const f=e.target.files?.[0];if(!f)return;try{if(f.size>32*1024*1024)throw new Error('文件不能超过 32 MB。');const parsed=extractVisibleShare(JSON.parse(await f.text()));const id=selected?.startsWith('replay-')?selected:crypto.randomUUID();localStorage.setItem(`oiu:messages:${id}`,JSON.stringify(parsed.messages));const threads=JSON.parse(localStorage.getItem('oiu:threads')||'[]');const existing=threads.find((t:any)=>t.id===id);if(existing)existing.title=parsed.title;else threads.unshift({id,title:parsed.title,createdAt:new Date().toISOString()});localStorage.setItem('oiu:threads',JSON.stringify(threads));reload();window.location.reload();}catch(error){setNotice(String(error));}e.target.value='';}}/>{notice&&<p role="status">{notice}</p>}</section>}</>;
}
export default function ReplayChat(){
  const {mode,setPreference}=useThemeModePreference();const [engine,setEngine]=useState<Engine>('native');
  useEffect(()=>{document.documentElement.setAttribute('data-openui-theme',mode);},[mode]);
  return <ReplayContext.Provider value={{mode,engine}}><div className="chat-shell replay-shell"><AgentInterface llm={llm} storage={storage} componentLibrary={library} components={{AssistantMessage:ReplayAssistant}} agentName="OpenUI" logoUrl="/shiro-face.svg" theme={{mode}} starters={starterQuestions.map(q=>({displayText:q,prompt:q}))}><AgentInterface.SidebarFooter><AgentInterface.ThemeModeToggle mode={mode} onModeChange={setPreference}/></AgentInterface.SidebarFooter><AgentInterface.ThreadHeader showChatTitle={false}/><AgentInterface.Welcome image={<img src="/shiro-woodworker.svg" className="welcome-mascot" alt=""/>} title="选择一段对话，比较渲染效果" starterVariant="card"/><Controls engine={engine} setEngine={setEngine}/><SaveMessages/></AgentInterface></div></ReplayContext.Provider>;
}
