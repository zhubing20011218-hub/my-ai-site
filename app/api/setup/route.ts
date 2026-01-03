import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. 用户表
    await sql`CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, userid TEXT UNIQUE NOT NULL, nickname TEXT, account TEXT UNIQUE NOT NULL, password TEXT NOT NULL, balance DECIMAL(10, 2) DEFAULT 0.10, role TEXT DEFAULT 'user', created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);`;

    // 2. 交易表
    await sql`CREATE TABLE IF NOT EXISTS transactions (id SERIAL PRIMARY KEY, userid TEXT NOT NULL, type TEXT NOT NULL, amount DECIMAL(10, 2) NOT NULL, description TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);`;

    // 3. 验证码表
    await sql`CREATE TABLE IF NOT EXISTS codes (id SERIAL PRIMARY KEY, phone TEXT NOT NULL, code TEXT NOT NULL, expires_at TIMESTAMP WITH TIME ZONE NOT NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);`;

    // 4. 卡密表
    await sql`CREATE TABLE IF NOT EXISTS cards (id SERIAL PRIMARY KEY, code TEXT UNIQUE NOT NULL, amount DECIMAL(10, 2) NOT NULL, status TEXT DEFAULT 'unused', expires_at TIMESTAMP WITH TIME ZONE, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, used_by TEXT, used_at TIMESTAMP WITH TIME ZONE);`;

    // 5. ✨ 新增：客服消息表
    // is_admin: true表示是客服发的，false表示是用户发的
    // read: 标记是否已读
    await sql`
      CREATE TABLE IF NOT EXISTS support_messages (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL, 
        content TEXT NOT NULL,
        is_admin BOOLEAN DEFAULT FALSE, 
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    return NextResponse.json({ message: "✅ 数据库升级成功！客服系统已就绪。" }, { status: 200 });
  } catch (error:any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}