import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
// @ts-ignore
import PopCore from '@alicloud/pop-core';

export const dynamic = 'force-dynamic';

// 🔴 请在这里配置您的阿里云密钥 (生产环境建议放在 .env 文件中)
const ALIYUN_CONFIG = {
  // 🔐 改成这样，从环境变量读取，不直接写死
  accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,     
  accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET, 
  
  endpoint: 'https://dysmsapi.aliyuncs.com',
  apiVersion: '2017-05-25',
  signName: '阿里云短信测试',          
  templateCode: 'SMS_154950909'       
};

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();

    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return NextResponse.json({ error: "手机号格式错误" }, { status: 400 });
    }

    // 1. 生成6位随机验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. 发送短信 (初始化阿里云客户端)
    // ⚠️ 如果您暂时还没申请下来阿里云，可以先注释掉下面这段 client 相关代码，
    // 直接保留 console.log，这样可以在 Vercel 后台日志里看到验证码进行测试。
    
    /* --- 真实发送代码开始 --- */
    // const client = new PopCore(ALIYUN_CONFIG);
    // const params = {
    //   "RegionId": "cn-hangzhou",
    //   "PhoneNumbers": phone,
    //   "SignName": ALIYUN_CONFIG.signName,
    //   "TemplateCode": ALIYUN_CONFIG.templateCode,
    //   "TemplateParam": JSON.stringify({ code: code })
    // };
    // await client.request('SendSms', params, { method: 'POST' });
    /* --- 真实发送代码结束 --- */

    console.log(`[模拟短信发送] 手机号: ${phone}, 验证码: ${code}`); // 方便您在没有Key的时候调试

    // 3. 存入数据库 (有效期5分钟)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 当前时间 + 5分钟
    
    // 先删除该手机号之前的旧验证码，防止堆积
    await sql`DELETE FROM codes WHERE phone = ${phone}`;
    
    // 插入新验证码
    await sql`
      INSERT INTO codes (phone, code, expires_at)
      VALUES (${phone}, ${code}, ${expiresAt})
    `;

    return NextResponse.json({ success: true, message: "验证码已发送" });

  } catch (error:any) {
    console.error("SMS Error:", error);
    return NextResponse.json({ error: "短信发送失败，请稍后重试" }, { status: 500 });
  }
}