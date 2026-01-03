import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');

    // 1. 获取特定用户的聊天记录 (用户端 & 管理员端通用)
    if (action === 'history' && userId) {
      const { rows } = await sql`
        SELECT * FROM support_messages 
        WHERE user_id = ${userId} 
        ORDER BY created_at ASC
      `;
      return NextResponse.json({ messages: rows });
    }

    // 2. 获取最近的会话列表 (仅管理员用)
    if (action === 'list') {
      // 获取所有发过消息的用户，按最新消息时间排序
      const { rows } = await sql`
        SELECT DISTINCT ON (m.user_id) 
          m.user_id, 
          u.nickname, 
          m.content as last_message, 
          m.created_at,
          (SELECT COUNT(*) FROM support_messages WHERE user_id = m.user_id AND is_admin = FALSE AND read = FALSE) as unread
        FROM support_messages m
        LEFT JOIN users u ON m.user_id = u.userid
        ORDER BY m.user_id, m.created_at DESC
      `;
      // 按时间倒序重排一下
      rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return NextResponse.json({ sessions: rows });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error:any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId, content, isAdmin } = await req.json();

    if (!content.trim()) return NextResponse.json({ error: "Empty content" }, { status: 400 });

    await sql`
      INSERT INTO support_messages (user_id, content, is_admin, read)
      VALUES (${userId}, ${content}, ${isAdmin || false}, ${false})
    `;

    // 如果是管理员回复，把该用户之前的未读消息标记为已读
    if (isAdmin) {
      await sql`UPDATE support_messages SET read = TRUE WHERE user_id = ${userId} AND is_admin = FALSE`;
    }

    return NextResponse.json({ success: true });
  } catch (error:any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}