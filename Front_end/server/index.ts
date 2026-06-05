import express from 'express';
import path from 'path';
import helmet from 'helmet';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate required environment variables on startup
const requiredVars = ['GEMINI_API_KEY', 'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_KEY'];
const missing = requiredVars.filter((v) => !process.env[v]);
if (missing.length > 0) {
  console.error(`FATAL: Missing required environment variables: ${missing.join(', ')}`);
  console.error('Copy .env.example to .env and fill in the values.');
  process.exit(1);
}

// Import route handlers
import userRoutes from './routes/users.js';
import roadmapRoutes from './routes/roadmaps.js';
import templateRoutes from './routes/templates.js';
import attendanceRoutes from './routes/attendance.js';
import resumeRoutes from './routes/resumes.js';
import chatRoutes from './routes/chat.js';

// Import middleware
import { globalLimiter } from './middleware/rateLimit.js';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // ── Global Middleware ──────────────────────────────────────
  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for development (Vite injects scripts)
  }));
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use('/api', globalLimiter);

  // ── API Routes ─────────────────────────────────────────────
  app.use('/api/users', userRoutes);
  app.use('/api/roadmaps/templates', templateRoutes);
  app.use('/api/roadmaps', roadmapRoutes);
  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/resumes', resumeRoutes);
  app.use('/api/chat', chatRoutes);

  // ── API Error Handler ──────────────────────────────────────
  app.use('/api', (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('API Error:', err);
    res.status(err.status || 500).json({
      error: err.message || 'Internal server error',
    });
  });

  // ── Frontend Serving ───────────────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // ── Start Server ───────────────────────────────────────────
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✓ Server running on http://localhost:${PORT}`);
    console.log(`✓ API routes: auth, users, roadmaps, attendance, resumes, chat`);
    console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer();
