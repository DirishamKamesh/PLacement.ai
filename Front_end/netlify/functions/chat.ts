import { Handler } from '@netlify/functions';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

// Access environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const geminiApiKey = process.env.GEMINI_API_KEY || '';

// Initialize Supabase client for auth verification
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: geminiApiKey });

export const handler: Handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    // 1. Verify Authentication
    const authHeader = event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid or expired token' }) };
    }

    // 2. Parse request body
    const body = JSON.parse(event.body || '{}');
    const { message, history, context } = body;

    if (!message) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Message is required' }) };
    }

    // 3. System Prompts
    const systemPrompts: Record<string, string> = {
      global: 'You are the PlaceMentor AI Mentor. You help students prepare for placements, practice interviews, and improve their coding skills. Be professional, encouraging, and highly technical when needed.',
      workspace: 'You are a coding mentor in an IDE workspace. Help the student understand algorithms, debug code, and optimize solutions. Be concise and focus on the specific problem they are working on.',
      interview: 'You are conducting a mock technical interview. Ask relevant questions, evaluate responses, and provide constructive feedback. Simulate a real interview experience.',
    };

    // 4. Generate response
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: systemPrompts[context] || systemPrompts.global,
      },
      history: history || [],
    });

    const response = await chat.sendMessage({ message });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ text: response.text }),
    };
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || 'AI chat failed' }),
    };
  }
};
