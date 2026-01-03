import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { userId, code } = await req.json();

    // 1. 基础校验
    if (!code || !code.startsWith('BOSS-')) {
      return NextResponse.json({ error: "无效的卡密格式" }, { status: 400 });
    }

    // 2. 查询卡密状态
    const cardRes = await sql`SELECT * FROM cards WHERE code = ${code}`;
    if (cardRes.rows.length === 0) {
      return NextResponse.json({ error: "卡密不存在，请检查输入" }, { status: 404 });
    }

    const card = cardRes.rows[0];

    // 3. 安全检查
    if (card.status === 'used') {
      return NextResponse.json({ error: "该卡密已被使用" }, { status: 409 });
    }

    if (card.expires_at && new Date(card.expires_at) < new Date()) {
      return NextResponse.json({ error: "该卡密已过期" }, { status: 403 });
    }

    // 4. 执行核销 (使用 UPDATE ... RETURNING 确保原子性，防止并发重复兑换)
    // 只有当 status = 'unused' 时才更新，如果被别人抢先用了，这里会返回 0 行
    const updateRes = await sql`
      UPDATE cards 
      SET status = 'used', used_by = ${userId}, used_at = NOW() 
      WHERE code = ${code} AND status = 'unused'
      RETURNING amount
    `;

    if (updateRes.rows.length === 0) {
      return NextResponse.json({ error: "兑换失败，卡密可能刚被使用" }, { status: 409 });
    }

    const amount = Number(updateRes.rows[0].amount);

    // 5. 给用户加余额
    await sql`UPDATE users SET balance = balance + ${amount} WHERE userid = ${userId}`;

    // 6. 写入交易流水 (这样用户和管理员都能查到)
    await sql`
      INSERT INTO transactions (userid, type, amount, description)
      VALUES (${userId}, 'topup', ${amount}, ${'卡密充值: ' + code})
    `;

    // 7. 查最新余额返回
    const userRes = await sql`SELECT balance FROM users WHERE userid = ${userId}`;
    const newBalance = Number(userRes.rows[0].balance).toFixed(2);

    return NextResponse.json({ success: true, balance: newBalance, amount: amount });

  } catch (error:any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}