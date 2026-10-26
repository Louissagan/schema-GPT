import { describe, expect, it } from 'vitest';
import { functions } from '@/lib/functions';
import { run } from '@/lib/functions/__tests__/run';
import { functionExamples } from './function-examples';
describe('live function gallery',()=>{
  it('provides an example for every registered function',()=>{
    expect(Object.keys(functionExamples).sort()).toEqual(functions.map(f=>f.name).sort());
  });
  for(const [name,expression] of Object.entries(functionExamples))it(`${name} parses and evaluates`,()=>{
    const result=run(expression);expect(result.parseErrors).toEqual([]);expect(result.runtimeErrors).toEqual([]);expect(result.value).not.toBeNull();
  });
});
