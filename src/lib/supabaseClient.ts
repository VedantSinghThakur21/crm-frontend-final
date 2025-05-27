import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bnfojphidihrtutndtia.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuZm9qcGhpZGlocnR1dG5kdGlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyNTk3NzgsImV4cCI6MjA2MzgzNTc3OH0.12beSY-pEePAAkzIboJ-bwfT-C385Xom8A6S8RKCMJY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);