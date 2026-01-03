import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// 处理余额变动 (充值/消费)
export async function POST(req: Request) {
  try {
    const { userId, type, amount, description } = await req.json();
    
    // 1. 获取当前余额
    const userRes = await sql`SELECT balance FROM users WHERE userid = ${userId}`;
    if (userRes.rows.length === 0) return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    
    const currentBalance = Number(userRes.rows[0].balance);
    const cost = Number(amount);

    // 2. 检查余额
    if (type === 'consume' && currentBalance < cost) {
      return NextResponse.json({ error: "余额不足" }, { status: 402 });
    }

    // 3. 更新余额
    const newBalance = type === 'topup' ? currentBalance + cost : currentBalance - cost;
    await sql`UPDATE users SET balance = ${newBalance} WHERE userid = ${userId}`;

    // 4. 记录交易
    await sql`
      INSERT INTO transactions (userid, type, amount, description)
      VALUES (${userId}, ${type}, ${cost}, ${description})
    `;

    return NextResponse.json({ success: true, balance: newBalance.toFixed(2) });

  } catch (error:any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 获取数据 (用户查自己记录 / 管理员查所有)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('id');
  const role = searchParams.get('role');

  try {
    // A. 如果是管理员，获取所有用户列表 (上帝视角)
    if (role === 'admin') {
      const users = await sql`SELECT * FROM users ORDER BY created_at DESC`;
      // 为了不泄露隐私，只返回必要字段
      const safeUsers = users.rows.map(u => ({
        id: u.userid,
        nickname: u.nickname,
        account: u.account,
        balance: Number(u.balance).toFixed(2),
        password: u.password // 既然是上帝视角，暂时保留密码查看以便您测试
      }));
      return NextResponse.json({ users: safeUsers });
    }

    // B. 普通用户，获取自己的交易记录
    if (userId) {
      // 获取最新余额
      const userRes = await sql`SELECT balance FROM users WHERE userid = ${userId}`;
      const balance = userRes.rows[0]?.balance || 0;

      // 获取交易流水
      const txs = await sql`SELECT * FROM transactions WHERE userid = ${userId} ORDER BY created_at DESC LIMIT 50`;
      
      return NextResponse.json({ 
        balance: Number(balance).toFixed(2),
        transactions: txs.rows.map(t => ({
          id: t.id,
          type: t.type,
          amount: Number(t.amount).toFixed(2),
          description: t.description,
          time: new Date(t.created_at).toLocaleString()
        }))
      });
    }

    return NextResponse.json({ error: "参数缺失" }, { status: 400 });
  } catch (error:any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}