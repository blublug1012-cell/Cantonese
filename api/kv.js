// api/kv.js - 修复JSON响应格式
export default async function handler(req, res) {
  // 强制设置响应为JSON格式
  res.setHeader('Content-Type', 'application/json');
  // 允许跨域
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理OPTIONS预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ success: true });
  }

  // 读取环境变量
  const { KV_REST_API_URL, KV_REST_API_TOKEN } = process.env;
  if (!KV_REST_API_URL || !KV_REST_API_TOKEN) {
    return res.status(500).json({ 
      success: false, 
      error: 'KV环境变量未配置' 
    });
  }

  try {
    // 拼接Redis API地址（修复URL格式）
    const redisUrl = new URL(KV_REST_API_URL);
    const fullUrl = new URL(req.url, redisUrl).href;

    // 发送请求到Redis
    const response = await fetch(fullUrl, {
      method: req.method,
      headers: {
        'Authorization': `Bearer ${KV_REST_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: req.method === 'POST' ? JSON.stringify(req.body) : null
    });

    // 读取Redis响应（确保是JSON）
    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseErr) {
      // 若Redis返回非JSON，包装为JSON
      responseData = { raw: responseText };
    }

    return res.status(response.status).json({
      success: response.ok,
      data: responseData
    });
  } catch (error) {
    // 捕获所有错误，返回JSON
    return res.status(500).json({
      success: false,
      error: error.message,
      details: error.stack
    });
  }
}
