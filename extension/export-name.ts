/** Device-local time, with filesystem-safe separators and seconds for repeated exports. */
export function exportFilename(date=new Date()){
 const two=(n:number)=>String(n).padStart(2,'0');
 return `chatgpt-${date.getFullYear()}-${two(date.getMonth()+1)}-${two(date.getDate())}_${two(date.getHours())}-${two(date.getMinutes())}-${two(date.getSeconds())}.schema.zip`;
}
