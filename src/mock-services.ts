/** Host-only demo data adapter. The upstream renderers/components remain unchanged. */
export function installDemoServices() {
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url, location.href);
    if (url.origin !== location.origin) return originalFetch(input, init);
    if (url.pathname === '/api/chat') return Response.json({ error: { message: '此部署展示原始组件与模拟数据，尚未配置模型服务。请使用组件展厅中的可交互示例。' } }, {status:503});
    if (url.pathname === '/api/wiki' || url.pathname === '/api/image-search') {
      const query = url.searchParams.get('title') || url.searchParams.get('q') || '';
      const kind = /roast|potato|crumble|food|dinner|lamb|pastel/i.test(query) ? 'food' : /phone|pixel|drone|bike|bicycle/i.test(query) ? 'product' : /forest|rainier|garden|beach|park|lake/i.test(query) ? 'nature' : 'city';
      const images = /qzxv/.test(query) ? [] : [`${location.origin}/demo/${kind}.svg`];
      return Response.json({photos:images,images,mock:true,query});
    }
    if (url.pathname === '/api/street-route') return Response.json({error:{message:'演示模式不提供真实道路导航；原始地图显示地点间连线。'}},{status:503});
    return originalFetch(input, init);
  };
}
