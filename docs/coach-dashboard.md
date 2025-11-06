# Coach Dashboard Documentation

## Overview

The Coach Dashboard provides educators and coaches with a real-time overview of student progress, enabling timely interventions and support. This feature leverages the existing supporter relationship model, where supporters with `role IN ('coach', 'teacher')` gain access to specialized cohort management tools.

## Key Features

### 1. Student Status Tracking

Students are automatically categorized into four statuses based on real-time activity:

#### 🟢 On Track
- Meeting weekly step completion targets (>60%)
- No overdue steps
- Recent check-ins showing manageable difficulty (<2.3 average)
- **Intervention**: Positive reinforcement, maintain momentum

#### 🟡 At Risk
- 1-2 overdue steps OR
- Difficulty trending upward (>2.3 average) OR
- Completion rate dropping below 60%
- **Intervention**: Light nudge, schedule adjustment, or step simplification

#### 🔴 Stuck
- 3+ overdue steps OR
- Any step overdue >72 hours OR
- High difficulty (>2.5) + no check-in for 48+ hours
- **Intervention**: Immediate attention, break down steps, schedule coaching session

#### ⚪ No Data
- No steps planned this week OR
- No check-in activity for 7+ days
- **Intervention**: Re-engagement outreach, check if student needs goal restart

### 2. Cohort Management

**Cohorts Table:**
- Group students by program, school, or period
- Each student can belong to one cohort
- Coaches can filter dashboard by cohort

**Creating Cohorts:**
```sql
INSERT INTO cohorts (name, program, school_id)
VALUES ('Fall 2025 Transition Skills', 'Helix', 'school-uuid');
```

**Adding Students:**
```sql
INSERT INTO cohort_members (cohort_id, individual_id, added_by)
VALUES ('cohort-uuid', 'student-uuid', auth.uid());
```

### 3. Quick Actions

From the student detail drawer, coaches can perform interventions that are logged and tracked:

- **Nudge**: Send encouraging reminder (visible to student)
- **Adjust**: Reschedule overdue steps (logged for coach)
- **Split**: Break down overwhelming step into smaller chunks (visible to student)
- **Note**: Add private coaching observation (coach-only)

All actions create records in the `support_actions` table for audit trails.

### 4. Dashboard KPIs

- **On Track / At Risk / Stuck / No Data**: Live counts
- **Total Overdue**: Sum of all overdue steps across students
- **Interventions (7d)**: Count of coach actions in past week

### 5. Filters

- **Cohort**: View specific program group
- **Grade**: Filter by grade level (8-12)
- **Status**: Show only students matching status
- **Supporter Scope**: 
  - **My Students**: Only your direct relationships
  - **All Coaches**: Include students supported by other coaches

### 6. CSV Export

Download current filtered view with columns:
- Name, Grade, Cohort, Status, Current Goal, Completed This Week, Planned This Week, Progress %, Streak Days, Overdue Count

## Data Model

### New Tables

**cohorts**
```sql
- id (uuid, PK)
- name (text, NOT NULL)
- program (text)
- school_id (uuid)
- created_at, updated_at (timestamptz)
```

**cohort_members**
```sql
- id (uuid, PK)
- cohort_id (uuid, FK → cohorts)
- individual_id (uuid, FK → auth.users)
- added_by (uuid, FK → auth.users)
- created_at (timestamptz)
- UNIQUE (cohort_id, individual_id)
```

**support_actions**
```sql
- id (uuid, PK)
- student_id (uuid, FK → auth.users)
- coach_id (uuid, FK → auth.users)
- type (support_action_type ENUM: nudge, adjust, split, note)
- at_ts (timestamptz)
- payload (jsonb)
- visible_to_student (boolean)
- created_at (timestamptz)
```

### Enhanced Columns

**check_ins**
- `difficulty` (integer 1-3): 1=😊 easy, 2=😐 okay, 3=😣 hard
- `mood` (integer 1-3): 1=good, 2=neutral, 3=struggling
- `blocker_tags` (text[]): e.g., ['timing', 'confusing_instructions', 'noise', 'avoidance']

**profiles**
- `grade` (text): Student's grade level (e.g., '9', '10')

**supporters** (enhanced enum)
- `role`: Added 'coach' and 'teacher' values to existing enum

## Security & Permissions

### RLS Policies

**Cohorts:**
- Coaches can view cohorts containing their students
- Coaches can create cohorts

**Cohort Members:**
- Coaches can view members of their cohorts
- Coaches can add only students they support

**Support Actions:**
- Coaches view their own actions
- Students view actions marked `visible_to_student = true`

### Access Control

Dashboard access is automatic:
- If `supporters` table has relationship with `role IN ('coach', 'teacher')`, user sees Coach tab
- No additional configuration needed

## Performance Optimizations

- **Auto-refresh**: Dashboard refetches every 2 minutes
- **Stale time**: 2 minutes (React Query manages freshness)
- **Batched queries**: Profiles, goals, steps, check-ins fetched in parallel
- **Indexed columns**: cohort_id, individual_id, student_id, coach_id, at_ts

## Troubleshooting

### Coach Tab Not Appearing
1. Verify supporter relationship exists: `SELECT * FROM supporters WHERE supporter_id = 'your-id' AND role IN ('coach', 'teacher');`
2. Check if profile has correct role type
3. Clear browser cache and reload

### Students Not Showing
1. Verify cohort membership: `SELECT * FROM cohort_members WHERE individual_id = 'student-id';`
2. Check supporter relationship exists
3. Verify student has active goals

### Status Calculation Issues
- **On Track not showing**: Check if steps are planned this week (due_date within current week)
- **Stuck not triggering**: Verify check_ins table has difficulty and blocker_tags populated
- **No Data persisting**: Ensure student has recent check-ins (within 7 days)

### Quick Actions Not Working
1. Check console for errors
2. Verify `support_actions` table exists
3. Confirm coach has proper RLS permissions

## Demo Data Setup

See `docs/coach-dashboard-seed.sql` for complete seed script.

**Quick setup:**
1. Open Supabase SQL Editor
2. Replace `:COACH_CARLOS` with your user ID
3. Run the seed script
4. Reload dashboard

**Expected results:**
- 6 students across 2 cohorts
- 2 On Track, 2 At Risk, 1 Stuck, 1 No Data
- Multiple check-ins and support actions for testing

## Future Enhancements

Potential additions (not yet implemented):
- Timeline view in student drawer showing all historical events
- Bulk actions (nudge multiple students)
- Coach notes attached to students
- Automated status alerts
- Weekly summary reports
- Goal proposal workflow for coaches to suggest goals to students

## Related Files

**Components:**
- `src/components/coach/coach-home-dashboard.tsx` - Main dashboard
- `src/components/coach/student-tile.tsx` - Student card
- `src/components/coach/student-drawer.tsx` - Detail view with quick actions
- `src/components/coach/coach-stats-cards.tsx` - KPI display
- `src/components/coach/coach-filters.tsx` - Filter controls
- `src/components/coach/status-chip.tsx` - Status badge
- `src/components/coach/mini-progress-bar.tsx` - Progress visualization
- `src/components/navigation/tab-coach-home.tsx` - Tab wrapper

**Hooks:**
- `src/hooks/useCoachDashboard.ts` - Data fetching and status calculation logic

**Routing:**
- `src/components/navigation/bottom-tabs.tsx` - Tab visibility logic

**Seed Data:**
- `docs/coach-dashboard-seed.sql` - Demo data for testing
