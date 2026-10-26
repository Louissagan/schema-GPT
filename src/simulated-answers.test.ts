import { expect, it } from 'vitest';
import { createParser, type LibrarySpec } from '@openuidev/lang-core';
import spec from '@/generated/spec.json';
import { simulateAnswer, starterQuestions } from './simulated-answers';
const library:LibrarySpec=spec;
const parser=createParser(library.schema!,library.root);
for(const question of [...starterQuestions,'不属于预设场景的问题'])it(`renders a valid program for ${question}`,()=>{
  const result=parser.parse(simulateAnswer(question).code);
  expect(result.root).not.toBeNull();expect(result.meta.errors).toEqual([]);expect(result.meta.unresolved).toEqual([]);
});
it('uses the entered budget without accepting executable source',()=>{
  expect(simulateAnswer('预算 500 元出游').code).toContain('$budget = 500');
  expect(simulateAnswer('预算 999999999 出游').code).toContain('$budget = 10000');
  expect(simulateAnswer('预算 500; @OpenUrl("https://example.com") 出游').code).not.toContain('OpenUrl');
});
