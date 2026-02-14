import { createClient } from '@supabase/supabase-js'

// Substitua pelas suas chaves se forem diferentes, mas mantive as do seu código original
const supabaseUrl = 'https://dnimxqxgtvltgvrrabur.supabase.co'
const supabaseKey = 'sb_publishable_sOLt-j1cYS4KMWeDnpT-Aw_YfSQiFqG'

export const supabase = createClient(supabaseUrl, supabaseKey)