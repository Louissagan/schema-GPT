import {useMemo,useState,useId} from 'react';
import {sanitizeHTML} from './html';
import type {WidgetSpec} from './widget-model';
export function VisualStates({spec,resolveAsset}:{spec:Extract<WidgetSpec,{type:'visual-states'}>;resolveAsset:(p:string)=>string|undefined}){
 const [value,setValue]=useState(spec.selected||'');const id=useId();const active=spec.states.find(s=>s.id===value);
 const html=useMemo(()=>active?.html?sanitizeHTML(active.html,resolveAsset,false):'',[active,resolveAsset]);
 return <section className="moyue-visual-states"><div className="moyue-stage-options" role="group" aria-label="图解阶段">{spec.states.map(state=><button type="button" key={state.id} aria-pressed={value===state.id} aria-controls={id} onClick={()=>setValue(value===state.id&&spec.allowClear?'':state.id)}>{state.label}</button>)}</div><div id={id} className="moyue-stage-content" aria-live="polite">{!active?<p role="status">请选择一个阶段</p>:html?<div dangerouslySetInnerHTML={{__html:html}}/>:<p role="status">此阶段的图解未保存在文档中，请用新版插件重新导出。</p>}</div></section>;
}
