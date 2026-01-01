import { createClient } from '@supabase/supabase-js'

// 读取我们在 .env.local 里存的钥匙
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 创建并导出这个客户端，以后谁要查数据库，就找它
export const supabase = createClient(supabaseUrl, supabaseKey)