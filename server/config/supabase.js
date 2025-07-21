const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = 'https://qkdciqmomuczdfgdqbcx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrZGNpcW1vbXVjemRmZ2RxYmN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NzAxMDMsImV4cCI6MjA2ODU0NjEwM30.YuxnYd0yjjbZmLbE9a40eE8PICD3Ae4CIBv_Qu_aMxs';

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = supabase;