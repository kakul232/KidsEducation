import React, { useState, useEffect } from "react";
import { CheckCircle, AlertTriangle } from "lucide-react";
import LocalDB from "../../services/db";
import type { Student } from "../../services/db";
import { generateGame } from "../../services/gemini";
import type { GeneratedGameResponse } from "../../services/gemini";
import Sandbox from "../Sandbox";
import { useApp } from "../../context/AppContext";

import { THEME_PRESETS } from "../../utils/constants";


interface TabStudioProps {
  editingGame: any;
  onCancelEdit: () => void;
  onPublishOrSave: () => void;
  students: Student[];
}

export const TabStudio: React.FC<TabStudioProps> = ({
  editingGame,
  onCancelEdit,
  onPublishOrSave,
  students
}) => {
  const { geminiApiKey, sendPushNotification } = useApp();

  const [topic, setTopic] = useState("Addition");
  const [selectedClasses, setSelectedClasses] = useState<string[]>(["Grade 1"]);
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">("Easy");
  const [assignedStudentId, setAssignedStudentId] = useState("");
  const [gameInstruction, setGameInstruction] = useState(THEME_PRESETS.space.prompt);
  const [aiTheme, setAiTheme] = useState<"space" | "ocean" | "dino" | "candy" | "custom">("space");
  const [includeSound, setIncludeSound] = useState(true);
  const [dyslexiaTypography, setDyslexiaTypography] = useState(false);
  const [rounds, setRounds] = useState<number | "infinite">(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedGame, setGeneratedGame] = useState<GeneratedGameResponse | null>(null);
  const [generationError, setGenerationError] = useState("");
  const [editingGameId, setEditingGameId] = useState<string | null>(null);
  const [tweakInstruction, setTweakInstruction] = useState("");
  const [draftCode, setDraftCode] = useState("");
  const [codeEditMode, setCodeEditMode] = useState(false);

  useEffect(() => {
    if (editingGame) {
      setTopic(editingGame.topic);
      if (editingGame.class) {
        setSelectedClasses(editingGame.class.split(",").map((c: string) => c.trim()));
      } else {
        setSelectedClasses(["Grade 1"]);
      }
      setDifficulty(editingGame.difficulty);
      setAssignedStudentId(editingGame.assignedStudentId || "");
      setDraftCode(editingGame.htmlContent);
      setGeneratedGame({
        title: editingGame.title,
        topic: editingGame.topic,
        class: editingGame.class || "Grade 1",
        difficulty: editingGame.difficulty,
        htmlContent: editingGame.htmlContent,
        promptUsed: "",
        isValid: true,
        errors: []
      });
      setEditingGameId(editingGame.id);
      setCodeEditMode(true);
      setGenerationError("");
    } else {
      setEditingGameId(null);
      setGeneratedGame(null);
      setDraftCode("");
      setCodeEditMode(false);
      setTopic("Addition");
      setSelectedClasses(["Grade 1"]);
      setDifficulty("Easy");
      setAssignedStudentId("");
      setGameInstruction(THEME_PRESETS.space.prompt);
      setAiTheme("space");
    }
  }, [editingGame]);

  const handleThemeChange = (themeKey: "space" | "ocean" | "dino" | "candy" | "custom") => {
    setAiTheme(themeKey);
    if (themeKey !== "custom") {
      setGameInstruction(THEME_PRESETS[themeKey].prompt);
    } else {
      setGameInstruction("");
    }
  };

  const handleAppendInstruction = (text: string) => {
    setGameInstruction(prev => {
      const cleanPrev = prev.trim();
      if (!cleanPrev) return text;
      if (cleanPrev.toLowerCase().includes(text.toLowerCase())) return prev;
      return cleanPrev + ", " + text;
    });
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    setGeneratedGame(null);
    setGenerationError("");
    setCodeEditMode(false);

    const combinedInstructions = [
      `Theme/Style: ${THEME_PRESETS[aiTheme].name}`,
      includeSound ? "Include visual audio feedback using HTML5 Web Audio API (AudioContext synth chimes) for correct and incorrect answers." : "Visual only feedback, do not write audio codes.",
      dyslexiaTypography ? "Strictly apply dyslexia-friendly typography adjustments: use larger rounded fonts (like Lexend/Outfit or Comic Neue), set letter-spacing to at least 0.12em, line-height to 1.6, bold font-weight, mixed-case text, and reversal prevention underlines." : "Do NOT apply specialized dyslexia-friendly typography styling. Use regular default web typography (standard modern sans-serif fonts, default letter-spacing, normal weight).",
      gameInstruction.trim()
    ].filter(Boolean).join("\n• ");

    try {
      const result = await generateGame("Mathematics", topic, selectedClasses.join(", "), difficulty, geminiApiKey, combinedInstructions, rounds, undefined, dyslexiaTypography);
      setGeneratedGame(result);
      setDraftCode(result.htmlContent);
    } catch (err: any) {
      console.error(err);
      setGenerationError(err.message || "Gemini AI generation failed. Verify API key and network.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTitleChange = (newTitle: string) => {
    if (!generatedGame) return;
    setGeneratedGame({
      ...generatedGame,
      title: newTitle
    });
  };

  const handleClearHtml = () => {
    setDraftCode("");
  };

  const handleRegenerate = async () => {
    if (!tweakInstruction.trim() || !draftCode.trim()) return;
    setIsGenerating(true);
    setGenerationError("");

    const modifyInstructions = [
      `Theme/Style: ${THEME_PRESETS[aiTheme].name}`,
      includeSound ? "Include visual audio feedback using HTML5 Web Audio API (AudioContext synth chimes) for correct and incorrect answers." : "Visual only feedback, do not write audio codes.",
      dyslexiaTypography ? "Strictly apply dyslexia-friendly typography adjustments: use larger rounded fonts (like Lexend/Outfit or Comic Neue), set letter-spacing to at least 0.12em, line-height to 1.6, bold font-weight, mixed-case text, and reversal prevention underlines." : "Do NOT apply specialized dyslexia-friendly typography styling. Use regular default web typography (standard modern sans-serif fonts, default letter-spacing, normal weight).",
      gameInstruction.trim() ? `Base instructions: ${gameInstruction.trim()}` : "",
      `REGENERATION REQUEST: Modify the existing HTML code according to this custom request: "${tweakInstruction.trim()}". Keep the rest of the game structures, logic, and sounds unchanged.`
    ].filter(Boolean).join("\n• ");

    try {
      const result = await generateGame("Mathematics", topic, selectedClasses.join(", "), difficulty, geminiApiKey, modifyInstructions, rounds, draftCode, dyslexiaTypography);
      setGeneratedGame(result);
      setDraftCode(result.htmlContent);
      setTweakInstruction("");
    } catch (err: any) {
      console.error(err);
      setGenerationError(err.message || "Gemini AI regeneration failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!generatedGame) return;

    const newGame = {
      id: editingGameId || ("game_" + Math.random().toString(36).substring(2, 11)),
      title: generatedGame.title,
      topic: generatedGame.topic,
      subject: "Mathematics",
      class: generatedGame.class || selectedClasses.join(", "),
      difficulty: generatedGame.difficulty as any,
      htmlContent: draftCode,
      published: true,
      createdAt: new Date().toISOString(),
      assignedStudentId: assignedStudentId || ""
    };

    try {
      await LocalDB.saveGame(newGame);
      try {
        await sendPushNotification(
          "New Game Published! 🎮",
          `A new math activity "${newGame.title}" is ready! Let's play and earn stars! ✨`
        );
      } catch (notiErr) {
        console.warn("Could not trigger publish notification:", notiErr);
      }
      alert(editingGameId ? "Game successfully updated! ✏️" : "Game successfully published to students! 🎉");
      onPublishOrSave();
    } catch (err: any) {
      console.error("Publish failed:", err);
      alert("Failed to publish game: " + (err.message || "Unknown database error."));
    }
  };

  const handleSaveAsDraft = async () => {
    if (!generatedGame) return;

    const newGame = {
      id: editingGameId || ("game_" + Math.random().toString(36).substring(2, 11)),
      title: generatedGame.title,
      topic: generatedGame.topic,
      subject: "Mathematics",
      class: generatedGame.class || selectedClasses.join(", "),
      difficulty: generatedGame.difficulty as any,
      htmlContent: draftCode,
      published: false,
      createdAt: new Date().toISOString(),
      assignedStudentId: assignedStudentId || ""
    };

    try {
      await LocalDB.saveGame(newGame);
      alert(editingGameId ? "Draft successfully updated! ✏️" : "Game successfully saved as Draft! 📁");
      onPublishOrSave();
    } catch (err: any) {
      console.error("Save as Draft failed:", err);
      alert("Failed to save draft: " + (err.message || "Unknown database error."));
    }
  };

  const isKeyLive = geminiApiKey && geminiApiKey.trim().length > 0;

  return (
    <div className="play-card admin-card-flex">
      {/* Sparkling AI Header Banner */}
      <div className="ai-studio-header">
        <div>
          <h3 style={{ fontSize: "1.3rem", color: "#fff", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
            🪄 Gemini AI Studio
          </h3>
          <p style={{ fontSize: "0.85rem", color: "rgba(255, 255, 255, 0.9)", marginTop: "6px", marginBottom: "0px" }}>
            {editingGameId 
              ? "Modify and re-generate existing game details." 
              : (isKeyLive
                  ? "Co-create visual, dyslexia-accessible arithmetic activities using Gemini AI." 
                  : "No API key saved. Creating a game will compile a simulated Balloon Counting template activity.")
            }
          </p>
          <div className={`studio-connection-badge ${isKeyLive ? "connected" : "mock"}`}>
            <span className="dot" />
            {isKeyLive ? "Gemini Connected (Live Mode)" : "Using Mock Mode (No API Key)"}
          </div>
        </div>
        {editingGameId && (
          <button
            onClick={onCancelEdit}
            className="btn studio-cancel-edit-btn"
          >
            Cancel Edit
          </button>
        )}
      </div>

      {/* AI Setup options Grid */}
      <div className="admin-form-grid">
        <div className="admin-form-group">
          <label htmlFor="student-selector-studio" className="admin-login-label">Select Student</label>
          <select
            id="student-selector-studio"
            value={assignedStudentId}
            onChange={e => setAssignedStudentId(e.target.value)}
            className="admin-settings-input"
          >
            <option value="">All Students (General Publish)</option>
            {students.map(std => (
              <option key={std.id} value={std.id}>
                {std.name}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-form-group">
          <label htmlFor="topic-input-studio" className="admin-login-label">Select Topic</label>
          <input
            id="topic-input-studio"
            type="text"
            placeholder="e.g. Addition, Subtraction, Counting"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            className="admin-settings-input"
          />
        </div>

        <div className="admin-form-group">
          <label className="admin-login-label">Target Classes / Grades</label>
          <div className="classes-checkboxes-wrapper">
            {["Preschool", "Kindergarten", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7"].map(cls => (
              <label key={cls} className="class-checkbox-label">
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
                />
                {cls}
              </label>
            ))}
          </div>
        </div>

        <div className="admin-form-group">
          <label htmlFor="difficulty-selector-studio" className="admin-login-label">Difficulty</label>
          <select
            id="difficulty-selector-studio"
            value={difficulty}
            onChange={e => setDifficulty(e.target.value as any)}
            className="admin-settings-input"
          >
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>

        <div className="admin-form-group">
          <label htmlFor="rounds-selector-studio" className="admin-login-label">Rounds Limit</label>
          <select
            id="rounds-selector-studio"
            value={rounds}
            onChange={e => setRounds(e.target.value === "infinite" ? "infinite" : Number(e.target.value))}
            className="admin-settings-input"
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
      <div className="admin-form-group">
        <span className="admin-login-label">🎨 Select Game Creative Theme (AI Preset)</span>
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
      <div className="admin-form-group">
        <label htmlFor="instruction-input-studio" className="admin-login-label">
          📝 Custom AI Prompts & Directives
        </label>
        <textarea
          id="instruction-input-studio"
          rows={3}
          placeholder="Describe custom graphics, theme accents, or select quick suggestion pills below..."
          value={gameInstruction}
          onChange={e => setGameInstruction(e.target.value)}
          className="admin-settings-input"
        />
        
        {/* Quick Click Suggestion Pills */}
        <div className="admin-form-group" style={{ marginTop: "4px" }}>
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
      <div className="studio-toggle-row">
        <input
          id="audio-toggle-studio"
          type="checkbox"
          checked={includeSound}
          onChange={e => setIncludeSound(e.target.checked)}
        />
        <label htmlFor="audio-toggle-studio">
          🔊 Prompt AI to write HTML5 Audio Synth Feedback (Plays sounds on answers)
        </label>
      </div>

      {/* Dyslexia-Friendly Typography option */}
      <div className="studio-toggle-row">
        <input
          id="typography-toggle-studio"
          type="checkbox"
          checked={dyslexiaTypography}
          onChange={e => setDyslexiaTypography(e.target.checked)}
        />
        <label htmlFor="typography-toggle-studio">
          🔤 Dyslexia-Friendly Typography (Rounded fonts, increased spacing, reversal cues)
        </label>
      </div>

      {/* Structured Prompt Preview */}
      <div className="studio-structured-preview-box">
        <span>💡 Structured Guidelines Sent to AI model:</span>
        <div className="content">
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
        <div className="studio-generation-error-card">
          <span>⚠️</span>
          <span>{generationError}</span>
        </div>
      )}

      {/* Generated Game Output & Sandbox */}
      {generatedGame && (
        <div className="studio-output-sandbox-wrapper">
          <div className="admin-form-group" style={{ width: "100%" }}>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: "16px" }}>
              <div className="admin-form-group" style={{ flex: 1, minWidth: "250px" }}>
                <label htmlFor="game-title-editable" style={{ fontSize: "0.85rem", fontWeight: "700" }}>Game Name</label>
                <input
                  id="game-title-editable"
                  type="text"
                  value={generatedGame.title}
                  onChange={e => handleTitleChange(e.target.value)}
                  className="studio-editable-title-input"
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
          <div className={`studio-validation-report ${generatedGame.isValid ? "valid" : "invalid"}`}>
            {generatedGame.isValid ? (
              <>
                <CheckCircle size={20} color="#047857" style={{ flexShrink: 0 }} />
                <div>
                  <span className="title-valid">Game Code Validated!</span>
                  <p className="desc-valid">
                    No dangerous browser APIs or external scripts detected. Ready to deploy.
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertTriangle size={20} color="#b91c1c" style={{ flexShrink: 0 }} />
                <div>
                  <span className="title-invalid">Security Validation Warnings</span>
                  <ul className="desc-invalid">
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
              <div className="admin-overview-header" style={{ marginBottom: "6px" }}>
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
                            
                            if (trimmed.startsWith('}') || trimmed.startsWith(']') || trimmed.startsWith(')')) {
                              indent = Math.max(baseIndent, indent - 1);
                            }
                            
                            formatted.push('  '.repeat(indent) + trimmed);
                            
                            if (trimmed.endsWith('{') || trimmed.endsWith('[') || trimmed.endsWith('(')) {
                              indent++;
                            }
                            
                            if ((trimmed.endsWith('}') || trimmed.endsWith(']') || trimmed.endsWith(')')) &&
                                (trimmed.includes('{') || trimmed.includes('[') || trimmed.includes('('))) {
                              // Already handled
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
                            }
                          });
                          
                          return formatted.join('\n');
                        };
                        
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
                    className="btn editor-btn-format"
                  >
                    ✨ Format Document
                  </button>
                  <button
                    onClick={handleClearHtml}
                    className="btn editor-btn-clear"
                  >
                    🗑️ Clear All
                  </button>
                </div>
              </div>
              <div className="editor-container">
                <div className="editor-inner">
                  {/* Line Numbers */}
                  <div className="editor-line-numbers">
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
                    className="editor-textarea"
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
                <div className="editor-info-bar">
                  Lines: {draftCode.split('\n').length} | Chars: {draftCode.length}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <span className="editor-sandbox-header">
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
          <div className="editor-tweak-section">
            <label htmlFor="tweak-instructions-textarea" className="editor-tweak-label">
              🪄 Tweak & Re-generate Activity (Add custom modifications)
            </label>
            <textarea
              id="tweak-instructions-textarea"
              rows={3}
              placeholder="e.g. Change background color to neon green, or make interactive elements 20% larger..."
              value={tweakInstruction}
              onChange={e => setTweakInstruction(e.target.value)}
              className="editor-tweak-textarea"
            />
            <button
              onClick={handleRegenerate}
              disabled={isGenerating || !tweakInstruction.trim()}
              className="btn btn-primary editor-tweak-btn"
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
