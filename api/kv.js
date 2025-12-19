// api/kv.js - 修复JSON响应格式+跨域
export default async function handler(req, res) {
    // 强制设置JSON响应头
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    // 允许跨域
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 处理OPTIONS预检请求
    if (req.method === 'OPTIONS') {
        return res.status(200).json({ success: true });
    }

    // 获取环境变量
    const { KV_REST_API_URL, KV_REST_API_TOKEN } = process.env;
    if (!KV_REST_API_URL || !KV_REST_API_TOKEN) {
        return res.status(500).json({
            success: false,
            error: 'Vercel KV环境变量未配置'
        });
    }

    try {
        // 拼接Redis API地址
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

        // 读取响应（确保是JSON）
        const responseText = await response.text();
        let responseData;
        try {
            responseData = JSON.parse(responseText);
        } catch (e) {
            responseData = { raw: responseText };
        }

        // 返回标准JSON响应
        return res.status(response.status).json({
            success: response.ok,
            data: responseData
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message,
            details: error.stack
        });
    }
}
