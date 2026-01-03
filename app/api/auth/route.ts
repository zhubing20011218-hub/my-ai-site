import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { type, account, password, nickname } = await req.json();

    // 🛡️ 场景一：登录
    if (type === 'login') {
      // 👑 核心逻辑：上帝账号通道 (无需数据库，直接通过)
      // 这保证了管理员永远存在，且不可被普通人注册覆盖
      if (account === 'admin' && password === 'admin123') {
        return NextResponse.json({ 
          id: 'admin_root', 
          nickname: '超级管理员', 
          account: 'admin', 
          role: 'admin', 
          balance: '99999.00' 
        });
      }

      // 普通用户登录：查数据库
      const { rows } = await sql`SELECT * FROM users WHERE account = ${account} AND password = ${password}`;
      if (rows.length === 0) {
        return NextResponse.json({ error: "账号或密码错误" }, { status: 401 });
      }
      const u = rows[0];
      return NextResponse.json({ 
        id: u.userid, nickname: u.nickname, account: u.account, role: u.role, balance: Number(u.balance).toFixed(2) 
      });
    } 
    
    // 🛡️ 场景二：注册
    else if (type === 'register') {
      // ❌ 安全补丁：严禁注册 admin 账号
      if (account.toLowerCase() === 'admin') {
        return NextResponse.json({ error: "非法操作：管理员账号禁止注册" }, { status: 403 });
      }

      // 1. 检查账号是否存在
      const existing = await sql`SELECT * FROM users WHERE account = ${account}`;
      if (existing.rows.length > 0) {
        return NextResponse.json({ error: "该账号已存在" }, { status: 400 });
      }

      // 2. 创建新用户 (强制 role = 'user'，堵死提权漏洞)
      const role = 'user'; 
      const initBalance = 0.10;
      const userId = `u_${Date.now()}`;
      
      await sql`
        INSERT INTO users (userid, nickname, account, password, balance, role)
        VALUES (${userId}, ${nickname}, ${account}, ${password}, ${initBalance}, ${role})
      `;

      // 3. 记录初始赠送
      await sql`
        INSERT INTO transactions (userid, type, amount, description)
        VALUES (${userId}, 'topup', 0.10, '注册赠送体验金')
      `;

      return NextResponse.json({ 
        id: userId, nickname, account, role, balance: initBalance.toFixed(2) 
      });
    }

    return NextResponse.json({ error: "无效请求" }, { status: 400 });

  } catch (error:any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}