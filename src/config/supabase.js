const { createClient } = require('@supabase/supabase-js');
const config = require('./index');

if (!config.supabase.url || !config.supabase.key) {
    console.warn('WARNING: Supabase URL or Key missing. Database functionality will be disabled.');
}

// Create a single supabase client for interacting with your database
const supabase = (config.supabase.url && config.supabase.key)
    ? createClient(config.supabase.url, config.supabase.key)
    : null;

module.exports = supabase;
