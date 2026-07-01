import React from "react";
import { CheckCircle, AlertTriangle } from "lucide-react";
import type { Student } from "../../services/db";
import type { GeneratedGameResponse } from "../../services/gemini";
import Sandbox from "../Sandbox";

const THEME_PRESETS = {
  space: {
    name: "Space Voyage 🌌",
    prompt: "Use space travel theme, include colorful floating planets, count visual stars, astronaut guidance."
  },
  ocean: {
    name: "Deep Sea 🐠",
    prompt: "Deep sea background with colorful fish swimming, pop oxygen bubbles to count, submarine guidance."
  },
  dino: {
    name: "Dino World 🦖",
    prompt: "Dinosaur footprints and jungle theme, match correct counts to feed food to a happy baby T-Rex."
  },
  candy: {
    name: "Candy Land 🍬",
    prompt: "Delicious sweet candies and cupcakes theme, stack sweets or pop candy drops to answer math challenges."
  },
  custom: {
    name: "Custom Theme 🪄",
    prompt: ""
  }
};

interface TabStudioProps {
  editingGameId: string | null;
  geminiApiKey: string;
  handleCancelEdit: () => void;
  assignedStudentId: string;
  setAssignedStudentId: (val: string) => void;
  students: Student[];
  topic: string;
  setTopic: (val: string) => void;
  selectedClasses: string[];
  setSelectedClasses: React.Dispatch<React.SetStateAction<string[]>>;
  difficulty: "Easy" | "Medium" | "Hard";
  setDifficulty: (val: "Easy" | "Medium" | "Hard") => void;
  rounds: number | "infinite";
  setRounds: (val: number | "infinite") => void;
  aiTheme: "space" | "ocean" | "dino" | "candy" | "custom";
  handleThemeChange: (theme: any) => void;
  gameInstruction: string;
  setGameInstruction: (val: string) => void;
  handleAppendInstruction: (val: string) => void;
  includeSound: boolean;
  setIncludeSound: (val: boolean) => void;
  dyslexiaTypography: boolean;
  setDyslexiaTypography: (val: boolean) => void;
  handleGenerate: () => void;
  isGenerating: boolean;
  generationError: string;
  generatedGame: GeneratedGameResponse | null;
  handleTitleChange: (val: string) => void;
  codeEditMode: boolean;
  setCodeEditMode: (val: boolean) => void;
  handleSaveAsDraft: () => void;
  handlePublish: () => void;
  draftCode: string;
  setDraftCode: (val: string) => void;
  handleClearHtml: () => void;
  tweakInstruction: string;
  setTweakInstruction: (val: string) => void;
  handleRegenerate: () => void;
}

export const TabStudio: React.FC<TabStudioProps> = ({
  editingGameId,
  geminiApiKey,
  handleCancelEdit,
  assignedStudentId,
  setAssignedStudentId,
  students,
  topic,
  setTopic,
  selectedClasses,
  setSelectedClasses,
  difficulty,
  setDifficulty,
  rounds,
  setRounds,
  aiTheme,
  handleThemeChange,
  gameInstruction,
  setGameInstruction,
  handleAppendInstruction,
  includeSound,
  setIncludeSound,
  dyslexiaTypography,
  setDyslexiaTypography,
  handleGenerate,
  isGenerating,
  generationError,
  generatedGame,
  handleTitleChange,
  codeEditMode,
  setCodeEditMode,
  handleSaveAsDraft,
  handlePublish,
  draftCode,
  setDraftCode,
  handleClearHtml,
  tweakInstruction,
  setTweakInstruction,
  handleRegenerate
}) => {
  return (
    <div className="play-card" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      
      {/* Sparkling AI Header Banner */}
      <div className="ai-studio-header">
        <div>
          <h3 style={{ fontSize: "1.3rem", color: "#fff", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
            🪄 Gemini AI Studio
          </h3>
          <p style={{ fontSize: "0.85rem", color: "rgba(255, 255, 255, 0.9)", marginTop: "6px", marginBottom: "0px" }}>
            {editingGameId 
              ? "Modify and re-generate existing game details." 
              : (geminiApiKey && geminiApiKey.trim().length > 0
                  ? "Co-create visual, dyslexia-accessible arithmetic activities using Gemini AI." 
                  : "No API key saved. Creating a game will compile a simulated Balloon Counting template activity.")
            }
          </p>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              borderRadius: "12px",
              fontSize: "0.75rem",
              fontWeight: "800",
              marginTop: "10px",
              backgroundColor: (geminiApiKey && geminiApiKey.trim().length > 0) ? "rgba(16, 185, 129, 0.25)" : "rgba(245, 158, 11, 0.25)",
              color: (geminiApiKey && geminiApiKey.trim().length > 0) ? "#34d399" : "#fbbf24",
              border: "1px solid",
              borderColor: (geminiApiKey && geminiApiKey.trim().length > 0) ? "rgba(16, 185, 129, 0.4)" : "rgba(245, 158, 11, 0.4)"
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: (geminiApiKey && geminiApiKey.trim().length > 0) ? "#10b981" : "#fbbf24",
                display: "inline-block"
              }}
            />
            {(geminiApiKey && geminiApiKey.trim().length > 0) ? "Gemini Connected (Live Mode)" : "Using Mock Mode (No API Key)"}
          </div>
        </div>
        {editingGameId && (
          <button
            onClick={handleCancelEdit}
            className="btn"
            style={{
              padding: "8px 14px",
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              border: "1.5px solid rgba(255, 255, 255, 0.4)",
              color: "#fff",
              borderRadius: "10px",
              fontSize: "0.8rem",
              boxShadow: "none"
            }}
          >
            Cancel Edit
          </button>
        )}
      </div>

      {/* AI Setup options Grid */}
      <div className="admin-form-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label htmlFor="student-selector-studio" style={{ fontWeight: "700", fontSize: "0.9rem" }}>Select Student</label>
          <select
            id="student-selector-studio"
            value={assignedStudentId}
            onChange={e => setAssignedStudentId(e.target.value)}
            style={{ padding: "12px", borderRadius: "10px", border: "2px solid #cbd5e1" }}
          >
            <option value="">All Students (General Publish)</option>
            {students.map(std => (
              <option key={std.id} value={std.id}>
                {std.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label htmlFor="topic-input-studio" style={{ fontWeight: "700", fontSize: "0.9rem" }}>Select Topic</label>
          <input
            id="topic-input-studio"
            type="text"
            placeholder="e.g. Addition, Subtraction, Counting"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            style={{ padding: "12px", borderRadius: "10px", border: "2px solid #cbd5e1" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontWeight: "700", fontSize: "0.9rem" }}>Target Classes / Grades</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "4px", backgroundColor: "#fff", padding: "10px", borderRadius: "10px", border: "2px solid #cbd5e1" }}>
            {["Preschool", "Kindergarten", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7"].map(cls => (
              <label key={cls} style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", fontWeight: "600", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={selectedClasses.includes(cls)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedClasses(prev => [...prev, cls]);
                    } else {
                      setSelectedClasses(prev => prev.filter(c => c !== cls));
                    }
                  }}
                  style={{ width: "16px", height: "16px" }}
                />
                {cls}
              </label>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label htmlFor="difficulty-selector-studio" style={{ fontWeight: "700", fontSize: "0.9rem" }}>Difficulty</label>
          <select
            id="difficulty-selector-studio"
            value={difficulty}
            onChange={e => setDifficulty(e.target.value as any)}
            style={{ padding: "12px", borderRadius: "10px", border: "2px solid #cbd5e1" }}
          >
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label htmlFor="rounds-selector-studio" style={{ fontWeight: "700", fontSize: "0.9rem" }}>Rounds Limit</label>
          <select
            id="rounds-selector-studio"
            value={rounds}
            onChange={e => setRounds(e.target.value === "infinite" ? "infinite" : Number(e.target.value))}
            style={{ padding: "12px", borderRadius: "10px", border: "2px solid #cbd5e1" }}
          >
            <option value={1}>1 Round</option>
            <option value={2}>2 Rounds</option>
            <option value={3}>3 Rounds</option>
            <option value={4}>4 Rounds</option>
            <option value={5}>5 Rounds (Recommended)</option>
            <option value={6}>6 Rounds</option>
            <option value={7}>7 Rounds</option>
            <option value={8}>8 Rounds</option>
            <option value={9}>9 Rounds</option>
            <option value={10}>10 Rounds</option>
            <option value="infinite">Infinite Rounds ♾️</option>
          </select>
        </div>
      </div>

      {/* AI Theme Presets Selector */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <span style={{ fontWeight: "700", fontSize: "0.95rem" }}>🎨 Select Game Creative Theme (AI Preset)</span>
        <div className="ai-theme-grid">
          {(Object.keys(THEME_PRESETS) as Array<keyof typeof THEME_PRESETS>).map((key) => {
            const preset = THEME_PRESETS[key];
            const emojis: Record<string, string> = { space: "🌌", ocean: "🐠", dino: "🦖", candy: "🍬", custom: "🪄" };
            return (
              <div
                key={key}
                onClick={() => handleThemeChange(key)}
                className={`ai-theme-card ${aiTheme === key ? "active" : ""}`}
              >
                <span className="icon">{emojis[key]}</span>
                <span className="title">{preset.name.split(" ")[0]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom AI Instructions Box */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <label htmlFor="instruction-input-studio" style={{ fontWeight: "700", fontSize: "0.95rem" }}>
          📝 Custom AI Prompts & Directives
        </label>
        <textarea
          id="instruction-input-studio"
          rows={3}
          placeholder="Describe custom graphics, theme accents, or select quick suggestion pills below..."
          value={gameInstruction}
          onChange={e => setGameInstruction(e.target.value)}
          style={{ padding: "12px", borderRadius: "10px", border: "2px solid #cbd5e1", resize: "vertical" }}
        />
        
        {/* Quick Click Suggestion Pills */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "4px" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--text-secondary)" }}>
            💡 Click to add specific directives to the prompt:
          </span>
          <div className="ai-pills-container">
            <button type="button" className="ai-pill" onClick={() => handleAppendInstruction("large chunky buttons")}>
              🔘 Chunky Buttons
            </button>
            <button type="button" className="ai-pill" onClick={() => handleAppendInstruction("direct canvas touch gestures")}>
              👈 Touch/Swipe Controls
            </button>
            <button type="button" className="ai-pill" onClick={() => handleAppendInstruction("dyslexia-friendly high contrast colors")}>
              👁️ Dyslexia Colors
            </button>
            <button type="button" className="ai-pill" onClick={() => handleAppendInstruction("synthesizer chime sounds")}>
              🔊 Audio Synthesis
            </button>
            <button type="button" className="ai-pill" onClick={() => handleAppendInstruction("celebrative confetti animations")}>
              🎉 Confetti FX
            </button>
            <button type="button" className="ai-pill" onClick={() => handleAppendInstruction("visual items instead of dots")}>
              🎨 Visual Icons
            </button>
          </div>
        </div>
      </div>

      {/* Audio Feedback option */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", backgroundColor: "#f8fafc", padding: "12px 18px", borderRadius: "16px", border: "1px solid #cbd5e1" }}>
        <input
          id="audio-toggle-studio"
          type="checkbox"
          checked={includeSound}
          onChange={e => setIncludeSound(e.target.checked)}
          style={{ width: "20px", height: "20px", cursor: "pointer" }}
        />
        <label htmlFor="audio-toggle-studio" style={{ fontWeight: "700", fontSize: "0.9rem", cursor: "pointer" }}>
          🔊 Prompt AI to write HTML5 Audio Synth Feedback (Plays sounds on answers)
        </label>
      </div>

      {/* Dyslexia-Friendly Typograph option */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", backgroundColor: "#f8fafc", padding: "12px 18px", borderRadius: "16px", border: "1px solid #cbd5e1" }}>
        <input
          id="typography-toggle-studio"
          type="checkbox"
          checked={dyslexiaTypography}
          onChange={e => setDyslexiaTypography(e.target.checked)}
          style={{ width: "20px", height: "20px", cursor: "pointer" }}
        />
        <label htmlFor="typography-toggle-studio" style={{ fontWeight: "700", fontSize: "0.9rem", cursor: "pointer" }}>
          🔤 Dyslexia-Friendly Typograph (Rounded fonts, increased spacing, reversal cues)
        </label>
      </div>

      {/* Prompt Preview */}
      <div style={{ padding: "14px", borderRadius: "16px", backgroundColor: "#f0fdf4", border: "1.5px solid #5eead4", fontSize: "0.8rem", display: "flex", flexDirection: "column", gap: "6px" }}>
        <span style={{ fontWeight: "700", color: "#0f766e" }}>💡 Structured Guidelines Sent to AI model:</span>
        <div style={{ color: "#0f766e", lineHeight: "1.4", fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
          • Theme/Style: {THEME_PRESETS[aiTheme].name}
          {"\n"}• Rounds: {rounds === "infinite" ? "Infinite loop of tasks (Continuous Play)" : `${rounds} Round(s) Limit`}
          {"\n"}• {includeSound ? "Include HTML5 Web Audio synth feedback tone generator." : "Visual only feedback, do not write audio codes."}
          {"\n"}• Dyslexia Typography: {dyslexiaTypography ? "ENABLED (large spaced rounded fonts, reversal cues)" : "DISABLED (standard font stack)"}
          {gameInstruction.trim() && `\n• ${gameInstruction.trim()}`}
        </div>
      </div>

      {/* Action Trigger button */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="btn btn-primary"
        style={{ width: "100%", padding: "16px" }}
      >
        {isGenerating ? "Gemini AI Generating Game..." : "Generate AI Game"}
      </button>

      {generationError && (
        <div
          style={{
            marginTop: "16px",
            padding: "14px 18px",
            borderRadius: "14px",
            backgroundColor: "#fee2e2",
            border: "2px solid #ef4444",
            color: "#b91c1c",
            fontSize: "0.95rem",
            fontWeight: "700",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            lineHeight: "1.4"
          }}
        >
          <span>⚠️</span>
          <span>{generationError}</span>
        </div>
      )}

      {/* Generated Game Output & Sandbox */}
      {generatedGame && (
        <div
          style={{
            marginTop: "20px",
            borderTop: "2px solid #e2e8f0",
            paddingTop: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "20px"
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1, minWidth: "250px" }}>
                <label htmlFor="game-title-editable" style={{ fontSize: "0.85rem", fontWeight: "700" }}>Game Name</label>
                <input
                  id="game-title-editable"
                  type="text"
                  value={generatedGame.title}
                  onChange={e => handleTitleChange(e.target.value)}
                  style={{
                    padding: "10px",
                    borderRadius: "10px",
                    border: "2px solid #cbd5e1",
                    fontSize: "1rem",
                    width: "100%",
                    backgroundColor: "#fff"
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => setCodeEditMode(!codeEditMode)}
                  className="btn btn-gray"
                  style={{ padding: "8px 12px", fontSize: "0.8rem", boxShadow: "none" }}
                >
                  {codeEditMode ? "View Sandbox" : "Edit HTML Code"}
                </button>
                <button
                  onClick={handleSaveAsDraft}
                  disabled={!generatedGame.isValid || !generatedGame.title.trim()}
                  className="btn btn-gray"
                  style={{ padding: "8px 12px", fontSize: "0.8rem", boxShadow: "none", backgroundColor: "#f1f5f9", border: "1.5px solid #cbd5e1", color: "#475569" }}
                >
                  📁 Save as Draft
                </button>
                <button
                  onClick={handlePublish}
                  disabled={!generatedGame.isValid || !generatedGame.title.trim()}
                  className="btn btn-success"
                  style={{ padding: "8px 12px", fontSize: "0.8rem", boxShadow: "none" }}
                >
                  {editingGameId ? "Save Changes" : "Publish Game"}
                </button>
              </div>
            </div>
          </div>

          {/* Safety & Validation Report */}
          <div
            style={{
              padding: "14px",
              borderRadius: "12px",
              backgroundColor: generatedGame.isValid ? "#d1fae5" : "#fee2e2",
              border: `1.5px solid ${generatedGame.isValid ? "#10b981" : "#ef4444"}`,
              display: "flex",
              gap: "10px",
              alignItems: "flex-start"
            }}
          >
            {generatedGame.isValid ? (
              <>
                <CheckCircle size={20} color="#047857" style={{ flexShrink: 0 }} />
                <div>
                  <span style={{ fontWeight: "700", color: "#065f46" }}>Game Code Validated!</span>
                  <p style={{ fontSize: "0.8rem", color: "#065f46", marginTop: "2px" }}>
                    No dangerous browser APIs or external scripts detected. Ready to deploy.
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertTriangle size={20} color="#b91c1c" style={{ flexShrink: 0 }} />
                <div>
                  <span style={{ fontWeight: "700", color: "#7f1d1d" }}>Security Validation Warnings</span>
                  <ul style={{ fontSize: "0.8rem", color: "#7f1d1d", marginTop: "4px", paddingLeft: "16px" }}>
                    {generatedGame.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>

          {/* Edit Mode / Sandbox switch */}
          {codeEditMode ? (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label htmlFor="html-editor-textarea" style={{ fontSize: "0.85rem", fontWeight: "700" }}>
                  HTML/CSS/JS Source Code
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => {
                      try {
                        const formatJS = (code: string, baseIndent: number): string => {
                          const lines = code.split('\n');
                          const formatted: string[] = [];
                          let indent = baseIndent;
                          
                          lines.forEach(line => {
                            const trimmed = line.trim();
                            if (!trimmed) return;
                            
                            // Decrease indent for closing braces/brackets
                            if (trimmed.startsWith('}') || trimmed.startsWith(']') || trimmed.startsWith(')')) {
                              indent = Math.max(baseIndent, indent - 1);
                            }
                            
                            formatted.push('  '.repeat(indent) + trimmed);
                            
                            // Increase indent after opening braces/brackets
                            if (trimmed.endsWith('{') || trimmed.endsWith('[') || trimmed.endsWith('(')) {
                              indent++;
                            }
                            
                            // Decrease indent after closing on same line
                            if ((trimmed.endsWith('}') || trimmed.endsWith(']') || trimmed.endsWith(')')) &&
                                (trimmed.includes('{') || trimmed.includes('[') || trimmed.includes('('))) {
                              // Do nothing, already handled
                            } else if (trimmed.endsWith('}') || trimmed.endsWith(']') || trimmed.endsWith(')')) {
                              indent = Math.max(baseIndent, indent - 1);
                            }
                          });
                          
                          return formatted.join('\n');
                        };
                        
                        const formatCSS = (code: string, baseIndent: number): string => {
                          const lines = code.split('\n');
                          const formatted: string[] = [];
                          let indent = baseIndent;
                          
                          lines.forEach(line => {
                            const trimmed = line.trim();
                            if (!trimmed) return;
                            
                            if (trimmed === '}') {
                              indent = Math.max(baseIndent, indent - 1);
                            }
                            
                            formatted.push('  '.repeat(indent) + trimmed);
                            
                            if (trimmed.endsWith('{')) {
                              indent++;
                            } else if (trimmed === '}') {
                              // Already decreased above
                            }
                          });
                          
                          return formatted.join('\n');
                        };
                        
                        // Main formatter
                        let result = '';
                        let htmlIndent = 0;
                        const parts = draftCode.split(/(<script[^>]*>|<\/script>|<style[^>]*>|<\/style>)/gi);
                        let inScript = false;
                        let inStyle = false;
                        let scriptContent = '';
                        let styleContent = '';
                        
                        parts.forEach(part => {
                          if (part.match(/<script[^>]*>/i)) {
                            result += '  '.repeat(htmlIndent) + part + '\n';
                            inScript = true;
                            htmlIndent++;
                            scriptContent = '';
                          } else if (part.match(/<\/script>/i)) {
                            if (scriptContent.trim()) {
                              result += formatJS(scriptContent, htmlIndent) + '\n';
                            }
                            htmlIndent = Math.max(0, htmlIndent - 1);
                            result += '  '.repeat(htmlIndent) + part + '\n';
                            inScript = false;
                          } else if (part.match(/<style[^>]*>/i)) {
                            result += '  '.repeat(htmlIndent) + part + '\n';
                            inStyle = true;
                            htmlIndent++;
                            styleContent = '';
                          } else if (part.match(/<\/style>/i)) {
                            if (styleContent.trim()) {
                              result += formatCSS(styleContent, htmlIndent) + '\n';
                            }
                            htmlIndent = Math.max(0, htmlIndent - 1);
                            result += '  '.repeat(htmlIndent) + part + '\n';
                            inStyle = false;
                          } else if (inScript) {
                            scriptContent += part;
                          } else if (inStyle) {
                            styleContent += part;
                          } else {
                            // Format HTML
                            const tags = part.split(/(<[^>]+>)/g).filter(s => s.trim());
                            tags.forEach(tag => {
                              if (tag.startsWith('</')) {
                                htmlIndent = Math.max(0, htmlIndent - 1);
                                result += '  '.repeat(htmlIndent) + tag + '\n';
                              } else if (tag.startsWith('<') && !tag.endsWith('/>') &&
                                         !tag.match(/<(br|hr|img|input|meta|link|area|base|col|embed|param|source|track|wbr)/i)) {
                                result += '  '.repeat(htmlIndent) + tag + '\n';
                                htmlIndent++;
                              } else if (tag.startsWith('<')) {
                                result += '  '.repeat(htmlIndent) + tag + '\n';
                              } else if (tag.trim()) {
                                result += '  '.repeat(htmlIndent) + tag.trim() + '\n';
                              }
                            });
                          }
                        });
                        
                        setDraftCode(result.trim());
                      } catch (err) {
                        alert('Could not format document. Please check for syntax errors.');
                      }
                    }}
                    className="btn"
                    style={{
                      padding: "4px 10px",
                      backgroundColor: "#dbeafe",
                      border: "1.5px solid #bfdbfe",
                      color: "#1e40af",
                      borderRadius: "8px",
                      fontSize: "0.75rem",
                      boxShadow: "none"
                    }}
                  >
                    ✨ Format Document
                  </button>
                  <button
                    onClick={handleClearHtml}
                    className="btn"
                    style={{
                      padding: "4px 10px",
                      backgroundColor: "#fee2e2",
                      border: "1.5px solid #fecaca",
                      color: "#b91c1c",
                      borderRadius: "8px",
                      fontSize: "0.75rem",
                      boxShadow: "none"
                    }}
                  >
                    🗑️ Clear All
                  </button>
                </div>
              </div>
              <div style={{
                width: "100%",
                height: "280px",
                borderRadius: "10px",
                border: "2px solid #cbd5e1",
                backgroundColor: "#1e293b",
                overflow: "hidden",
                position: "relative"
              }}>
                <div style={{
                  display: "flex",
                  height: "100%"
                }}>
                  {/* Line Numbers */}
                  <div style={{
                    backgroundColor: "#0f172a",
                    color: "#64748b",
                    padding: "12px 8px",
                    fontFamily: "monospace",
                    fontSize: "0.85rem",
                    lineHeight: "1.5",
                    textAlign: "right",
                    userSelect: "none",
                    minWidth: "40px",
                    borderRight: "1px solid #334155"
                  }}>
                    {draftCode.split('\n').map((_, i) => (
                      <div key={i}>{i + 1}</div>
                    ))}
                  </div>
                  {/* Code Editor */}
                  <textarea
                    id="html-editor-textarea"
                    value={draftCode}
                    onChange={e => setDraftCode(e.target.value)}
                    spellCheck={false}
                    style={{
                      flex: 1,
                      height: "100%",
                      fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
                      fontSize: "0.85rem",
                      padding: "12px",
                      border: "none",
                      backgroundColor: "#1e293b",
                      color: "#e2e8f0",
                      resize: "none",
                      outline: "none",
                      lineHeight: "1.5",
                      tabSize: 2,
                      whiteSpace: "pre",
                      overflowWrap: "normal",
                      overflowX: "auto"
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Tab') {
                        e.preventDefault();
                        const start = e.currentTarget.selectionStart;
                        const end = e.currentTarget.selectionEnd;
                        const newValue = draftCode.substring(0, start) + '  ' + draftCode.substring(end);
                        setDraftCode(newValue);
                        setTimeout(() => {
                          e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 2;
                        }, 0);
                      }
                    }}
                  />
                </div>
                {/* Editor Info Bar */}
                <div style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  backgroundColor: "#0f172a",
                  color: "#64748b",
                  padding: "4px 12px",
                  fontSize: "0.75rem",
                  fontFamily: "monospace",
                  borderTopLeftRadius: "6px",
                  borderLeft: "1px solid #334155",
                  borderTop: "1px solid #334155"
                }}>
                  Lines: {draftCode.split('\n').length} | Chars: {draftCode.length}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <span style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "4px" }}>
                Live Sandbox Sandbox Preview
              </span>
              <Sandbox
                htmlContent={draftCode}
                onComplete={() => alert("Simulation Complete message received!")}
                onAttempt={() => console.log("Simulation Attempt message")}
              />
            </div>
          )}

          {/* Tweak & Regenerate section */}
          <div style={{ marginTop: "20px", borderTop: "2px solid #cbd5e1", paddingTop: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <label htmlFor="tweak-instructions-textarea" style={{ fontSize: "0.95rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" }}>
              🪄 Tweak & Re-generate Activity (Add custom modifications)
            </label>
            <textarea
              id="tweak-instructions-textarea"
              rows={3}
              placeholder="e.g. Change background color to neon green, or make interactive elements 20% larger..."
              value={tweakInstruction}
              onChange={e => setTweakInstruction(e.target.value)}
              style={{ padding: "12px", borderRadius: "10px", border: "2px solid #cbd5e1", fontSize: "0.85rem", resize: "vertical" }}
            />
            <button
              onClick={handleRegenerate}
              disabled={isGenerating || !tweakInstruction.trim()}
              className="btn btn-primary"
              style={{ alignSelf: "flex-start", padding: "10px 20px", fontSize: "0.85rem" }}
            >
              {isGenerating ? "AI Regenerating..." : "Apply Tweaks & Regenerate Code"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TabStudio;
