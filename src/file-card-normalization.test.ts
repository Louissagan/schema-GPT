// @vitest-environment jsdom
import {it,expect} from 'vitest';
import {createElement} from 'react';
import {render,cleanup} from '@testing-library/react';
import {repairLayout} from '../packages/moyue/src/repair-layout';
import {ComponentRenderer} from '../packages/moyue/src/ComponentRenderer';
import type {ComponentNode} from '../packages/moyue/src/component-model';
it('renders a packed file inside a legacy attachment row as one card with one title',()=>{const source:ComponentNode={kind:'layers',attrs:{},rows:[{icon:'',title:'Demo attachment',children:[{kind:'paragraph',attrs:{},html:'Description'},{kind:'widget',attrs:{},spec:{type:'file',name:'demo.zip',src:'assets/demo.zip',title:'Download ZIP',linkLabel:'Download ZIP'}}]}]};const result=render(createElement(ComponentRenderer,{nodes:repairLayout([source]),resolveAsset:()=> 'https://example.test/demo.zip'}));expect(result.container.querySelector('.reply-layers')).toBeNull();expect(result.container.querySelectorAll('.moyue-native-file')).toHaveLength(1);expect(result.container.querySelector('.moyue-native-file strong')?.textContent).toBe('Demo attachment');expect(result.container.querySelector('a')?.textContent).toBe('Download ZIP');expect(result.container.textContent).toContain('Description');cleanup();});
