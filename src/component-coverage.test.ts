import { expect, it } from 'vitest';
import spec from '@/generated/spec.json';
import { catalogue } from './catalogue';
it('has a real upstream program for all 55 registered components',()=>{
  const missing=Object.keys(spec.components).filter(name=>!catalogue.some(p=>new RegExp(`\\b${name}\\s*\\(`).test(p.code)));
  expect(missing).toEqual([]);expect(catalogue).toHaveLength(45);
});
