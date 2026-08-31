# 🌐 Sensei-Ultra — Mozilla AI-Aligned Architecture & Problem Statement Blueprint

This document outlines the **Problem Statement (PS)**, the core rationale behind building **Sensei-Ultra**, and a detailed technical roadmap to shift its architecture to align with the **Mozilla AI principles** of local-first, trustworthy, open-source, and decentralized AI.

---

## 1. The Core Problem Statement (PS)

### Headline
> **"Bridging the Institutional Agency Gap: Mitigating Student Attrition and Skills Misalignment through Trustworthy, Private, and Collaborative AI Systems."**

### Problem Context
Modern higher education institutions struggle with high student attrition (dropout), widening skills gaps, and a fragmented understanding of student engagement. While AI tools offer potential solutions, traditional institutional platforms rely heavily on centralized, closed-source cloud models (like OpenAI, Google Vertex API, etc.). 

This reliance creates a multi-layered crisis:
1. **Data Sovereignty & Privacy Violations**: Pushing highly sensitive student behavior data, wellness notes, help-desk queries, and academic records to proprietary third-party servers violates student privacy rights (and regulations like GDPR or FERPA).
2. **The "Renter" Cost Trap**: Running dozens of AI agents per student for doubt solving, mock interviews, and study planning quickly becomes financially unsustainable under token-pricing cloud models.
3. **Black-Box Decision Bias**: Predictive dropout models must be auditable. Proprietary models offer no transparency, which is a major risk when flagging students for critical academic interventions.
4. **Lack of User Agency**: Current educational tools act on behalf of the platform rather than serving as a true "user agent" that acts on behalf of the student or teacher.

---

## 2. Why We Are Building This (Vision & Research)

Sensei-Ultra is built to solve the **three disconnects** of modern higher education:

```
┌────────────────────────────────────────────────────────┐
│                   THE THREE DISCONNECTS                │
├───────────────────┬───────────────────┬────────────────┤
│    ACADEMIC       │     PRACTICAL     │  INSTITUTIONAL │
│  Students study   │ Students graduate │  Admins make   │
│   passively to    │ lacking practical │ resource and   │
│   pass tests, not │ communication &   │ class schedule │
│   to comprehend.  │ critical thinking.│ decisions on   │
│                   │                   │ stale data.    │
└───────────────────┴───────────────────┴────────────────┘
```

*   **To Cultivate True Comprehension (Academic)**: Standard platforms provide flat textbooks. Sensei-Ultra uses **Video Analyzers** and **Doubt Solvers** to transform static content into interactive visual concept maps and LaTeX step-by-step narration.
*   **To Foster Dynamic Skills (Practical)**: Students need communication skills, not just rote knowledge. Sensei-Ultra integrates real-time webcam sentiment analysis and interactive verbal reasoning through the **Virtual Interview** and **Virtual Debate** agents.
*   **To Enable Proactive Mentorship (Institutional)**: Faculty members are overloaded. Sensei-Ultra groups students using mathematical clustering of behavior indicators, automatically drafting personalized outreach emails so teachers can intervene before grades drop.

---

## 3. Shifting to the Mozilla AI Architecture

Mozilla’s AI philosophy is defined by the **"Owner, Not Renter"** model. AI should run locally when possible, utilize open-source models, ensure data privacy, and run on decentralized/federated architectures.

### The Mozilla AI Blueprint for Sensei-Ultra

```
                       ┌─────────────────────────┐
                       │  Sensei Web UI / App    │
                       └────────────┬────────────┘
                                    │
            ┌───────────────────────┴───────────────────────┐
            ▼ (Intra-device)                                ▼ (Self-hosted Edge)
 ┌─────────────────────────────────────┐         ┌─────────────────────────────────────┐
 │        LOCAL-FIRST AI ENGINE        │         │        TRUSTWORTHY EDGE NODE        │
 ├─────────────────────────────────────┤         ├─────────────────────────────────────┤
 │ • WebGPU-accelerated WebLLM         │         │ • Self-contained Llamafile          │
 │ • Local models: Phi-3 / Llama-3-8B  │         │   (Mistral-7B / Llama-3)            │
 │ • Offline Doubt Solving & Notes     │         │ • Private Vector DB (Chroma/Qdrant) │
 │ • MediaPipe (On-device CV)          │         │ • Model Context Protocol (MCP)      │
 └─────────────────────────────────────┘         └─────────────────────────────────────┘
```

---

## 4. Key Architectural Transitions

### 1. From Cloud Dependencies to Local-First Execution (`llamafile` & `WebLLM`)
*   **Current State**: The platform calls Google Gemini and HuggingFace APIs via cloud requests to summarize transcripts, solve doubts, and run interviews.
*   **Mozilla Shift**:
    *   Deploy **`llamafile`** on institutional edge servers. `llamafile` packages an LLM (like Mistral-7B or Llama-3) into a single executable that runs locally on local CPU/GPU hardware.
    *   Integrate **`WebLLM`** (via WebGPU/WASM) in the Next.js frontend, allowing small, high-performance models (like Microsoft's `Phi-3` or Google's `Gemma-2B`) to run **directly inside the user's browser**. The browser handles basic doubt solving, note summarization, and interview feedback completely offline.

### 2. Standardized Agent Orchestration with the `any-*` Toolset
*   **Current State**: Custom LangGraph graphs are wired directly to Gemini JSON prompts.
*   **Mozilla Shift**:
    *   Implement **`any-llm`** to dynamically route calls. It can route critical logic reasoning (like the *Virtual Debate*) to the local server, and lighter tasks to the browser WebLLM.
    *   Use **`any-guardrail`** on local edge nodes to validate outputs for safety, preventing hallucinations and bias in grading or feedback.
    *   Utilize **`Lumigator`** to continually evaluate and benchmark local models (e.g., comparing Mistral-7B vs. Llama-3-8B) on student grading tasks to ensure consistent output quality.

### 3. Private Memory Architecture & Data Sovereignty
*   **Current State**: Mongoose databases store complete user conversations, help tickets, and sentiment histories.
*   **Mozilla Shift**:
    *   Design a **"Private Memory"** local vault for students. Instead of storing logs in the central database, student conversation history is encrypted and stored locally in the student's browser (IndexedDB) or mobile device.
    *   Vector search embeddings (for student study plans and note search) are created and queried locally on-device. The central database only tracks anonymized indicators for early dropout prediction, preserving student privacy.

### 4. Open Standards using Model Context Protocol (MCP)
*   **Current State**: The backend routes fetch data from models using custom schemas.
*   **Mozilla Shift**:
    *   Adopt the **Model Context Protocol (MCP)** via **`mcpd`** (Mozilla's MCP manager).
    *   Expose university resources (curriculum guidelines, class syllabi, past marks datasets) as secure MCP servers.
    *   The AI agents (like the *Grading Agent* or *Doubt Solver*) connect as MCP clients, querying data through standard, secure protocols.

---

## 5. Technical Comparison: Current vs. Mozilla AI

| Dimension | Current Architecture | Mozilla AI Shift |
|-----------|----------------------|------------------|
| **Execution Location** | Cloud API (Google/HF) | On-device browser (WebLLM) + Self-hosted Local Server (Llamafile) |
| **Data Privacy** | Pushed to third-party endpoints | Local-first; user data remains inside the browser or school network |
| **Operating Cost** | Variable (per-token cloud billing) | Fixed (server electricity and local hosting) |
| **Offline Support** | Zero (fails without internet) | Partial (WebLLM runs locally for search, doubts, and notes offline) |
| **System Auditability**| Zero (closed-source models) | High (fully open-source models, verifiable model weights) |
| **Agent Protocols** | Direct LangGraph API integrations | Model Context Protocol (MCP) via `mcpd` servers |
