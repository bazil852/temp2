import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials');
}

const retryCount = 3;
const retryDelay = 1000; // 1 second

const customFetch = async (url: string, options: RequestInit) => {
  let lastError;
  
  for (let i = 0; i < retryCount; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response;
    } catch (err) {
      lastError = err;
      if (i < retryCount - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (i + 1)));
      }
    }
  }
  
  throw new Error('Network connection error. Please check your internet connection.');
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    fetch: customFetch
  }
});