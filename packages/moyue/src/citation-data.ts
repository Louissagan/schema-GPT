import {z} from 'zod';
export const citationSourcesSchema=z.array(z.object({label:z.string().max(2000),href:z.string().max(4000),title:z.string().max(4000).optional(),icon:z.string().max(4000).optional(),date:z.string().max(200).optional()})).max(50);
export type CitationSource=z.infer<typeof citationSourcesSchema>[number];
export function readCitationSources(value:string|null):CitationSource[]{if(!value||value.length>200000)return [];try{const r=citationSourcesSchema.safeParse(JSON.parse(value));return r.success?r.data:[];}catch{return [];}}
