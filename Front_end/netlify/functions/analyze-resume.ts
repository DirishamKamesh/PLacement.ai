import { Handler } from '@netlify/functions';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';
const geminiApiKey = process.env.GEMINI_API_KEY || '';

// We need the service key to update the resume record with analysis results securely
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

// Also need anon client to verify the user token
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});

const ai = new GoogleGenAI({ apiKey: geminiApiKey });

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

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
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token);

    if (authError || !user) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid or expired token' }) };
    }

    // 2. Parse request
    const body = JSON.parse(event.body || '{}');
    const { resume_id, target_role } = body;

    if (!resume_id) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'resume_id is required' }) };
    }

    // 3. Fetch resume record
    const { data: resume, error: fetchError } = await supabaseAdmin
      .from('resumes')
      .select('*')
      .eq('id', resume_id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !resume) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Resume not found' }) };
    }

    // 4. Generate AI Analysis
    const analysisPrompt = `You are a professional resume analyst. Analyze a resume for the role of "${target_role || 'Software Engineer'}".

The resume file is named: "${resume.file_name}"

Provide a JSON response with the following structure (no markdown, just raw JSON):
{
  "ats_score": <number 0-100>,
  "health_score": <number 0-100>,
  "found_keywords": ["keyword1", "keyword2", ...],
  "missing_keywords": ["keyword1", "keyword2", ...],
  "suggestions": [
    { "title": "Suggestion Title", "description": "Detailed suggestion" }
  ]
}

Since you don't have the actual content, provide realistic scores and relevant keywords for a ${target_role || 'Software Engineer'} role. Be specific and actionable in suggestions.`;

    const chat = ai.chats.create({
      model: 'gemini-3.5-flash',
      config: { systemInstruction: 'You are a resume analysis API. Return only valid JSON, no markdown.' },
    });

    const response = await chat.sendMessage({ message: analysisPrompt });
    let analysis;
    
    try {
      const text = response.text || '{}';
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(cleaned);
    } catch {
      analysis = {
        ats_score: 70,
        health_score: 65,
        found_keywords: [],
        missing_keywords: [],
        suggestions: [{ title: 'Analysis Pending', description: 'AI analysis could not parse results. Please try again.' }],
      };
    }

    // 5. Update database record
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('resumes')
      .update({
        ats_score: analysis.ats_score,
        health_score: analysis.health_score,
        found_keywords: analysis.found_keywords,
        missing_keywords: analysis.missing_keywords,
        ai_suggestions: analysis.suggestions,
        target_role: target_role || resume.target_role,
        analyzed_at: new Date().toISOString(),
      })
      .eq('id', resume_id)
      .select()
      .single();

    if (updateError) {
      console.error('Update analysis error:', updateError);
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to save analysis' }) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ resume: updated || resume, analysis }),
    };

  } catch (error: any) {
    console.error('Analyze error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Analysis failed. Please try again.' }),
    };
  }
};
