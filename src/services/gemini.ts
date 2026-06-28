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
  originalHtml?: string
): Promise<GeneratedGameResponse> {
  let prompt = `Generate a single-file interactive educational HTML game for a child aged ${age} facing dyslexia.
Subject: ${subject}
Topic: ${topic}
Difficulty: ${difficulty}

Here are reference examples of high-quality, verified HTML games from our games folder showing how the layout, mobile-first touch/swipe controls (direct canvas gestures, no D-pad), aspect ratios, and event triggers should be implemented:

Strict Constraints:
1. Return ONLY a valid JSON object in this format:
{
  "title": "Short Fun Title starting with a relevant emoji first (e.g., '🐍 Snake Math Adventure', '🌌 Cosmic Counting', '🐠 Deep Sea Addition')",
  "htmlContent": "HTML source code string here"
}
2. The game must be designed specifically for a vertical mobile portrait screen (aspect ratio 9:16 or 3:4) and MUST utilize the full viewport height and width of the sandbox window with ZERO unused white space or empty gaps at the bottom. To guarantee this, the HTML, body, and outer wrap elements must have: 'height: 100%', 'margin: 0', 'padding: 10px', 'box-sizing: border-box', 'display: flex', 'flex-direction: column', and 'justify-content: space-between' or 'space-around'. The main game board / interactive play area (such as balloon popping grids, drop boxes, or sliding canvas) must expand dynamically using 'flex: 1' or 'flex-grow: 1' to occupy all vertical screen height between the header and bottom settings. Never restrict the play board with small fixed heights. Scale buttons, cards, options, and items large to occupy the layout fully.
3. Use a dyslexia-friendly design: no countdown timers, no negative text (use positive encouragement like "Great try! Let's try again" instead of "Wrong answer"), only positive reinforcement.
4. The game MUST support rounds and report progress using parent.postMessage:
   - Action Logging: For every single task or question answered by the student, immediately post a details message to the parent: parent.postMessage({ type: 'game_action', success: true/false, question: 'A brief text of the question (e.g. "3 + 5?")', answer: 'The text of the chosen answer (e.g. "8")' }, '*'). You must report this action details for both correct and incorrect answers.
   - Rounds Limit: ${rounds === "infinite" ? "Infinite rounds (continuous gameplay). Keep generating new tasks/questions loop endlessly, sending parent.postMessage({ type: 'game_complete', success: true, correctCount: 1, incorrectCount: 0 }, '*') after each correct answer." : `exactly ${rounds} round(s). The game must display round progress clearly on screen (e.g. 'Round 1 of ${rounds}'). ONLY send parent.postMessage({ type: 'game_complete', success: true, correctCount: ${rounds}, incorrectCount: X }, '*') after the user successfully completes the final round.`}
   - Incorrect answers: parent.postMessage({ type: 'game_attempt', success: false }, '*') after any incorrect attempt.
5. Do not include external dependencies, CDNs, or scripts. Self-contained HTML, CSS and JS.
6. The HTML code must not contain any forbidden APIs: eval, new Function, fetch, XMLHttpRequest, WebSocket, document.cookie, navigator.mediaDevices, location.replace, etc.
7. Return ONLY raw JSON. No markdown backticks or wrapper.
8. The game layout must NOT be wrapped inside a centered card, bordered box container, or frame that leaves margins or borders on the sides or bottom of the screen. The background and interactive content must span 100% of the screen width and height directly to ensure an immersive full-bleed game display.
9. The game MUST be highly animated and highly interactive, featuring rich visual effects (such as bouncing items, popping shapes, floating assets, CSS keyframe micro-animations, color gradients, interactive hover/active states, and slide transitions) to captivate the child's attention and keep them actively engaged throughout the play experience.
10. The game MUST show visual, animated feedback for each task/question outcome: on correct answers, temporarily overlay floating animations with positive texts like "Hurray! 🎉", "Yeahhh! 🌟", or "Awesome! 🎈"; on incorrect attempts, temporarily overlay friendly encouragement like "boo... Try again! 🧸" or "Oops! Keep trying! ❤️". Make sure all overlays are large, colorful, centered, and fully mobile-friendly.`;

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
