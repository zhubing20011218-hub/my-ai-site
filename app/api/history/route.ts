import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// 初始化 Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// 1. 获取历史记录列表
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

  const { data, error } = await supabase
    .from('chats')
    .select('id, title, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ chats: data });
}

// 2. 保存/更新对话
export async function POST(req: NextRequest) {
  const json = await req.json();
  const { chatId, userId, messages, title } = json;

  // 如果没有 chatId，说明是新对话，插入一条
  if (!chatId) {
    const { data, error } = await supabase
      .from('chats')
      .insert([{ 
        user_id: userId, 
        messages: messages, 
        title: title || messages[0]?.content?.text?.slice(0, 20) || '新对话' 
      }])
      .select()
      .single();
      
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ chat: data });
  } 
  // 如果有 chatId，说明是老对话，更新 messages
  else {
    const { error } = await supabase
      .from('chats')
      .update({ 
        messages: messages, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', chatId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }
}

// 3. 读取单条详情
export async function PUT(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get('chatId');

    const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('id', chatId)
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ chat: data });
}

// 4. 删除
export async function DELETE(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get('chatId');
    
    const { error } = await supabase.from('chats').delete().eq('id', chatId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}