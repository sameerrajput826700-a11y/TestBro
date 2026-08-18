# MCQ Test App - Comprehensive Codebase Analysis

**Project:** TestAppV3 - MCQ (Multiple Choice Questions) Test Application  
**Technology Stack:** TypeScript, Vite, IndexedDB, Vanilla JavaScript (DOM APIs)  
**Architecture:** Client-Side SPA (Single Page Application) with Local-First Data Storage  
**Build Date:** August 2026

---

## 1. PROJECT STRUCTURE

### Directory Organization

```
mcq-app/
├── src/
│   ├── app.ts                    # Main application entry point
│   ├── index.html                # HTML entry point
│   ├── vite-env.d.ts            # Vite type definitions
│   ├── components/
│   │   ├── common.ts            # Reusable UI components (header, cards, modals)
│   │   └── common.js            # Compiled JS
│   ├── engine/
│   │   ├── testEngine.ts        # Core test logic (session creation, answer management)
│   │   ├── importer.ts          # JSON question import and validation
│   │   └── testEngine.test.ts   # Unit tests for test engine
│   ├── models/
│   │   ├── types.ts             # TypeScript interfaces and type definitions
│   │   └── types.js             # Compiled JS
│   ├── pages/                    # Page components (SPA routes)
│   │   ├── login.ts             # Student login page
│   │   ├── dashboard.ts         # Student dashboard with stats
│   │   ├── questions.ts         # Questions management page
│   │   ├── import.ts            # Question import page
│   │   ├── testCreate.ts        # Test creation form page
│   │   ├── tests.ts             # List of available tests
│   │   ├── testScreen.ts        # Main testing interface (question display, timer, navigation)
│   │   ├── results.ts           # Test result display with detailed analysis
│   │   ├── history.ts           # Test attempt history
│   │   └── settings.ts          # User settings and preferences
│   ├── storage/
│   │   ├── storage.ts           # IndexedDB storage manager (CRUD operations)
│   │   └── storage.js           # Compiled JS
│   ├── styles/
│   │   └── global.css           # Global CSS styling
│   └── utils/
│       ├── router.ts            # Client-side router for SPA navigation
│       ├── studentAuth.ts       # Authentication utilities (demo users)
│       ├── helpers.ts           # Utility functions (formatting, ID generation)
│       └── (compiled .js files)
├── offline-question-bank/        # Pre-bundled question JSON files
│   ├── Consolidated_Math_Aptitude_Questions.json
│   ├── Model_Paper_23.json
│   ├── RAILWAY_MOD_*.json       # Railway exam module questions
│   └── (other JSON question banks)
├── data/
│   └── sample-questions.json    # Sample questions for reference
├── package.json                  # Dependencies and scripts
├── tsconfig.json                # TypeScript configuration
├── vite.config.ts               # Vite build configuration
├── dist/                        # Production build output (generated)
└── node_modules/                # Dependencies
```

### Key Statistics
- **Total TypeScript Files:** ~20+ files
- **Total Page Components:** 8 pages
- **Storage Stores:** 5 IndexedDB object stores
- **Lines of Code:** ~5000+ (estimate)

---

## 2. ARCHITECTURE & DESIGN PATTERNS

### Overall Architecture: **Client-Side SPA with Local-First Storage**

The application follows a **modular, component-based architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────┐
│            HTML Entry Point (index.html)             │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│      app.ts (Main Initialization & Router Setup)    │
│  - Storage initialization                           │
│  - Route registration                               │
│  - Authentication check                             │
│  - Theme management                                 │
└─────────────────────────────────────────────────────┘
                         ↓
    ┌────────────────────┴────────────────────┐
    ↓                                          ↓
┌─────────────────────────┐    ┌──────────────────────────┐
│  Router (utils/router.ts)    │  Storage Manager         │
│  - Path matching              │  (storage/storage.ts)   │
│  - Dynamic route handling     │  - IndexedDB CRUD ops   │
│  - History navigation         │  - 5 Object Stores      │
└─────────────────────────┘    └──────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────┐
│    Page Components (pages/*.ts)                      │
│  - Login                                            │
│  - Dashboard                                        │
│  - Questions, Import                                │
│  - Tests, TestCreate, TestScreen                   │
│  - Results, History, Settings                      │
└─────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────┐
│    Business Logic & Utilities                       │
│  - TestEngine (engine/testEngine.ts)               │
│  - QuestionImporter (engine/importer.ts)           │
│  - StudentAuth (utils/studentAuth.ts)              │
│  - Helpers (utils/helpers.ts)                      │
└─────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────┐
│    Common Components (components/common.ts)         │
│  - Header, Footer UI elements                      │
│  - Stats Cards, Empty States                       │
│  - Loading Spinners, Modals                        │
└─────────────────────────────────────────────────────┘
```

### Design Patterns Used

| Pattern | Implementation | File(s) |
|---------|----------------|---------|
| **Singleton** | StorageManager (single DB instance) | `storage/storage.ts` |
| **Module Pattern** | Encapsulated modules with namespaced functions | All `*.ts` files |
| **Factory Pattern** | Page creation functions (`createXxxPage()`) | `pages/*.ts` |
| **Observer Pattern** | DOM event listeners for navigation | `utils/router.ts` |
| **Strategy Pattern** | Question selection modes (random, filtered, all) | `engine/testEngine.ts` |
| **Session Pattern** | TestSession management with state tracking | `models/types.ts` |

---

## 3. CORE MODULES & RESPONSIBILITIES

### A. Storage System (IndexedDB)
**File:** [src/storage/storage.ts](src/storage/storage.ts)

**Responsibility:** Persistent local-first data storage

**Key Features:**
- **Database:** `mcq_test_app` (v2)
- **5 Object Stores:**
  1. **questions** - Stores Question objects (keyPath: `_internalKey` to allow duplicate IDs)
  2. **testConfigs** - Test configurations (keyPath: `id`)
  3. **testSessions** - Active/completed test sessions (keyPath: `id`)
  4. **testResults** - Test results and scores (keyPath: `id`)
  5. **settings** - App settings (keyPath: `key`)

**Core Methods:**
- `addQuestion(question)`, `addQuestions(questions[])` - Insert questions
- `getAllQuestions()` - Retrieve all questions
- `getQuestion(id)` - Retrieve specific question
- `deleteQuestion(id)`, `deleteAllQuestions()` - Remove questions
- `addTestConfig()`, `updateTestConfig()`, `getTestConfig()`
- `addTestSession()`, `getTestSession()`, `updateTestSession()`
- `addTestResult()`, `getTestResult()`, `getAllTestResults()`
- `updateSettings()`, `getSettings()`

**Notable Design:**
- Questions use `_internalKey` (UUID-based) as primary key to support duplicate question IDs
- Allows importing same question multiple times from different banks
- Handles v2 schema migration with automatic store recreation

### B. Test Engine (Core Logic)
**File:** [src/engine/testEngine.ts](src/engine/testEngine.ts)

**Responsibility:** Test lifecycle management and answer processing

**Key Responsibilities:**
1. **Session Creation** - `createTestSession(config, questions)`
   - Selects questions based on configuration
   - Shuffles questions (if enabled)
   - Shuffles options (if enabled)
   - Initializes session state

2. **Question Selection Modes:**
   - `'all'` - Use all questions
   - `'random'` - Random selection of N questions
   - `'selected'` - User-specified questions
   - `'filtered'` - Filter by subject/topic/difficulty/tags

3. **Answer Management:**
   - `selectAnswer()` - Record student's option selection
   - `clearAnswer()` - Clear previously selected answer
   - `toggleReview()` - Mark question for review

4. **Session Manipulation:**
   - `updateQuestionIndex()` - Navigate to specific question
   - `submitSession()` - Finalize and score test
   - `cloneSession()` - Create immutable session copies

5. **Scoring Logic:**
   - Calculates marks based on configuration
   - Applies negative marking if configured
   - Tracks accuracy, percentage, time taken

6. **Utilities:**
   - `fisherYatesShuffle<T>()` - Unbiased randomization algorithm
   - `filterQuestions()` - Apply multiple filter criteria

### C. Question Import System
**File:** [src/engine/importer.ts](src/engine/importer.ts)

**Responsibility:** JSON import and validation

**Features:**
- `parseJson(content)` - Parse JSON (handles array or wrapped object formats)
- `validateQuestion(data)` - Comprehensive validation:
  - Requires: id, question text, options (≥2), answer index
  - Optional: explanation, subject, topic, difficulty, marks, tags
  - Auto-generates ID if missing
  - Validates answer index bounds
  - Cleans/trims text fields

- `validateQuestionsFile(json)` - Batch validation
  - Returns: valid questions, invalid with errors, duplicate IDs
  - Prevents duplicate question imports

**Data Models:** [src/models/types.ts](src/models/types.ts)

### D. Data Models & Types

**Core Interfaces:**

```typescript
// Question Structure
Question {
  id: string                          // Unique identifier
  _internalKey?: string               // Internal UUID for IndexedDB
  question: string                    // Question text
  options: string[]                   // Answer options
  answer: number                      // Correct option index (0-based)
  explanation?: string                // Optional explanation
  subject?: string                    // Classification
  topic?: string                      // Sub-classification
  difficulty?: 'easy' | 'medium' | 'hard'
  marks?: number                      // Points for correct answer
  negativeMarks?: number              // Penalty for wrong answer
  tags?: string[]                     // Additional metadata
  image?: string                      // Image URL/base64
  source?: string                     // Question source
}

// Test Configuration
TestConfiguration {
  id: string
  name: string                        // Test name
  numberOfQuestions: number           // Questions to include
  timeLimit: number                   // Minutes
  marksPerCorrect: number
  negativeMarking: number
  passPercentage: number
  shuffleQuestions: boolean
  shuffleOptions: boolean
  selectionMode: 'all' | 'random' | 'selected' | 'filtered'
  filters?: { subjects[], topics[], difficulties[], tags[] }
}

// Test Session (Active Test State)
TestSession {
  id: string
  studentId?: string
  configId: string
  questionIds: string[]
  optionOrders: Map<questionId, shuffledIndices>  // Track option shuffles
  currentQuestionIndex: number
  answers: Map<questionId, TestAnswer>
  visitedQuestions: Set<string>
  startTime: number
  remainingTimeMs: number             // For timer countdown
  isSubmitted: boolean
  isPaused: boolean
}

// Test Result (Final Scoring)
TestResult {
  id: string
  studentId?: string
  testName: string
  totalQuestions: number
  correctAnswers: number
  wrongAnswers: number
  unansweredQuestions: number
  totalMarks: number                  // Score obtained
  maxMarks: number
  percentage: number
  accuracy: number                    // % of answered questions correct
  timeTaken: number                   // Seconds
  questionResults: QuestionResult[]   // Per-question analysis
  submittedAt: number
}

// Student Profile
StudentProfile {
  id: string                          // Student ID
  name: string
  password: string                    // Plain text (demo app only!)
}

// Application Settings
AppSettings {
  theme: 'light' | 'dark' | 'system'
  defaultMarks: number
  defaultNegativeMarking: number
  defaultTestDuration: number
  autoSave: boolean
  confirmBeforeSubmit: boolean
  fullscreenMode: boolean
}
```

### E. Page Components (User Interface)

**File Location:** [src/pages/](src/pages/)

| Page | File | Purpose | Key Features |
|------|------|---------|--------------|
| **Login** | `login.ts` | Student authentication | Demo credentials, form validation, session storage |
| **Dashboard** | `dashboard.ts` | Student home | Stats (questions, tests, avg score, best score), quick actions |
| **Questions** | `questions.ts` | Question management | List questions, search, filter by subject/difficulty |
| **Import** | `import.ts` | Import questions | JSON file upload, validation, duplicate detection, batch import |
| **Tests** | `tests.ts` | Available tests | List created test configs, filter, delete, start test |
| **Test Create** | `testCreate.ts` | Create new test | Form with question selection modes, filters, timing, marking rules |
| **Test Screen** | `testScreen.ts` | Take test | Question display, timer, options, answer review mode, palette |
| **Results** | `results.ts` | View results | Score card, statistics, detailed answer review, comparison metrics |
| **History** | `history.ts` | Test history | Past attempts, performance trends, re-attempt option |
| **Settings** | `settings.ts` | Preferences | Theme selection, default values, data backup/restore |

### F. Routing System
**File:** [src/utils/router.ts](src/utils/router.ts)

**Features:**
- Client-side history-based routing
- Dynamic route matching (e.g., `/test/:sessionId`)
- Page factory pattern
- Async route handlers
- Error handling with fallback

**Route Registration:**
```typescript
/login                      → Login page
/logout                     → Clear session, redirect to /login
/dashboard                  → Student dashboard
/questions                  → Questions list
/questions/import           → Import questions
/tests/new                  → Create new test
/tests                      → Tests list
/test/:sessionId            → Active test (e.g., /test/session_xyz)
/results/:resultId          → Test results
/history                    → Test history
/settings                   → Settings
```

### G. Authentication System
**File:** [src/utils/studentAuth.ts](src/utils/studentAuth.ts)

**Features:**
- Demo student profiles (hardcoded):
  - `SHWETA` / password `1234`
  - `STU002` (Diya Patel) / `1234`
  - `STU003` (Kabir Singh) / `1234`
- LocalStorage-based session persistence (`mcq_student_session`)
- `validateStudentLogin(id, password)` - Simple authentication
- `getCurrentStudent()` - Check logged-in state
- `setCurrentStudent(student)` - Create session
- `clearCurrentStudent()` - Logout

**⚠️ Security Note:** Demo app only! Passwords are plain text and hardcoded.

### H. Utilities & Helpers
**File:** [src/utils/helpers.ts](src/utils/helpers.ts)

**Utility Functions:**
- `generateId(prefix)` - Create unique IDs (timestamp + random)
- `formatTime(seconds)` - Human-readable time format (1h 30m 45s)
- `formatTimerDisplay(ms)` - Clock format (HH:MM:SS or MM:SS)
- `formatPercentage(value)` - Format percentages
- `formatMarks(value)` - Format score decimals
- `clamp(value, min, max)` - Constrain value to range
- `debounce(func, wait)` - Rate-limit function calls
- `throttle(func, limit)` - Throttle execution
- `deepClone<T>(obj)` - Deep copy objects/arrays
- `readFileAsText(file)` - Read uploaded file content
- `showNotification(msg, type)` - Display toast messages

### I. Common Components
**File:** [src/components/common.ts](src/components/common.ts)

**Reusable UI Components:**
- `createHeader()` - Navigation bar with logout
- `createStatsCard(label, value, icon)` - Stats display
- `createEmptyState(icon, title, description)` - Empty state placeholder
- `createLoadingSpinner()` - Loading indicator
- `Modal` class - Dialog boxes
- Form group builders
- Card containers
- Alert components

---

## 4. KEY FEATURES

### Core Functionality

| Feature | Implementation | File(s) |
|---------|-----------------|---------|
| **Question Import** | JSON file upload with validation | `engine/importer.ts`, `pages/import.ts` |
| **Test Creation** | Configurable test builder | `pages/testCreate.ts`, `engine/testEngine.ts` |
| **Test Taking** | Full-featured test interface with timer | `pages/testScreen.ts` |
| **Answer Review** | Mark for review, navigate questions | `testEngine.ts` |
| **Test Submission** | Automatic scoring with negative marking | `testEngine.ts` |
| **Results Analysis** | Detailed score breakdown | `pages/results.ts` |
| **Test History** | Past attempts tracking | `pages/history.ts` |
| **Student Dashboard** | Performance statistics | `pages/dashboard.ts` |
| **Settings** | Theme selection, defaults | `pages/settings.ts` |
| **Question Shuffling** | Fisher-Yates algorithm | `engine/testEngine.ts` |
| **Option Shuffling** | Randomize answer choices | `engine/testEngine.ts` |
| **Question Filtering** | By subject, topic, difficulty, tags | `engine/testEngine.ts` |
| **Offline Support** | Bundled question banks | `offline-question-bank/` |
| **No Backend Required** | 100% client-side, IndexedDB storage | Architecture |

### Advanced Features

**Question Bank Management:**
- Supports duplicate questions from different sources
- Internal UUID-based indexing
- Batch import with validation
- Pre-bundled offline questions (Railway exams, Math aptitude, etc.)

**Test Configuration:**
- 4 question selection modes
- Flexible marking scheme (marks, negative marks, pass %)
- Configurable time limits
- Multiple display/interaction options

**Test Execution:**
- Live countdown timer
- Question palette for navigation
- Mark for review functionality
- Option shuffling tracking
- Session persistence

**Results Generation:**
- Correctness tracking per question
- Time-taken statistics
- Accuracy calculations
- Performance metrics
- Downloadable results (feature ready)

---

## 5. TECHNOLOGY STACK

### Frontend Technologies

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Language** | TypeScript | ^5.2.2 | Type-safe development |
| **Build Tool** | Vite | ^4.5.0 | Fast development & production builds |
| **Runtime** | Node.js | v18+ (recommended) | Development only |
| **Package Manager** | npm | Latest | Dependency management |
| **Browser APIs** | IndexedDB | Native | Local storage |
| **DOM** | Vanilla JS | Native | UI manipulation |
| **Styling** | CSS3 | Native | Global styles |

### Development Tools

| Tool | Version | Purpose |
|------|---------|---------|
| **TypeScript Compiler** | ^5.2.2 | Type checking and compilation |
| **Vitest** | ^0.34.6 | Unit testing framework |
| **Source Maps** | Built-in | Development debugging |
| **HMR** | Vite built-in | Hot Module Replacement |

### Build Process

```
src/ (TypeScript)
   ↓
tsc (Type checking)
   ↓
Vite (Bundling & optimization)
   ↓
dist/ (Production bundle)
   ├── index.html (minified)
   ├── assets/
   │   ├── index-[hash].js (minified)
   │   └── global-[hash].css (minified)
   └── (source maps if enabled)
```

### Browser Compatibility

- **Modern Browsers:** Chrome, Firefox, Safari, Edge (latest)
- **Required APIs:**
  - IndexedDB (storage)
  - History API (routing)
  - FileReader API (import)
  - LocalStorage (session)
  - EventTarget API (events)

**No external CDN dependencies** - everything bundled locally.

---

## 6. STUDENT/AUTHENTICATION SYSTEM

### Current Implementation

**Type:** Demo-based local authentication

**Demo Credentials:**
```
Student ID: SHWETA         | Password: 1234
Student ID: STU002         | Password: 1234  (Diya Patel)
Student ID: STU003         | Password: 1234  (Kabir Singh)
```

### Authentication Flow

```
┌──────────────────────────┐
│   User opens /login      │
└───────────┬──────────────┘
            ↓
┌──────────────────────────────────────────┐
│  createStudentLoginPage()                │
│  - Display login form                    │
│  - Request studentId & password          │
└───────────┬──────────────────────────────┘
            ↓
┌──────────────────────────────────────────┐
│  validateStudentLogin(id, password)      │
│  - Check against DEMO_STUDENTS array     │
│  - Return StudentProfile or null         │
└───────────┬──────────────────────────────┘
            ↓
       ✓ Valid?
       ├─ YES ──→ setCurrentStudent(student)
       │          → Store in localStorage
       │          → Navigate to /dashboard
       │          → Display success message
       │
       └─ NO  ──→ Show error notification
                  → Stay on /login
```

### Session Management

**Storage:**
- Key: `mcq_student_session`
- Format: JSON serialized StudentProfile
- Location: Browser localStorage (persistent)

**Session Lifecycle:**
1. **Login** → `setCurrentStudent()` stores in localStorage
2. **Navigation** → `getCurrentStudent()` checks if logged in
3. **Page Load** → Auto-redirect based on auth state
4. **Logout** → `clearCurrentStudent()` removes session
5. **Login Required Pages** → Redirect to /login if not authenticated

**Protected Routes:**
- `/dashboard`, `/tests/new`, `/test/:sessionId`
- `/questions`, `/questions/import`
- `/results/:resultId`, `/history`, `/settings`

### StudentProfile Data Model

```typescript
StudentProfile {
  id: string              // e.g., "SHWETA"
  name: string            // e.g., "Shweta"
  password: string        // Plain text (⚠️ demo only)
}
```

### Student-Scoped Data

**Test Results Filtering:**
```typescript
// Only show results for current student
const studentResults = results.filter(r => r.studentId === currentStudent.id);
```

**Test Sessions:**
- Each session tagged with `studentId`
- Prevents other students from accessing sessions
- Access control on result page

---

## 7. DATA FLOW ARCHITECTURE

### User Journey Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     STUDENT JOURNEY                         │
└─────────────────────────────────────────────────────────────┘

1. INITIALIZATION
   ┌─────────────────────────┐
   │  Load index.html        │
   │  ↓                      │
   │  DOMContentLoaded       │
   │  ↓                      │
   │  initializeApp()        │
   │  ├─ Initialize storage  │
   │  ├─ Setup router        │
   │  ├─ Check auth          │
   │  └─ Navigate to route   │
   └─────────────────────────┘

2. LOGIN (if not authenticated)
   ┌──────────────────────────────────┐
   │  /login page                     │
   │  ↓                               │
   │  Enter: studentId + password     │
   │  ↓                               │
   │  Form submit                     │
   │  ↓                               │
   │  validateStudentLogin()          │
   │  ↓                               │
   │  setCurrentStudent()             │
   │  ↓                               │
   │  Navigate to /dashboard          │
   └──────────────────────────────────┘

3. DASHBOARD (Home)
   ┌──────────────────────────────────┐
   │  Display student stats:          │
   │  ├─ Total questions in bank      │
   │  ├─ Tests taken                  │
   │  ├─ Average score                │
   │  └─ Best score                   │
   │                                  │
   │  Quick actions:                  │
   │  ├─ Take test                    │
   │  ├─ Import questions             │
   │  └─ View history                 │
   └──────────────────────────────────┘

4. IMPORT QUESTIONS
   ┌──────────────────────────────────┐
   │  /questions/import               │
   │  ↓                               │
   │  Upload JSON file                │
   │  ↓                               │
   │  QuestionImporter.parseJson()    │
   │  ↓                               │
   │  Validate each question          │
   │  ├─ Check structure              │
   │  ├─ Verify answer index          │
   │  └─ Clean data                   │
   │  ↓                               │
   │  Check for duplicates            │
   │  ↓                               │
   │  storage.addQuestions()          │
   │  ├─ Generate _internalKey        │
   │  └─ Store in IndexedDB           │
   │  ↓                               │
   │  Show success message            │
   └──────────────────────────────────┘

5. CREATE TEST
   ┌──────────────────────────────────┐
   │  /tests/new                      │
   │  ↓                               │
   │  Fill form:                      │
   │  ├─ Test name                    │
   │  ├─ Question count               │
   │  ├─ Time limit                   │
   │  ├─ Marking scheme               │
   │  ├─ Question selection mode      │
   │  │  (all/random/filtered)        │
   │  ├─ Shuffle options              │
   │  └─ Pass percentage              │
   │  ↓                               │
   │  storage.addTestConfig()         │
   │  ↓                               │
   │  TestConfiguration saved         │
   │  ↓                               │
   │  Show "Test created" message     │
   └──────────────────────────────────┘

6. START TEST
   ┌──────────────────────────────────┐
   │  /tests (list tests)             │
   │  ↓                               │
   │  Click "Start Test"              │
   │  ↓                               │
   │  TestEngine.createTestSession()  │
   │  ├─ Select questions based mode  │
   │  ├─ Shuffle if needed            │
   │  ├─ Create option orders Map     │
   │  ├─ Initialize answer storage    │
   │  └─ Set timer                    │
   │  ↓                               │
   │  storage.addTestSession()        │
   │  ↓                               │
   │  Navigate to /test/:sessionId    │
   └──────────────────────────────────┘

7. TAKE TEST
   ┌──────────────────────────────────────┐
   │  /test/:sessionId (TestScreen)       │
   │  ↓                                   │
   │  Load TestSession from storage       │
   │  ↓                                   │
   │  Render test interface:              │
   │  ├─ Timer (countdown)                │
   │  ├─ Question display                 │
   │  ├─ Option buttons                   │
   │  ├─ Question palette (mini nav)      │
   │  └─ Action buttons                   │
   │                                      │
   │  User interactions:                  │
   │  ├─ Select option                    │
   │  │  └─ TestEngine.selectAnswer()     │
   │  ├─ Mark for review                  │
   │  │  └─ TestEngine.toggleReview()     │
   │  ├─ Navigate questions               │
   │  │  └─ Update currentQuestionIndex   │
   │  ├─ Timer countdown runs every 100ms │
   │  └─ Auto-save session                │
   │                                      │
   │  When time expires or user clicks    │
   │  "Submit Test":                      │
   │  └─ Trigger submission flow          │
   └──────────────────────────────────────┘

8. SUBMIT TEST
   ┌──────────────────────────────────────┐
   │  Confirmation dialog (if enabled)    │
   │  ↓                                   │
   │  TestEngine.submitSession()          │
   │  ├─ Get all answers                  │
   │  ├─ Fetch correct answers            │
   │  ├─ Calculate per-question results   │
   │  │  ├─ Is answer correct?            │
   │  │  ├─ Calculate marks obtained      │
   │  │  └─ Apply negative marking        │
   │  ├─ Aggregate statistics:            │
   │  │  ├─ Total marks                   │
   │  │  ├─ Correct/wrong/unanswered      │
   │  │  ├─ Percentage                    │
   │  │  ├─ Accuracy                      │
   │  │  └─ Time taken                    │
   │  └─ Create TestResult object         │
   │  ↓                                   │
   │  storage.addTestResult()             │
   │  ├─ Store with studentId             │
   │  └─ Generate result ID               │
   │  ↓                                   │
   │  Mark session as submitted           │
   │  ↓                                   │
   │  Navigate to /results/:resultId      │
   └──────────────────────────────────────┘

9. VIEW RESULTS
   ┌──────────────────────────────────────┐
   │  /results/:resultId                  │
   │  ↓                                   │
   │  Fetch TestResult from storage       │
   │  ↓                                   │
   │  Display results card:               │
   │  ├─ Score (obtained/max)             │
   │  ├─ Percentage                       │
   │  ├─ Accuracy                         │
   │  ├─ Time taken                       │
   │  ├─ Pass/Fail status                 │
   │  ├─ Question-by-question breakdown   │
   │  │  ├─ Q text                        │
   │  │  ├─ Student's answer              │
   │  │  ├─ Correct answer                │
   │  │  ├─ Marks obtained                │
   │  │  └─ Explanation                   │
   │  └─ Comparison with other attempts   │
   │  ↓                                   │
   │  Options: Download/Print/Retake     │
   └──────────────────────────────────────┘

10. TEST HISTORY
    ┌──────────────────────────────────┐
    │  /history                        │
    │  ↓                               │
    │  Load all results for student    │
    │  ↓                               │
    │  Display list with:              │
    │  ├─ Test name                    │
    │  ├─ Date/time taken              │
    │  ├─ Score                        │
    │  ├─ Percentage                   │
    │  ├─ Status (pass/fail)           │
    │  └─ View/Retake buttons          │
    │  ↓                               │
    │  Performance trends chart        │
    └──────────────────────────────────┘
```

### Data Flow Between Components

```
┌──────────────────────────────────────────────────────────────┐
│                     STORAGE ARCHITECTURE                     │
└──────────────────────────────────────────────────────────────┘

                  IndexedDB: mcq_test_app (v2)
                  
    ┌─────────────┬──────────────┬──────────────┬──────────┬──────────┐
    ↓             ↓              ↓              ↓          ↓          ↓
  questions   testConfigs   testSessions  testResults  settings   (others)
    │             │              │              │
    ├─ id          ├─ id          ├─ id          ├─ id
    ├─ question    ├─ name        ├─ studentId   ├─ studentId
    ├─ options     ├─ marks       ├─ configId    ├─ testName
    ├─ answer      ├─ filters     ├─ answers     ├─ totalMarks
    ├─ subject     ├─ timeLimit   ├─ timer       ├─ percentage
    ├─ difficulty  └─ ...         ├─ submitted   └─ results[]
    └─ ...                        └─ ...
    
↓ Used by:                ↓                ↓              ↓
├─ Import page    ├─ Test create    ├─ Test screen    ├─ Results page
├─ Dashboard      ├─ Tests list     ├─ Storage        ├─ History page
├─ Test create    └─ Test screen    └─ Test engine    └─ Dashboard
└─ Test screen
```

### Question Resolution Flow (with duplicate IDs)

```
Question ID vs _internalKey Pattern:

┌─────────────────────────────────┐
│  Original Question (JSON)       │
│  {                              │
│    id: "Q001",                  │  ← May be duplicated
│    question: "...",             │
│    options: [...],              │
│    answer: 0                    │
│  }                              │
└────────────┬────────────────────┘
             ↓
┌────────────────────────────────────┐
│  Import & Storage                 │
│  Generate _internalKey:           │
│  "Q001_1692345678901_a7x9c2f"     │  ← Unique UUID
│  {                                │
│    id: "Q001",                    │
│    _internalKey: "...",           │  ← Primary key in IndexedDB
│    question: "...",               │
│    ...                            │
│  }                                │
└────────────┬─────────────────────┘
             ↓
┌────────────────────────────────────┐
│  Test Session Usage               │
│  - Reference by _internalKey      │
│  - getQuestionKey() returns either │
│    _internalKey or id             │
│  - Ensures uniqueness in tests    │
└────────────────────────────────────┘
```

---

## 8. POTENTIAL ISSUES & IMPROVEMENTS

### 🔴 Critical Issues

#### 1. **Plain-Text Password Storage**
- **Issue:** Passwords hardcoded and stored in plain text
- **Impact:** Major security risk
- **Files:** `utils/studentAuth.ts`
- **Fix:** 
  - Implement proper backend authentication
  - Use password hashing (bcrypt)
  - Use JWT tokens for sessions
  - Use HTTPS only

#### 2. **No Input Sanitization**
- **Issue:** User inputs not sanitized; XSS vulnerability possible
- **Impact:** Malicious script injection via question text
- **Files:** `pages/testScreen.ts`, `pages/results.ts`
- **Fix:**
  ```typescript
  // Use textContent instead of innerHTML where possible
  element.textContent = userInput;  // Safe
  
  // Use DOMPurify or similar for HTML content
  import DOMPurify from 'dompurify';
  element.innerHTML = DOMPurify.sanitize(userInput);
  ```

#### 3. **No CSRF Protection**
- **Issue:** Forms lack CSRF tokens
- **Impact:** Cross-site request forgery attacks possible
- **Fix:** Implement CSRF tokens in forms

#### 4. **Session Hijacking Risk**
- **Issue:** Student ID stored in plain localStorage
- **Impact:** Easy to spoof/impersonate other students
- **Files:** `utils/studentAuth.ts`
- **Fix:**
  - Use secure, httpOnly cookies with backend validation
  - Implement session tokens with expiry
  - Add IP/device fingerprinting

---

### 🟡 Major Issues

#### 5. **IndexedDB Version Migration Complexity**
- **Issue:** Automatic store recreation on version upgrade loses data
- **Impact:** Data loss if schema changes
- **Files:** `storage/storage.ts` line ~40
- **Current Code:**
  ```typescript
  if (db.objectStoreNames.contains(STORES.QUESTIONS)) {
    db.deleteObjectStore(STORES.QUESTIONS);  // ⚠️ Data loss!
  }
  ```
- **Fix:** Implement gradual migration with data preservation:
  ```typescript
  if (oldVersion < 2) {
    // Copy old data before deleting
    const oldData = db.transaction(...).objectStore(...).getAll();
    db.deleteObjectStore(STORES.QUESTIONS);
    // Create new store and re-populate
  }
  ```

#### 6. **No Offline Strategy for Network Failures**
- **Issue:** App assumes IndexedDB always available
- **Impact:** Crashes if IndexedDB quota exceeded or unavailable
- **Files:** All storage operations
- **Fix:** Implement fallback storage, quota monitoring

#### 7. **Timer Accuracy Issues**
- **Issue:** Client-side countdown can be inaccurate
- **Impact:** Timer might show wrong time if tab unfocused
- **Files:** `pages/testScreen.ts`
- **Fix:**
  - Use server-side time for validation
  - Implement requestAnimationFrame for smoother updates
  - Add buffer time for submission

#### 8. **No Concurrent Session Prevention**
- **Issue:** Student can open multiple test sessions simultaneously
- **Impact:** Allows cheating (multiple attempts in parallel)
- **Files:** `engine/testEngine.ts`, `storage/storage.ts`
- **Fix:**
  ```typescript
  // Lock mechanism
  const activeSessions = await storage.getActiveSessions(studentId);
  if (activeSessions.length > 0) {
    throw new Error("You have an active test in progress");
  }
  ```

#### 9. **Answer Modification After Submission**
- **Issue:** No mechanism to prevent editing after submit
- **Impact:** Results could be manipulated
- **Files:** `pages/testScreen.ts`
- **Fix:** Disable all inputs after submission, set `isSubmitted = true`

---

### 🟠 Moderate Issues

#### 10. **Large File Upload Limits**
- **Issue:** No validation on imported JSON file size
- **Impact:** Browser crash with huge files
- **Files:** `pages/import.ts`
- **Fix:**
  ```typescript
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File too large");
  }
  ```

#### 11. **No Duplicate Question Merging**
- **Issue:** Same question can exist multiple times with different internal keys
- **Impact:** Bloated database, test inconsistencies
- **Files:** `engine/importer.ts`
- **Fix:** Add `getDuplicatesBySemantic()` to check content hash:
  ```typescript
  function hashQuestion(q: Question): string {
    return hash(q.question + q.options.join('|'));
  }
  ```

#### 12. **No Pagination for Large Question Banks**
- **Issue:** Loads all questions into memory
- **Impact:** Performance degradation with 10K+ questions
- **Files:** `storage/storage.ts`
- **Fix:** Implement cursor-based pagination:
  ```typescript
  async getQuestions(pageSize = 100, offset = 0) {
    // Use IDBCursor for efficient pagination
  }
  ```

#### 13. **No Error Recovery in Test Screen**
- **Issue:** Timer display can go negative; no pause recovery
- **Impact:** UI state inconsistency
- **Files:** `pages/testScreen.ts`
- **Fix:** Implement state normalization:
  ```typescript
  // Clamp timer to 0
  let displayTime = Math.max(0, remainingTimeMs);
  ```

#### 14. **No Mobile Responsiveness Testing**
- **Issue:** Layout not tested on mobile devices
- **Impact:** Poor UX on phones/tablets
- **Files:** `styles/global.css`
- **Fix:** Add media queries and mobile-first design

---

### 🟢 Minor Improvements

#### 15. **Missing Unit Test Coverage**
- **Issue:** Only `testEngine.test.ts` exists; other modules untested
- **Files:** Most modules
- **Recommendation:** Add tests for:
  - Storage CRUD operations
  - Question validation
  - Scoring calculations
  - Router path matching

#### 16. **No Logging System**
- **Issue:** Errors logged to console only
- **Impact:** Hard to debug in production
- **Fix:** Implement logging service:
  ```typescript
  class Logger {
    info(msg: string) { console.log(`[INFO] ${msg}`); }
    error(msg: string, err?: Error) { console.error(`[ERROR] ${msg}`, err); }
    warn(msg: string) { console.warn(`[WARN] ${msg}`); }
  }
  ```

#### 17. **No Analytics/Usage Tracking**
- **Issue:** Can't see what students actually do
- **Impact:** Can't optimize UX
- **Fix:** Add event tracking (anonymized)

#### 18. **No Dark Mode Implementation**
- **Issue:** Theme setting exists but not fully implemented
- **Files:** `app.ts` (sets attribute), `styles/global.css` (missing rules)
- **Fix:** Extend CSS with `[data-theme="dark"]` selectors

#### 19. **Inconsistent Naming Conventions**
- **Issue:** Mix of `createXxx()`, `getXxx()`, `addXxx()` patterns
- **Recommendation:** Standardize naming:
  - Storage: `get*()`, `set*()`, `add*()`, `delete*()`
  - Pages: `create*Page()`
  - Components: `create*()`

#### 20. **No Data Export Format Options**
- **Issue:** Results page mentions "download" but no export
- **Files:** `pages/results.ts`
- **Fix:** Add export to CSV, PDF, JSON:
  ```typescript
  export function exportResultsAsCSV(result: TestResult) {
    // Generate CSV content
  }
  ```

---

### Architectural Recommendations

#### ✅ Use a State Management Library
- **Current:** Props and direct DOM manipulation
- **Issue:** Hard to track state in complex scenarios
- **Recommendation:** Add lightweight state manager (e.g., TinyState, Redux-lite)

#### ✅ Implement Service Architecture
- **Current:** Direct storage access from pages
- **Recommendation:** Create service layer:
  ```typescript
  // services/testService.ts
  export const testService = {
    createAndStartTest: async (configId) => { ... },
    submitTest: async (sessionId) => { ... },
    getResults: async (resultId) => { ... }
  };
  ```

#### ✅ Add Component Library
- **Current:** Components built ad-hoc in each page
- **Recommendation:** Create reusable component lib:
  ```
  components/
  ├── Button.ts
  ├── Card.ts
  ├── Form.ts
  ├── Modal.ts
  ├── Notification.ts
  └── Table.ts
  ```

#### ✅ Implement Dependency Injection
- **Current:** Direct imports and instantiation
- **Recommendation:** Add simple DI container for testing

#### ✅ Add E2E Testing
- **Current:** No integration tests
- **Recommendation:** Add with Playwright/Cypress:
  - Login flow
  - Complete test flow
  - Results validation

---

## 9. DEPENDENCIES

### Production Dependencies
**None!** The app uses zero runtime dependencies - only native browser APIs.

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | ^5.2.2 | Language, type checking |
| `vite` | ^4.5.0 | Build tool, dev server |
| `vitest` | ^0.34.6 | Unit testing framework |

### Rationale for Minimal Dependencies

✅ **Advantages:**
- Smaller bundle size (~50-100 KB gzipped estimate)
- No supply-chain security risks
- Faster load time
- No version conflicts
- Easier to maintain

❌ **Trade-offs:**
- Manual DOM manipulation (verbose)
- No UI framework benefits
- Limited component reusability
- More boilerplate code

### Browser APIs Used (No Polyfills Needed)
- ✅ IndexedDB (v1) - Storage
- ✅ History API - Routing
- ✅ FileReader API - Import
- ✅ LocalStorage - Session
- ✅ Fetch API - (if added for backend)
- ✅ EventTarget - Events
- ✅ Web Timers - setTimeout, setInterval

### Optional Dependencies (Recommended to Add)

| Package | Version | Purpose |
|---------|---------|---------|
| `dompurify` | ^3.0.0 | XSS protection |
| `uuid` | ^9.0.0 | Unique ID generation |
| `date-fns` | ^2.30.0 | Date formatting |
| `zod` | ^3.22.0 | Runtime validation |
| `vitest` | ^0.34.6+ | Already included |
| `@testing-library/dom` | ^9.3.0 | Component testing |

---

## 10. BUILD & TESTING

### Development Setup

**Prerequisites:**
```bash
Node.js v18+ (recommended LTS)
npm (comes with Node.js)
```

**Installation:**
```bash
cd mcq-app
npm install
```

**Scripts:**
```json
{
  "dev": "vite",           // Start dev server (port 5173)
  "build": "tsc && vite build",  // Full build with type checking
  "preview": "vite preview",     // Preview production build locally
  "test": "vitest"         // Run unit tests
}
```

### Development Workflow

```bash
# 1. Start development server
npm run dev
# Opens: http://localhost:5173

# 2. Watch file changes
# Vite automatically reloads (HMR)

# 3. Type checking during development
# tsc --noEmit --watch

# 4. Run tests
npm test

# 5. Build for production
npm run build

# 6. Preview production build
npm run preview
```

### Build Process

**Input:** `src/` (TypeScript + HTML)  
**Output:** `dist/` (Production-ready bundle)

```
┌──────────────────────────────────────┐
│        npm run build                 │
└────────┬──────────────────────────────┘
         ↓
┌──────────────────────────────────────┐
│   1. TypeScript Compilation          │
│   tsc src/**/*.ts                    │
│   - Type checking                    │
│   - Output: .js files (temporary)    │
│   - Fails on type errors             │
└────────┬──────────────────────────────┘
         ↓
┌──────────────────────────────────────┐
│   2. Vite Bundling & Optimization    │
│   vite build                         │
│   ├─ Entry: src/index.html           │
│   ├─ Root: src/                      │
│   ├─ Output dir: dist/               │
│   ├─ Tree shaking (dead code removal)
│   ├─ Code splitting                  │
│   ├─ Asset optimization              │
│   ├─ CSS minification                │
│   ├─ JS minification (esbuild)       │
│   ├─ Source maps (if enabled)        │
│   └─ Hashing for cache busting       │
└────────┬──────────────────────────────┘
         ↓
┌──────────────────────────────────────┐
│   3. Output Structure                │
│   dist/                              │
│   ├─ index.html (minified)          │
│   ├─ assets/                         │
│   │  ├─ index-[hash].js             │
│   │  └─ global-[hash].css           │
│   └─ offline-question-bank/         │
│      └─ (JSON files copied)         │
└──────────────────────────────────────┘
```

### Build Configuration

**File:** `vite.config.ts`
```typescript
{
  root: 'src',                    // Source directory
  build: {
    outDir: '../dist',            // Output directory (relative to root)
    emptyOutDir: true             // Clean before build
  },
  server: {
    port: 5173,
    open: true                    // Auto-open browser
  }
}
```

### TypeScript Configuration

**File:** `tsconfig.json`
- Target: Latest/ES2020+
- Module: ESM (ES modules)
- Module Resolution: Node
- Strict mode: Enabled (recommended)

**File:** `tsconfig.node.json`
- Build tool files (vite.config.ts, etc.)

### Testing Strategy

**Framework:** Vitest (Vite-native testing)

**Test File Example:**
```
src/engine/testEngine.test.ts
```

**Current Coverage:**
- Test engine logic (partial)
- ⚠️ Most modules lack tests

**Recommended Test Cases:**

```typescript
// Storage tests
describe('StorageManager', () => {
  it('should add and retrieve questions', async () => { ... });
  it('should handle duplicate IDs', async () => { ... });
});

// Test Engine tests
describe('TestEngine', () => {
  it('should shuffle questions correctly', () => { ... });
  it('should calculate scores with negative marking', () => { ... });
  it('should filter questions by criteria', () => { ... });
});

// Importer tests
describe('QuestionImporter', () => {
  it('should parse valid JSON', () => { ... });
  it('should validate questions', () => { ... });
  it('should reject invalid data', () => { ... });
});

// Auth tests
describe('StudentAuth', () => {
  it('should validate correct credentials', () => { ... });
  it('should reject invalid password', () => { ... });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm test -- --watch

# Coverage report
npm test -- --coverage

# Specific file
npm test -- testEngine.test.ts
```

### Production Deployment

**Steps:**
```bash
# 1. Build locally
npm run build

# 2. Verify build
npm run preview

# 3. Deploy dist/ folder to static host
# Options:
# - GitHub Pages
# - Netlify
# - Vercel
# - AWS S3 + CloudFront
# - Any static hosting

# 4. Serve with HTTP server
npx http-server dist/
```

**Deployment Considerations:**
- Single-page app (SPA) → configure server to route all `/path` → `/index.html`
- Enable gzip compression
- Set appropriate cache headers for assets
- Use CDN for offline-question-bank JSON files
- Consider database migration before serving with backend

---

## 11. RECOMMENDATIONS SUMMARY

### Priority 1: Security (Critical)
- [ ] Remove plain-text passwords; implement proper auth
- [ ] Add input sanitization (use DOMPurify)
- [ ] Switch to secure, httpOnly session cookies
- [ ] Implement CSRF protection
- [ ] Use HTTPS in production

### Priority 2: Data Integrity
- [ ] Fix IndexedDB migration to preserve data
- [ ] Add concurrent session prevention
- [ ] Implement answer submission locking
- [ ] Add validation on timer accuracy

### Priority 3: Performance
- [ ] Implement pagination for large question banks
- [ ] Add IndexedDB query indexing
- [ ] Optimize bundle size (already minimal)
- [ ] Add lazy loading for question data

### Priority 4: Reliability
- [ ] Add error boundaries/recovery
- [ ] Implement comprehensive logging
- [ ] Add retry logic for storage operations
- [ ] Handle quota exceeded errors

### Priority 5: User Experience
- [ ] Implement full dark mode support
- [ ] Add mobile responsiveness
- [ ] Improve question/result display
- [ ] Add accessibility features (a11y)
- [ ] Implement print/export functionality

### Priority 6: Testing & Quality
- [ ] Add comprehensive unit tests (target: 80% coverage)
- [ ] Implement E2E tests
- [ ] Add CI/CD pipeline
- [ ] Code quality tools (ESLint, Prettier)

---

## 12. FILE REFERENCE GUIDE

### Core Application Files

| File | Purpose | Lines | Status |
|------|---------|-------|--------|
| [src/app.ts](src/app.ts) | App initialization & routing | ~130 | ✅ Complete |
| [src/index.html](src/index.html) | HTML entry point | ~20 | ✅ Complete |
| [src/models/types.ts](src/models/types.ts) | Type definitions | ~200 | ✅ Complete |
| [src/storage/storage.ts](src/storage/storage.ts) | IndexedDB operations | ~300+ | ✅ Mostly Complete |

### Page Components

| File | Purpose | Status |
|------|---------|--------|
| [src/pages/login.ts](src/pages/login.ts) | Student login | ✅ Complete |
| [src/pages/dashboard.ts](src/pages/dashboard.ts) | Dashboard | ✅ Complete |
| [src/pages/questions.ts](src/pages/questions.ts) | Questions list | ✅ Complete |
| [src/pages/import.ts](src/pages/import.ts) | Question import | ✅ Complete |
| [src/pages/testCreate.ts](src/pages/testCreate.ts) | Test creation | ✅ Complete |
| [src/pages/tests.ts](src/pages/tests.ts) | Tests list | ✅ Complete |
| [src/pages/testScreen.ts](src/pages/testScreen.ts) | Test interface | ✅ Complete |
| [src/pages/results.ts](src/pages/results.ts) | Results display | ✅ Complete |
| [src/pages/history.ts](src/pages/history.ts) | Test history | ✅ Complete |
| [src/pages/settings.ts](src/pages/settings.ts) | User settings | ✅ Complete |

### Engine & Utilities

| File | Purpose | Status |
|------|---------|--------|
| [src/engine/testEngine.ts](src/engine/testEngine.ts) | Test logic | ✅ Complete |
| [src/engine/importer.ts](src/engine/importer.ts) | Question import/validate | ✅ Complete |
| [src/engine/testEngine.test.ts](src/engine/testEngine.test.ts) | Unit tests | ⚠️ Partial |
| [src/utils/router.ts](src/utils/router.ts) | SPA routing | ✅ Complete |
| [src/utils/studentAuth.ts](src/utils/studentAuth.ts) | Authentication | ✅ Complete |
| [src/utils/helpers.ts](src/utils/helpers.ts) | Utility functions | ✅ Complete |
| [src/components/common.ts](src/components/common.ts) | UI components | ✅ Complete |

### Configuration

| File | Purpose |
|------|---------|
| [package.json](package.json) | Dependencies & scripts |
| [tsconfig.json](tsconfig.json) | TypeScript settings |
| [vite.config.ts](vite.config.ts) | Vite build config |

---

## Conclusion

The **MCQ Test App** is a well-structured, **local-first** web application with:

✅ **Strengths:**
- Zero-dependency runtime (fast, secure)
- Clean modular architecture
- Complete feature set for offline testing
- Proper data models and type safety
- Comprehensive storage system

⚠️ **Weaknesses:**
- Demo authentication (not production-ready)
- Limited security measures
- No comprehensive test coverage
- Potential data loss on schema migration
- Lacks mobile optimization

**Overall Assessment:** **Solid Foundation** for a demo/educational application. Requires security hardening and testing before production deployment.

---

**Document Generated:** August 18, 2026  
**Last Updated:** Current Session  
**Analysis Depth:** Comprehensive (all 10 sections covered)
