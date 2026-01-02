const crypto = require('crypto');

// 👇 请把下面单引号里的内容，换成你在 Supabase 复制的那个短密码 (Legacy JWT Secret)
const secret = 'MXyDsH54xQtlHHw9owp/zpzOSwJ64d5LTc8q7N5Xab6NwXz6Z0BdGfBjGW/VL0eF8mHBmBkWJ0gmL/RQWndwVg=='; 

// 定义生成逻辑
function generateToken(secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = { 
    role: 'anon', 
    iss: 'supabase', 
    exp: 2147483647 // 有效期到 2038 年，足够用了
  };

  const base64Url = (str) => Buffer.from(str).toString('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedPayload = base64Url(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;
  
// 关键修改：告诉电脑这个 secret 是 base64 格式的，需要翻译
const signature = crypto.createHmac('sha256', Buffer.from(secret, 'base64'))
    .update(data)
    .digest('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  return `${data}.${signature}`;
}

console.log("👇 下面是你的 eyJ 钥匙 (复制它):");
console.log(generateToken(secret));