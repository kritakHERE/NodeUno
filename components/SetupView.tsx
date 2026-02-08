import React, { useState, useEffect } from "react";
import { ModelProvider, ApiKeys, SkillLevel, AcademicLevel } from "../types";
import { MODEL_OPTIONS, SKILL_LEVELS, ACADEMIC_LEVELS } from "../constants";

interface SetupViewProps {
  onStart: (
    focus: number,
    breakM: number,
    sessions: number,
    provider: ModelProvider,
    modelId: string,
    keys: ApiKeys,
    skillLevel: SkillLevel,
    academicLevel: AcademicLevel,
    useAcademic: boolean,
    dynamicLevel: boolean,
  ) => void;
  initialProvider: ModelProvider;
  initialKeys?: ApiKeys;
  initialSkillLevel?: SkillLevel;
  initialAcademicLevel?: AcademicLevel;
  initialUseAcademic?: boolean;
  initialDynamic?: boolean;
}

const SetupView: React.FC<SetupViewProps> = ({
  onStart,
  initialProvider,
  initialKeys = {},
  initialSkillLevel = "Intermediate",
  initialAcademicLevel = "Undergraduate",
  initialUseAcademic = false,
  initialDynamic = false,
}) => {
  const [focus, setFocus] = useState(25);
  const [breakM, setBreakM] = useState(5);
  const [sessions, setSessions] = useState(1);
  const [provider, setProvider] = useState<ModelProvider>(initialProvider);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [keys, setKeys] = useState<ApiKeys>(initialKeys);
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [skillLevel, setSkillLevel] = useState<SkillLevel>(initialSkillLevel);
  const [academicLevel, setAcademicLevel] =
    useState<AcademicLevel>(initialAcademicLevel);
  const [useAcademic, setUseAcademic] = useState(initialUseAcademic);
  const [dynamicLevel, setDynamicLevel] = useState<boolean>(initialDynamic);

  useEffect(() => {
    const options = MODEL_OPTIONS[provider];
    if (options && options.length > 0) setSelectedModel(options[0].id);
  }, [provider]);

  const updateKey = (p: keyof ApiKeys, val: string) =>
    setKeys((prev) => ({ ...prev, [p]: val }));

  const getKeyPlaceholder = (p: ModelProvider) => {
    if (p === "groq" || p === "openrouter")
      return "Optional (uses backend if configured)";
    if (p === "openai") return "Required for OpenAI";
    return "Optional";
  };

  const providers: {
    id: ModelProvider;
    label: string;
    icon: string;
    color: string;
    desc: string;
  }[] = [
    {
      id: "gemini",
      label: "Gemini 2.0",
      icon: "fa-gem",
      color: "blue",
      desc: "Multimodal, Google powered.",
    },
    {
      id: "cerebras",
      label: "Cerebras",
      icon: "fa-microchip",
      color: "pink",
      desc: "Instant inference speed.",
    },
    {
      id: "groq",
      label: "Groq (Llama)",
      icon: "fa-bolt",
      color: "orange",
      desc: "Ultra-fast inference.",
    },
    {
      id: "openai",
      label: "OpenAI",
      icon: "fa-robot",
      color: "green",
      desc: "GPT-4o Mini (Requires Key).",
    },
    {
      id: "openrouter",
      label: "OpenRouter",
      icon: "fa-network-wired",
      color: "purple",
      desc: "Free Tier Included.",
    },
  ];

  const currentModelOptions = MODEL_OPTIONS[provider];

  return (
    <div className="max-w-2xl mx-auto mt-20 flex flex-col items-center pb-20">
      <div className="mb-12 text-center">
        <h1 className="text-5xl font-black mb-4 tracking-tighter bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          MindMap AI
        </h1>
        <p className="text-neutral-400 font-medium">
          Configure your adaptive learning environment.
        </p>
      </div>

      <div className="w-full glass rounded-3xl p-8 flex flex-col gap-8 border border-white/5">
        {/* Provider Selection */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
              AI Brain Provider
            </label>
            <button
              onClick={() => setShowKeyConfig(!showKeyConfig)}
              className="text-[10px] font-bold text-blue-400 hover:text-white uppercase tracking-widest flex items-center gap-2"
            >
              <i className="fa-solid fa-key"></i>{" "}
              {showKeyConfig ? "Hide Keys" : "Configure Keys"}
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {providers.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setProvider(p.id);
                }}
                className={`flex flex-col items-center py-4 rounded-xl transition-all border relative overflow-hidden ${provider === p.id ? `bg-${p.color}-600/20 border-${p.color}-500 text-white shadow-lg` : "bg-neutral-900 border-white/5 text-neutral-500 hover:text-neutral-300 hover:bg-white/5"}`}
              >
                <i
                  className={`fa-solid ${p.icon} text-xl mb-2 ${provider === p.id ? `text-${p.color}-400` : ""}`}
                ></i>
                <span className="font-black text-[10px] tracking-widest uppercase">
                  {p.label}
                </span>
                <div
                  className={`absolute top-2 right-2 w-2 h-2 rounded-full ${keys[p.id as keyof ApiKeys] ? "bg-green-500" : "bg-neutral-700"}`}
                />
              </button>
            ))}
          </div>
          {currentModelOptions && (
            <div className="mt-2 animate-in fade-in slide-in-from-top-1">
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-neutral-300 outline-none focus:border-blue-500"
              >
                {currentModelOptions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          {showKeyConfig && (
            <div className="mt-4 p-6 rounded-2xl bg-neutral-900/50 border border-white/10 animate-in fade-in slide-in-from-top-2">
              <h3 className="text-sm font-bold text-neutral-300 mb-4 flex items-center gap-2">
                <i className="fa-solid fa-lock"></i> API Key Configuration
              </h3>
              <div className="space-y-4">
                {providers.map((p) => (
                  <div key={`key-${p.id}`} className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase">
                      {p.label} Key
                    </label>
                    <input
                      type="password"
                      value={keys[p.id as keyof ApiKeys] || ""}
                      onChange={(e) =>
                        updateKey(p.id as keyof ApiKeys, e.target.value)
                      }
                      placeholder={getKeyPlaceholder(p.id)}
                      className="w-full bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white focus:border-blue-500 outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Focus Configuration */}
        <div className="flex flex-col gap-3">
          <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest px-1">
            Focus Session Settings
          </label>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-neutral-900 border border-white/5 p-4 rounded-xl flex flex-col items-center">
              <span className="text-2xl font-black text-white">{focus}m</span>
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                Focus
              </span>
              <input
                type="range"
                min="15"
                max="60"
                step="5"
                value={focus}
                onChange={(e) => setFocus(Number(e.target.value))}
                className="w-full mt-3 accent-blue-500"
              />
            </div>
            <div className="bg-neutral-900 border border-white/5 p-4 rounded-xl flex flex-col items-center">
              <span className="text-2xl font-black text-white">{breakM}m</span>
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                Break
              </span>
              <input
                type="range"
                min="5"
                max="30"
                step="5"
                value={breakM}
                onChange={(e) => setBreakM(Number(e.target.value))}
                className="w-full mt-3 accent-green-500"
              />
            </div>
            <div className="bg-neutral-900 border border-white/5 p-4 rounded-xl flex flex-col items-center">
              <span className="text-2xl font-black text-white">{sessions}</span>
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                Rounds
              </span>
              <input
                type="range"
                min="1"
                max="8"
                step="1"
                value={sessions}
                onChange={(e) => setSessions(Number(e.target.value))}
                className="w-full mt-3 accent-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Skill Level Selection */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
              Base Skill Level
            </label>
            <button
              onClick={() => setUseAcademic(!useAcademic)}
              className="text-[10px] font-bold text-purple-400 hover:text-white uppercase tracking-widest"
            >
              {useAcademic
                ? "Switch to Basic Levels"
                : "Switch to Academic Levels"}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {(useAcademic ? ACADEMIC_LEVELS : SKILL_LEVELS).map((level) => (
              <button
                key={level}
                onClick={() =>
                  useAcademic
                    ? setAcademicLevel(level as AcademicLevel)
                    : setSkillLevel(level as SkillLevel)
                }
                className={`py-3 rounded-xl text-xs font-bold uppercase tracking-wide border transition-all ${
                  (useAcademic ? academicLevel === level : skillLevel === level)
                    ? "bg-purple-600/20 border-purple-500 text-purple-400"
                    : "bg-neutral-900 border-white/5 text-neutral-500 hover:text-white"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
          <div
            className="flex items-center gap-3 mt-2 px-1 cursor-pointer"
            onClick={() => setDynamicLevel(!dynamicLevel)}
          >
            <div
              className={`w-10 h-6 rounded-full p-1 transition-colors ${dynamicLevel ? "bg-green-500" : "bg-neutral-800"}`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${dynamicLevel ? "translate-x-4" : ""}`}
              />
            </div>
            <span className="text-sm font-bold text-neutral-400 select-none">
              Dynamic Skill Level (Ask me every time)
            </span>
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={() =>
            onStart(
              focus,
              breakM,
              sessions,
              provider,
              selectedModel,
              keys,
              skillLevel,
              academicLevel,
              useAcademic,
              dynamicLevel,
            )
          }
          className={`mt-4 w-full py-5 rounded-2xl font-black text-xl tracking-tight transition-all shadow-lg active:scale-[0.98] ${
            provider === "openai" && !keys.openai
              ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20"
          }`}
          disabled={provider === "openai" && !keys.openai}
        >
          {provider === "openai" && !keys.openai
            ? "Enter API Key to Start"
            : "Start Focus Session"}
        </button>
      </div>
    </div>
  );
};

export default SetupView;
