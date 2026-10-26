import { expect,it } from 'vitest';
import {createParser,type LibrarySpec} from '@openuidev/lang-core';
import spec from '@/generated/spec.json';
import {extractVisibleShare,seedReplayThreads,replaySources} from './shared-replays';
class MemoryStorage{data=new Map<string,string>();getItem(k:string){return this.data.get(k)??null;}setItem(k:string,v:string){this.data.set(k,v);}}
it('seeds four recent chats without overwriting user chats or imported versions',()=>{
  const memory=new MemoryStorage();memory.setItem('oiu:threads',JSON.stringify([{id:'personal',title:'用户记录'}]));
  seedReplayThreads(memory);seedReplayThreads(memory);
  const threads=JSON.parse(memory.getItem('oiu:threads')!);expect(threads).toHaveLength(5);expect(threads.some((t:any)=>t.id==='personal')).toBe(true);
  const library:LibrarySpec=spec;const parser=createParser(library.schema!,library.root);
  for(const source of replaySources){const messages=JSON.parse(memory.getItem(`oiu:messages:replay-${source.id}`)!);expect(messages[1].replayStatus).toContain('非分享原文');expect(parser.parse(messages[1].content).meta.errors).toEqual([]);}
});
it('imports only visible user and final assistant text',()=>{
  const data={title:'原文',linear_conversation:[
    {message:{author:{role:'system'},content:{content_type:'text',parts:['secret system']}}},
    {message:{author:{role:'user'},content:{content_type:'text',parts:['我的原问题']}}},
    {message:{author:{role:'assistant'},channel:'analysis',content:{content_type:'text',parts:['private reasoning']}}},
    {message:{author:{role:'tool'},content:{content_type:'text',parts:['tool output']}}},
    {message:{author:{role:'assistant'},metadata:{is_visually_hidden_from_conversation:true},content:{content_type:'text',parts:['hidden']}}},
    {message:{author:{role:'assistant'},channel:'final',content:{content_type:'text',parts:['## 原回答\n\n**格式保留**']}}},
  ]};
  const imported=extractVisibleShare(data);expect(imported.messages).toHaveLength(2);expect(imported.messages[1].replayMarkdown).toBe('## 原回答\n\n**格式保留**');expect(JSON.stringify(imported)).not.toMatch(/secret|reasoning|hidden|tool output/);
});
it('follows the selected branch instead of exposing other branches',()=>{
  const result=extractVisibleShare({current_node:'b',mapping:{a:{parent:null,message:{role:'user',content:'当前问题'}},b:{parent:'a',message:{role:'assistant',content:'当前回答'}},c:{parent:'a',message:{role:'assistant',content:'另一分支'}}}});
  expect(result.messages).toHaveLength(2);expect(JSON.stringify(result)).not.toContain('另一分支');
});
it('rejects files with no visible conversation',()=>{expect(()=>extractVisibleShare({messages:[]})).toThrow();});
