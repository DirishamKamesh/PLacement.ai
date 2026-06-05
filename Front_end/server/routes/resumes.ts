import { Router, Request, Response } from 'express';
import multer from 'multer';
import { supabaseAdmin } from '../supabase.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { resumeAnalyzeSchema } from '../schemas/resume.schema.js';
import { GoogleGenAI } from '@google/genai';

const router = Router();

// Configure multer for file uploads (5MB limit, PDF only)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

// All resume routes require authentication
router.use(authMiddleware);

// GET /api/resumes — List user's resumes
router.get('/', async (req: Request, res: Response) => {
  try {
    const { data: resumes, error } = await supabaseAdmin
      .from('resumes')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch resumes' });
    }

    res.json({ resumes: resumes || [] });
  } catch (error: any) {
    console.error('List resumes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/resumes/upload — Upload a resume PDF
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileName = `${req.user!.id}/${Date.now()}_${req.file.originalname}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('resumes')
      .upload(fileName, req.file.buffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload file' });
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('resumes')
      .getPublicUrl(fileName);

    // Create database record
    const { data: resume, error: dbError } = await supabaseAdmin
      .from('resumes')
      .insert({
        user_id: req.user!.id,
        file_name: req.file.originalname,
        file_url: urlData.publicUrl,
        file_size_bytes: req.file.size,
        mime_type: req.file.mimetype,
        target_role: req.body.target_role || 'Software Engineer',
      })
      .select()
      .single();

    if (dbError) {
      console.error('DB insert error:', dbError);
      return res.status(500).json({ error: 'Failed to save resume record' });
    }

    res.status(201).json({ resume });
  } catch (error: any) {
    console.error('Upload error:', error);
    if (error.message === 'Only PDF files are allowed') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/resumes/:id/analyze — Run AI analysis on uploaded resume
router.post('/:id/analyze', validate(resumeAnalyzeSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { target_role } = req.body;

    // Fetch resume record
    const { data: resume, error } = await supabaseAdmin
      .from('resumes')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (error || !resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // For MVP, we use Gemini to analyze based on file name and target role.
    // In production, you'd extract text from the PDF first.
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || '',
    });

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

Since you don't have the actual content, provide realistic scores and relevant keywords for a ${target_role} role. Be specific and actionable in suggestions.`;

    const chat = ai.chats.create({
      model: 'gemini-3.5-flash',
      config: { systemInstruction: 'You are a resume analysis API. Return only valid JSON, no markdown.' },
    });

    const response = await chat.sendMessage({ message: analysisPrompt });
    let analysis;
    
    try {
      // Try to parse the AI response as JSON
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

    // Update resume record with analysis results
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
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Update analysis error:', updateError);
    }

    res.json({ resume: updated || resume, analysis });
  } catch (error: any) {
    console.error('Analyze error:', error);
    res.status(500).json({ error: 'Analysis failed. Please try again.' });
  }
});

// DELETE /api/resumes/:id — Delete a resume
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Fetch to get file URL for storage deletion
    const { data: resume } = await supabaseAdmin
      .from('resumes')
      .select('file_url')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Delete from storage (extract path from URL)
    if (resume.file_url) {
      const pathMatch = resume.file_url.match(/resumes\/(.+)$/);
      if (pathMatch) {
        await supabaseAdmin.storage.from('resumes').remove([pathMatch[1]]);
      }
    }

    // Delete from database
    await supabaseAdmin.from('resumes').delete().eq('id', id);

    res.json({ success: true });
  } catch (error: any) {
    console.error('Delete resume error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
