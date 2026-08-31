# iris-plus

> **Iris Plus**: Next-Generation AI Student Learning OS & Multimodal Academic Cockpit.

---

## 🌟 Overview
**Iris Plus** is a standalone, AI-accelerated student learning operating system designed to diagnose, support, and elevate student learning through on-device edge intelligence, LangGraph multi-agent reasoning, WebGL 3D immersion, and real-time biometric telemetry.

---

## 🚀 Core Student Dashboard Modules

1. **Mission Control (`/student`)**:
   - 5-Axis Multi-Dimensional Competency Radar Chart.
   - Real-time Attendance Velocity & Exam Grade Trajectories.
   - Active Streak Counter, Level Progress, and Live Notification Feed.

2. **3D AI Avatar Studio (`/student/ai-avatar`)**:
   - WebGL 3D Avatar Companion with dynamic mouth viseme lip-syncing.
   - Multimodal Voice Interaction with context-injected mentoring.

3. **Ultra Study Arsenal (`/student/ultra-study`)**:
   - **Study Plan Synthesizer**: YouTube lecture transcript ingestion & visual timetable generator.
   - **Camo Quizo**: MediaPipe real-time Computer Vision hand gesture recognition in a 3D bubble arena.
   - **Doubt Solver**: Multimodal OCR + Speech LaTeX step-by-step mathematical problem solver.
   - **Ultra Keeper**: AI flashcards and notes organizer.

4. **Virtual Beyond Metaverse (`/student/virtual-beyond`)**:
   - **Virtual World**: Multi-user 3D virtual campus with spatial player synchronization.
   - **Interview Hub**: Adaptive technical/HR mock recruitment simulator with facial biometrics & WPM analytics.
   - **Debate Arena**: Real-time Socratic debate arena with live logical fallacy detection.

5. **Overcome Remediation (`/student/overcome`)**:
   - Weakness diagnostic engine with interactive ReactFlow strategy mastery pathways.
   - Dual-task verification (Platform automated checks + Physical notebook camera proof OCR).

6. **Focus Guardian & 4-7-8 Breathing (`/student/focus-guardian`)**:
   - Real-time MediaPipe Pose Landmarking tracking focus depth at 60 FPS.
   - Adaptive 4-7-8 Mindfulness Break with live webcam shoulder elevation ($\Delta Y$) compliance tracking.

7. **AI Career Simulator (`/student/career-simulator`)**:
   - Monte Carlo probabilistic career outcome forecaster (Conservative, Ambitious, Wildcard + Accelerated Vocational tracks).
   - Interactive Three.js particle starfield canvas.

8. **Social Hub (`/student/social`)**:
   - Real-time Class XP Leaderboard with in-memory caching and WebSocket sync.
   - Interactive Classroom Polls & Student Help Desk.

9. **Profile & Customization (`/student/profile`)**:
   - Multi-language localization (i18n) & Neobrutalist Dark/Light theme toggle.

---

## 🛠️ Tech Stack

* **Frontend**: Next.js 14 (App Router), React 18, TailwindCSS, Framer Motion, Three.js, Recharts, ReactFlow, MediaPipe Vision Tasks.
* **Mobile (Flutter)**: Flutter 3.x, Dart 3, Riverpod 2.x, LiteRT Gemma 2B INT8, Qualcomm QNN Execution Provider on Snapdragon Hexagon NPU.
* **Backend**: Node.js, Express.js, MongoDB (Mongoose), Socket.IO, Winston Logger.
* **AI & Multi-Agent**: LangGraph State Graphs, Google Gemini 2.0 Flash, HuggingFace DistilBERT.

---

## ⚡ Quick Start

### 1. Backend Server
```bash
cd sensei-backend
npm install
node seed.js    # Seeds 40 student profiles across CSE, IT, BTECH, and AI
npm run dev     # Runs on http://localhost:5000 (or configured port)
```

### 2. Frontend Web Application
```bash
cd sensei-frontend
npm install
npm run dev     # Runs on http://localhost:3000
```

### 3. Demo Student Credentials
* **Email**: `aarav.sharma.cse@sensei.edu`
* **Password**: `student123`

---

*Built with ❤️ for Iris Plus.*
