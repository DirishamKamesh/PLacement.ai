import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../supabase.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// All attendance routes require authentication
router.use(authMiddleware);

// GET /api/attendance — Get user's attendance records
router.get('/', async (req: Request, res: Response) => {
  try {
    const { month, year } = req.query;
    
    let query = supabaseAdmin
      .from('attendance_records')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('attendance_date', { ascending: false });

    // Filter by month/year if provided
    if (month && year) {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endMonth = Number(month) === 12 ? 1 : Number(month) + 1;
      const endYear = Number(month) === 12 ? Number(year) + 1 : Number(year);
      const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;
      
      query = query.gte('attendance_date', startDate).lt('attendance_date', endDate);
    }

    const { data: records, error } = await query;

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch attendance records' });
    }

    // Calculate stats
    const allRecords = records || [];
    const presentDays = allRecords.filter(r => r.status === 'present').length;
    const lateDays = allRecords.filter(r => r.status === 'late').length;
    const absentDays = allRecords.filter(r => r.status === 'absent').length;
    const totalDays = allRecords.length;
    const attendanceRate = totalDays > 0 ? ((presentDays + lateDays) / totalDays * 100).toFixed(1) : '0.0';

    // Calculate average arrival time for present/late records
    const timesInMinutes = allRecords
      .filter(r => r.check_in_time && r.status !== 'absent')
      .map(r => {
        const [h, m] = r.check_in_time.split(':').map(Number);
        return h * 60 + m;
      });
    
    const avgMinutes = timesInMinutes.length > 0
      ? Math.round(timesInMinutes.reduce((a: number, b: number) => a + b, 0) / timesInMinutes.length)
      : 0;
    const avgHour = Math.floor(avgMinutes / 60);
    const avgMin = avgMinutes % 60;
    const avgArrival = timesInMinutes.length > 0
      ? `${String(avgHour % 12 || 12).padStart(2, '0')}:${String(avgMin).padStart(2, '0')} ${avgHour >= 12 ? 'PM' : 'AM'}`
      : 'N/A';

    // Calculate streak (consecutive present days from most recent)
    let streak = 0;
    const sorted = [...allRecords].sort((a, b) => 
      new Date(b.attendance_date).getTime() - new Date(a.attendance_date).getTime()
    );
    for (const record of sorted) {
      if (record.status === 'present' || record.status === 'late') {
        streak++;
      } else {
        break;
      }
    }

    res.json({
      records: allRecords,
      stats: {
        attendance_rate: `${attendanceRate}%`,
        present_days: presentDays,
        late_days: lateDays,
        absent_days: absentDays,
        avg_arrival: avgArrival,
        streak,
      },
    });
  } catch (error: any) {
    console.error('Get attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/attendance/checkin — Record a check-in
router.post('/checkin', async (req: Request, res: Response) => {
  try {
    const { location, mode } = req.body;
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].slice(0, 5); // HH:MM

    // Check for duplicate check-in on same day
    const { data: existing } = await supabaseAdmin
      .from('attendance_records')
      .select('id')
      .eq('user_id', req.user!.id)
      .eq('attendance_date', dateStr)
      .single();

    if (existing) {
      return res.status(409).json({ error: 'Already checked in today' });
    }

    // Determine status based on time (before 9:15 AM = present, after = late)
    const [hours, minutes] = timeStr.split(':').map(Number);
    const status = (hours < 9 || (hours === 9 && minutes <= 15)) ? 'present' : 'late';

    const { data: record, error } = await supabaseAdmin
      .from('attendance_records')
      .insert({
        user_id: req.user!.id,
        attendance_date: dateStr,
        status,
        check_in_time: timeStr,
        location: location || 'Unknown',
        mode: mode || 'manual',
      })
      .select()
      .single();

    if (error) {
      console.error('Check-in error:', error);
      return res.status(500).json({ error: 'Failed to record check-in' });
    }

    res.status(201).json({ record });
  } catch (error: any) {
    console.error('Check-in error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
