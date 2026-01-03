import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { type, account, password, nickname, verifyCode } = await req.json();

    // --- 场景一：登录 ---
    if (type === 'login') {
      if (account === 'admin' && password === 'admin123') {
        return NextResponse.json({ id: 'admin_root', nickname: '超级管理员', account: 'admin', role: 'admin', balance: '99999.00' });
      }
      const { rows } = await sql`SELECT * FROM users WHERE account = ${account} AND password = ${password}`;
      if (rows.length === 0) return NextResponse.json({ error: "账号或密码错误" }, { status: 401 });
      const u = rows[0];
      return NextResponse.json({ id: u.userid, nickname: u.nickname, account: u.account, role: u.role, balance: Number(u.balance).toFixed(2) });
    } 
    
    // --- 场景二：注册 (需校验真实短信) ---
    else if (type === 'register') {
      if (account.toLowerCase() === 'admin') return NextResponse.json({ error: "非法操作" }, { status: 403 });

      // 1. ✨ 校验短信验证码 (核心安全升级)
      // 如果是手机号注册，必须校验；如果是admin测试或特殊情况可放宽，这里强制校验
      const codeRes = await sql`
        SELECT * FROM codes 
        WHERE phone = ${account} 
        AND code = ${verifyCode} 
        AND expires_at > NOW()
      `;

      if (codeRes.rows.length === 0) {
        return NextResponse.json({ error: "验证码错误或已过期" }, { status: 400 });
      }

      // 2. 检查账号存在
      const existing = await sql`SELECT * FROM users WHERE account = ${account}`;
      if (existing.rows.length > 0) return NextResponse.json({ error: "该账号已存在" }, { status: 400 });

      // 3. 创建用户
      const userId = `u_${Date.now()}`;
      await sql`INSERT INTO users (userid, nickname, account, password, balance, role) VALUES (${userId}, ${nickname}, ${account}, ${password}, 0.10, 'user')`;
      await sql`INSERT INTO transactions (userid, type, amount, description) VALUES (${userId}, 'topup', 0.10, '注册赠送体验金')`;

      // 4. 注册成功后删除验证码，防止复用
      await sql`DELETE FROM codes WHERE phone = ${account}`;

      return NextResponse.json({ id: userId, nickname, account, role: 'user', balance: '0.10' });
    }

    // --- 场景三：重置密码 (也需要校验短信) ---
    else if (type === 'reset-password') {
      if (account === 'admin') return NextResponse.json({ error: "不可操作" }, { status: 403 });

      // 1. ✨ 校验验证码
      const codeRes = await sql`
        SELECT * FROM codes 
        WHERE phone = ${account} 
        AND code = ${verifyCode} 
        AND expires_at > NOW()
      `;
      if (codeRes.rows.length === 0) return NextResponse.json({ error: "验证码错误或已过期" }, { status: 400 });

      // 2. 更新密码
      const checkUser = await sql`SELECT * FROM users WHERE account = ${account}`;
      if (checkUser.rows.length === 0) return NextResponse.json({ error: "账号未注册" }, { status: 404 });

      await sql`UPDATE users SET password = ${password} WHERE account = ${account}`;
      await sql`DELETE FROM codes WHERE phone = ${account}`; // 用完即焚
      
      return NextResponse.json({ success: true, message: "重置成功" });
    }

    return NextResponse.json({ error: "无效请求" }, { status: 400 });

  } catch (error:any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}