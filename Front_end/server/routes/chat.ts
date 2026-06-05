import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { supabaseAdmin } from '../supabase.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { chatLimiter } from '../middleware/rateLimit.js';
import { chatMessageSchema, saveConversationSchema } from '../schemas/chat.schema.js';

const router = Router();

// Initialize Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: { 'User-Agent': 'aistudio-build' },
  },
});

// All chat routes require authentication
router.use(authMiddleware);

// POST /api/chat — Send a message to AI (main chat endpoint)
router.post('/', chatLimiter, validate(chatMessageSchema), async (req: Request, res: Response) => {
  try {
    const { message, history, context } = req.body;

    const systemPrompts: Record<string, string> = {
      global: 'You are the PlaceMentor AI Mentor. You help students prepare for placements, practice interviews, and improve their coding skills. Be professional, encouraging, and highly technical when needed.',
      workspace: 'You are a coding mentor in an IDE workspace. Help the student understand algorithms, debug code, and optimize solutions. Be concise and focus on the specific problem they are working on.',
      interview: 'You are conducting a mock technical interview. Ask relevant questions, evaluate responses, and provide constructive feedback. Simulate a real interview experience.',
    };

    const chat = ai.chats.create({
      model: 'gemini-3.5-flash',
      config: {
        systemInstruction: systemPrompts[context] || systemPrompts.global,
      },
      history: history || [],
    });

    const response = await chat.sendMessage({ message });
    res.json({ text: response.text });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ error: error.message || 'AI chat failed' });
  }
});

// GET /api/chat/conversations — List user's conversations
router.get('/conversations', async (req: Request, res: Response) => {
  try {
    const { data: conversations, error } = await supabaseAdmin
      .from('chat_conversations')
      .select('id, context, created_at, updated_at')
      .eq('user_id', req.user!.id)
      .order('updated_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch conversations' });
    }

    res.json({ conversations: conversations || [] });
  } catch (error: any) {
    console.error('List conversations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/chat/conversations — Create a new conversation
router.post('/conversations', async (req: Request, res: Response) => {
  try {
    const { context } = req.body;

    const { data: conversation, error } = await supabaseAdmin
      .from('chat_conversations')
      .insert({
        user_id: req.user!.id,
        context: context || 'global',
        messages: [],
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to create conversation' });
    }

    res.status(201).json({ conversation });
  } catch (error: any) {
    console.error('Create conversation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/chat/conversations/:id — Save messages to a conversation
router.put('/conversations/:id', validate(saveConversationSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { messages } = req.body;

    const { data: conversation, error } = await supabaseAdmin
      .from('chat_conversations')
      .update({
        messages,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to save conversation' });
    }

    res.json({ conversation });
  } catch (error: any) {
    console.error('Save conversation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
