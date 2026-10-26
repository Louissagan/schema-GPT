import { expect,it } from 'vitest';
import { createParser,type LibrarySpec } from '@openuidev/lang-core';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import spec from '@/generated/spec.json';
import { foundationBlocks } from './foundation-fixture';
import { normalizeMathDelimiters } from './normalize-math';
import { MarkdownRenderer } from './MarkdownRenderer';
const blocks=foundationBlocks('https://example.com');
const library:LibrarySpec=spec;const parser=createParser(library.schema!,library.root);
it('covers all 25 annotations in one fixture without duplicate blocks',()=>{
  expect(blocks).toHaveLength(18);expect(new Set(blocks.map(b=>b.id)).size).toBe(18);
  expect([...new Set(blocks.flatMap(b=>b.annotations))].sort((a,b)=>a-b)).toEqual(Array.from({length:25},(_,i)=>i+1));
});
for(const block of blocks)it(`parses the native ${block.id} block`,()=>{
  const result=parser.parse(block.code);expect(result.root).not.toBeNull();expect(result.meta.errors).toEqual([]);expect(result.meta.unresolved).toEqual([]);expect(result.meta.orphaned).toEqual([]);
});
it('normalizes math without changing code examples',()=>{
  const input='\\(x+1\\)\n\\[E=mc^2\\]\n`\\(code\\)`\n```js\nconst text = "\\[raw\\]";\n```';
  const output=normalizeMathDelimiters(input);expect(output).toContain('$x+1$');expect(output).toContain('$$\nE=mc^2\n$$');expect(output).toContain('`\\(code\\)`');expect(output).toContain('const text = "\\[raw\\]";');
});
it('renders the supplied math block as actual formulas',()=>{
  const html=renderToStaticMarkup(createElement(MarkdownRenderer,{content:blocks.find(b=>b.id==='math')!.markdown!}));
  expect(html).toContain('class="katex"');expect(html).toContain('katex-display');expect(html).not.toContain('katex-error');
});
