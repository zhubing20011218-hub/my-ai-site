import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. 用户表
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        userid TEXT UNIQUE NOT NULL,
        nickname TEXT,
        account TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        balance DECIMAL(10, 2) DEFAULT 0.10,
        role TEXT DEFAULT 'user',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 2. 交易表
    await sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        userid TEXT NOT NULL,
        type TEXT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 3. 验证码表
    await sql`
      CREATE TABLE IF NOT EXISTS codes (
        id SERIAL PRIMARY KEY,
        phone TEXT NOT NULL,
        code TEXT NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 4. ✨ 新增：卡密表 (核心升级)
    await sql`
      CREATE TABLE IF NOT EXISTS cards (
        id SERIAL PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,        -- 卡密内容 (BOSS-XXXX...)
        amount DECIMAL(10, 2) NOT NULL,   -- 面额
        status TEXT DEFAULT 'unused',     -- 状态: unused(未使用), used(已使用)
        expires_at TIMESTAMP WITH TIME ZONE, -- 有效期 (为空则永久有效)
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        used_by TEXT,                     -- 谁使用了 (存 userid)
        used_at TIMESTAMP WITH TIME ZONE  -- 使用时间
      );
    `;

    return NextResponse.json({ message: "✅ 数据库升级成功！卡密系统已就绪。" }, { status: 200 });
  } catch (error:any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}