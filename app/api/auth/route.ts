import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { type, account, password, nickname } = await req.json();

    if (type === 'register') {
      // 1. 检查账号是否存在
      const existing = await sql`SELECT * FROM users WHERE account = ${account}`;
      if (existing.rows.length > 0) {
        return NextResponse.json({ error: "该账号已存在" }, { status: 400 });
      }

      // 2. 创建新用户 (如果是 admin 账号，自动设为管理员角色)
      const role = account === 'admin' ? 'admin' : 'user';
      const initBalance = account === 'admin' ? 9999.00 : 0.10; // 管理员给多点钱
      const userId = `u_${Date.now()}`;
      
      await sql`
        INSERT INTO users (userid, nickname, account, password, balance, role)
        VALUES (${userId}, ${nickname}, ${account}, ${password}, ${initBalance}, ${role})
      `;

      // 3. 记录初始赠送
      if (role === 'user') {
        await sql`
          INSERT INTO transactions (userid, type, amount, description)
          VALUES (${userId}, 'topup', 0.10, '注册赠送体验金')
        `;
      }

      return NextResponse.json({ 
        id: userId, nickname, account, role, balance: initBalance.toFixed(2) 
      });
    } 
    
    else if (type === 'login') {
      // 登录逻辑
      const { rows } = await sql`SELECT * FROM users WHERE account = ${account} AND password = ${password}`;
      if (rows.length === 0) {
        return NextResponse.json({ error: "账号或密码错误" }, { status: 401 });
      }
      const u = rows[0];
      return NextResponse.json({ 
        id: u.userid, nickname: u.nickname, account: u.account, role: u.role, balance: Number(u.balance).toFixed(2) 
      });
    }

    return NextResponse.json({ error: "无效请求" }, { status: 400 });

  } catch (error:any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}