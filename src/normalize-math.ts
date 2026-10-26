/** Convert ChatGPT math fences while leaving fenced and inline code unchanged. */
export function normalizeMathDelimiters(markdown:string):string{
  return markdown.split(/(```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]*`)/g).map((part,i)=>i%2?part:part.replace(/\\\[([\s\S]*?)\\\]/g,(_,body)=>`\n$$\n${body.trim()}\n$$\n`).replace(/\\\(([^\n]*?)\\\)/g,(_,body)=>`$${body.trim()}$`)).join('');
}
