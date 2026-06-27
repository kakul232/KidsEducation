import { validateGameCode } from "./validator";

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
  addition: (_topic, _age, _difficulty) => `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: system-ui, sans-serif;
      text-align: center;
      padding: 10px;
      margin: 0;
      background: #fbf8f5;
      color: #333;
      user-select: none;
    }
    .container { max-width: 400px; margin: 0 auto; }
    h2 { margin: 10px 0; color: #4f46e5; }
    .instruction { font-size: 1.1rem; font-weight: bold; margin-bottom: 15px; }
    .marbles-area {
      display: flex;
      justify-content: center;
      gap: 15px;
      margin: 20px 0;
      flex-wrap: wrap;
    }
    .group {
      background: #fff;
      border: 3px dashed #a5b4fc;
      border-radius: 16px;
      padding: 12px;
      min-width: 100px;
      display: flex;
      justify-content: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    .plus { font-size: 2rem; align-self: center; font-weight: bold; color: #4f46e5; }
    .marble {
      width: 32px;
      height: 32px;
      background: radial-gradient(circle at 10px 10px, #818cf8, #4f46e5);
      border-radius: 50%;
      box-shadow: 0 4px 6px rgba(0,0,0,0.15);
    }
    .marble.orange {
      background: radial-gradient(circle at 10px 10px, #fb923c, #ea580c);
    }
    .options {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-top: 20px;
    }
    .btn {
      background: #ffffff;
      border: 3px solid #e2e8f0;
      border-bottom: 7px solid #e2e8f0;
      border-radius: 16px;
      padding: 15px;
      font-size: 1.5rem;
      font-weight: bold;
      cursor: pointer;
      color: #1e293b;
    }
    .btn:active {
      transform: translateY(4px);
      border-bottom-width: 3px;
    }
    .btn.correct { background: #d1fae5; border-color: #10b981; }
    .btn.incorrect { background: #fee2e2; border-color: #ef4444; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Addition Adventure 🧮</h2>
    <div class="instruction">Add the purple marbles and orange marbles!</div>
    <div class="marbles-area">
      <div class="group" id="grp1"></div>
      <div class="plus">+</div>
      <div class="group" id="grp2"></div>
    </div>
    <div class="options" id="opts"></div>
  </div>
  
  <script>
    let num1 = Math.floor(Math.random() * 4) + 1;
    let num2 = Math.floor(Math.random() * 4) + 1;
    let answer = num1 + num2;
    
    const grp1 = document.getElementById('grp1');
    const grp2 = document.getElementById('grp2');
    for(let i=0; i<num1; i++) {
      let m = document.createElement('div');
      m.className = 'marble';
      grp1.appendChild(m);
    }
    for(let i=0; i<num2; i++) {
      let m = document.createElement('div');
      m.className = 'marble orange';
      grp2.appendChild(m);
    }
    
    let options = new Set([answer]);
    while(options.size < 3) {
      options.add(Math.floor(Math.random() * 9) + 1);
    }
    let optionsArray = Array.from(options).sort((a,b) => a - b);
    
    const opts = document.getElementById('opts');
    optionsArray.forEach(val => {
      let b = document.createElement('button');
      b.className = 'btn';
      b.innerText = val;
      b.onclick = () => {
        if(val === answer) {
          b.className = 'btn correct';
          parent.postMessage({ type: 'game_complete', success: true, correctCount: 1, incorrectCount: 0 }, '*');
        } else {
          b.className = 'btn incorrect';
          parent.postMessage({ type: 'game_attempt', success: false }, '*');
        }
      };
      opts.appendChild(b);
    });
  </script>
</body>
</html>`,
  subtraction: (_topic, _age, _difficulty) => `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: system-ui, sans-serif;
      text-align: center;
      padding: 10px;
      margin: 0;
      background: #fbfafc;
      color: #333;
      user-select: none;
    }
    .container { max-width: 400px; margin: 0 auto; }
    h2 { margin: 10px 0; color: #ec4899; }
    .instruction { font-size: 1.1rem; font-weight: bold; margin-bottom: 15px; }
    .display-area {
      display: flex;
      justify-content: center;
      gap: 15px;
      margin: 20px 0;
      flex-wrap: wrap;
    }
    .star {
      font-size: 2.5rem;
      transition: opacity 0.3s;
    }
    .star.crossed {
      opacity: 0.25;
      text-decoration: line-through;
    }
    .options {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-top: 20px;
    }
    .btn {
      background: #ffffff;
      border: 3px solid #e2e8f0;
      border-bottom: 7px solid #e2e8f0;
      border-radius: 16px;
      padding: 15px;
      font-size: 1.5rem;
      font-weight: bold;
      cursor: pointer;
      color: #1e293b;
    }
    .btn:active {
      transform: translateY(4px);
      border-bottom-width: 3px;
    }
    .btn.correct { background: #d1fae5; border-color: #10b981; }
    .btn.incorrect { background: #fee2e2; border-color: #ef4444; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Star Subtraction 💫</h2>
    <div class="instruction" id="instr"></div>
    <div class="display-area" id="stars"></div>
    <div class="options" id="opts"></div>
  </div>
  
  <script>
    let num1 = Math.floor(Math.random() * 4) + 5; // 5 to 8
    let num2 = Math.floor(Math.random() * 3) + 1; // 1 to 3
    let answer = num1 - num2;
    
    document.getElementById('instr').innerText = "We have " + num1 + " stars. Take away " + num2 + " stars. How many are left?";
    
    const starsDiv = document.getElementById('stars');
    for(let i=0; i<num1; i++) {
      let s = document.createElement('span');
      s.className = i >= (num1 - num2) ? 'star crossed' : 'star';
      s.innerHTML = "⭐";
      starsDiv.appendChild(s);
    }
    
    let options = new Set([answer]);
    while(options.size < 3) {
      options.add(Math.max(1, Math.floor(Math.random() * 8)));
    }
    let optionsArray = Array.from(options).sort((a,b) => a - b);
    
    const opts = document.getElementById('opts');
    optionsArray.forEach(val => {
      let b = document.createElement('button');
      b.className = 'btn';
      b.innerText = val;
      b.onclick = () => {
        if(val === answer) {
          b.className = 'btn correct';
          parent.postMessage({ type: 'game_complete', success: true, correctCount: 1, incorrectCount: 0 }, '*');
        } else {
          b.className = 'btn incorrect';
          parent.postMessage({ type: 'game_attempt', success: false }, '*');
        }
      };
      opts.appendChild(b);
    });
  </script>
</body>
</html>`,
  shapes: (_topic, _age, _difficulty) => `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: system-ui, sans-serif;
      text-align: center;
      padding: 10px;
      margin: 0;
      background: #f0fdf4;
      color: #333;
      user-select: none;
    }
    .container { max-width: 400px; margin: 0 auto; }
    h2 { margin: 10px 0; color: #16a34a; }
    .instruction { font-size: 1.1rem; font-weight: bold; margin-bottom: 25px; }
    .shape-container {
      margin: 20px auto;
      width: 100px;
      height: 100px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .square {
      width: 90px;
      height: 90px;
      background: #3b82f6;
      border-radius: 8px;
    }
    .circle {
      width: 95px;
      height: 95px;
      background: #ef4444;
      border-radius: 50%;
    }
    .triangle {
      width: 0;
      height: 0;
      border-left: 50px solid transparent;
      border-right: 50px solid transparent;
      border-bottom: 90px solid #eab308;
    }
    .options {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-top: 30px;
    }
    .btn {
      background: #ffffff;
      border: 3px solid #e2e8f0;
      border-bottom: 7px solid #e2e8f0;
      border-radius: 16px;
      padding: 12px;
      font-size: 1.1rem;
      font-weight: bold;
      cursor: pointer;
      color: #1e293b;
    }
    .btn:active {
      transform: translateY(4px);
      border-bottom-width: 3px;
    }
    .btn.correct { background: #d1fae5; border-color: #10b981; }
    .btn.incorrect { background: #fee2e2; border-color: #ef4444; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Shape Detective 🔍</h2>
    <div class="instruction">What shape is this?</div>
    <div class="shape-container">
      <div id="targetShape"></div>
    </div>
    <div class="options" id="opts"></div>
  </div>
  
  <script>
    const shapes = ['Square', 'Circle', 'Triangle'];
    let randomIndex = Math.floor(Math.random() * shapes.length);
    let answer = shapes[randomIndex];
    
    const target = document.getElementById('targetShape');
    if (answer === 'Square') target.className = 'square';
    else if (answer === 'Circle') target.className = 'circle';
    else target.className = 'triangle';
    
    const opts = document.getElementById('opts');
    shapes.forEach(val => {
      let b = document.createElement('button');
      b.className = 'btn';
      b.innerText = val;
      b.onclick = () => {
        if(val === answer) {
          b.className = 'btn correct';
          parent.postMessage({ type: 'game_complete', success: true, correctCount: 1, incorrectCount: 0 }, '*');
        } else {
          b.className = 'btn incorrect';
          parent.postMessage({ type: 'game_attempt', success: false }, '*');
        }
      };
      opts.appendChild(b);
    });
  </script>
</body>
</html>`
};

export async function generateGame(
  subject: string,
  topic: string,
  age: number,
  difficulty: "Easy" | "Medium" | "Hard",
  apiKey?: string,
  customInstruction?: string
): Promise<GeneratedGameResponse> {
  let prompt = `Generate a single-file interactive educational HTML game for a child aged ${age} facing dyslexia.
Subject: ${subject}
Topic: ${topic}
Difficulty: ${difficulty}

Strict Constraints:
1. Return ONLY a valid JSON object in this format:
{
  "title": "Short Fun Title with Emoji",
  "htmlContent": "HTML source code string here"
}
2. The game must be mobile-first, touch-friendly, highly responsive, with spacious layouts, large text, and bright color contrasts.
3. Use a dyslexia-friendly design: no countdown timers, no negative text (use positive encouragement like "Great try! Let's try again" instead of "Wrong answer"), only positive reinforcement.
4. The game MUST report progress using parent.postMessage:
   - When correct answer / completed: parent.postMessage({ type: 'game_complete', success: true, correctCount: 1, incorrectCount: 0 }, '*')
   - When incorrect answer: parent.postMessage({ type: 'game_attempt', success: false }, '*')
5. Do not include external dependencies, CDNs, or scripts. Self-contained HTML, CSS and JS.
6. The HTML code must not contain any forbidden APIs: eval, new Function, fetch, XMLHttpRequest, WebSocket, document.cookie, navigator.mediaDevices, location.replace, etc.
7. Return ONLY raw JSON. No markdown backticks or wrapper.`;

  if (customInstruction && customInstruction.trim().length > 0) {
    prompt += `\n\nAdditional custom requirements/instructions from the teacher to incorporate: ${customInstruction}`;
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
      if (cleanText.startsWith("```")) {
        cleanText = cleanText.replace(/^```(json)?/, "");
        cleanText = cleanText.replace(/```$/, "");
        cleanText = cleanText.trim();
      }

      const parsed = JSON.parse(cleanText);
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
