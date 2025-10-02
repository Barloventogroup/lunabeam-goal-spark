# User Stories - INVEST Model

## Authentication & Account Management

### US-001: User Registration
**As a** new user  
**I want to** sign up with my email and password  
**So that** I can create my own account and start tracking my goals

**Acceptance Criteria:**
- User can enter email and password on signup form
- Password must meet minimum security requirements (length, complexity)
- System validates email format
- User receives confirmation upon successful registration
- Error messages display for invalid inputs or existing accounts
- User is automatically redirected to onboarding after signup

**Value:** Enables new users to access the platform independently  
**Size:** Small (1-2 days)  
**Dependencies:** None

---

### US-002: User Login
**As a** registered user  
**I want to** log in with my email and password  
**So that** I can access my account and data

**Acceptance Criteria:**
- User can enter email and password on login form
- System authenticates credentials
- Successful login redirects to home dashboard
- Error message displays for incorrect credentials
- Session persists across page refreshes
- User cannot access protected routes without authentication

**Value:** Provides secure access to personalized user data  
**Size:** Small (1-2 days)  
**Dependencies:** US-001

---

### US-003: Password Reset
**As a** user who forgot my password  
**I want to** request a password reset link  
**So that** I can regain access to my account

**Acceptance Criteria:**
- User can access "Forgot Password" link from login page
- User enters email address for reset
- System sends password reset email with secure token
- Reset link expires after 24 hours
- User can set new password via reset link
- User is notified of successful password change

**Value:** Prevents account lockout and reduces support burden  
**Size:** Small (2-3 days)  
**Dependencies:** US-002

---

### US-004: User Logout
**As a** logged-in user  
**I want to** sign out of my account  
**So that** I can protect my data when using shared devices

**Acceptance Criteria:**
- Logout button is visible in header on home tab
- Clicking logout clears session
- User is redirected to login page
- Protected routes become inaccessible after logout
- Logout confirmation is immediate

**Value:** Ensures account security on shared devices  
**Size:** Extra Small (1 day)  
**Dependencies:** US-002

---

### US-005: First-Time Password Setup
**As a** new user invited to the platform  
**I want to** set my initial password  
**So that** I can secure my account

**Acceptance Criteria:**
- User receives secure setup link via email or magic link
- Setup form requires password and confirmation
- Password must meet security requirements
- Setup link expires after configured period
- User is redirected to onboarding after setup
- Account status updates to "active" after password set

**Value:** Enables invited users to activate their accounts securely  
**Size:** Small (2 days)  
**Dependencies:** None

---

## Onboarding

### US-006: Role Selection
**As a** new user  
**I want to** select whether I'm an individual or parent  
**So that** I receive the appropriate onboarding experience

**Acceptance Criteria:**
- User sees role selection as first onboarding step
- Two clear options: "Individual" and "Parent"
- Selection determines subsequent onboarding flow
- User can see explanation of each role type
- Selection is saved to user profile
- Progress indicator shows current step

**Value:** Personalizes the onboarding experience based on user type  
**Size:** Small (1-2 days)  
**Dependencies:** US-001 or US-005

---

### US-007: Individual Onboarding
**As an** individual user  
**I want to** complete a structured onboarding process  
**So that** the system can personalize my experience

**Acceptance Criteria:**
- Multi-step form collects: name, interests, strengths, challenges, work style, best time, barriers, goal seed
- User can navigate forward and backward between steps
- Progress indicator shows completion status
- User can skip optional fields
- System generates profile summary at end
- User can review before finalizing
- Profile data is saved to database

**Value:** Creates personalized experience and baseline for goal recommendations  
**Size:** Medium (3-5 days)  
**Dependencies:** US-006

---

### US-008: Parent Onboarding
**As a** parent user  
**I want to** complete a parent-specific onboarding  
**So that** I can set up profiles for both myself and my child

**Acceptance Criteria:**
- Parent provides their own profile information
- Parent can optionally provide child's email or set up later
- System creates dual profiles (parent + individual)
- Parent receives admin permissions automatically
- System establishes supporter relationship
- Confirmation screen shows next steps
- Both profiles are properly linked in database

**Value:** Streamlines family setup and establishes proper permissions  
**Size:** Medium (3-5 days)  
**Dependencies:** US-006

---

## Goals Management

### US-009: Create Goal
**As a** user  
**I want to** create a new goal with title, description, and timeline  
**So that** I can track progress toward something I want to achieve

**Acceptance Criteria:**
- User can access goal creation from home dashboard
- Form includes: title (required), description, category, start date, due date, frequency
- System validates dates (start < due date)
- User can select goal owner (self or individual if supporter)
- System calculates initial point values based on parameters
- Goal appears in goals list immediately after creation
- User receives confirmation notification

**Value:** Enables users to define and track personal objectives  
**Size:** Medium (3-4 days)  
**Dependencies:** US-007 or US-008

---

### US-010: View Goals List
**As a** user  
**I want to** see all my goals in a list  
**So that** I can quickly review what I'm working on

**Acceptance Criteria:**
- Goals list displays on "Goals" tab
- Each goal shows: title, progress percentage, status, due date
- Goals are sorted by status (active, completed, archived)
- User can filter by category or status
- Empty state displays helpful message for new users
- List updates in real-time when goals change
- Clicking a goal navigates to detail view

**Value:** Provides overview of all objectives for easy reference  
**Size:** Small (2-3 days)  
**Dependencies:** US-009

---

### US-011: View Goal Detail
**As a** user  
**I want to** view detailed information about a specific goal  
**So that** I can see progress, steps, and other relevant data

**Acceptance Criteria:**
- Detail page shows: title, description, dates, progress bar, status, points
- All associated steps are listed with status
- User can see check-in history
- Points breakdown shows earned vs total possible
- Edit and delete buttons are accessible
- Back button returns to goals list
- Streak count displays if applicable

**Value:** Provides comprehensive view of goal status and history  
**Size:** Medium (3-4 days)  
**Dependencies:** US-009

---

### US-012: Edit Goal
**As a** user  
**I want to** modify goal details  
**So that** I can adjust my objectives as circumstances change

**Acceptance Criteria:**
- Edit button visible on goal detail page
- Form pre-populates with current goal data
- User can modify: title, description, dates, frequency, tags
- System validates changes (date logic, required fields)
- Changes save immediately to database
- Updated goal reflects changes in all views
- User receives confirmation of successful update

**Value:** Allows users to adapt goals to changing circumstances  
**Size:** Small (2-3 days)  
**Dependencies:** US-011

---

### US-013: Delete/Archive Goal
**As a** user  
**I want to** remove goals I no longer need  
**So that** my goals list stays relevant and manageable

**Acceptance Criteria:**
- Delete option available on goal detail page
- System prompts for confirmation before deletion
- Deletion archives goal (soft delete) rather than permanent removal
- Associated steps remain linked but hidden
- Points earned remain in user's total
- Archived goals don't appear in active lists
- User can view archived goals in separate view

**Value:** Keeps goal list focused on current priorities  
**Size:** Small (2 days)  
**Dependencies:** US-011

---

### US-014: Browse Goals by Category
**As a** user  
**I want to** explore pre-defined goal templates by category  
**So that** I can get inspiration and quick-start common goals

**Acceptance Criteria:**
- Category browser accessible from create goal flow
- Categories include: Academic, Health, Creative, Social, Life Skills, etc.
- Each category shows relevant goal templates
- User can preview goal details before selection
- Selecting template pre-fills goal creation form
- User can modify template before saving
- Custom goals (not from template) are also supported

**Value:** Reduces friction in goal creation with proven templates  
**Size:** Medium (3-4 days)  
**Dependencies:** US-009

---

### US-015: Goal Creation Wizard
**As a** user  
**I want to** use a step-by-step wizard to create comprehensive goals  
**So that** I can set up well-structured goals with proper planning

**Acceptance Criteria:**
- Wizard presents goal creation in multiple steps
- Steps include: category selection, goal details, timeline, steps planning
- Progress indicator shows current wizard position
- User can navigate back to previous steps
- Each step validates before proceeding
- User can save draft and return later
- Final review screen shows complete goal before creation

**Value:** Guides users to create well-planned, actionable goals  
**Size:** Large (5-8 days)  
**Dependencies:** US-009, US-014

---

### US-016: Goal Completion Celebration
**As a** user  
**I want to** see a celebration when I complete a goal  
**So that** I feel recognized for my achievement

**Acceptance Criteria:**
- Celebration modal/animation triggers when goal reaches 100%
- Display includes: fireworks/confetti animation, congratulatory message, points earned
- User can see summary of goal completion (time taken, steps completed)
- Celebration is dismissible
- Goal status updates to "completed"
- Completion milestone is logged

**Value:** Provides positive reinforcement and motivation  
**Size:** Small (2-3 days)  
**Dependencies:** US-011

---

## Steps & Progress Tracking

### US-017: Create Step
**As a** user  
**I want to** add steps to my goal  
**So that** I can break down my goal into manageable actions

**Acceptance Criteria:**
- Add step button available on goal detail page
- Form includes: title (required), description, due date, estimated effort
- System validates due date is within goal timeline
- System assigns point value based on goal settings
- Step appears in goal's step list immediately
- Steps can be marked as required or optional
- Order index is automatically assigned

**Value:** Enables goal decomposition into actionable tasks  
**Size:** Small (2-3 days)  
**Dependencies:** US-009

---

### US-018: View Steps List
**As a** user  
**I want to** see all steps for a goal  
**So that** I know what actions to take next

**Acceptance Criteria:**
- Steps list displays on goal detail page
- Each step shows: title, status, due date, points
- Steps are ordered by order_index
- Visual indicators for: not started, in progress, completed, skipped
- Overdue steps are highlighted
- User can expand step to see description
- Quick actions available (complete, skip, edit)

**Value:** Provides clear action plan for goal completion  
**Size:** Small (2 days)  
**Dependencies:** US-017

---

### US-019: Edit Step
**As a** user  
**I want to** modify step details  
**So that** I can adjust my action plan as needed

**Acceptance Criteria:**
- Edit button available on each step
- Modal/form shows current step data
- User can modify: title, description, due date, estimated effort
- System validates changes
- Changes save immediately
- Updated step reflects in step list
- Goal progress recalculates if needed

**Value:** Allows flexible adjustment of action plans  
**Size:** Small (1-2 days)  
**Dependencies:** US-018

---

### US-020: Complete Step
**As a** user  
**I want to** mark a step as complete  
**So that** I can track my progress and earn points

**Acceptance Criteria:**
- Complete button available on each step
- Clicking complete immediately updates step status
- Points are awarded and added to user total
- Points log entry is created
- Goal progress percentage updates
- Completion timestamp is recorded
- Visual feedback confirms completion
- Notification may trigger for milestone completions

**Value:** Enables progress tracking and provides rewards  
**Size:** Medium (2-3 days)  
**Dependencies:** US-018

---

### US-021: Skip Step
**As a** user  
**I want to** skip optional steps  
**So that** I can focus on what's most important

**Acceptance Criteria:**
- Skip option only available for non-required steps
- Skip action prompts for optional reason
- Skipped steps update status to "skipped"
- No points awarded for skipped steps
- Skipped steps don't block dependent steps
- Skipped steps remain visible but grayed out
- Goal progress recalculates excluding skipped steps

**Value:** Provides flexibility in goal completion paths  
**Size:** Small (2 days)  
**Dependencies:** US-018

---

### US-022: Check-In on Step
**As a** user  
**I want to** check-in on a step to log my activity  
**So that** I can track my effort even before completion

**Acceptance Criteria:**
- Check-in button available on each step
- Check-in form includes: date, confidence level (1-5), reflection, minutes spent, attempts count
- User can optionally attach evidence (photos, files)
- Check-in is saved with timestamp
- Step status updates to "in progress" if not started
- Multiple check-ins allowed per step
- Check-ins are viewable in step detail

**Value:** Enables detailed progress logging and reflection  
**Size:** Medium (3-4 days)  
**Dependencies:** US-018

---

### US-023: Create Substeps
**As a** user  
**I want to** break steps into smaller substeps  
**So that** I can manage complex actions more effectively

**Acceptance Criteria:**
- Add substep option available within step view
- Substep form includes: title (required), description (optional)
- Substeps display nested under parent step
- Substeps can be checked off independently
- Completing all substeps can auto-complete parent step
- Each substep has its own point value
- Substeps can be reordered

**Value:** Enables finer-grained task management  
**Size:** Medium (3-4 days)  
**Dependencies:** US-017

---

### US-024: Reorder Steps
**As a** user  
**I want to** change the order of steps  
**So that** I can organize them in the most logical sequence

**Acceptance Criteria:**
- Steps list includes drag handles or reorder buttons
- User can drag-drop steps to new positions
- Order updates immediately in UI
- Order_index values update in database
- Dependent steps maintain their dependency logic
- Changes are persisted
- Reordering is smooth and intuitive

**Value:** Allows users to organize their workflow optimally  
**Size:** Small (2-3 days)  
**Dependencies:** US-018

---

### US-025: Chat About Step with AI
**As a** user  
**I want to** discuss a step with an AI assistant  
**So that** I can get help, guidance, or clarification

**Acceptance Criteria:**
- Chat button available on each step
- Chat modal opens with step context pre-loaded
- User can ask questions about the step
- AI provides relevant, contextual responses
- Chat history is saved
- User can return to previous chat sessions
- AI can suggest modifications or breaking step down further
- Chat includes helpful prompts/suggestions

**Value:** Provides on-demand assistance for challenging steps  
**Size:** Large (5-7 days)  
**Dependencies:** US-018, AI integration

---

### US-026: View Progress Percentage
**As a** user  
**I want to** see my progress as a percentage  
**So that** I can quickly understand how far I've come

**Acceptance Criteria:**
- Progress percentage displays on goal detail page
- Progress bar visually represents percentage
- Calculation: (completed steps / total steps) × 100
- Skipped steps excluded from calculation
- Updates in real-time as steps complete
- Different visual states for: 0%, 1-24%, 25-49%, 50-74%, 75-99%, 100%
- Percentage also shown in goals list

**Value:** Provides quick visual feedback on goal status  
**Size:** Small (1-2 days)  
**Dependencies:** US-011, US-020

---

## Supporter & Family Circle Features

### US-027: Invite Supporter
**As an** individual  
**I want to** invite someone to support me  
**So that** they can help me achieve my goals

**Acceptance Criteria:**
- Invite button accessible from team/supporters page
- Form includes: name, email, role, permission level, optional message
- User can select which goals to share (all or specific)
- System generates unique invite token
- Email invitation is sent automatically
- Invite has expiration date (7 days default)
- Pending invites are listed and can be canceled
- User can resend invitations

**Value:** Enables collaborative goal achievement with support network  
**Size:** Medium (4-5 days)  
**Dependencies:** US-007

---

### US-028: Accept Supporter Invitation
**As an** invited supporter  
**I want to** accept an invitation to support someone  
**So that** I can help them with their goals

**Acceptance Criteria:**
- Email contains clear call-to-action link
- Link opens invitation acceptance page
- Page shows: who invited them, what role, what they'll have access to
- User can accept or decline
- Accepting creates supporter relationship in database
- Accepting triggers account creation flow if new user
- Individual receives notification of acceptance
- Supporter gains access to shared goals immediately

**Value:** Establishes trusted support relationships  
**Size:** Medium (3-4 days)  
**Dependencies:** US-027

---

### US-029: Create Family Circle
**As a** parent/supporter  
**I want to** create a family circle  
**So that** I can manage a group of related individuals

**Acceptance Criteria:**
- Create circle button available in team section
- Form includes: circle name, description (optional)
- User becomes circle owner automatically
- Circle ID is generated
- Owner has full admin permissions
- Empty state shows invitation options
- Circle appears in user's circles list

**Value:** Provides organizational structure for families/groups  
**Size:** Small (2-3 days)  
**Dependencies:** US-008

---

### US-030: Invite Circle Members
**As a** circle owner  
**I want to** invite members to my circle  
**So that** we can collaborate and share progress

**Acceptance Criteria:**
- Invite member button available in circle view
- Form includes: name, email/contact, role, share scope settings
- User can configure what data is shared (goals, progress, check-ins, etc.)
- Invitation sent via email or other configured method
- Pending invites are listed
- Owner can set member permissions
- Multiple invitations can be sent simultaneously

**Value:** Enables group collaboration and mutual support  
**Size:** Medium (3-4 days)  
**Dependencies:** US-029

---

### US-031: Propose Goal for Individual
**As a** supporter  
**I want to** propose a goal for an individual I support  
**So that** I can suggest helpful objectives

**Acceptance Criteria:**
- Propose goal button available in supporter's view of individual
- Form includes: title, description, category, rationale, timeline, frequency
- Proposal saved with "pending" status
- Individual receives notification of proposal
- Admin supporters can see proposals
- Proposal can be edited before individual responds
- Proposal includes admin notes field

**Value:** Enables supportive suggestions while respecting autonomy  
**Size:** Medium (3-4 days)  
**Dependencies:** US-027

---

### US-032: Review Goal Proposals
**As an** admin supporter  
**I want to** review and approve/decline goal proposals  
**So that** I can ensure proposals are appropriate

**Acceptance Criteria:**
- Proposals list accessible from admin dashboard
- Each proposal shows: title, proposer, individual, rationale, details
- Admin can approve, decline, or request changes
- Approval creates actual goal for individual
- Decline includes reason/feedback field
- Individual is notified of decision
- Proposal status updates accordingly
- Approved proposals show approved_by and approved_at

**Value:** Provides oversight for appropriate goal suggestions  
**Size:** Medium (3-4 days)  
**Dependencies:** US-031

---

### US-033: View Supported Individual's Goals
**As a** supporter  
**I want to** view goals of individuals I support  
**So that** I can provide relevant help and encouragement

**Acceptance Criteria:**
- Supporter dashboard shows list of individuals
- Selecting individual shows their goals
- Goals display based on permission level (viewer, collaborator)
- Supporter sees: goal details, progress, recent activity
- View respects share scope settings
- Goals marked as "created by" show supporter's involvement
- Supporter can filter/sort goals
- Real-time updates when goals change

**Value:** Enables informed, relevant support  
**Size:** Medium (3-4 days)  
**Dependencies:** US-028

---

### US-034: Manage Permissions
**As an** individual  
**I want to** control what supporters can see and do  
**So that** I maintain appropriate privacy

**Acceptance Criteria:**
- Permissions management page accessible from team section
- Each supporter listed with current permission level
- Permission levels: Viewer, Collaborator, Admin
- Individual can modify supporter permissions
- Individual can revoke supporter access
- Changes take effect immediately
- Supporter is notified of permission changes
- Granular settings for: goals, check-ins, notes, badges, calendar, reflections

**Value:** Ensures user privacy and control over their data  
**Size:** Medium (4-5 days)  
**Dependencies:** US-027

---

### US-035: Add Community Member
**As an** individual  
**I want to** add a community member to my support network  
**So that** I can include people who don't need full supporter access

**Acceptance Criteria:**
- Add member option available in team section
- Form includes: name, relationship, contact method
- Community members have limited visibility
- No email invitation required (optional contact info)
- Member appears in individual's support network
- Individual can remove community members anytime
- Community members don't get notifications by default

**Value:** Acknowledges informal support network  
**Size:** Small (2-3 days)  
**Dependencies:** US-007

---

## Points & Rewards System

### US-036: Earn Points for Completing Steps
**As a** user  
**I want to** earn points when I complete steps  
**So that** I feel rewarded for my progress

**Acceptance Criteria:**
- Points awarded automatically on step completion
- Point value based on step type and goal settings
- Points added to user's total immediately
- Points log entry created with details
- Visual feedback shows points earned
- Points categorized (e.g., "goal_progress")
- Bonus points for streaks or milestones
- Points can't be manually edited by users

**Value:** Provides gamification and motivation  
**Size:** Medium (3-4 days)  
**Dependencies:** US-020

---

### US-037: View Total Points
**As a** user  
**I want to** see my total points balance  
**So that** I can track my overall achievements

**Acceptance Criteria:**
- Points balance displayed in header/dashboard
- Balance shows total across all categories
- Visual indicator (coin icon, number badge)
- Points update in real-time when earned
- Clicking points shows detailed breakdown
- Breakdown by category available
- Historical trend visible (points over time)

**Value:** Provides sense of accomplishment and progress  
**Size:** Small (2 days)  
**Dependencies:** US-036

---

### US-038: View Points History
**As a** user  
**I want to** see my points log history  
**So that** I can understand how I earned my points

**Acceptance Criteria:**
- Points log accessible from profile or dashboard
- Each entry shows: date, points earned, reason, goal/step context
- Entries sorted by date (newest first)
- Filter by: date range, category, goal
- Export option for records
- Entries include links to related goals/steps
- Pagination for long histories

**Value:** Provides transparency and reference for earned points  
**Size:** Small (2-3 days)  
**Dependencies:** US-036

---

### US-039: Create Rewards
**As a** supporter  
**I want to** create rewards that individuals can redeem  
**So that** I can incentivize progress with meaningful prizes

**Acceptance Criteria:**
- Create reward button in rewards admin section
- Form includes: name, description, point cost, category, image (optional)
- Reward saved with owner_id (supporter)
- Reward marked as active by default
- Reward appears in gallery for linked individuals
- Image upload supported (URL or file)
- Reward can be edited after creation
- Categories: Privilege, Experience, Item, Activity

**Value:** Enables personalized motivation through meaningful rewards  
**Size:** Medium (3-4 days)  
**Dependencies:** US-028

---

### US-040: Set Reward Point Cost
**As a** supporter  
**I want to** set the point cost for rewards  
**So that** I can balance effort required with reward value

**Acceptance Criteria:**
- Point cost field required in reward form
- Must be positive integer
- Cost displayed on reward card in gallery
- User can see if they have enough points
- Cost can be adjusted by editing reward
- Individuals see their balance vs. cost clearly
- Visual indicator if affordable/not affordable

**Value:** Allows flexible reward pricing based on value  
**Size:** Small (1 day)  
**Dependencies:** US-039

---

### US-041: Browse Rewards Gallery
**As an** individual  
**I want to** see available rewards I can redeem  
**So that** I can choose something meaningful to work toward

**Acceptance Criteria:**
- Rewards gallery accessible from rewards tab
- Shows rewards from all supporters
- Each reward card displays: name, image, description, point cost
- Visual indicator if user can afford reward
- Filter by: category, supporter, affordability
- Rewards sorted by: cost, newest, custom
- Clicking reward shows full details
- Inactive rewards hidden from view

**Value:** Provides motivation targets and choice  
**Size:** Medium (3-4 days)  
**Dependencies:** US-039

---

### US-042: Request Reward Redemption
**As an** individual  
**I want to** request to redeem a reward  
**So that** I can exchange my points for prizes

**Acceptance Criteria:**
- Redeem button available on reward detail
- Button disabled if insufficient points
- Clicking opens confirmation modal
- Modal shows: reward details, cost, current balance, remaining balance after
- User confirms redemption request
- Points deducted immediately (held in pending state)
- Redemption created with "pending" status
- Supporter receives notification
- Redemption appears in individual's inbox
- Request includes optional notes field

**Value:** Enables users to enjoy earned rewards  
**Size:** Medium (3-4 days)  
**Dependencies:** US-041

---

### US-043: Approve/Deny Redemption
**As a** supporter  
**I want to** review and approve or deny redemption requests  
**So that** I can verify appropriateness and manage delivery

**Acceptance Criteria:**
- Redemption inbox accessible from supporter dashboard
- Each request shows: individual name, reward, points, request date
- Supporter can approve or deny with reason
- Approval marks redemption as "approved"
- Denial refunds points to individual
- Individual receives notification of decision
- Approved redemptions move to fulfillment stage
- Denial includes feedback field

**Value:** Provides oversight and delivery management  
**Size:** Medium (3-4 days)  
**Dependencies:** US-042

---

### US-044: Mark Redemption as Fulfilled
**As a** supporter  
**I want to** mark redemptions as fulfilled  
**So that** I can track that rewards were delivered

**Acceptance Criteria:**
- Fulfill button available on approved redemptions
- Clicking marks redemption as "fulfilled"
- Fulfillment timestamp recorded
- Individual receives completion notification
- Points permanently deducted (no refund after fulfillment)
- Fulfilled redemptions archived to history
- Notes field for fulfillment details

**Value:** Completes redemption lifecycle and maintains records  
**Size:** Small (2 days)  
**Dependencies:** US-043

---

### US-045: Manage Reward Bank
**As a** supporter  
**I want to** add, edit, and archive rewards  
**So that** I can keep the reward catalog current and relevant

**Acceptance Criteria:**
- Rewards admin page shows all supporter's rewards
- Each reward has edit and archive buttons
- Edit opens form with current data pre-filled
- Archive marks reward as inactive (not deleted)
- Archived rewards hidden from gallery
- Archived rewards can be restored
- Bulk actions available (archive multiple)
- Changes reflected immediately

**Value:** Maintains relevant, manageable reward options  
**Size:** Medium (3-4 days)  
**Dependencies:** US-039

---

## Notifications

### US-046: Receive Notifications
**As a** user  
**I want to** receive notifications about important events  
**So that** I stay informed about my goals and support network

**Acceptance Criteria:**
- Notifications created for key events: invitations, proposals, redemptions, completions, check-ins
- Each notification includes: title, message, timestamp, type, data payload
- Notifications stored in database
- Unread notifications have distinct status
- System supports multiple notification types
- Notifications can be triggered by other users or system events
- Future: Push notifications (web/mobile)

**Value:** Keeps users engaged and informed  
**Size:** Medium (3-4 days)  
**Dependencies:** Multiple features

---

### US-047: View Notifications List
**As a** user  
**I want to** see all my notifications  
**So that** I can review what's happened recently

**Acceptance Criteria:**
- Notifications accessible from bell icon in header
- Dropdown or page shows notifications list
- Each notification displays: icon, title, message, time ago
- Unread notifications highlighted
- Clicking notification marks as read
- Clicking notification navigates to relevant page (if applicable)
- List sorted by date (newest first)
- Empty state shows friendly message

**Value:** Provides centralized communication hub  
**Size:** Small (2-3 days)  
**Dependencies:** US-046

---

### US-048: Mark Notifications as Read
**As a** user  
**I want to** mark notifications as read  
**So that** I can track what I've already reviewed

**Acceptance Criteria:**
- Clicking notification automatically marks as read
- Manual "mark as read" option available
- "Mark all as read" button clears all unread
- Read_at timestamp recorded
- Read notifications have different visual style
- Badge count updates when notifications marked read
- Read status syncs across devices/sessions

**Value:** Helps users manage notification overload  
**Size:** Small (1-2 days)  
**Dependencies:** US-047

---

### US-049: Notification Badge
**As a** user  
**I want to** see a badge showing unread notification count  
**So that** I know when there's something new to check

**Acceptance Criteria:**
- Badge appears on notification bell icon
- Badge shows count of unread notifications
- Count updates in real-time
- Badge disappears when no unread notifications
- Maximum count display (e.g., "9+" for 10 or more)
- Badge color indicates urgency (standard vs. important)
- Badge visible on all pages

**Value:** Provides immediate awareness of new activity  
**Size:** Small (1-2 days)  
**Dependencies:** US-047

---

### US-050: Milestone Notifications
**As a** user  
**I want to** receive special notifications for milestones  
**So that** I can celebrate important achievements

**Acceptance Criteria:**
- Milestone notifications triggered for: 25%, 50%, 75%, 100% goal completion, streak milestones, point milestones
- Notifications have special visual treatment
- Include congratulatory messaging
- Optionally trigger in-app celebrations
- Milestone type recorded in notification data
- User can configure milestone preferences
- Milestones shared with supporters if permissions allow

**Value:** Enhances motivation through recognition  
**Size:** Medium (3 days)  
**Dependencies:** US-046

---

## Dashboard & Home

### US-051: Individual Home Dashboard
**As an** individual  
**I want to** see a personalized home dashboard  
**So that** I can quickly access my most important information

**Acceptance Criteria:**
- Dashboard displays: personalized greeting, today's focus card, upcoming steps, quick actions, points balance
- Greeting includes user's name and contextual message
- Today's focus shows prioritized step(s) for the day
- Upcoming steps card shows next 3-5 steps
- Quick actions: create goal, check-in, view rewards
- Dashboard updates in real-time
- Responsive design for mobile and desktop
- Load time under 2 seconds

**Value:** Provides immediate access to most relevant information  
**Size:** Large (5-7 days)  
**Dependencies:** Multiple features

---

### US-052: Supporter Home Dashboard
**As a** supporter  
**I want to** see a supporter-specific dashboard  
**So that** I can monitor individuals I support

**Acceptance Criteria:**
- Dashboard shows: list of individuals, their recent activity, pending tasks (proposals, redemptions)
- Each individual card shows: name, avatar, active goals count, recent progress
- Notifications for supporter-specific events highlighted
- Quick actions: propose goal, create reward, message individual
- Filter individuals by: needs attention, recent activity, alphabetical
- Dashboard loads quickly even with many individuals
- Navigation to individual detail views

**Value:** Enables efficient oversight of multiple individuals  
**Size:** Large (5-7 days)  
**Dependencies:** US-028, US-033

---

### US-053: Navigation Between Tabs
**As a** user  
**I want to** navigate between main sections easily  
**So that** I can access different features quickly

**Acceptance Criteria:**
- Bottom navigation bar with 5 tabs: Home, Goals, Team, Friends, You
- Each tab has icon and label
- Active tab highlighted clearly
- Tapping tab navigates to that section
- Navigation persists selected tab on refresh
- Smooth transitions between tabs
- Tab bar visible on all main pages
- Tab bar hidden during wizards/modals

**Value:** Provides intuitive app navigation  
**Size:** Small (2 days)  
**Dependencies:** None

---

## Profile Management

### US-054: View Profile
**As a** user  
**I want to** view my profile information  
**So that** I can see my personal details and stats

**Acceptance Criteria:**
- Profile accessible from "You" tab
- Displays: avatar, name, email, user type, member since date
- Shows achievements/badges earned
- Displays total points
- Shows active goals count
- Lists supporter network
- Statistics: goals completed, current streak, total check-ins
- Edit profile button prominent

**Value:** Provides personal overview and sense of identity  
**Size:** Medium (3 days)  
**Dependencies:** US-007

---

### US-055: Edit Profile
**As a** user  
**I want to** edit my profile information  
**So that** I can keep my details current

**Acceptance Criteria:**
- Edit button opens profile form
- Editable fields: first name, avatar URL, interests, strengths, challenges
- Avatar upload supported (file or URL)
- Form validates required fields
- Changes save on submit
- Profile updates immediately in all views
- User receives confirmation
- Email not editable (requires separate flow)

**Value:** Allows users to maintain accurate personal information  
**Size:** Small (2-3 days)  
**Dependencies:** US-054

---

### US-056: Upload Avatar
**As a** user  
**I want to** upload a custom avatar image  
**So that** I can personalize my profile

**Acceptance Criteria:**
- Avatar upload available in edit profile
- Supports common image formats (JPG, PNG, GIF)
- File size limit enforced (e.g., 5MB)
- Image preview before saving
- Automatic resizing/cropping to square
- Stored in Supabase storage bucket
- Avatar URL saved to profile
- Avatar displays throughout app
- Default avatar if none uploaded

**Value:** Enables personalization and recognition  
**Size:** Medium (3-4 days)  
**Dependencies:** US-055, Storage setup

---

### US-057: View Achievements/Badges
**As a** user  
**I want to** see badges I've earned  
**So that** I can feel proud of my accomplishments

**Acceptance Criteria:**
- Badges section in profile view
- Each badge shows: icon, title, description, earned date
- Badges categorized (e.g., streaks, milestones, completion)
- Visual distinction for rare/special badges
- Locked badges shown in grayed-out state
- Progress toward next badge visible
- Badges shareable (future enhancement)
- Badges earned automatically based on criteria

**Value:** Provides additional motivation through recognition  
**Size:** Medium (3-4 days)  
**Dependencies:** Badge creation system

---

## Invitations & Access

### US-058: Send Email Invitation
**As a** user  
**I want to** send email invitations to supporters  
**So that** they can join and help me

**Acceptance Criteria:**
- Invite form includes email field
- System validates email format
- Edge function sends professional email
- Email includes: inviter name, role, personalized message, accept link
- Accept link includes secure token
- Email branded with app styling
- Delivery confirmation shown to inviter
- Invitation tracked in database

**Value:** Professional invitation experience  
**Size:** Medium (3-4 days)  
**Dependencies:** US-027, Email service

---

### US-059: Accept Account Claim via Magic Link
**As an** invitee  
**I want to** click a magic link to claim my account  
**So that** I can access the platform easily

**Acceptance Criteria:**
- Email contains magic link with unique token
- Clicking link authenticates user automatically
- Token validates against database
- Token expires after 24 hours
- Invalid/expired token shows error message
- Successful claim redirects to password setup or onboarding
- Account status updates to "active"
- Claim timestamp recorded

**Value:** Provides frictionless account activation  
**Size:** Medium (3-4 days)  
**Dependencies:** US-005

---

### US-060: Claim Account with Passcode
**As an** invitee  
**I want to** use a passcode to claim my account  
**So that** I have an alternative if the link doesn't work

**Acceptance Criteria:**
- Passcode provided in invitation email
- Claim page includes passcode entry field
- 6-digit alphanumeric passcode
- System validates passcode against claim token
- Rate limiting prevents brute force attempts
- Passcode expires with invitation (7 days)
- Successful validation proceeds to password setup
- Failed attempts logged

**Value:** Provides backup access method  
**Size:** Small (2-3 days)  
**Dependencies:** US-059

---

### US-061: View Pending Invitations
**As a** user  
**I want to** see invitations I've sent that are pending  
**So that** I can track who hasn't responded yet

**Acceptance Criteria:**
- Pending invitations list in team section
- Each invitation shows: invitee name/email, role, sent date, expires date, status
- Status options: pending, accepted, expired, declined
- User can cancel pending invitations
- User can resend invitations
- Expired invitations marked clearly
- Count of pending invitations shown

**Value:** Helps users manage their support network  
**Size:** Small (2 days)  
**Dependencies:** US-027

---

### US-062: Manage Invitation Status
**As a** user  
**I want to** cancel or resend invitations  
**So that** I can manage my network effectively

**Acceptance Criteria:**
- Cancel button available on pending invitations
- Cancel immediately invalidates token
- Canceled invitations marked in database
- Resend generates new token and sends new email
- Resend resets expiration date
- Original invitation invalidated on resend
- User receives confirmation of action
- Invitee notified if configured

**Value:** Provides control over sent invitations  
**Size:** Small (2 days)  
**Dependencies:** US-061

---

## Weekly Check-ins

### US-063: Complete Weekly Check-in
**As a** user in a family circle  
**I want to** complete a weekly check-in  
**So that** I can reflect on my week and share with my circle

**Acceptance Criteria:**
- Check-in prompt appears weekly (configurable day)
- Form includes: wins (what went well), microsteps (small actions), optional reward
- User can add multiple wins and microsteps
- Each entry has text field
- User can mark check-in complete
- Completion timestamp recorded
- Check-in associated with current week
- Previous check-ins viewable in history

**Value:** Encourages reflection and circle engagement  
**Size:** Medium (3-4 days)  
**Dependencies:** US-029

---

### US-064: Record Wins
**As a** user  
**I want to** record things that went well this week  
**So that** I can celebrate successes

**Acceptance Criteria:**
- Wins section in weekly check-in
- User can add multiple win entries
- Each win includes: description, optional goal link
- Wins stored as JSONB array
- User can edit wins before completing check-in
- Wins shareable with circle members
- Wins can include emoji/reactions from circle

**Value:** Promotes positive reflection and sharing  
**Size:** Small (2 days)  
**Dependencies:** US-063

---

### US-065: Record Microsteps
**As a** user  
**I want to** log small actions I'll take this week  
**So that** I can commit to incremental progress

**Acceptance Criteria:**
- Microsteps section in weekly check-in
- User can add multiple microstep entries
- Each microstep includes: description, optional goal link
- Microsteps stored as JSONB array
- User can edit microsteps before completing
- Next week's check-in can show if microsteps were completed
- Microsteps visible to circle members

**Value:** Encourages bite-sized commitments  
**Size:** Small (2 days)  
**Dependencies:** US-063

---

### US-066: Set Weekly Reward
**As a** user  
**I want to** define a reward for completing my weekly goals  
**So that** I have extra motivation

**Acceptance Criteria:**
- Optional reward field in check-in
- User enters text description of self-reward
- Reward visible only to user (private)
- Reward stored as JSONB object
- User can see reward throughout week
- Completion of week's goals triggers reward reminder
- Reward can be edited during week

**Value:** Provides self-motivation mechanism  
**Size:** Small (1-2 days)  
**Dependencies:** US-063

---

## Accessibility & Reminders

### US-067: Access Accessibility Features
**As a** user with accessibility needs  
**I want to** access features that support my needs  
**So that** I can use the app effectively

**Acceptance Criteria:**
- Accessibility settings in user preferences
- Text size adjustment (small, medium, large, extra large)
- High contrast mode toggle
- Screen reader compatibility (ARIA labels)
- Keyboard navigation support
- Focus indicators visible
- Color-blind friendly palette option
- Settings persist across sessions

**Value:** Makes app usable for users with disabilities  
**Size:** Large (5-8 days)  
**Dependencies:** None (should be built-in)

---

### US-068: Receive Task Reminders
**As a** user  
**I want to** receive reminders for important tasks  
**So that** I don't forget to work on my goals

**Acceptance Criteria:**
- Reminders can be set for: specific steps, daily check-in, weekly check-in, goal deadlines
- User can configure reminder preferences
- Reminder delivery methods: in-app notification, email (future: SMS, push)
- Reminders sent at user's preferred time
- User can snooze reminders
- User can dismiss reminders
- Reminder history tracked
- First-time user gets onboarding reminder

**Value:** Helps users stay on track with commitments  
**Size:** Large (5-7 days)  
**Dependencies:** US-046, Scheduling system

---

## AI-Powered Features

### US-069: Chat with AI Coach
**As a** user  
**I want to** chat with an AI coach  
**So that** I can get guidance and support anytime

**Acceptance Criteria:**
- AI chat accessible from home dashboard
- Chat interface includes: message history, text input, send button
- AI responses are contextual and personalized
- AI can reference user's goals and progress
- Chat history persists between sessions
- AI provides: encouragement, suggestions, problem-solving help
- Response time under 3 seconds
- AI maintains conversational context

**Value:** Provides 24/7 support and guidance  
**Size:** Large (7-10 days)  
**Dependencies:** AI integration, Edge function

---

### US-070: Get AI Step Assistance
**As a** user  
**I want to** get AI help with specific steps  
**So that** I can overcome obstacles

**Acceptance Criteria:**
- AI assistance button on each step
- Modal opens with step context pre-loaded
- User can describe their challenge
- AI provides: step breakdown, tips, resources, encouragement
- AI can suggest modifying step due date or splitting into substeps
- AI responses are actionable and specific
- User can apply AI suggestions directly
- Assistance session saved for reference

**Value:** Reduces friction when users get stuck  
**Size:** Medium (4-5 days)  
**Dependencies:** US-069

---

### US-071: Get AI Goal Suggestions
**As a** user  
**I want to** receive AI-powered goal suggestions  
**So that** I can discover relevant goals I hadn't considered

**Acceptance Criteria:**
- Suggestion engine accessible during goal creation
- AI analyzes user profile (interests, strengths, challenges)
- AI considers user's existing goals to avoid duplication
- Suggestions include: goal title, description, rationale, category
- User can preview full suggestion before accepting
- User can request different suggestions
- Accepting suggestion pre-fills goal creation form
- Multiple rounds of suggestions supported

**Value:** Helps users discover meaningful goals  
**Size:** Large (5-7 days)  
**Dependencies:** US-069, US-007

---

### US-072: Receive Onboarding Guidance
**As a** new user  
**I want to** receive AI-powered guidance during onboarding  
**So that** I understand how to use the platform effectively

**Acceptance Criteria:**
- AI guide appears during onboarding steps
- Provides context-specific tips for each step
- Answers common questions proactively
- Offers examples of good responses
- Can be minimized but remains accessible
- Guidance tone is friendly and encouraging
- First-time user gets welcome message from AI
- AI references are subtly branded

**Value:** Reduces onboarding friction and confusion  
**Size:** Medium (4-5 days)  
**Dependencies:** US-069, US-007

---

### US-073: Get AI Reflection Analysis
**As a** user  
**I want to** receive AI analysis of my reflections  
**So that** I can gain insights from my experiences

**Acceptance Criteria:**
- Analysis available after completing check-in with reflection
- AI analyzes reflection text for: patterns, sentiment, progress indicators, challenges
- Analysis types: encouragement, pattern identification, next steps suggestion
- Results presented in friendly, digestible format
- User can request different analysis types
- Analysis includes actionable insights
- User can dismiss or save analysis
- Privacy note indicates analysis is confidential

**Value:** Helps users learn from their experiences  
**Size:** Medium (4-5 days)  
**Dependencies:** US-069, US-022

---

## Summary Statistics

**Total User Stories:** 73  
**Average Size:** Small-Medium  
**Estimated Timeline:** 8-12 months for full implementation with small team  
**Most Complex Areas:** AI features, Supporter network, Points & rewards system

## Notes on INVEST Compliance

- **Independent:** Each story is self-contained with clear dependencies listed
- **Negotiable:** Acceptance criteria provide framework but allow for discussion and refinement
- **Valuable:** Each story explicitly states user value
- **Estimable:** Size estimates provided, clear scope defined
- **Small:** Most stories sized for single sprint (1-5 days), with larger ones split into logical chunks
- **Testable:** Acceptance criteria provide clear test cases

## Recommended Implementation Order

1. **Phase 1 (MVP):** US-001 to US-013 (Auth + Basic Goals)
2. **Phase 2:** US-017 to US-026 (Steps & Progress)
3. **Phase 3:** US-027 to US-035 (Supporter Network)
4. **Phase 4:** US-036 to US-045 (Points & Rewards)
5. **Phase 5:** US-046 to US-062 (Notifications & Invitations)
6. **Phase 6:** US-069 to US-073 (AI Features)
7. **Ongoing:** US-051 to US-068 (Dashboard, Profile, Accessibility)
