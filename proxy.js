const http = require('http');
const https = require('https');

const PORT = 8888;

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Max-Age', '86400');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const targetUrl = req.headers['x-proxy-url'];
    if (!targetUrl) {
        res.writeHead(400);
        res.end('Missing x-proxy-url header');
        return;
    }

    let parsedUrl;
    try {
        parsedUrl = new URL(targetUrl);
    } catch (e) {
        res.writeHead(400);
        res.end('Invalid target URL');
        return;
    }

    const proxyHeaders = { ...req.headers };
    delete proxyHeaders['x-proxy-url'];
    delete proxyHeaders['host'];
    delete proxyHeaders['connection'];

    const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: req.method,
        headers: proxyHeaders
    };

    const client = parsedUrl.protocol === 'https:' ? https : http;
    const proxyReq = client.request(options, (proxyRes) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Expose-Headers', '*');

        const responseHeaders = { ...proxyRes.headers };
        delete responseHeaders['transfer-encoding'];
        Object.entries(responseHeaders).forEach(([key, value]) => {
            res.setHeader(key, value);
        });

        res.writeHead(proxyRes.statusCode);
        proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
        res.writeHead(502);
        res.end(`Proxy error: ${err.message}`);
    });

    req.pipe(proxyReq);
});

server.listen(PORT, () => {
    console.log(`CORS Proxy 已启动: http://localhost:${PORT}`);
    console.log('使用方法: 在 Easy API 中启用代理模式，代理地址填写 http://localhost:8888');
    console.log('按 Ctrl+C 停止代理');
});
