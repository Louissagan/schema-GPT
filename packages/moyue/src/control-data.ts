import {fieldSchema} from './widget-model';
import type {ComponentNode} from './component-model';
/** Only inert, bounded form data crosses the DOM boundary. */
export function readCapturedField(el:Element):ComponentNode{
 const finite=(key:string)=>{const raw=el.getAttribute(key);const n=raw===null?NaN:Number(raw);return Number.isFinite(n)?n:undefined;};
 let options:ComponentNode['options'];try{const result=fieldSchema.shape.options.safeParse(JSON.parse(el.getAttribute('data-moyue-options')||'null'));if(result.success)options=result.data;}catch{/* Missing or invalid options remain unavailable. */}
 const raw=el.getAttribute('data-moyue-field')||'checkbox';
 const fieldType=(['checkbox','radio','text','textarea','select','range','date','number'].includes(raw)?raw:'text') as ComponentNode['fieldType'];
 return {kind:'field',attrs:{},fieldType,value:el.getAttribute('aria-valuenow')||el.textContent||'',...(options?{options}:{}),...(finite('aria-valuemin')!==undefined?{min:finite('aria-valuemin')}:{}),...(finite('aria-valuemax')!==undefined?{max:finite('aria-valuemax')}:{}),...(Number(finite('data-moyue-step'))>0?{step:finite('data-moyue-step')}:{}),...(el.hasAttribute('data-moyue-check')?{checked:el.getAttribute('data-moyue-check')==='true'}:{})};
}
