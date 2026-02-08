export type AppScene = 'setup' | 'hub' | 'curriculum' | 'topic' | 'graph';
export type ModelProvider = 'gemini' | 'groq' | 'openai' | 'openrouter' | 'cerebras';
export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
export type AcademicLevel = 'Kindergarten' | 'Elementary' | 'High School' | 'Undergraduate' | 'Graduate' | 'PhD' | 'Professional';

export interface ApiKeys {
  gemini?: string;
  groq?: string;
  openai?: string;
  openrouter?: string;
  cerebras?: string;
}

export interface CurriculumItem {
  id: string;
  label: string;
  level: string; // e.g. "1.1"
  description?: string;
  children?: CurriculumItem[];
  hasBeenSearched?: boolean;
}

export interface ResourceLink {
  title: string;
  uri: string;
}

export interface TopicPage {
  id: string;
  parentId: string | null;
  title: string;
  // Core Content (Always generated first)
  definition: string;
  rawMarkdown: string; // Legacy/Fallback
  coreMarkdown?: string; // The short version
  deepDiveMarkdown?: string; // The long version
  
  // Lazy Loaded Content (Optional)
  simpleExplanation?: string; // "Essentials"
  significance?: string; // "Why it matters"
  context?: string; // "Background/History"
  
  youtubeVideos?: ResourceLink[];
  images?: ResourceLink[]; // Relevant static images/diagrams
  keywords: string[];
  timestamp: number;
  trends?: ResourceLink[];
  searchQueries?: string[]; 
  
  currentDefinition?: { word: string; text: string; source?: string }; 
  isDetailed?: boolean; 
  skillLevel?: SkillLevel | AcademicLevel; 
}

export interface Note {
  id: string;
  content: string;
  hashtags: string[];
  timestamp: number;
}

export interface PendingTask {
  id: string;
  name: string;
  type: 'topic' | 'curriculum' | 'trends' | 'definition' | 'expand_curriculum' | 'expand_content' | 'connect_nodes' | 'more_queries' | 'upgrade_curriculum' | 'load_essentials' | 'load_significance' | 'load_context' | 'load_youtube' | 'load_images';
}

export interface SavedCurriculum {
  id: string;
  goal: string;
  timestamp: number;
  items: CurriculumItem[];
  skillLevel: SkillLevel | AcademicLevel;
}

export interface AppState {
  currentScene: AppScene;
  modelProvider: ModelProvider;
  selectedModelId: string;
  apiKeys: ApiKeys;
  learningGoal: string;
  
  // Skill Logic
  skillLevel: SkillLevel; 
  academicLevel: AcademicLevel;
  useAcademicLevel: boolean; // Toggle between simple and academic
  dynamicSkillLevel: boolean;

  curriculum: CurriculumItem[];
  savedCurriculums: SavedCurriculum[];
  topicPages: Record<string, TopicPage>;
  notes: Note[];
  selectedTopicId: string | null;
  
  // Navigation History
  history: string[]; 
  
  // Background processing
  pendingTasks: Record<string, PendingTask>;
  searchErrors: Record<string, string>;

  // Focus logic
  focusMinutes: number;
  breakMinutes: number;
  totalSessions: number;
  currentSession: number;
  isFocusMode: boolean;
  isPaused: boolean;
  timeLeft: number;
  isOverlayActive: boolean;
  
  // Layout
  isSidebarCollapsed: boolean;
}