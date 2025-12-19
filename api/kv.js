// api/kv.js - Vercel Serverless代理Redis请求，解决跨域问题
export default async function handler(req, res) {
  // 允许所有跨域请求（适配前端调用）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // 处理OPTIONS预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 获取Vercel环境变量中的Redis配置
  const { KV_REST_API_URL, KV_REST_API_TOKEN } = process.env;
  
  // 校验配置是否存在
  if (!KV_REST_API_URL || !KV_REST_API_TOKEN) {
    return res.status(500).json({ 
      success: false, 
      error: 'Vercel KV配置未找到，请检查环境变量' 
    });
  }

  try {
    // 拼接完整的Redis REST API地址
    const redisApiUrl = `${KV_REST_API_URL}${req.url}`;
    
    // 转发请求到Redis KV
    const response = await fetch(redisApiUrl, {
      method: req.method,
      headers: {
        'Authorization': `Bearer ${KV_REST_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
    });

    // 获取Redis返回结果
    const data = await response.json();
    
    // 转发响应给前端
    res.status(response.status).json({
      success: true,
      data: data
    });
  } catch (error) {
    // 捕获错误并返回给前端
    res.status(500).json({
      success: false,
      error: 'Redis请求失败',
      details: error.message
    });
  }
}
