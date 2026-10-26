import {Building2,Drama,Landmark} from 'lucide-react';
import {NativeMap} from '../../packages/moyue/src/native-map';
export const places = [
 {id:'halle',name:'Hallé St Peter’s',type:'音乐厅 · 历史建筑',coordinates:[-2.2293,53.4855] as [number,number],icon:Landmark,color:'#817399',url:'https://halle.co.uk/',photo:'/reply/church.jpg'},
 {id:'exchange',name:'Royal Exchange Theatre',type:'表演艺术剧院',coordinates:[-2.2440,53.4835] as [number,number],icon:Drama,color:'#637fc7',url:'https://www.royalexchange.co.uk/',photo:null},
 {id:'umist',name:'UMIST Staff House',type:'大学建筑 · 案例研究',coordinates:[-2.2343,53.4735] as [number,number],icon:Building2,color:'#618c96',url:'https://www.manchester.ac.uk/',photo:null},
];
export function PlacesMap({theme}:{theme:string}){return <div className="moyue-document moyue-embedded" data-theme={theme}><NativeMap dark={theme==='dark'} spec={{type:'map',title:'曼彻斯特地图，同时显示音乐厅、剧院和大学三处建筑',places:places.map(p=>({name:p.name,category:p.type,longitude:p.coordinates[0],latitude:p.coordinates[1],url:p.url,...(p.photo?{photo:p.photo}:{})}))}}/></div>;}
