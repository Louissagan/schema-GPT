import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowUp, BookOpen, RotateCcw, User } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { simulateAnswer, starterQuestions, type SimulatedAnswer } from './simulated-answers';
type Turn = { id:number; question:string; answer:SimulatedAnswer };
export function SimulatedChat({dark,renderUI}:{dark:boolean;renderUI:(code:string,key:string)=>ReactNode}) {
  const [turns,setTurns]=useState<Turn[]>(()=>[{id:0,question:starterQuestions[0],answer:simulateAnswer(starterQuestions[0])}]);
  const [input,setInput]=useState('');
  const [busy,setBusy]=useState(false);
  const [source,setSource]=useState(false);
  const timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  const end=useRef<HTMLDivElement>(null);
  useEffect(()=>()=>clearTimeout(timer.current),[]);
  const send=(question:string)=>{
    const text=question.trim();if(!text||busy)return;
    setInput('');setBusy(true);
    timer.current=setTimeout(()=>{setTurns(list=>[...list,{id:Date.now(),question:text,answer:simulateAnswer(text)}]);setBusy(false);requestAnimationFrame(()=>end.current?.scrollIntoView({behavior:'smooth',block:'end'}));},250);
  };
  return <section className="sim-chat"><div className="comparison-intro"><div><span className="lab-eyebrow">ASK. RENDER. INTERACT.</span><h1>先问一句，亲手试试<span>。</span></h1><p>已经放好一轮模拟问答。继续提问，看看文字如何变成可操作的回答。</p></div><span className="live-pill">预设场景 · 未调用 AI</span></div><div className="chat-demo-toolbar"><span>模拟问答演示</span><div><button aria-pressed={source} onClick={()=>setSource(!source)}>查看回答源码</button><button aria-label="清空模拟对话" disabled={busy} onClick={()=>setTurns([])}><RotateCcw size={14}/>清空对话</button></div></div><div className="chat-transcript" aria-label="模拟问答记录">{!turns.length&&<p className="chat-empty">点击下方示例问题，开始一轮模拟问答。</p>}{turns.map(turn=><section className="chat-turn" key={turn.id}><div className="chat-question"><div><User size={14}/><span>你</span></div><p>{turn.question}</p></div><div className="chat-answer"><div className="chat-speaker"><BookOpen size={15}/><strong>视码 SCHEMA助手</strong><span>模拟回答 · {turn.answer.scenario}</span></div><MarkdownRenderer content={turn.answer.markdown} className={dark?'theme-dark':'theme-light'}/><div className="chat-interactive-label">可以直接操作的 OpenUI 组件</div><div className="chat-live-ui">{renderUI(turn.answer.code,String(turn.id))}</div>{source&&<details className="chat-answer-source" open><summary>模拟回答的 OpenUI Lang 源码</summary><pre>{turn.answer.code}</pre></details>}</div></section>)}{busy&&<p role="status" className="chat-working">正在装配预设场景的模拟回答…</p>}<div ref={end}/></div><div className="chat-composer"><div className="chat-starters">{starterQuestions.map(question=><button key={question} disabled={busy} onClick={()=>send(question)}>{question}</button>)}</div><form onSubmit={e=>{e.preventDefault();send(input);}}><textarea aria-label="输入模拟问题" maxLength={1000} rows={2} placeholder="例如：帮我规划一个预算 500 元的周末出游" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();send(input);}}}/><button type="submit" disabled={!input.trim()||busy} aria-label="发送模拟问题"><ArrowUp size={18}/></button></form><p>按 Enter 发送，Shift + Enter 换行。支持上述四类预设场景；未知问题会显示范围提示。界面交互真实执行，回答数据为模拟数据。</p></div></section>;
}
