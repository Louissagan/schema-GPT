// @vitest-environment jsdom
import { expect, it } from 'vitest';
import { answerFlow } from './reply-components/Diagram';
it('parses the branching flow with the real Mermaid parser in both themes',async()=>{
 const {default:mermaid}=await import('mermaid');
 mermaid.initialize({startOnLoad:false,securityLevel:'strict'});
 for(const source of [answerFlow,answerFlow.replaceAll('#e3f2ff','#19364a').replaceAll('#075b9f','#b2daf9')]) {
  const result=await mermaid.parse(source);expect(result&&result.diagramType).toBe('flowchart-v2');
 }
});
