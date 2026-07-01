import { validateGameCode } from "./validator";
import balloonCountingRaw from "../game/Ballon-counting.html?raw";

export interface GeneratedGameResponse {
  title: string;
  topic: string;
  age: number;
  difficulty: string;
  htmlContent: string;
  promptUsed: string;
  isValid: boolean;
  errors: string[];
}

// Highly creative mock games for different subjects & topics
const MOCK_TEMPLATES: Record<string, (topic: string, age: number, difficulty: string) => string> = {
  addition: (_topic, _age, _difficulty) => balloonCountingRaw,
  subtraction: (_topic, _age, _difficulty) => balloonCountingRaw,
  shapes: (_topic, _age, _difficulty) => balloonCountingRaw
};

function extractJson(str: string): string | null {
  const start = str.indexOf("{");
  if (start === -1) return null;

  let braceCount = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < str.length; i++) {
    const char = str[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === "{") {
        braceCount++;
      } else if (char === "}") {
        braceCount--;
        if (braceCount === 0) {
          return str.substring(start, i + 1);
        }
      }
    }
  }

  return null;
}

export async function generateGame(
  subject: string,
  topic: string,
  age: number,
  difficulty: "Easy" | "Medium" | "Hard",
  apiKey?: string,
  customInstruction?: string,
  rounds: number | "infinite" = 5,
  originalHtml?: string,
  dyslexiaTypography: boolean = false
): Promise<GeneratedGameResponse> {
  let prompt = `Generate a single-file interactive educational HTML game for a child aged ${age} facing dyslexia.
Subject: ${subject}
Topic: ${topic}
Difficulty: ${difficulty}

Strict UX & Dyslexia-Friendly Constraints:
1. Typography: ${dyslexiaTypography ? "Use dyslexia-friendly fonts like 'Comic Neue', 'Comic Sans MS', or 'Arial Rounded MT Bold' as fallback. Apply styling: letter-spacing: 0.1em; line-height: 1.6; font-weight: bold; font-size: clamp(16px, 4vw, 24px). Avoid all-caps text; use mixed case for better word-shape recognition." : "Use normal, standard readable web typography (standard modern sans-serif fonts, default letter-spacing, normal weight, clean readable sizes) without specialized dyslexia font adjustments."}
2. High Readability Contrast: Use soft, warm off-white or light pastel backgrounds (e.g., cream #fdfbf7, soft lavender #f5f3ff, pale sky-blue #f0f9ff, soft mint #f0fdf4) instead of stark pure white to reduce visual stress. Use high-contrast dark text colors (like dark slate #1e293b, dark purple #4c1d95, or dark blue #0369a1). Avoid pure black-on-white.
3. Multi-Sensory Feedback & Text-to-Speech:
   - Speech Read-Aloud: Include a clearly visible, fun TTS button/icon (e.g. "🔊 Listen") next to the main instruction/question. Clicking this button MUST trigger the Web Speech API (window.speechSynthesis) to read the question or instruction text aloud in a clean child-friendly voice.
   - Audio Feedback: Include visual audio feedback using HTML5 Web Audio API (AudioContext synthesizer chimes) for correct (high-pitched happy chime) and incorrect (lower-pitched friendly sound) answers.
   - Visual Feedback: On correct answers, show a temporary fullscreen overlay animation with celebratory emoji elements (e.g. "Awesome! 🌟", "Hurray! 🎉", "Great Job! 🎈"). On incorrect attempts, show friendly positive encouragement (e.g. "Oops! Let's try again! 🧸", "Nice try! Keep going! ❤️") rather than negative text or sounds.
4. Visual Quantity Supports: For counting and arithmetic topics, represent numbers visually using countable emojis or shapes (e.g. show 5 apples 🍎🍎🍎🍎🍎 next to the number 5) to help the child map numeric symbols to concrete quantities.
5. Large Touch Targets & Layout Spacing: Clickable items, buttons, bubbles, and cards must be large (minimum 60px by 60px touch area) and widely spaced to prevent accidental mis-clicks and motor frustration.
6. Reversal Prevention: Place a distinct visual decoration or line underneath easily confused numbers (such as underline under 6 and 9) or letters (such as color-coding 'b' vs 'd') to assist children in spatial distinction.
7. Stress-Free Environment: NEVER include countdown timers, time limits, or penalty buzzers. Let the child complete tasks at their own relaxed pace.

Layout & Technical Constraints:
8. Full Viewport Responsive Scaling:
   - The entire game must fit exactly within a vertical mobile portrait viewport (aspect ratio 9:16 or 3:4) with NO scrollbars (use CSS 'overflow: hidden; height: 100vh; box-sizing: border-box;' on body).
   - Use CSS Flexbox ('display: flex; flex-direction: column; justify-content: space-between;') to scale elements dynamically. The main interactive game area / canvas / play board must use 'flex: 1' or 'flex-grow: 1' to fill all available space between the header and the bottom settings.
   - Scale button paddings, grid layouts, canvas drawings, and font sizes using relative units (vh, vw, rem, clamp) so it remains perfectly legible on small screens without leaving empty gaps at the bottom.
9. Rounds Limit & Parent Communication:
   - For every single response or question answered by the student, immediately post a details message to the parent: parent.postMessage({ type: 'game_action', success: true/false, question: 'Question text', answer: 'Student answer' }, '*').
   - Rounds limit: ${rounds === "infinite" ? "Infinite rounds (continuous gameplay). Keep generating new tasks/questions loops endlessly, and send parent.postMessage({ type: 'game_complete', success: true, correctCount: 1, incorrectCount: 0 }, '*') after each correct answer." : `exactly ${rounds} round(s). The game must display round progress clearly on screen (e.g. 'Round 1 of ${rounds}'). ONLY send parent.postMessage({ type: 'game_complete', success: true, correctCount: ${rounds}, incorrectCount: X }, '*') after the user successfully completes the final round.`}
   - Incorrect answers: parent.postMessage({ type: 'game_attempt', success: false }, '*') after any incorrect attempt.
10. Strict Security Validation:
    - The HTML content must be self-contained: do not include any external dependencies, CDNs, or scripts. Everything must be inside inline <style> and <script> tags.
    - DO NOT use forbidden APIs: eval, new Function, fetch, XMLHttpRequest, WebSocket, document.cookie, navigator.mediaDevices, or location.replace.
11. Return Format: Return ONLY a valid JSON object in this format:
{
  "title": "Short Fun Title starting with a relevant emoji (e.g., '🐍 Snake Math Adventure')",
  "htmlContent": "HTML source code string here"
}
Ensure the "htmlContent" is valid and properly escaped for JSON.`;

  if (customInstruction && customInstruction.trim().length > 0) {
    prompt += `\n\nAdditional custom requirements/instructions from the teacher to incorporate: ${customInstruction}`;
  }

  if (originalHtml && originalHtml.trim().length > 0) {
    prompt += `\n\nCRITICAL DIRECTIVE: You are modifying an existing game. Below is the current HTML code of the game. Update and rewrite this code to apply the custom modifications/tweaks requested. Keep all other aspects, sound synthesizers, assets, styles, and logic intact unless explicitly requested to change.
Current HTML Code to modify:
\`\`\`html
${originalHtml.trim()}
\`\`\`
`;
  }

  // Real Gemini API Call if apiKey is provided
  if (apiKey && apiKey.trim().length > 0) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt
                  }
                ]
              }
            ],
            generationConfig: {
              responseMimeType: "application/json"
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API returned HTTP status ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error("Empty response content from Gemini.");
      }

      let cleanText = text.trim();

      // Attempt to extract outermost JSON block dynamically using a robust character state-machine brace count
      let parsed: any = null;
      const extracted = extractJson(cleanText);

      if (extracted) {
        try {
          parsed = JSON.parse(extracted);
        } catch (innerErr) {
          console.warn("Extracted brace JSON parsing failed, falling back to standard string replacements:", innerErr);
        }
      }

      if (!parsed) {
        if (cleanText.startsWith("```")) {
          cleanText = cleanText.replace(/^```(json)?/, "");
          cleanText = cleanText.replace(/```$/, "");
          cleanText = cleanText.trim();
        }
        parsed = JSON.parse(cleanText);
      }

      const htmlContent = parsed.htmlContent;
      const title = parsed.title || `${topic} Game`;

      const validation = validateGameCode(htmlContent);

      return {
        title,
        topic,
        age,
        difficulty,
        htmlContent,
        promptUsed: prompt,
        isValid: validation.isValid,
        errors: validation.errors
      };
    } catch (e: any) {
      console.error("Gemini Live Generation failed:", e.message);
      throw new Error(`Gemini AI Generation failed: ${e.message}`);
    }
  }

  // High-quality dynamic fallback mock
  await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate AI processing delay

  const key = topic.toLowerCase().includes("subtract")
    ? "subtraction"
    : topic.toLowerCase().includes("shape")
      ? "shapes"
      : "addition";

  const generator = MOCK_TEMPLATES[key] || MOCK_TEMPLATES.addition;
  const htmlContent = generator(topic, age, difficulty);
  const validation = validateGameCode(htmlContent);

  const titleEmoji = key === "subtraction" ? "💫" : key === "shapes" ? "🔍" : "🧮";
  const formattedTitle = `${topic.charAt(0).toUpperCase() + topic.slice(1)} ${titleEmoji}`;

  return {
    title: formattedTitle,
    topic,
    age,
    difficulty,
    htmlContent,
    promptUsed: prompt,
    isValid: validation.isValid,
    errors: validation.errors
  };
}
