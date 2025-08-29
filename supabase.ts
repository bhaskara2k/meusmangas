import { createClient } from '@supabase/supabase-js'

// TODO: Mova isso para variáveis de ambiente em um projeto real
const supabaseUrl = 'https://wvqfnnsgvhpydhqjoswu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2cWZubnNndmhweWRocWpvc3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzMwMzMsImV4cCI6MjA3MjA0OTAzM30.cG5JSB1cN7VpgDWdPZSkgWUw-_9bKd_pUtfj0wkw7o0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)