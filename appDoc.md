# ADAPTIVE LEARNING SYSTEM - TECHNICAL SPECIFICATION
## AI Agent Implementation Guide

**Version:** 1.0 (Prototype)  
**Platform:** Desktop Application (Electron + React)  
**Storage:** Local filesystem only  
**LLM Provider:** Multi-provider via backend proxy (no client-side secrets)

---

## TABLE OF CONTENTS

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Core Features](#core-features)
4. [File Structure](#file-structure)
5. [Scene-by-Scene Specification](#scene-by-scene-specification)
6. [Component Requirements](#component-requirements)
7. [Data Models](#data-models)
8. [API Integration](#api-integration)
9. [User Flow Diagrams](#user-flow-diagrams)
10. [Implementation Checklist](#implementation-checklist)

---

## 1. SYSTEM OVERVIEW

### Purpose
A desktop application that helps students learn through:
- AI-generated personalized curricula
- Enforced focus/break cycles (Pomodoro-style with physical activity prompts)
- Knowledge graph visualization of learning progress
- Real-time resource retrieval (YouTube videos, memes, definitions)
- Infinite-depth topic exploration with parent-child node relationships

### Key Principles
- **Focus enforcement:** No bypass during breaks - full screen lock
- **Local-first:** All data stored on user's machine
- **AI-powered:** LLM generates curricula, search queries, and connections
- **Graph-based:** Every page is a node, selections create child nodes
- **Markdown native:** All content stored and rendered as markdown

---

## 2. TECHNOLOGY STACK

### Required Technologies

```json
{
  "runtime": "Electron",
  "frontend": "React",
  "styling": "CSS/Tailwind (your choice)",
  "file_handling": "Node.js fs module",
  "markdown": "react-markdown or marked.js",
  "3d_visualization": "Three.js / React Force Graph / D3.js",
  "llm_api": "Backend proxy (Express) \u2192 LLM providers (Groq/OpenRouter/etc)",
  "video_api": "YouTube Data API v3",
  "hashing": "crypto-js (SHA-256)",
  "state_management": "React Context API / Redux (optional)"
}
```

### Dependencies to Install

```bash
npm install electron react react-dom
npm install react-markdown
npm install three @react-three/fiber @react-three/drei  # for 3D graph
npm install crypto-js  # for SHA-256 hashing
npm install axios  # for API calls
npm install electron-store  # for persistent settings
```

---

## 3. CORE FEATURES

### Feature 1: Dynamic Curriculum Generation
- **Input:** User's learning goal (e.g., "Learn React Hooks")
- **Process:** 
  1. Combine user input with system prompt
  2. Send to Gemini API
  3. Receive hierarchical curriculum (1, 1.1, 1.1.1 format)
- **Output:** Expandable/collapsible tree structure
- **User Actions:** Edit, add, regenerate curriculum items

### Feature 2: Real-time Resource Retrieval
- **Trigger:** User selects text → presses search button
- **Process:**
  1. Generate search query using LLM
  2. Fetch YouTube videos (YouTube API)
  3. Scrape memes (web scraping)
  4. Create structured "topic page"
- **Output:** Child node with comprehensive topic information

### Feature 3: Knowledge Graph Visualization
- **Display:** 3D interactive graph of all nodes
- **Layout:** Auto-arranged hierarchy (tree structure)
- **Interactions:**
  - Hover: Show node preview
  - Drag: Reposition nodes
  - Click: Navigate to node
- **AI Feature:** "Suggest potential connections" (dotted lines)

### Feature 4: Enforced Focus/Break Sessions
- **Configuration:** Focus time, break time, number of sessions
- **Enforcement:** Full screen lock during breaks
- **Break Activity:** Display random physical activity prompt
- **Persistence:** Timer continues even if app closed

### Feature 5: Topic Pages (Deep Dive)
- **Structure:**
  1. Topic title (H1)
  2. Comprehensive definition
  3. 3-5 YouTube videos
  4. Beginner-friendly explanation
  5. 3-5 related memes
  6. Keyword suggestions (clickable)
- **Recursion:** Select text → create child topic page (infinite depth)

### Feature 6: AI-Powered Search
- **Modes:**
  - AI response (Gemini API)
  - Web scraping (article content)
- **Integration:** Each search creates a new child node

---

## 4. FILE STRUCTURE

### Application Directory Layout

```
adaptive-learning-app/
├── src/
│   ├── main/
│   │   ├── main.js                 # Electron main process
│   │   ├── preload.js              # Electron preload scripts
│   │   └── ipc-handlers.js         # IPC communication handlers
│   ├── renderer/
│   │   ├── App.jsx                 # Main React component
│   │   ├── scenes/
│   │   │   ├── Scene0_FocusSetup.jsx
│   │   │   ├── Scene1_MainHub.jsx
│   │   │   ├── Scene2_Curriculum.jsx
│   │   │   └── Scene3_TopicPage.jsx
│   │   ├── components/
│   │   │   ├── HamburgerMenu.jsx
│   │   │   ├── FocusTimer.jsx
│   │   │   ├── BreakOverlay.jsx
│   │   │   ├── NoteOverlay.jsx
│   │   │   ├── GraphVisualization.jsx
│   │   │   ├── CurriculumTree.jsx
│   │   │   ├── TopicPageRenderer.jsx
│   │   │   └── SearchBar.jsx
│   │   ├── utils/
│   │   │   ├── fileHandler.js      # File read/write operations
│   │   │   ├── hashGenerator.js    # SHA-256 ID generation
│   │   │   ├── geminiAPI.js        # Gemini API wrapper
│   │   │   ├── youtubeAPI.js       # YouTube API wrapper
│   │   │   ├── memeScraper.js      # Web scraping logic
│   │   │   └── markdownParser.js   # Markdown rendering
│   │   ├── hooks/
│   │   │   ├── useFocusTimer.js
│   │   │   ├── useLocalStorage.js
│   │   │   └── useNodeGraph.js
│   │   └── styles/
│   │       └── global.css
│   └── index.html
├── user-data/                      # User's local data (created at runtime)
│   ├── pages/                      # All topic pages (markdown files)
│   │   ├── a1b2c3d4.md
│   │   ├── e5f6g7h8.md
│   │   └── ...
│   ├── notes/                      # User notes
│   │   ├── note_1.md
│   │   └── ...
│   ├── curricula/                  # Saved curricula
│   │   ├── curriculum_1.json
│   │   └── ...
│   ├── graph-state.json            # Graph node positions and connections
│   ├── session-history.json        # Focus session logs
│   └── app-state.json              # Last active node, timer state, etc.
├── assets/
│   ├── break-messages.json         # 30 physical activity prompts
│   └── system-prompts.json         # LLM system prompts
├── package.json
└── README.md
```

---

## 5. SCENE-BY-SCENE SPECIFICATION

### SCENE 0: Focus Session Setup

**File:** `Scene0_FocusSetup.jsx`

**UI Layout:**
```
┌─────────────────────────────────────────┐
│                                         │
│         Welcome to Adaptive Learn       │
│                                         │
│   Configure Your Focus Session:        │
│                                         │
│   Focus Duration:                       │
│   [Dropdown: 1min(demo), 25min, 60min, │
│    Custom]                              │
│                                         │
│   Break Duration:                       │
│   [Dropdown: 1min(demo), 5min, 10min,  │
│    Custom]                              │
│                                         │
│   Number of Sessions:                   │
│   [Dropdown: 1, 2, 3, Custom (max 6)]  │
│                                         │
│   [   Start Focus Session   ]          │
│                                         │
└─────────────────────────────────────────┘
```

**State Variables:**
```javascript
{
  focusDuration: number,      // minutes
  breakDuration: number,      // minutes
  numberOfSessions: number,   // 1-6
  currentSession: number,     // which session is active
  isCustomFocus: boolean,
  isCustomBreak: boolean
}
```

**Actions:**
- User selects durations from dropdowns
- Click "Start Focus Session" → Save to `app-state.json`
- Navigate to Scene 1
- Initialize timer countdown

**Validation:**
- Custom values must be > 0
- Number of sessions: 1-6 only

---

### SCENE 1: Main Hub

**File:** `Scene1_MainHub.jsx`

**UI Layout:**
```
┌─────────────────────────────────────────┐
│                          [☰] Timer: 24:32│
│                                         │
│                                         │
│    ┌─────────────────────────────────┐ │
│    │ What do you want to learn?     │ │
│    │                                 │ │
│    └─────────────────────────────────┘ │
│              [Search]                   │
│                                         │
│                                         │
└─────────────────────────────────────────┘
```

**Hamburger Menu Items:**
```
☰ Menu
├── Note it down
├── See understanding graph
├── Continue (last visited node)
├── Embedded Google search
├── Settings
└── Exit focus session
```

**Component Structure:**
```jsx
<Scene1_MainHub>
  <HamburgerMenu position="top-right" />
  <FocusTimer display="top-right" />
  <SearchBar 
    placeholder="What do you want to learn?"
    onSubmit={handleGenerateCurriculum}
  />
</Scene1_MainHub>
```

**Actions:**

1. **Enter Learning Goal:**
   - User types query (e.g., "Machine Learning")
   - Click "Search" button
   
2. **Generate Curriculum:**
   ```javascript
   async function handleGenerateCurriculum(userInput) {
     const systemPrompt = `Generate a hierarchical curriculum for learning: "${userInput}".
     Format as numbered tree structure (1, 1.1, 1.1.1, 2, 2.1, etc.).
     Include beginner to advanced topics.
     Output as JSON array with fields: id, title, level, parent_id`;
     
     const response = await geminiAPI.generate({
       prompt: systemPrompt + userInput,
       model: "gemini-pro"
     });
     
     const curriculum = JSON.parse(response);
     saveCurriculum(curriculum);
     navigateTo("Scene2_Curriculum");
   }
   ```

3. **Hamburger Menu Actions:**

   **Note it down:**
   ```jsx
   <NoteOverlay
     width="33%"
     height="50%"
     position="center"
     onSave={saveNoteToFile}
   />
   ```
   - Save to: `user-data/notes/note_[timestamp].md`
   - Support hashtag organization (#react #hooks)

   **See understanding graph:**
   - Open `GraphVisualization.jsx` in new window
   - Load all nodes from `user-data/pages/`
   - Display 3D force-directed graph

   **Continue:**
   - Read last visited node from `app-state.json`
   - Navigate to that topic page

---

### SCENE 2: Curriculum View

**File:** `Scene2_Curriculum.jsx`

**UI Layout:**
```
┌─────────────────────────────────────────┐
│ [☰] Timer: 23:15          [Edit Mode]  │
│                                         │
│ Curriculum: Machine Learning            │
│                                         │
│ ▼ 1. Introduction to ML                │
│   ▶ 1.1 What is Machine Learning?      │
│   ▼ 1.2 Types of ML                    │
│       • 1.2.1 Supervised Learning      │
│       • 1.2.2 Unsupervised Learning    │
│ ▼ 2. Data Preprocessing                │
│   ▶ 2.1 Data Cleaning                  │
│                                         │
│ ────────────────────────────────────    │
│ Trends:                                 │
│ • MLOps gaining traction                │
│ • AutoML adoption increasing            │
└─────────────────────────────────────────┘
```

**Component Structure:**
```jsx
<Scene2_Curriculum>
  <HamburgerMenu />
  <FocusTimer />
  <CurriculumTree
    data={curriculumData}
    onItemClick={handleNavigateToTopic}
    onTextSelect={handleTextSelection}
    editMode={isEditMode}
  />
  <TrendsSection />
</Scene2_Curriculum>
```

**Curriculum Data Model:**
```javascript
{
  curriculum_id: "uuid",
  title: "Machine Learning",
  created_at: "2025-02-07T10:30:00Z",
  items: [
    {
      id: "1",
      title: "Introduction to ML",
      level: 0,
      parent_id: null,
      expanded: true,
      linked_page_id: null  // SHA-256 hash if topic page exists
    },
    {
      id: "1.1",
      title: "What is Machine Learning?",
      level: 1,
      parent_id: "1",
      expanded: false,
      linked_page_id: "a1b2c3d4"
    }
  ]
}
```

**Interactions:**

1. **Expand/Collapse:**
   - Click arrow icon → Toggle `expanded` state
   - Persist state in `curricula/curriculum_[id].json`

2. **Text Selection → Search:**
   ```javascript
   function handleTextSelection(selectedText, curriculumItem) {
     showOverlay({
       message: `Search for "${selectedText}"?`,
       actions: [
         { label: "Yes", onClick: () => createTopicPage(selectedText, curriculumItem.id) },
         { label: "No", onClick: closeOverlay }
       ]
     });
   }
   
   async function createTopicPage(topic, parentId) {
     const pageId = generateSHA256(topic.trim()).substring(0, 8);
     
     // Check if page already exists
     if (pageExists(pageId)) {
       showOverlay({
         message: "This topic already exists. Link to it or create new?",
         actions: [
           { label: "Link", onClick: () => linkExistingPage(parentId, pageId) },
           { label: "Create New", onClick: () => forceCreateNewPage(topic) }
         ]
       });
       return;
     }
     
     // Generate topic page content
     const pageContent = await generateTopicPage(topic);
     savePage(pageId, pageContent);
     navigateTo("Scene3_TopicPage", { pageId });
   }
   ```

3. **Edit Mode:**
   - Toggle via button in top-right
   - Allow: Add new items, delete items, reorder, regenerate sections
   - Save changes to curriculum JSON file

4. **Underlined Text:**
   - Any text that has been "searched" gets underlined
   - Store in curriculum item: `searched_terms: ["supervised learning"]`
   - Hover → Show tooltip with linked page preview

---

### SCENE 3: Topic Page

**File:** `Scene3_TopicPage.jsx`

**UI Layout:**
```
┌─────────────────────────────────────────┐
│ [☰] [← Back] Timer: 22:43  [Raw MD]    │
│                                         │
│ Supervised Learning                     │
│ ═══════════════════════════════════     │
│                                         │
│ Supervised learning is a type of        │
│ machine learning where the algorithm    │
│ learns from labeled training data...    │
│                                         │
│ ───── Videos ─────                      │
│ [▶ Introduction to Supervised...]      │
│ [▶ Linear Regression Explained]        │
│ [▶ Classification vs Regression]       │
│                                         │
│ ───── Simple Explanation ─────          │
│ Think of it like learning with a        │
│ teacher who shows you examples...       │
│                                         │
│ ───── Memes ─────                       │
│ [img: overfitting meme]                 │
│ [img: training data quality meme]       │
│                                         │
│ ───── Related Topics ─────              │
│ • Linear Regression                     │
│ • Classification                        │
│ • Training Data                         │
└─────────────────────────────────────────┘
```

**Topic Page Data Structure:**
```markdown
# Supervised Learning

## Definition
Supervised learning is a type of machine learning where the algorithm learns from labeled training data. The model is trained on input-output pairs and learns to map inputs to correct outputs.

## Videos
- [Introduction to Supervised Learning](https://youtube.com/watch?v=xxx)
- [Linear Regression Explained](https://youtube.com/watch?v=yyy)
- [Classification vs Regression](https://youtube.com/watch?v=zzz)

## Simple Explanation
Think of it like learning with a teacher who shows you examples and tells you the right answers. After seeing many examples, you learn to predict the answer for new questions on your own.

## Memes
![Overfitting meme](meme_url_1.jpg)
![Training data quality](meme_url_2.jpg)

## Keywords
#LinearRegression #Classification #TrainingData #Labels #Prediction

---
**Metadata:**
- page_id: a1b2c3d4
- parent_id: e5f6g7h8
- created_at: 2025-02-07T11:00:00Z
- topic: "Supervised Learning"
```

**Content Generation Flow:**

```javascript
async function generateTopicPage(topic) {
  // 1. Generate main definition
  const definition = await geminiAPI.generate({
    prompt: `Provide a comprehensive definition of "${topic}" in 2-3 paragraphs.`
  });
  
  // 2. Generate YouTube search query
  const videoQuery = await geminiAPI.generate({
    prompt: `Generate an optimal YouTube search query for educational videos about "${topic}".`
  });
  const videos = await youtubeAPI.search(videoQuery, maxResults: 5);
  
  // 3. Generate simple explanation
  const simpleExplanation = await geminiAPI.generate({
    prompt: `Explain "${topic}" in 2-3 sentences using simple language and analogies for beginners.`
  });
  
  // 4. Generate meme search query
  const memeQuery = await geminiAPI.generate({
    prompt: `Generate a search query to find humorous memes related to "${topic}".`
  });
  const memes = await memeScraper.search(memeQuery, maxResults: 5);
  
  // 5. Generate keywords
  const keywords = await geminiAPI.generate({
    prompt: `List 5-8 key technical terms and related concepts for "${topic}". Format as hashtags.`
  });
  
  // 6. Compile markdown
  return compileMarkdown({
    title: topic,
    definition,
    videos,
    simpleExplanation,
    memes,
    keywords
  });
}
```

**Interactions:**

1. **Text Selection:**
   - User highlights any text
   - Right-click or button appears: "Search this"
   - Creates child node (recursive topic page)

2. **Markdown Toggle:**
   - Button in top-right: "Raw MD" / "Preview"
   - Switch between rendered markdown and raw text

3. **Navigation:**
   - Back button → Return to parent page/curriculum
   - Breadcrumb trail: `Curriculum > ML > Supervised Learning`

4. **Link Underlining:**
   - Any selected text that created a child page gets underlined
   - Hover → Preview tooltip of child page
   - Click → Navigate to child page

---

## 6. COMPONENT REQUIREMENTS

### HamburgerMenu Component

**Props:**
```typescript
interface HamburgerMenuProps {
  position: "top-left" | "top-right";
  currentScene: string;
}
```

**Menu Items:**
```javascript
const menuItems = [
  {
    id: "note",
    label: "Note it down",
    icon: "📝",
    action: () => openNoteOverlay(),
    availableIn: ["all"]
  },
  {
    id: "graph",
    label: "See understanding graph",
    icon: "🕸️",
    action: () => openGraphWindow(),
    availableIn: ["all"]
  },
  {
    id: "continue",
    label: "Continue",
    icon: "▶️",
    action: () => navigateToLastNode(),
    availableIn: ["Scene1"]
  },
  {
    id: "search",
    label: "Google Search",
    icon: "🔍",
    action: () => openEmbeddedSearch(),
    availableIn: ["all"]
  },
  {
    id: "markdown-toggle",
    label: "Toggle Markdown Preview",
    icon: "📄",
    action: () => toggleMarkdownPreview(),
    availableIn: ["Scene3"]
  },
  {
    id: "exit-session",
    label: "Exit Focus Session",
    icon: "🚪",
    action: () => exitCurrentSession(),
    availableIn: ["all"]
  }
];
```

---

### FocusTimer Component

**Props:**
```typescript
interface FocusTimerProps {
  onFocusEnd: () => void;
  onBreakEnd: () => void;
  onSessionComplete: () => void;
}
```

**State:**
```javascript
{
  mode: "focus" | "break",
  timeRemaining: number,  // seconds
  currentSession: number,
  totalSessions: number,
  isPaused: boolean
}
```

**Logic:**
```javascript
useEffect(() => {
  const interval = setInterval(() => {
    if (timeRemaining > 0 && !isPaused) {
      setTimeRemaining(prev => prev - 1);
      saveTimerState({ timeRemaining: timeRemaining - 1 });
    } else if (timeRemaining === 0) {
      if (mode === "focus") {
        onFocusEnd();
        startBreak();
      } else {
        onBreakEnd();
        if (currentSession < totalSessions) {
          startFocus();
        } else {
          onSessionComplete();
        }
      }
    }
  }, 1000);
  
  return () => clearInterval(interval);
}, [timeRemaining, isPaused, mode]);
```

**Display Format:**
```
⏱️ 24:35 (Focus 1/3)
⏱️ 04:52 (Break 1/3)
```

---

### BreakOverlay Component

**File:** `BreakOverlay.jsx`

**Full Screen Lock:**
```css
.break-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.95);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
}
```

**UI Content:**
```jsx
<div className="break-overlay">
  <h1>Time for a Break! 🌿</h1>
  <p className="activity-prompt">{randomActivity}</p>
  <div className="countdown">
    <span className="time-remaining">{formatTime(timeRemaining)}</span>
    <p>remaining</p>
  </div>
</div>
```

**Break Messages (30 prewritten):**
```json
[
  "Go touch some grass, literally 🌱",
  "Drink a full glass of water 💧",
  "Do 10 push-ups 💪",
  "Stretch your arms above your head for 30 seconds 🙆",
  "Walk around your room for 2 minutes 🚶",
  "Look at something 20 feet away for 20 seconds (20-20 rule) 👀",
  "Do 15 jumping jacks",
  "Stand up and sit down 10 times",
  "Roll your shoulders backward 10 times",
  "Take 5 deep breaths - in through nose, out through mouth 🧘",
  "Go pet your dog/cat if you have one 🐕🐈",
  "Look out a window at nature 🪟",
  "Do a 1-minute plank",
  "Shake out your hands and wrists",
  "Do 10 squats",
  "Massage your temples gently",
  "March in place for 1 minute",
  "Stretch your neck - left, right, up, down",
  "Do toe touches - try to touch your toes 10 times",
  "Close your eyes and rest them for 1 minute",
  "Get up and tidy one small area of your desk",
  "Do wrist circles - 10 each direction",
  "Practice your best superhero pose for 30 seconds 🦸",
  "Do 10 lunges (5 each leg)",
  "Wiggle your fingers and toes",
  "Stand on one foot for 30 seconds, then switch",
  "Do arm circles - 10 forward, 10 backward",
  "Give yourself a quick shoulder massage",
  "Do 5 burpees (if you're feeling ambitious)",
  "Just stand up and walk to another room and back 🚶‍♀️"
]
```

**Enforcement:**
- Disable all keyboard shortcuts
- Prevent window closing (Electron BrowserWindow options)
- No escape key bypass
- Must wait full duration

---

### GraphVisualization Component

**File:** `GraphVisualization.jsx`

**Library:** React Force Graph 3D

**Setup:**
```jsx
import ForceGraph3D from 'react-force-graph-3d';

<ForceGraph3D
  graphData={graphData}
  nodeLabel="title"
  nodeAutoColorBy="curriculum_id"
  linkDirectionalArrowLength={3.5}
  linkDirectionalArrowRelPos={1}
  onNodeClick={handleNodeClick}
  onNodeHover={handleNodeHover}
/>
```

**Graph Data Structure:**
```javascript
{
  nodes: [
    {
      id: "a1b2c3d4",
      title: "Supervised Learning",
      curriculum_id: "ml_curriculum",
      level: 2,
      preview: "Supervised learning is a type...",
      x: 0,   // 3D position (optional - auto if not set)
      y: 0,
      z: 0
    }
  ],
  links: [
    {
      source: "a1b2c3d4",  // parent page ID
      target: "e5f6g7h8",  // child page ID
      type: "solid"        // "solid" or "dotted"
    }
  ]
}
```

**Potential Connections Logic:**

```javascript
async function suggestPotentialConnections() {
  const allNodes = loadAllPages();
  
  const prompt = `Given these learning topics:
  ${allNodes.map(n => `- ${n.title}`).join('\n')}
  
  Suggest 5-10 meaningful connections between topics that would help a learner understand relationships. Return as JSON array:
  [{ "from": "topic name", "to": "topic name", "reason": "why they're related" }]`;
  
  const suggestions = await geminiAPI.generate({ prompt });
  
  // Convert topic names to page IDs
  const links = suggestions.map(s => ({
    source: findPageIdByTitle(s.from),
    target: findPageIdByTitle(s.to),
    type: "dotted",
    reason: s.reason
  }));
  
  return links;
}
```

**Interactions:**
- **Hover:** Show tooltip with page title and preview
- **Click:** Navigate to that page
- **Drag:** Reposition node (save position to `graph-state.json`)
- **Button:** "Show Potential Connections" → Display dotted lines

---

### NoteOverlay Component

**Props:**
```typescript
interface NoteOverlayProps {
  onClose: () => void;
  onSave: (content: string) => void;
}
```

**UI:**
```jsx
<div className="note-overlay">
  <div className="note-window">
    <div className="note-header">
      <h3>Quick Note</h3>
      <button onClick={onClose}>✕</button>
    </div>
    <textarea
      placeholder="Type your note... Use #hashtags to organize"
      value={noteContent}
      onChange={(e) => setNoteContent(e.target.value)}
    />
    <button onClick={handleSave}>Save Note</button>
  </div>
</div>
```

**Save Logic:**
```javascript
function handleSave() {
  const timestamp = Date.now();
  const hashtags = extractHashtags(noteContent);  // Find all #tags
  
  const filename = `note_${timestamp}.md`;
  const filepath = `user-data/notes/${filename}`;
  
  const metadata = {
    created_at: new Date().toISOString(),
    hashtags: hashtags,
    filename: filename
  };
  
  const fullContent = `---
${JSON.stringify(metadata, null, 2)}
---

${noteContent}`;
  
  fs.writeFileSync(filepath, fullContent);
  onSave(filepath);
  onClose();
}
```

**Hashtag Extraction:**
```javascript
function extractHashtags(text) {
  const regex = /#[\w]+/g;
  return text.match(regex) || [];
}
```

---

## 7. DATA MODELS

### Page Data Model

**File:** `user-data/pages/[page_id].md`

**Format:**
```markdown
---
metadata:
  page_id: "a1b2c3d4"
  topic: "Supervised Learning"
  parent_id: "e5f6g7h8"
  curriculum_id: "ml_curriculum"
  created_at: "2025-02-07T11:00:00Z"
  last_modified: "2025-02-07T14:30:00Z"
  child_ids: ["x1y2z3a4", "b5c6d7e8"]
  search_queries_used:
    - "supervised learning tutorial"
    - "machine learning classification"
---

# Supervised Learning

## Definition
[Content here...]

## Videos
[Links here...]

## Simple Explanation
[Content here...]

## Memes
[Image URLs here...]

## Keywords
#LinearRegression #Classification #TrainingData
```

---

### Curriculum Data Model

**File:** `user-data/curricula/curriculum_[id].json`

```json
{
  "curriculum_id": "uuid-1234",
  "title": "Machine Learning Mastery",
  "created_at": "2025-02-07T10:00:00Z",
  "last_modified": "2025-02-07T15:00:00Z",
  "user_goal": "Learn machine learning from scratch",
  "items": [
    {
      "id": "1",
      "title": "Introduction to Machine Learning",
      "level": 0,
      "parent_id": null,
      "linked_page_id": null,
      "expanded": true,
      "searched_terms": []
    },
    {
      "id": "1.1",
      "title": "What is Machine Learning?",
      "level": 1,
      "parent_id": "1",
      "linked_page_id": "a1b2c3d4",
      "expanded": false,
      "searched_terms": ["neural networks", "algorithms"]
    }
  ]
}
```

---

### App State Model

**File:** `user-data/app-state.json`

```json
{
  "last_visited_page_id": "a1b2c3d4",
  "last_visited_curriculum_id": "uuid-1234",
  "current_scene": "Scene3_TopicPage",
  "focus_session": {
    "is_active": true,
    "mode": "focus",
    "time_remaining_seconds": 1432,
    "current_session": 2,
    "total_sessions": 3,
    "focus_duration_minutes": 25,
    "break_duration_minutes": 5,
    "started_at": "2025-02-07T14:00:00Z"
  },
  "preferences": {
    "markdown_preview": true,
    "theme": "light"
  }
}
```

---

### Graph State Model

**File:** `user-data/graph-state.json`

```json
{
  "nodes": [
    {
      "id": "a1b2c3d4",
      "position": { "x": 100, "y": 50, "z": 0 },
      "custom_color": "#3498db"
    }
  ],
  "connections": [
    {
      "source": "a1b2c3d4",
      "target": "e5f6g7h8",
      "type": "solid"
    }
  ],
  "suggested_connections": [
    {
      "source": "a1b2c3d4",
      "target": "x1y2z3a4",
      "type": "dotted",
      "reason": "Both topics relate to classification algorithms"
    }
  ]
}
```

---

## 8. API INTEGRATION

### Gemini API Integration

> Note: In a production web app, do not call provider APIs directly from the React client.
> Route LLM calls through your backend so API keys never ship to the browser.

**File:** `utils/geminiAPI.js`

**Setup:**
```javascript
import axios from 'axios';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

export async function generateContent(prompt, systemPrompt = '') {
  const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
  
  try {
    const response = await axios.post(
      `${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [{ text: fullPrompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048
        }
      }
    );
    
    return response.data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
}
```

**Use Cases:**

1. **Curriculum Generation:**
```javascript
const systemPrompt = `You are an expert curriculum designer. Generate a hierarchical learning curriculum for the given topic. Format as JSON array with fields: id (numbered like 1, 1.1, 1.1.1), title, level (0=top, 1=sub, 2=subsub), parent_id. Include 10-15 items ranging from beginner to advanced.`;

const curriculum = await generateContent(userInput, systemPrompt);
```

2. **Topic Definition:**
```javascript
const definition = await generateContent(
  `Provide a comprehensive, technically accurate definition of "${topic}" in 2-3 paragraphs. Target audience: intermediate learners.`
);
```

3. **Simple Explanation:**
```javascript
const simpleExplanation = await generateContent(
  `Explain "${topic}" in 2-3 sentences using everyday language and relatable analogies. Assume the reader has no technical background.`
);
```

4. **Search Query Generation:**
```javascript
const youtubeQuery = await generateContent(
  `Generate the optimal YouTube search query to find high-quality educational videos about "${topic}". Return only the search query text, no explanation.`
);
```

---

### OpenRouter API Integration (via backend proxy)

**Backend route:** `POST /api/openrouter/chat` (server-side call to `https://openrouter.ai/api/v1/chat/completions`)

**Server env (`.env`, gitignored):**
```bash
OPENROUTER_API_KEY=your_key_here
```

**Client usage (no API key in React):**
```js
// First call: request reasoning (OpenRouter-compatible)
let r1 = await fetch('/api/openrouter/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'openai/gpt-oss-120b:free',
    messages: [
      { role: 'user', content: "How many r's are in the word 'strawberry'?" },
    ],
    reasoning: { enabled: true },
  }),
});

const data1 = await r1.json();
const assistantMessage = data1.message; // includes reasoning_details when available

// Preserve the assistant message with reasoning_details (pass back unmodified)
const messages = [
  { role: 'user', content: "How many r's are in the word 'strawberry'?" },
  {
    role: 'assistant',
    content: assistantMessage.content,
    reasoning_details: assistantMessage.reasoning_details,
  },
  { role: 'user', content: 'Are you sure? Think carefully.' },
];

// Second call: continue from preserved reasoning_details
const r2 = await fetch('/api/openrouter/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'openai/gpt-oss-120b:free',
    messages,
  }),
});

const data2 = await r2.json();
console.log(data2.reply);
```

**Model swapping (just change `model`):**

- `openai/gpt-oss-20b:free`
- `google/gemma-3-4b-it:free`
- `google/gemma-3-12b-it:free`
- `google/gemma-3-27b-it:free`
- `tngtech/deepseek-r1t2-chimera:free`
- `deepseek/deepseek-r1-0528:free`
- `tngtech/deepseek-r1t-chimera:free`
- `nousresearch/hermes-3-llama-3.1-405b:free`
- `meta-llama/llama-3.2-3b-instruct:free`
- `meta-llama/llama-3.3-70b-instruct:free`
- `nvidia/nemotron-nano-12b-v2-vl:free`

---

### YouTube API Integration

**File:** `utils/youtubeAPI.js`

**Setup:**
```javascript
import axios from 'axios';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_SEARCH_ENDPOINT = 'https://www.googleapis.com/youtube/v3/search';

export async function searchVideos(query, maxResults = 5) {
  try {
    const response = await axios.get(YOUTUBE_SEARCH_ENDPOINT, {
      params: {
        part: 'snippet',
        q: query,
        type: 'video',
        maxResults: maxResults,
        key: YOUTUBE_API_KEY,
        videoDuration: 'medium',  // 4-20 minutes
        videoDefinition: 'high',
        relevanceLanguage: 'en',
        order: 'relevance'
      }
    });
    
    return response.data.items.map(item => ({
      video_id: item.id.videoId,
      title: item.snippet.title,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      thumbnail: item.snippet.thumbnails.medium.url,
      channel: item.snippet.channelTitle,
      published_at: item.snippet.publishedAt
    }));
  } catch (error) {
    console.error('YouTube API Error:', error);
    return [];
  }
}
```

**Embedding Videos:**
```jsx
<div className="video-container">
  {videos.map(video => (
    <iframe
      key={video.video_id}
      width="560"
      height="315"
      src={`https://www.youtube.com/embed/${video.video_id}`}
      title={video.title}
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  ))}
</div>
```

---

### Meme Scraping

**File:** `utils/memeScraper.js`

**Challenge:** Client-side web scraping has CORS limitations.

**Solutions:**

**Option 1: Electron Main Process Scraping**
```javascript
// In main process (main.js)
const axios = require('axios');
const cheerio = require('cheerio');

ipcMain.handle('scrape-memes', async (event, query) => {
  try {
    // Scrape from Imgur, Imgflip, or meme APIs
    const response = await axios.get(`https://www.reddit.com/r/ProgrammerHumor/search.json?q=${query}&limit=5`);
    
    const memes = response.data.data.children
      .filter(post => post.data.post_hint === 'image')
      .map(post => ({
        url: post.data.url,
        title: post.data.title,
        score: post.data.score
      }))
      .slice(0, 5);
    
    return memes;
  } catch (error) {
    console.error('Meme scraping error:', error);
    return [];
  }
});
```

```javascript
// In renderer process
const memes = await window.electron.ipcRenderer.invoke('scrape-memes', memeQuery);
```

**Option 2: Use Meme APIs**
- Imgflip API: https://imgflip.com/api
- Giphy API: https://developers.giphy.com/
- Reddit JSON API: https://www.reddit.com/r/[subreddit]/search.json

**Recommended Approach:**
```javascript
export async function searchMemes(query, maxResults = 5) {
  // Use Reddit's JSON API (no auth required for read-only)
  const subreddits = ['ProgrammerHumor', 'memes', 'EducationalMemes'];
  
  const allMemes = [];
  
  for (const subreddit of subreddits) {
    try {
      const response = await axios.get(
        `https://www.reddit.com/r/${subreddit}/search.json`,
        {
          params: {
            q: query,
            limit: 3,
            sort: 'relevance'
          }
        }
      );
      
      const memes = response.data.data.children
        .filter(post => post.data.post_hint === 'image')
        .map(post => ({
          url: post.data.url,
          title: post.data.title,
          score: post.data.score,
          subreddit: subreddit
        }));
      
      allMemes.push(...memes);
    } catch (error) {
      console.error(`Error scraping r/${subreddit}:`, error);
    }
  }
  
  // Sort by score and return top results
  return allMemes
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}
```

---

## 9. USER FLOW DIAGRAMS

### Primary User Journey

```
┌────────────────┐
│ Launch App     │
└───────┬────────┘
        │
        ▼
┌────────────────────────┐
│ Scene 0: Focus Setup   │
│ - Set focus: 25min     │
│ - Set break: 5min      │
│ - Sessions: 3          │
└───────┬────────────────┘
        │ Click "Start"
        ▼
┌────────────────────────┐
│ Scene 1: Main Hub      │
│ Timer starts: 25:00    │
└───────┬────────────────┘
        │ Enter "Machine Learning"
        ▼
┌────────────────────────┐
│ Gemini API Call        │
│ Generate curriculum    │
└───────┬────────────────┘
        │
        ▼
┌────────────────────────┐
│ Scene 2: Curriculum    │
│ - 1. Intro to ML       │
│   - 1.1 What is ML?    │
│   - 1.2 Types of ML    │
│ - 2. Preprocessing     │
└───────┬────────────────┘
        │ Select "What is ML?"
        ▼
┌────────────────────────┐
│ Show overlay:          │
│ "Search this topic?"   │
└───────┬────────────────┘
        │ Click "Yes"
        ▼
┌────────────────────────┐
│ Generate Topic Page    │
│ - Call Gemini (def)    │
│ - Call YouTube API     │
│ - Scrape memes         │
│ - Generate keywords    │
└───────┬────────────────┘
        │
        ▼
┌────────────────────────┐
│ Scene 3: Topic Page    │
│ "What is ML?"          │
│ - Definition           │
│ - 5 Videos             │
│ - Simple explanation   │
│ - 3 Memes              │
│ - Keywords             │
└───────┬────────────────┘
        │ Select "neural networks"
        ▼
┌────────────────────────┐
│ Create Child Node      │
│ Topic Page for         │
│ "Neural Networks"      │
└───────┬────────────────┘
        │
        ▼
┌────────────────────────┐
│ Timer hits 0:00        │
└───────┬────────────────┘
        │
        ▼
┌────────────────────────┐
│ Break Overlay (LOCK)   │
│ "Go touch grass!"      │
│ Countdown: 5:00        │
└───────┬────────────────┘
        │ Wait 5 minutes
        ▼
┌────────────────────────┐
│ Break ends             │
│ Resume Scene 3         │
│ Start Session 2        │
└────────────────────────┘
```

---

### Graph Interaction Flow

```
┌────────────────────────┐
│ Click Hamburger Menu   │
└───────┬────────────────┘
        │
        ▼
┌────────────────────────┐
│ Select "See graph"     │
└───────┬────────────────┘
        │
        ▼
┌────────────────────────┐
│ Load all pages from    │
│ user-data/pages/       │
└───────┬────────────────┘
        │
        ▼
┌────────────────────────┐
│ Build graph data:      │
│ - Nodes = pages        │
│ - Links = parent-child │
└───────┬────────────────┘
        │
        ▼
┌────────────────────────┐
│ Render 3D Graph        │
│ Auto-arrange hierarchy │
└───────┬────────────────┘
        │
        ├─ Hover node ────▶ Show tooltip
        │
        ├─ Click node ────▶ Navigate to page
        │
        └─ Drag node ─────▶ Reposition & save
        
        Click "Suggest Connections"
        │
        ▼
┌────────────────────────┐
│ Send all topics to     │
│ Gemini API             │
└───────┬────────────────┘
        │
        ▼
┌────────────────────────┐
│ Receive suggestions    │
│ Draw dotted lines      │
└────────────────────────┘
```

---

## 10. IMPLEMENTATION CHECKLIST

### Phase 1: Core Infrastructure (Week 1)

- [ ] Set up Electron + React boilerplate
- [ ] Create file structure (`src/`, `user-data/`, etc.)
- [ ] Implement file handling utilities
  - [ ] `readFile(path)`
  - [ ] `writeFile(path, content)`
  - [ ] `listFiles(directory)`
  - [ ] `deleteFile(path)`
- [ ] Set up local storage structure
  - [ ] Create `pages/` directory
  - [ ] Create `notes/` directory
  - [ ] Create `curricula/` directory
- [ ] Implement SHA-256 hash ID generator
- [ ] Create app state management (Context API or Redux)

### Phase 2: Scene 0 - Focus Setup (Week 1)

- [ ] Build `Scene0_FocusSetup.jsx`
- [ ] Create dropdown components for focus/break/sessions
- [ ] Add custom duration input fields
- [ ] Implement "Start Focus Session" button
- [ ] Save configuration to `app-state.json`
- [ ] Navigate to Scene 1 on start

### Phase 3: Scene 1 - Main Hub (Week 2)

- [ ] Build `Scene1_MainHub.jsx`
- [ ] Create search bar component
- [ ] Implement hamburger menu
- [ ] Build focus timer display component
- [ ] Create note overlay component
  - [ ] Text area with hashtag support
  - [ ] Save to `notes/` directory
- [ ] Implement "Continue" functionality (load last node)

### Phase 4: Timer & Break System (Week 2)

- [ ] Build `FocusTimer` component
  - [ ] Countdown logic
  - [ ] Switch between focus/break modes
  - [ ] Session tracking (1/3, 2/3, etc.)
- [ ] Build `BreakOverlay` component
  - [ ] Full screen lock implementation
  - [ ] Load 30 random activity messages
  - [ ] Display countdown timer
  - [ ] Auto-resume after break
- [ ] Implement timer persistence
  - [ ] Save timer state on interval
  - [ ] Restore on app relaunch
  - [ ] Handle app close during session

### Phase 5: LLM Integration (Week 3)

- [ ] Set up Gemini API wrapper (`geminiAPI.js`)
- [ ] Create system prompts library
  - [ ] Curriculum generation prompt
  - [ ] Definition generation prompt
  - [ ] Simple explanation prompt
  - [ ] Search query generation prompt
  - [ ] Keyword extraction prompt
- [ ] Test API calls with sample inputs
- [ ] Implement error handling and retries
- [ ] Add loading states for API calls

### Phase 6: Scene 2 - Curriculum View (Week 3)

- [ ] Build `Scene2_Curriculum.jsx`
- [ ] Create curriculum tree component
  - [ ] Expand/collapse functionality
  - [ ] Hierarchical numbering (1, 1.1, 1.1.1)
- [ ] Implement curriculum generation flow
  - [ ] Call Gemini API with user goal
  - [ ] Parse JSON response
  - [ ] Save to `curricula/` directory
  - [ ] Render tree structure
- [ ] Add text selection overlay
  - [ ] Detect text selection
  - [ ] Show "Search this?" prompt
  - [ ] Create topic page on confirmation
- [ ] Implement edit mode
  - [ ] Add new items
  - [ ] Delete items
  - [ ] Reorder items
  - [ ] Regenerate sections
- [ ] Add underline styling for searched terms
- [ ] Implement hover preview tooltips

### Phase 7: Topic Page Generation (Week 4)

- [ ] Build topic page content generator
  - [ ] Call Gemini for definition
  - [ ] Call Gemini for simple explanation
  - [ ] Call Gemini for keywords
  - [ ] Call Gemini for YouTube search query
  - [ ] Call Gemini for meme search query
- [ ] Compile markdown from all sections
- [ ] Add metadata to markdown frontmatter
- [ ] Save to `pages/[page_id].md`
- [ ] Handle SHA-256 collisions
  - [ ] Check if page exists
  - [ ] Prompt: "Link or Create New?"
  - [ ] Link to existing if chosen

### Phase 8: YouTube Integration (Week 4)

- [ ] Set up YouTube Data API
- [ ] Create `youtubeAPI.js` wrapper
- [ ] Implement video search
  - [ ] Use LLM-generated query
  - [ ] Fetch top 5 results
  - [ ] Extract: title, URL, thumbnail
- [ ] Add video embeds to topic pages
- [ ] Handle API errors gracefully

### Phase 9: Meme Scraping (Week 5)

- [ ] Research meme scraping options
  - [ ] Reddit JSON API
  - [ ] Imgflip API
  - [ ] Giphy API
- [ ] Implement `memeScraper.js`
- [ ] Create Electron IPC handler for scraping
- [ ] Fetch top 5 meme images
- [ ] Display memes in topic pages
- [ ] Add fallback if scraping fails

### Phase 10: Scene 3 - Topic Page View (Week 5)

- [ ] Build `Scene3_TopicPage.jsx`
- [ ] Implement markdown renderer
  - [ ] Use `react-markdown` library
  - [ ] Support images, links, headings
- [ ] Add "Raw Markdown" toggle
- [ ] Implement text selection for child nodes
- [ ] Add underline styling for linked terms
- [ ] Create hover preview tooltips
- [ ] Add breadcrumb navigation
- [ ] Implement back button

### Phase 11: Graph Visualization (Week 6)

- [ ] Choose 3D graph library (React Force Graph 3D)
- [ ] Build `GraphVisualization.jsx`
- [ ] Load all pages and build graph data
  - [ ] Nodes from `pages/` metadata
  - [ ] Links from parent-child relationships
- [ ] Implement graph interactions
  - [ ] Hover: Show tooltip
  - [ ] Click: Navigate to page
  - [ ] Drag: Reposition node
- [ ] Save node positions to `graph-state.json`
- [ ] Add "Suggest Connections" feature
  - [ ] Call Gemini with all topics
  - [ ] Parse relationship suggestions
  - [ ] Draw dotted lines
- [ ] Add color coding by curriculum

### Phase 12: Additional Features (Week 7)

- [ ] Implement embedded Google search
  - [ ] Iframe integration
  - [ ] Open via hamburger menu
- [ ] Create split-screen comparison
  - [ ] Search for node to compare
  - [ ] Display two pages side-by-side
- [ ] Add session history logging
  - [ ] Track node creation/deletion
  - [ ] Track navigation patterns
  - [ ] Save to `session-history.json`
- [ ] Implement multiple curricula support
  - [ ] Dropdown selector
  - [ ] Switch between curricula
  - [ ] Color-code in graph

### Phase 13: Polish & Testing (Week 8)

- [ ] Add loading indicators for API calls
- [ ] Implement error messages for failed operations
- [ ] Add confirmation dialogs for destructive actions
- [ ] Test full user journey end-to-end
- [ ] Test timer persistence across app restarts
- [ ] Test SHA-256 collision handling
- [ ] Optimize graph performance for 100+ nodes
- [ ] Add keyboard shortcuts
  - [ ] Ctrl+N: New note
  - [ ] Ctrl+G: Open graph
  - [ ] Ctrl+F: Search
- [ ] Create onboarding tutorial (optional)

---

## CRITICAL IMPLEMENTATION NOTES

### 1. File Handling Best Practices

**Always use absolute paths:**
```javascript
const { app } = require('electron');
const path = require('path');

const USER_DATA_DIR = path.join(app.getPath('userData'), 'user-data');
const PAGES_DIR = path.join(USER_DATA_DIR, 'pages');
```

**Ensure directories exist:**
```javascript
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}
```

---

### 2. SHA-256 Collision Handling

**Generate ID:**
```javascript
import CryptoJS from 'crypto-js';

function generatePageId(topic) {
  const trimmedTopic = topic.trim();  // Remove whitespace
  const hash = CryptoJS.SHA256(trimmedTopic).toString();
  return hash.substring(0, 8);  // First 8 characters
}
```

**Check for collisions:**
```javascript
function pageExists(pageId) {
  const filepath = path.join(PAGES_DIR, `${pageId}.md`);
  return fs.existsSync(filepath);
}
```

**Handle collision:**
```javascript
async function handleTextSelection(selectedText) {
  const pageId = generatePageId(selectedText);
  
  if (pageExists(pageId)) {
    const choice = await showDialog({
      title: 'Topic Already Exists',
      message: `A page for "${selectedText}" already exists. What would you like to do?`,
      buttons: ['Link to Existing', 'Create New Anyway', 'Cancel']
    });
    
    if (choice === 0) {
      // Link to existing page
      linkPage(currentPageId, pageId);
      navigateToPage(pageId);
    } else if (choice === 1) {
      // Force create new page with modified topic name
      const newTopic = `${selectedText} (${Date.now()})`;
      const newPageId = generatePageId(newTopic);
      await createTopicPage(newTopic, newPageId);
    }
  } else {
    // No collision, create new page
    await createTopicPage(selectedText, pageId);
  }
}
```

---

### 3. Timer Persistence

**Save state every second:**
```javascript
useEffect(() => {
  const interval = setInterval(() => {
    saveTimerState({
      mode: mode,
      timeRemaining: timeRemaining,
      currentSession: currentSession,
      totalSessions: totalSessions,
      startedAt: startedAt
    });
  }, 1000);
  
  return () => clearInterval(interval);
}, [timeRemaining, mode, currentSession]);
```

**Restore on app launch:**
```javascript
useEffect(() => {
  const savedState = loadTimerState();
  
  if (savedState && savedState.isActive) {
    const elapsed = Math.floor((Date.now() - new Date(savedState.startedAt).getTime()) / 1000);
    const remaining = Math.max(0, savedState.timeRemaining - elapsed);
    
    setMode(savedState.mode);
    setTimeRemaining(remaining);
    setCurrentSession(savedState.currentSession);
    setTotalSessions(savedState.totalSessions);
    
    if (remaining === 0) {
      // Session ended while app was closed
      handleSessionEnd();
    }
  }
}, []);
```

---

### 4. Break Screen Enforcement

**Prevent all exits during break:**
```javascript
// In Electron main process
let breakWindow;

function startBreak(duration) {
  breakWindow = new BrowserWindow({
    fullscreen: true,
    alwaysOnTop: true,
    frame: false,
    closable: false,  // Prevent closing
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  
  breakWindow.loadURL('break-overlay.html');
  
  // Prevent Alt+F4, Cmd+Q, etc.
  breakWindow.on('close', (e) => {
    e.preventDefault();
    return false;
  });
  
  // Auto-close after duration
  setTimeout(() => {
    breakWindow.close();
    breakWindow = null;
  }, duration * 1000);
}
```

**Disable keyboard shortcuts:**
```javascript
// In break overlay renderer
useEffect(() => {
  const handleKeyDown = (e) => {
    // Prevent all keyboard shortcuts
    e.preventDefault();
    e.stopPropagation();
    return false;
  };
  
  document.addEventListener('keydown', handleKeyDown, true);
  
  return () => {
    document.removeEventListener('keydown', handleKeyDown, true);
  };
}, []);
```

---

### 5. Markdown Rendering Security

**Sanitize user input:**
```javascript
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  components={{
    // Prevent script injection
    script: () => null,
    // Open links in new window
    a: ({ node, ...props }) => (
      <a {...props} target="_blank" rel="noopener noreferrer" />
    )
  }}
>
  {markdownContent}
</ReactMarkdown>
```

---

### 6. API Error Handling

**Retry logic:**
```javascript
async function callGeminiWithRetry(prompt, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await generateContent(prompt);
      return response;
    } catch (error) {
      if (i === maxRetries - 1) {
        throw new Error(`Gemini API failed after ${maxRetries} attempts: ${error.message}`);
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
}
```

**Fallback content:**
```javascript
async function generateTopicPage(topic) {
  try {
    const definition = await callGeminiWithRetry(`Define "${topic}"`);
    // ... rest of generation
  } catch (error) {
    console.error('Failed to generate topic page:', error);
    
    // Fallback: Create basic page
    return createFallbackPage(topic);
  }
}

function createFallbackPage(topic) {
  return `# ${topic}

## Definition
Unable to generate content. Please check your internet connection and try again.

## Keywords
#${topic.replace(/\s+/g, '')}
`;
}
```

---

## ENVIRONMENT SETUP

### Required API Keys

Create a `.env` file:
```
GEMINI_API_KEY=your_gemini_api_key_here
YOUTUBE_API_KEY=your_youtube_api_key_here
```

### Get API Keys:

1. **Gemini API:**
   - Visit: https://makersuite.google.com/app/apikey
   - Create new project
   - Generate API key

2. **YouTube Data API:**
   - Visit: https://console.cloud.google.com/
   - Enable YouTube Data API v3
   - Create credentials → API key

---

## SYSTEM PROMPTS LIBRARY

**File:** `assets/system-prompts.json`

```json
{
  "curriculum_generation": "You are an expert curriculum designer. Generate a hierarchical learning curriculum for the given topic. Structure it from beginner to advanced levels. Format as JSON array with fields: id (numbered like 1, 1.1, 1.1.1), title, level (0=main, 1=sub, 2=subsub), parent_id. Include 10-15 items. Be specific and practical.",
  
  "definition_generation": "Provide a comprehensive, technically accurate definition of the given topic in 2-3 paragraphs. Target audience: intermediate learners who have basic background knowledge. Be precise and include key concepts.",
  
  "simple_explanation": "Explain the given topic in 2-3 sentences using everyday language and relatable analogies. Assume the reader has no technical background. Make it memorable and easy to understand.",
  
  "youtube_query": "Generate the optimal YouTube search query to find high-quality educational videos about the given topic. Return only the search query text, no explanation. Focus on tutorial and educational content.",
  
  "meme_query": "Generate a search query to find humorous memes related to the given topic. Focus on educational memes, programming humor, or relatable learning experiences. Return only the query text.",
  
  "keyword_extraction": "List 5-8 key technical terms and related concepts for the given topic. Format each as a hashtag. These should be terms a learner would need to understand to master this topic.",
  
  "connection_suggestions": "Given a list of learning topics, suggest 5-10 meaningful connections between topics that would help a learner understand relationships. Return as JSON array: [{ 'from': 'topic name', 'to': 'topic name', 'reason': 'why they are related' }]. Focus on conceptual links, prerequisite relationships, and practical applications."
}
```

---

## SAMPLE BREAK MESSAGES

**File:** `assets/break-messages.json`

```json
[
  "Go touch some grass, literally 🌱",
  "Drink a full glass of water 💧",
  "Do 10 push-ups 💪",
  "Stretch your arms above your head for 30 seconds 🙆",
  "Walk around your room for 2 minutes 🚶",
  "Look at something 20 feet away for 20 seconds 👀",
  "Do 15 jumping jacks",
  "Stand up and sit down 10 times",
  "Roll your shoulders backward 10 times",
  "Take 5 deep breaths 🧘",
  "Go pet your dog or cat 🐕🐈",
  "Look out a window at nature 🪟",
  "Do a 1-minute plank",
  "Shake out your hands and wrists",
  "Do 10 squats",
  "Massage your temples gently",
  "March in place for 1 minute",
  "Stretch your neck in all directions",
  "Touch your toes 10 times",
  "Close your eyes and rest them",
  "Tidy one small area of your desk",
  "Do wrist circles in both directions",
  "Strike your best superhero pose 🦸",
  "Do 10 lunges (5 each leg)",
  "Wiggle all your fingers and toes",
  "Balance on one foot for 30 seconds",
  "Do arm circles - forward and backward",
  "Give yourself a shoulder massage",
  "Do 5 burpees (if feeling ambitious)",
  "Walk to another room and back 🚶‍♀️"
]
```

---

## TESTING SCENARIOS

### Scenario 1: Complete First Session
1. Launch app
2. Set focus: 1 min (demo), break: 1 min (demo), sessions: 1
3. Click "Start Focus Session"
4. Enter learning goal: "React Hooks"
5. Wait for curriculum generation
6. Select "useState" from curriculum
7. Confirm search
8. Wait for topic page generation
9. Select text "state management"
10. Create child node
11. Wait for timer to hit 0:00
12. Verify break overlay appears
13. Wait 1 minute
14. Verify return to topic page

### Scenario 2: Graph Visualization
1. Create 5+ topic pages
2. Open hamburger menu
3. Select "See understanding graph"
4. Verify all nodes appear
5. Hover over node → Verify tooltip
6. Click node → Verify navigation
7. Drag node → Verify position saves
8. Click "Suggest Connections"
9. Verify dotted lines appear

### Scenario 3: Timer Persistence
1. Start focus session (5 min)
2. Create topic page
3. Close app after 2 minutes
4. Reopen app
5. Verify timer shows ~3 minutes remaining
6. Verify on correct page

### Scenario 4: Note Taking
1. Open hamburger menu
2. Select "Note it down"
3. Type: "Remember to review #react #hooks"
4. Save note
5. Verify file exists in `notes/` directory
6. Verify hashtags extracted

---

## SUCCESS METRICS

The prototype is complete when:

- ✅ All 4 scenes render and navigate correctly
- ✅ Focus/break timer enforces sessions without bypass
- ✅ LLM generates curricula, definitions, and explanations
- ✅ YouTube videos appear in topic pages
- ✅ Memes display in topic pages (or graceful fallback)
- ✅ Text selection creates child nodes correctly
- ✅ SHA-256 collision detection works
- ✅ Graph displays all nodes and connections
- ✅ Potential connections feature suggests links
- ✅ Markdown preview toggles correctly
- ✅ Notes save with hashtag organization
- ✅ App state persists across restarts
- ✅ Timer continues when app closed
- ✅ Break overlay locks screen completely

---

## FUTURE ENHANCEMENTS (V2)

- Cloud sync for multi-device access
- Industry trend updates for curricula
- Spaced repetition flashcards
- Progress tracking and analytics
- Collaborative learning (share graphs)
- AI tutor chat interface
- Export curricula as PDF/DOCX
- Mobile companion app
- Gamification (XP, achievements)
- Integration with note-taking apps

---

## CONCLUSION

This specification provides complete implementation details for an AI-powered adaptive learning desktop application. Follow the implementation checklist sequentially, starting with core infrastructure and building up to advanced features.

**Key Focus Areas:**
1. Robust file handling and state persistence
2. Seamless LLM integration with error handling
3. Enforced focus/break system with no bypass
4. Recursive topic exploration with parent-child relationships
5. Interactive 3D knowledge graph

**Next Steps:**
1. Set up development environment
2. Obtain API keys (Gemini + YouTube)
3. Create Electron + React boilerplate
4. Begin Phase 1 implementation

---

**Document Version:** 1.0  
**Last Updated:** 2025-02-07  
**Target Completion:** 8 weeks (prototype)
