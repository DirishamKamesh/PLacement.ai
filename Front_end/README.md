<div align="center">
  <img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# PlaceMentor AI

PlaceMentor AI is a comprehensive placement preparation platform designed to help students track their roadmaps, analyze resumes with AI, manage attendance, and prepare effectively for placements.

---

## 📸 Screenshots

*(Replace these placeholder images with actual screenshots of your application)*

### Dashboard
<div align="center">
  <img src="https://via.placeholder.com/800x450?text=Dashboard+Screenshot" alt="Dashboard" />
</div>

### AI Resume Analyzer
<div align="center">
  <img src="https://via.placeholder.com/800x450?text=AI+Resume+Analyzer+Screenshot" alt="AI Resume Analyzer" />
</div>

### Interactive Roadmaps
<div align="center">
  <img src="https://via.placeholder.com/800x450?text=Roadmap+Screenshot" alt="Interactive Roadmaps" />
</div>

### Attendance Tracker
<div align="center">
  <img src="https://via.placeholder.com/800x450?text=Attendance+Tracker+Screenshot" alt="Attendance Tracker" />
</div>

---

## 🗄️ Database Structure (Supabase)

The application uses **Supabase** (PostgreSQL) for its database, with Row Level Security (RLS) enabled to ensure data privacy. Below is the detailed schema:

### 1. `users`
Extends Supabase Auth's `auth.users` with application-specific fields.
*   **id** `UUID` (Primary Key, references `auth.users`)
*   **email** `TEXT`
*   **full_name** `TEXT`
*   **role** `TEXT` ('student', 'faculty', 'admin')
*   **avatar_url** `TEXT`
*   **skills**, **social_links** `JSONB`
*   **streak** `INTEGER`

### 2. `roadmaps`
Stores user-created or cloned learning tracks.
*   **id** `UUID` (Primary Key)
*   **user_id** `UUID` (Foreign Key -> `users.id`)
*   **title** `TEXT`
*   **status** `TEXT` ('active', 'completed', 'archived')
*   **total_challenges**, **completed_challenges** `INTEGER`

### 3. `roadmap_nodes` & 4. `roadmap_edges`
Stores the visual nodes and connections for the interactive React Flow roadmaps.
*   **`roadmap_nodes`**: `id`, `roadmap_id`, `node_type`, `title`, `status`, `position_x`, `position_y`, `data` (JSONB).
*   **`roadmap_edges`**: `id`, `roadmap_id`, `source_node_id`, `target_node_id`, `animated`.

### 5. `attendance_records`
Logs student check-ins.
*   **id** `UUID` (Primary Key)
*   **user_id** `UUID` (Foreign Key -> `users.id`)
*   **attendance_date** `DATE`
*   **status** `TEXT` ('present', 'absent', 'late')
*   **check_in_time** `TIME`
*   **location**, **mode** `TEXT`

### 6. `resumes`
Stores resume files and AI-generated analysis scores.
*   **id** `UUID` (Primary Key)
*   **user_id** `UUID` (Foreign Key -> `users.id`)
*   **file_name**, **file_url**, **mime_type** `TEXT`
*   **ats_score**, **health_score** `INTEGER`
*   **found_keywords**, **missing_keywords**, **ai_suggestions** `JSONB`

### 7. `chat_conversations`
Stores chat history for the AI Mentor.
*   **id** `UUID` (Primary Key)
*   **user_id** `UUID` (Foreign Key -> `users.id`)
*   **context** `TEXT`
*   **messages** `JSONB`

---

## 🚀 Run Locally

**Prerequisites:**  Node.js

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Environment Variables:**
   Copy `.env.example` to `.env` or `.env.local` and fill in your Supabase credentials and Gemini API Key:
   ```env
   GEMINI_API_KEY="your_api_key"
   SUPABASE_URL="your_supabase_url"
   SUPABASE_ANON_KEY="your_anon_key"
   SUPABASE_SERVICE_KEY="your_service_key"
   ```
3. **Run the app:**
   ```bash
   npm run dev
   ```
