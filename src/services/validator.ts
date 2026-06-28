export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateGameCode(htmlContent: string): ValidationResult {
  const errors: string[] = [];

  // Rules to block
  const rules = [
    { pattern: /eval\s*\(/g, name: "eval()" },
    { pattern: /new\s+Function/g, name: "Function() constructor" },
    { pattern: /fetch\s*\(/g, name: "fetch() network request" },
    { pattern: /new\s+XMLHttpRequest/g, name: "XMLHttpRequest network request" },
    { pattern: /new\s+WebSocket/g, name: "WebSocket network request" },
    { pattern: /document\.cookie/g, name: "Cookie access" },
    { pattern: /navigator\.mediaDevices/g, name: "Camera/Microphone access" },
    { pattern: /location\.replace/g, name: "Location redirection" }
  ];

  // Apply rules
  rules.forEach(rule => {
    if (rule.pattern.test(htmlContent)) {
      errors.push(`Forbidden API detected: ${rule.name}`);
    }
  });

  // Strict check on postMessage and parent access
  // We extract JS script contents and inline events to avoid false positives on HTML text content
  let jsCode = "";
  const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let scriptMatch;
  while ((scriptMatch = scriptRegex.exec(htmlContent)) !== null) {
    jsCode += scriptMatch[1] + "\n";
  }

  const inlineAttrRegex = /\bon[a-z]+\s*=\s*(['"])([\s\S]*?)\1/gi;
  let inlineMatch;
  while ((inlineMatch = inlineAttrRegex.exec(htmlContent)) !== null) {
    jsCode += inlineMatch[2] + "\n";
  }

  // Strip single-line and multi-line comments
  let cleanCode = jsCode.replace(/\/\/.*/g, "");
  cleanCode = cleanCode.replace(/\/\*[\s\S]*?\*\//g, "");

  // Match postMessage references in executable JS
  const parentMatches = cleanCode.match(/\bparent\b/g) || [];
  const postMessageMatches = cleanCode.match(/\bpostMessage\b/g) || [];

  // Match flexible parent.postMessage calls with type game_complete, game_attempt, or game_action
  const safePostMessagePattern = /(?:parent|window\.parent)\.postMessage\(\s*\{\s*[\s\S]*?['"]?type['"]?\s*:\s*['"](game_complete|game_attempt|game_action)['"][\s\S]*?\}\s*,\s*['"]\*['"]\s*\)/g;
  const safeMatches = cleanCode.match(safePostMessagePattern) || [];

  if (parentMatches.length > safeMatches.length) {
    errors.push("Forbidden parent window access detected. Only 'parent.postMessage' for game completion and attempts is permitted.");
  }

  if (postMessageMatches.length > safeMatches.length) {
    errors.push("Forbidden postMessage usage. Only sending 'game_complete' or 'game_attempt' to the parent is permitted.");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
