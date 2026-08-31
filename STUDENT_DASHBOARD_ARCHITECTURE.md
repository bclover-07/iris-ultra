# 🎓 Sensei-Ultra: Student Dashboard Deep-Dive Architecture & Specification
> **System Scope:** Complete Architectural Analysis, Logic Flows, Backend Pipelines, AI Agent LangGraph Workflows, Frontend Component Hierarchy, Real-time Socket Communication, and On-Device NPU Telemetry Integration for the Sensei-Ultra Student Ecosystem.

---

## 📑 Table of Contents
1. [Executive Summary & High-Level Architecture](#1-executive-summary--high-level-architecture)
2. [Hardware & HackTracker Optimization (iQOO 15 NPU Architecture)](#2-hardware--hacktracker-optimization-iqoo-15-npu-architecture)
3. [Feature Breakdown & Deep Logic Analysis](#3-feature-breakdown--deep-logic-analysis)
   - 3.1 [Core Student Overview & Command Center (`/student`)](#31-core-student-overview--command-center-student)
   - 3.2 [Interactive AI Avatar Studio (`/student/ai-avatar`)](#32-interactive-ai-avatar-studio-studentai-avatar)
   - 3.3 [Ultra Study Ecosystem (`/student/ultra-study`)](#33-ultra-study-ecosystem-studentultra-study)
     - 3.3.1 Study Plan Synthesizer & Video Ingestion
     - 3.3.2 Camo Quizo (Gesture Vision) & Standard Adaptive Quiz
     - 3.3.3 Multimodal Doubt Solver (Voice, Vision OCR, LaTeX)
     - 3.3.4 Ultra Keeper (AI Notes & Smart Flashcards)
   - 3.4 [Virtual Beyond Metaverse Hub (`/student/virtual-beyond`)](#34-virtual-beyond-metaverse-hub-studentvirtual-beyond)
     - 3.4.1 Virtual World 3D Campus
     - 3.4.2 Virtual Interview Hub (Multimodal AI Recruiter)
     - 3.4.3 Virtual Debate Arena (Real-time Socratic Argumentation)
   - 3.5 [Overcome Weakness Remediation (`/student/overcome`)](#35-overcome-weakness-remediation-studentovercome)
   - 3.6 [Focus Guardian & Biometric Mindfulness (`/student/focus-guardian`)](#36-focus-guardian--biometric-mindfulness-studentfocus-guardian)
   - 3.7 [AI Career Simulator & Monte Carlo Engine (`/student/career-simulator`)](#37-ai-career-simulator--monte-carlo-engine-studentcareer-simulator)
   - 3.8 [Social Hub & Gamification Engine (`/student/social`)](#38-social-hub--gamification-engine-studentsocial)
   - 3.9 [Student Profile, Settings & Localization (`/student/profile`)](#39-student-profile-settings--localization-studentprofile)
4. [AI Agent Workflows & LangGraph State Machine Graph Directory](#4-ai-agent-workflows--langgraph-state-machine-graph-directory)
5. [Real-time Socket.IO Communication Matrix](#5-real-time-socketio-communication-matrix)
6. [Data Models & Schema Relationships](#6-data-models--schema-relationships)
7. [GSD Development & Governance Framework](#7-gsd-development--governance-framework)
   - 7.1 [`/goal`: Milestone & Mission Contract](#71-goal-milestone--mission-contract)
   - 7.2 [`/gsd-map-codebase`: Complete System Mapping](#72-gsd-map-codebase-complete-system-mapping)
   - 7.3 [`/gsd-add-phase`: Phased Delivery & Integration Plan](#73-gsd-add-phase-phased-delivery--integration-plan)
   - 7.4 [`/gsd-code-review`: Backend, Frontend & Agent Audit](#74-gsd-code-review-backend-frontend--agent-audit)
   - 7.5 [`/gsd-ui-review`: Brutalist Design & Responsiveness Audit](#75-gsd-ui-review-brutalist-design--responsiveness-audit)

---

## 1. Executive Summary & High-Level Architecture

The **Sensei-Ultra Student Dashboard** is a state-of-the-art, multimodal, AI-augmented educational cockpit built to transform learning through:
1. **Intelligent Weakness Remediation**: Automated detection of learning gaps using multi-signal risk analytics (attendance, marks, sentiment, submission velocity).
2. **Immersive WebGL/Three.js Interaction**: 3D Avatars, 3D Virtual Worlds, 3D Gesture-controlled Quizzes, and Monte Carlo Visualizations.
3. **Multi-Agent LangGraph Reasoning**: Orchestrated LLM workflows (Gemini 2.0 Flash / HuggingFace DistilBERT) with self-healing heuristic fallbacks.
4. **On-Device Edge Intelligence**: Client-side MediaPipe pose, facial, and hand landmark models running at 60 FPS directly on the client's GPU/NPU.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SENSEI-ULTRA ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                 FRONTEND: Next.js 14 / React 18                     │   │
│   │  - Brutalist Comic UI (Framer Motion, Fredoka Fonts, Canvas)        │   │
│   │  - Client-side MediaPipe (Vision Tasks, Pose & Hand Landmarkers)     │   │
│   │  - Three.js / React Three Fiber / WebGL 3D Rendering Engine         │   │
│   │  - Web Speech STT / Synthesis & Socket.IO Client                    │   │
│   └───────────────────▲─────────────────────────────▲───────────────────┘   │
│                       │ HTTP REST (Axios)           │ WebSockets            │
│                       │ (JWT Auth, Cookies)         │ (/student namespace)  │
│   ┌───────────────────▼─────────────────────────────▼───────────────────┐   │
│   │                 BACKEND: Node.js / Express Server                   │   │
│   │  - REST Controllers (Student, Quiz, StudyPlan, Career, Focus, etc.) │   │
│   │  - Socket Gateways (Debate, Interview, World, Notifications)       │   │
│   │  - Security Layer (Helmet, MongoSanitize, HPP, JWT Verification)   │   │
│   └───────────────────▲─────────────────────────────▲───────────────────┘   │
│                       │ State Pipeline Invocation   │ Storage & Cache       │
│   ┌───────────────────▼─────────────────────────────▼───────────────────┐   │
│   │           AI AGENTS (LangGraph)           │    DATABASE & STORAGE   │   │
│   │  - FocusGuardian Agent                    │  - MongoDB (Mongoose)   │   │
│   │  - CareerSimulator Agent                  │  - NodeCache (TTL 30s)  │   │
│   │  - DoubtSolver Agent                      │  - Cloudinary Media     │   │
│   │  - VirtualDebate Agent                    │                         │   │
│   │  - VirtualInterview Agent                 │                         │   │
│   │  - DropoutPrediction Agent                │                         │   │
│   │  - BehaviorFingerprint Agent              │                         │   │
│   └───────────────────────────────────────────┴─────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Hardware & HackTracker Optimization (iQOO 15 NPU Architecture)

For hackathon competitions featuring automated device telemetry tools like **HackTracker** on the **iQOO 15 (Snapdragon 8 Gen Elite / Hexagon NPU)**, the architecture is strictly optimized to maximize the **25% Telemetry Score**:

### 🎯 Metric 1: Creative Phone Use (15%)
* **MediaPipe GPU/NPU Offload**: The client-side computer vision models (`@mediapipe/tasks-vision`) use `delegate: "GPU"` to target Qualcomm Adreno and Hexagon NPU acceleration.
* **Continuous Sensors Utilization**:
  * **Camera Sensor**: Actively runs real-time posture/eye tracking in *Focus Guardian*, hand landmark detection in *Camo Quizo*, and facial expression analysis in *Virtual Debate* & *Interview Hub*.
  * **Microphone Sensor**: Continuously powers the real-time speech-to-text pipeline in *Doubt Solver*, *AI Avatar*, *Virtual Debate*, and *Interview Hub*.
  * **Breathing Sensor (Pose Elevation)**: Derives live biometrics (shoulder vertical displacement $\Delta Y$) during the *4-7-8 Mindfulness Break*.

### 🌉 Metric 2: Office Kit Usage (10%) & "Red Light" Workflow
* **Network Binding**: Seamless communication between the mobile client and Node.js Express server via local IPv4 WiFi subnet (`http://192.168.x.x:3000`).
* **OriginOS Bridge Compatibility**: Full responsiveness across 6-inch mobile screens and desktop mirrored monitors with zero UI text clipping, fluid touch targets (minimum 48px), and brutalist tactile feedback.

---

## 3. Feature Breakdown & Deep Logic Analysis

```
                                STUDENT DASHBOARD
                                       │
     ┌──────────────┬──────────────────┼──────────────────┬──────────────┐
     │              │                  │                  │              │
 1. Overview    2. AI Avatar     3. Ultra Study    4. Virtual Beyond  5. Overcome
     │              │                  │                  │              │
     ├─ Marks Radar ├─ 3D Face Mesh    ├─ Study Plan      ├─ 3D World    ├─ LangGraph
     ├─ Attendance  ├─ STT / TTS Voice ├─ Camo Quizo      ├─ AI Recruiter├─ Proof OCR
     └─ Live Socket └─ Context Mentor  ├─ Doubt Solver    └─ Socratic    └─ Flow Path
                                       └─ Ultra Keeper       Debate
                    ┌──────────────────┴──────────────────┐
                    │                                     │
             6. Focus Guardian                    7. Career Simulator
                    │                                     │
             ├─ MediaPipe Pose / Focus IQ          ├─ Monte Carlo Trajectories
             ├─ 4-7-8 Breathing Compliance         ├─ 3D Starfield Canvas
             └─ Gamified XP Badges                 └─ Vocational Fast-Track
```

---

### 3.1 Core Student Overview & Command Center (`/student`)

#### 🎯 What it Does
The central mission control for students providing an immediate diagnostic summary of their academic standing, real-time risk evaluation, attendance trends, notifications, and personalized AI action items.

#### ⚙️ Frontend Logic Flow (`src/app/student/page.tsx`)
1. **Initial Mount & Data Fetching**: Triggers parallel REST calls:
   * `GET /api/student/dashboard`: Retrieves core student metadata, streak counter, total XP, current level, and active alerts.
   * `GET /api/student/marks-trend`: Fetches semester-wise and exam-wise historical marks.
   * `GET /api/student/radar`: Retrieves 5-axis competency scores (Academics, Attendance, Assignment Velocity, Quiz Mastery, Behavioral Wellness).
   * `GET /api/student/interventions`: Loads pending high-priority actions required by teachers/AI.
2. **WebSocket Live Sync**: Subscribes to Socket.IO channels:
   * `dashboard:refresh`: Auto-re-fetches dashboard metrics when marks or attendance are updated by faculty.
   * `leaderboard:update`: Updates rank ticker live without page reload.
   * `intervention:created`: Triggers toast alert for immediate intervention.
3. **UI Composition**:
   * Multi-dimensional Radar Chart (Recharts).
   * Attendance Velocity Indicator (Gradient bar with threshold color warning).
   * Gamification Banner with animated XP progress bar.

#### 🧠 Backend Architecture & Controller (`student.controller.js`)
* **Endpoint**: `GET /api/student/dashboard`
* **Execution Pipeline**:
  ```javascript
  const [student, insight, marks, attendance, interventions] = await Promise.all([
    Student.findOne({ userId: req.user.userId }).lean(),
    Insight.findOne({ studentId: req.user.userId }).lean(),
    Marks.find({ studentId: req.user.userId }).sort({ examDate: -1 }).limit(10).lean(),
    Attendance.find({ studentId: req.user.userId }).lean(),
    Intervention.find({ studentId: req.user.userId, status: 'pending' }).lean()
  ]);
  ```
* **Performance Metric Computation**: Computes weighted CGPA ($(\sum \% / N) / 10$) and runs `calculateRiskScore()` using the risk engine.

---

### 3.2 Interactive AI Avatar Studio (`/student/ai-avatar`)

#### 🎯 What it Does
A photorealistic 3D interactive learning companion capable of real-time voice conversation, emotional responsiveness, and personalized pedagogical mentoring.

#### ⚙️ Frontend Logic Flow (`src/app/student/ai-avatar/page.tsx`)
1. **3D WebGL Canvas**: Loads Three.js avatar model with morph targets for visemes (speech mouth movements), eye blinks, and head tilt animations.
2. **Voice Interaction Loop**:
   * User clicks Mic $\to$ activates `webkitSpeechRecognition` with continuous interim results.
   * Speech transcribed $\to$ sent to `POST /api/chatbot/chat`.
   * LLM text response received $\to$ sent to `POST /api/tts` for natural vocal audio stream.
   * Web Audio API `AudioContext` creates an `AnalyserNode` to drive real-time mouth morph target weights ($[0.0, 1.0]$) synchronized to audio decibels.

#### 🧠 Backend & Agent Pipeline (`chatbot.routes.js`, `gemini.service.js`)
1. **Context Enrichment**: Injects the student's real-time risk profile:
   ```
   System: "You are Sensei, a friendly academic mentor. Student: {name}. CGPA: {cgpa}. Risk Level: {riskLevel}. Weak Areas: {weakSubjects}."
   ```
2. **Chat History Persistence**: Appends user message and model reply to `ChatHistory` schema.
3. **Self-Healing Fallback**: If cloud Gemini hits quota limits ($429$), falls back to HuggingFace or executes local offline rule-based heuristic responses.

---

### 3.3 Ultra Study Ecosystem (`/student/ultra-study`)

The Ultra Study hub aggregates 4 specialized AI learning modules:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ULTRA STUDY ARSENAL                              │
├──────────────────────┬──────────────────────┬───────────────────────────────┤
│ 1. Study Plan        │ 2. Camo Quizo        │ 3. Doubt Solver               │
│ - YouTube Ingestion  │ - MediaPipe Vision   │ - Multimodal (Voice/Vision)   │
│ - Visual Gantt Tree  │ - Three.js Bubbles   │ - LaTeX & Step-by-Step        │
│ - Automated Emails   │ - Gesture Tracking   │ - Voice Audio Walkthrough     │
└──────────────────────┴──────────────────────┴───────────────────────────────┘
```

#### 3.3.1 Study Plan Synthesizer & Video Ingestion
* **Frontend (`src/app/student/study-plan/page.tsx`)**: Allows students to input target topics, desired duration (e.g. 7 days, 2 hrs/day), or paste a YouTube video lecture URL.
* **Backend Processing (`studyPlan.controller.js`, `youtubeTranscript.js`)**:
  1. Extracts video ID $\to$ fetches raw English subtitles via YouTube Transcript API.
  2. Passes transcript to Gemini 2.0 with prompt:
     ```json
     {
       "title": "Course Curriculum",
       "days": [
         { "day": 1, "topic": "...", "subtopics": [...], "durationMinutes": 120, "practiceQuestions": [...] }
       ],
       "milestones": [...]
     }
     ```
  3. Saves plan into `StudyPlan` collection; provides instant email dispatch via Nodemailer.

#### 3.3.2 Camo Quizo (Gesture Vision) & Standard Adaptive Quiz
* **Standard Quiz (`src/app/student/quiz/standard/page.tsx`)**:
  * Adaptive engine: Questions scale from Level 1 to Level 5 dynamically based on correct/incorrect answer streaks.
* **Camo Quizo (`src/app/student/quiz/camo/page.tsx`)**:
  * Uses MediaPipe Hand Landmarker (`HandLandmarker.createFromOptions`).
  * Recognizes user hand gestures (Fist = Option A, Index finger = Option B, Two fingers = Option C, Open palm = Option D).
  * Three.js particle arena with floating 3D question bubbles that pop upon gesture selection.
  * Awards +50 XP on completion and emits `leaderboard:update` via Socket.IO.

#### 3.3.3 Multimodal Doubt Solver (`doubtSolver.agent.js`)
* **LangGraph Agent Workflow**:
  ```
  START ──► [Transcribe Node] ──► [OCR Node] ──► [Context Node] ──► [Solve Node] ──► [Narrate Node] ──► END
  ```
  1. `Transcribe Node`: Processes audio inputs from Web Speech API.
  2. `OCR Node`: Ingests camera snapshots of handwritten notebook formulas.
  3. `Context Node`: Classifies academic subject and difficulty level.
  4. `Solve Node`: Formulates step-by-step pedagogical solution with formatted LaTeX formulas ($E=mc^2$).
  5. `Narrate Node`: Produces conversational voice audio walkthrough.

#### 3.3.4 Ultra Keeper (AI Notes & Smart Flashcards)
* Automated summary generator that converts class notes and PDFs into spaced-repetition flashcards.

---

### 3.4 Virtual Beyond Metaverse Hub (`/student/virtual-beyond`)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             VIRTUAL BEYOND                                  │
├──────────────────────┬──────────────────────┬───────────────────────────────┤
│ 1. Virtual World     │ 2. Interview Hub     │ 3. Debate Arena               │
│ - Three.js Campus    │ - LangGraph Agent    │ - Socratic AI Persona         │
│ - Spatial Peer Sync  │ - MediaPipe Biometric│ - Fallacy Detection           │
│ - Live Whiteboard    │ - Confidence Scoring │ - Crowd Mood Engine           │
└──────────────────────┴──────────────────────┴───────────────────────────────┘
```

#### 3.4.1 Virtual World 3D Campus (`src/socket/world.socket.js`)
* Real-time multi-user virtual environment using Three.js.
* WebSocket synchronization: `world:join`, `world:player_move`, `world:chat_message`.
* Students can walk around the campus with customized 3D avatars, sit in study rooms, and collaborate on shared whiteboards.

#### 3.4.2 Virtual Interview Hub (`virtualInterview.agent.js`, `interview.socket.js`)
* **Agent Graph**: 10-step adaptive recruitment interview simulation:
  * `resumeContextLoader` $\to$ parses uploaded PDF/JSON resume.
  * `answerPreprocessor` $\to$ computes Words Per Minute (WPM), filler words ('um', 'uh').
  * `facialBiometrics` $\to$ MediaPipe FaceMesh tracks eye contact %, head tilt, and smile frequency.
  * `technicalEvaluator` $\to$ Gemini scores answer completeness, keyword coverage, and missing concepts.
  * `adaptiveQuestionGenerator` $\to$ adjusts question difficulty dynamically.
  * `reportSynthesis` $\to$ generates downloadable PDF scorecards.

#### 3.4.3 Virtual Debate Arena (`virtualDebateAgent.js`, `debate.socket.js`)
* Real-time Socratic argumentation with AI personalities (e.g., Calm Professor, Aggressive Lawyer).
* **Fallacy Engine**: Detects logical fallacies in real-time (*ad hominem*, strawman, circular reasoning).
* **Crowd Sentiment Simulation**: Live audience reaction meter fluctuates based on rhetorical persuasiveness and tone modulation.

---

### 3.5 Overcome Weakness Remediation (`/student/overcome`)

#### 🎯 What it Does
A closed-loop growth pathway system that targets specific academic weaknesses flagged by teachers or dropout prediction models.

#### ⚙️ Frontend & Visual Strategy Flow
* **Interactive ReactFlow Strategy Flow Graph**: Visualizes prerequisite mastery nodes and milestones.
* **Dual Task Verification Pipeline**:
  1. *Internal Platform Tasks*: Auto-verified by checking student quiz scores in database (`POST /api/overcome/task/:id/verify-internal`).
  2. *External Proof Tasks*: Students capture photos of physical handwritten assignments or test papers $\to$ uploaded to `POST /api/overcome/task/:id/proof` $\to$ validated via MediaPipe & OCR vision models.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          OVERCOME REMEDIATION FLOW                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────────────┐       ┌──────────────────┐       ┌─────────────────┐ │
│   │ Low Quiz Marks / │ ────► │ LangGraph Path   │ ────► │ Interactive     │ │
│   │ Teacher Incident │       │ Generation Agent │       │ Strategy Graph  │ │
│   └──────────────────┘       └──────────────────┘       └────────┬────────┘ │
│                                                                  │          │
│                       ┌──────────────────────────────────────────┴──────┐   │
│                       │                                                 │   │
│                       ▼                                                 ▼   │
│              [Internal Quiz Tasks]                             [Physical Proof Tasks]
│                       │                                                 │   │
│                       ▼                                                 ▼   │
│              Database Auto-Verify                              Camera OCR & Vision  │
│                       │                                                 │   │
│                       └─────────────────► 🏆 ◄──────────────────────────┘   │
│                                      Mastery Verified                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 3.6 Focus Guardian & Biometric Mindfulness (`/student/focus-guardian`)

#### 🎯 What it Does
An AI-powered deep-work tracker that monitors student attention via live webcam pose analysis, prevents burnout, and triggers adaptive mindfulness breaks.

#### ⚙️ Real-time Detection Pipeline (`src/app/student/focus-guardian/page.tsx`)
1. **Pose Landmarking**: MediaPipe `PoseLandmarker` tracks Nose landmark $(X, Y)$ and Shoulder landmarks $(11, 12)$ at 60 FPS.
2. **Distraction Detection**: If nose coordinates drift outside normal threshold ($X < 0.25$ or $X > 0.75$ or $Y < 0.2$ or $Y > 0.8$), distraction flag is logged.
3. **Adaptive 4-7-8 Mindfulness Overlay**:
   * Triggered on consecutive distraction.
   * Visual breathing circle cycles: Inhale ($4\text{s}$), Hold ($7\text{s}$), Exhale ($8\text{s}$).
   * **Live Breathing Compliance Tracking**: Tracks shoulder elevation delta $\Delta Y$. If shoulders rise during Inhale and drop during Exhale, compliance score reaches $100\%$.

#### 🧠 Focus Guardian LangGraph Agent (`focusGuardian.agent.js`)
```
START ──► [aggregateNode] ──► [fingerprintNode] ──► [gamifyNode] ──► END
```
* Generates Focus Fingerprint: Best working hours, focus depth index, primary distraction triggers, and assigns badges (*🧠 Deep Thinker*, *🎯 Laser Focus*, *🍅 Pomodoro Pro*).

---

### 3.7 AI Career Simulator & Monte Carlo Engine (`/student/career-simulator`)

#### 🎯 What it Does
A probabilistic career trajectory forecaster that calculates multi-year outcomes based on student CGPA, skills, interests, and real-time labor market trends.

#### ⚙️ Monte Carlo Simulation Pipeline (`careerSimulator.agent.js`)
* **LangGraph Pipeline**:
  1. `marketResearchNode`: Evaluates market demand score and average entry salary for chosen domain.
  2. `skillGapNode`: Cross-references student skills against market expectations to identify critical deficiencies.
  3. `timelineNode`: Generates 3 distinct multi-year trajectory paths:
     * **Conservative Path**: High probability corporate trajectory.
     * **Ambitious Path**: Fast-track technical lead / startup trajectory.
     * **Wildcard Path**: Indie creator / specialized consultant trajectory.
     * **Accelerated Vocational Path**: Auto-triggered for high-risk students ($\text{CGPA} \le 6.0$), focusing on 6-month industry certifications (AWS Cloud, Google Data Analytics).
  4. `riskNode`: Normalizes probability distributions ($[5\%, 99\%]$).

#### 🌌 Visual Canvas
* Interactive Three.js particle starfield (`CareerCanvas.tsx`) providing an immersive cosmic career exploration experience.

---

### 3.8 Social Hub & Gamification Engine (`/student/social`)

The Social Hub connects peer competition with collaborative learning:
1. **Leaderboard (`src/app/student/leaderboard/page.tsx`)**:
   * Dynamic ranking based on total XP, active streaks, and earned badges.
   * Backed by `leaderboard.service.js` with in-memory 30-second TTL caching (`NodeCache`) to prevent database congestion.
   * Real-time WebSocket broadcasting on point change events (`leaderboard:update`).
2. **Live Classroom Polls (`src/app/student/polls/page.tsx`)**:
   * Instantaneous polling engine for active lecture participation.
3. **Student Help Desk (`src/app/student/help-desk/page.tsx`)**:
   * Direct ticket raising system. Ingested tickets pass through HuggingFace DistilBERT sentiment classification to feed the global *Dropout Prediction Agent*.

---

### 3.9 Student Profile, Settings & Localization (`/student/profile`)

* **Profile Metadata**: Student ID, Department, Semester, Level, Total XP, and Streak Days.
* **Internationalization (i18n)**: Integrated `useTranslation()` supporting multiple regional languages.
* **Theme Customization**: Brutalist Light / Dark mode toggle with persistent local storage.

---

## 4. AI Agent Workflows & LangGraph State Machine Graph Directory

The system implements 6 specialized LangGraph State Graphs:

| Agent Name | Primary Function | State Graph Flow | Fallback Mechanism |
|---|---|---|---|
| **FocusGuardian Agent** | Focus session telemetry, distraction fingerprinting, badge calculation | `aggregate` $\to$ `analyzeFingerprint` $\to$ `gamify` | Heuristic focus depth scorer |
| **CareerSimulator Agent** | Monte Carlo multi-trajectory forecasting & skill gap audit | `marketResearch` $\to$ `skillGap` $\to$ `timeline` $\to$ `risk` | Pre-computed tech domain matrix |
| **DoubtSolver Agent** | Multimodal OCR, audio transcription, step-by-step math solver | `transcribe` $\to$ `ocr` $\to$ `context` $\to$ `solve` $\to$ `narrate` | Rule-based academic dictionary |
| **DropoutPrediction Agent** | Fuses sentiment, attendance velocity, and marks to predict dropout risk | `sentiment` $\to$ `behavioral` $\to$ `fusion` $\to$ `intervention` | Linear risk formula |
| **VirtualInterview Agent** | 10-turn adaptive technical recruiter with biometric scoring | `resumeContext` $\to$ `answerProcess` $\to$ `biometrics` $\to$ `eval` $\to$ `nextQ` | Static question bank |
| **VirtualDebate Agent** | Socratic AI opponent with live fallacy detection & crowd mood | `preprocessor` $\to$ `fallacyCheck` $\to$ `logicEval` $\to$ `aiResponse` | Deterministic debate tree |

---

## 5. Real-time Socket.IO Communication Matrix

All real-time communications operate on the `/student` namespace:

| Socket Event | Direction | Payload | Trigger Source / Purpose |
|---|---|---|---|
| `dashboard:refresh` | Server $\to$ Client | `{ studentId }` | Emitted when marks, attendance, or interventions update |
| `leaderboard:update` | Server $\to$ Client | `{ entries, classId }` | Emitted whenever student earns XP in quizzes/tasks |
| `intervention:created` | Server $\to$ Client | `{ intervention }` | Emitted when teacher or AI creates a critical intervention |
| `world:player_move` | Bi-directional | `{ id, position, rotation }` | Real-time position sync in 3D Virtual Campus |
| `debate:argument` | Client $\to$ Server | `{ argument, audioMetrics }` | Submits student debate turn to LangGraph debate agent |
| `interview:answer` | Client $\to$ Server | `{ answer, biometrics }` | Submits interview response with MediaPipe face data |

---

## 6. Data Models & Schema Relationships

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          STUDENT DATA RELATIONSHIPS                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────────┐         1:1         ┌──────────────┐                     │
│   │     User     │ ──────────────────► │   Student    │                     │
│   └──────┬───────┘                     └──────┬───────┘                     │
│          │                                    │                             │
│          │ 1:N                                │ 1:N                         │
│          ▼                                    ▼                             │
│   ┌──────────────┐                     ┌──────────────┐                     │
│   │ ChatHistory  │                     │    Marks     │                     │
│   └──────────────┘                     └──────────────┘                     │
│          │                                    │                             │
│          │ 1:1                                │ 1:N                         │
│          ▼                                    ▼                             │
│   ┌──────────────┐                     ┌──────────────┐                     │
│   │   Insight    │ ◄────────────────── │  Attendance  │                     │
│   │ (Risk Engine)│                     └──────────────┘                     │
│   └──────┬───────┘                            │                             │
│          │                                    │ 1:N                         │
│          │ 1:N                                ▼                             │
│          ▼                             ┌──────────────┐                     │
│   ┌──────────────┐                     │ Intervention │                     │
│   │ OvercomePath │                     └──────────────┘                     │
│   └──────────────┘                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

* **`Student` Schema**: Manages XP, level, badges, classId, and enrolled courses.
* **`Insight` Schema**: Stores calculated CGPA, attendance rate, risk level (`low`, `medium`, `high`, `critical`), and root causes.
* **`OvercomePath` Schema**: Contains actionable tasks (Day 1..N), task types (`internal` vs `proof`), status, and ReactFlow diagram structures.
* **`FocusSession` Schema**: Logs total minutes, focused minutes, distraction timestamps, and ambient noise telemetry.

---

## 7. GSD Development & Governance Framework

### 7.1 `/goal`: Milestone & Mission Contract
* **Primary Objective**: Deliver a production-grade, zero-defect, mobile-responsive, on-device AI-accelerated Student Dashboard that empowers learners to identify, confront, and overcome academic challenges through immersive multimodal technology.
* **Success Verification**:
  1. All 9 student sub-modules render seamlessly with no CSS overlaps or clipping.
  2. MediaPipe vision models execute on-device at $\ge 30\text{ FPS}$ with WebGL GPU delegates.
  3. All 6 LangGraph AI agents resolve queries with $< 2.5\text{s}$ latency and have $100\%$ fallback resilience.
  4. Real-time Socket.IO broadcasts update dashboard state without full-page reloads.

---

### 7.2 [`/gsd-map-codebase`](file:///c:/Users/Swanandi/Desktop/Sensei-Ultra/sensei-frontend)
```
sensei-frontend/src/app/student/
├── page.tsx                     # Main Dashboard & Command Center
├── layout.tsx                   # Student Navigation Shell & Sidebar
├── ai-avatar/page.tsx           # 3D WebGL Avatar & Voice Mentor
├── ultra-study/page.tsx         # Arsenal Hub (Study Plan, Quiz, Doubt, Keeper)
│   ├── study-plan/page.tsx      # Video Transcript & Syllabus Generator
│   ├── quiz/page.tsx            # Quiz Arena (Adaptive & Camo Quizo)
│   ├── doubt-solver/page.tsx    # Multimodal Voice/OCR Math Tutor
│   └── ultra-keeper/page.tsx    # AI Notes & Flashcards
├── virtual-beyond/page.tsx      # Metaverse Hub (World, Interview, Debate)
│   ├── world/page.tsx           # 3D Multi-user Virtual Campus
│   ├── interview/page.tsx       # AI Video Recruiter Simulation
│   └── debate/page.tsx          # Real-time Socratic Argumentation
├── overcome/page.tsx            # Weakness Remediation & Task Proofs
├── focus-guardian/page.tsx      # Pose Telemetry & 4-7-8 Breathing
├── career-simulator/page.tsx    # Monte Carlo Multi-Trajectory Planner
├── social/page.tsx              # Social Hub (Leaderboard, Polls, Helpdesk)
└── profile/page.tsx             # Student Profile & i18n Localization

sensei-backend/src/
├── controllers/student.controller.js # Aggregation & Dashboard Logic
├── agents/                           # LangGraph AI Agent Pipelines
│   ├── focusGuardian.agent.js
│   ├── careerSimulator.agent.js
│   ├── doubtSolver.agent.js
│   ├── dropoutPrediction.agent.js
│   ├── virtualInterview.agent.js
│   ├── virtualDebateAgent.js
│   └── behaviorFingerprint.agent.js
├── socket/                           # Real-time Gateway Sockets
│   ├── world.socket.js
│   ├── interview.socket.js
│   └── debate.socket.js
└── services/
    ├── gemini.service.js             # Rate-limited Gemini AI Client
    ├── huggingface.service.js        # DistilBERT & Feature Embeddings
    └── performance.service.js        # Multi-factor Risk Scorer
```

---

### 7.3 `/gsd-add-phase`: Phased Delivery & Integration Plan

* **Wave 1 (Core Diagnostics & Stability)**:
  * Validate `student.controller.js` parallel database aggregation.
  * Verify real-time Socket.IO authentication and room isolation.
* **Wave 2 (On-Device Vision & Biometrics)**:
  * Optimize MediaPipe WASM and GPU delegates for mobile clients.
  * Ensure Focus Guardian and Camo Quizo maintain $60\text{ FPS}$ with zero memory leaks.
* **Wave 3 (LangGraph Multi-Agent Orchestration)**:
  * Deploy self-healing fallbacks across all 6 LangGraph state machines.
  * Benchmark token throughput and JSON schema adherence.
* **Wave 4 (Visual Polish & Accessibility)**:
  * Comprehensive brutalist UI inspection across all standard viewports ($360\text{px}$ to $1920\text{px}$).
  * Verify dark/light mode token harmony and typography consistency.

---

### 7.4 `/gsd-code-review`: Backend, Frontend & Agent Audit
1. **Type Safety & Error Handling**:
   * All REST endpoints wrapped with structured try-catch blocks and Winston audit logging.
   * Frontend Axios instances configured with automatic JWT refresh interceptors.
2. **AI Resilience & Rate Limiting**:
   * `gemini.service.js` utilizes `p-queue` (max 14 requests/min) with key rotation across configured API keys.
   * Clean fallback to HuggingFace DistilBERT and offline deterministic heuristics during network partitions.
3. **State Management**:
   * ReactFlow nodes cleanly managed without circular edge dependencies.
   * MediaStream camera tracks explicitly released on component unmount to prevent camera lockups.

---

### 7.5 [`/gsd-ui-review`](file:///c:/Users/Swanandi/Desktop/Sensei-Ultra/sensei-frontend/src/app/student)
1. **Visual Style**: Neobrutalist aesthetic featuring bold $4\text{px}$ solid `#111` borders, tactile offset drop shadows (`shadow-[8px_8px_0_#111]`), Fredoka typography, and vibrant pastel accents.
2. **Responsive Layouts**: Flexible grid configurations (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`) preventing any card collisions or text overflow.
3. **Micro-Interactions**: Framer Motion spring transitions (`type: "spring", bounce: 0.4`), hover scalings (`whileHover={{ y: -4 }}`), and animated loaders.

---
*Generated autonomously by Google DeepMind Antigravity AI Engine for Sensei-Ultra.*
