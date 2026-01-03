import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// 生成高强度随机卡密 (格式: BOSS-XXXX-XXXX-XXXX)
function generateSecureCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 去掉易混淆字符 I,1,O,0
  let result = 'BOSS';
  for (let i = 0; i < 3; i++) {
    result += '-';
    for (let j = 0; j < 4; j++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  return result;
}

// GET: 管理员获取卡密列表
export async function GET(req: Request) {
  try {
    const { rows } = await sql`SELECT * FROM cards ORDER BY created_at DESC LIMIT 100`;
    // 格式化一下时间
    const formatted = rows.map(c => ({
      ...c,
      amount: Number(c.amount).toFixed(2),
      created_at: new Date(c.created_at).toLocaleString(),
      expires_at: c.expires_at ? new Date(c.expires_at).toLocaleDateString() : '永久',
      used_at: c.used_at ? new Date(c.used_at).toLocaleString() : '-'
    }));
    return NextResponse.json({ cards: formatted });
  } catch (error:any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: 管理员生成新卡密
export async function POST(req: Request) {
  try {
    const { amount, count, days } = await req.json(); // 金额，数量，有效期(天)

    // 计算过期时间
    let expiresAt = null;
    if (days && days > 0) {
      const date = new Date();
      date.setDate(date.getDate() + parseInt(days));
      expiresAt = date.toISOString();
    }

    const newCards = [];
    
    // 批量生成
    for (let i = 0; i < count; i++) {
      const code = generateSecureCode();
      if (expiresAt) {
        await sql`INSERT INTO cards (code, amount, expires_at) VALUES (${code}, ${amount}, ${expiresAt})`;
      } else {
        await sql`INSERT INTO cards (code, amount) VALUES (${code}, ${amount})`;
      }
      newCards.push(code);
    }

    return NextResponse.json({ success: true, count: newCards.length });
  } catch (error:any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}