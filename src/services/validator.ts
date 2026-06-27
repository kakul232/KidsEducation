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
  // We allow `parent.postMessage({ type: 'game_complete'` and `parent.postMessage({ type: 'game_attempt'` but block other parent / postMessage calls
  
  // Find any occurrence of parent or postMessage
  const parentMatches = htmlContent.match(/parent/g) || [];
  const postMessageMatches = htmlContent.match(/postMessage/g) || [];

  // We check if they are part of the safe allowed format
  const safeCompletePattern = /parent\.postMessage\(\s*\{\s*type:\s*['"]game_complete['"]/g;
  const safeAttemptPattern = /parent\.postMessage\(\s*\{\s*type:\s*['"]game_attempt['"]/g;

  const safeCompleteMatches = htmlContent.match(safeCompletePattern) || [];
  const safeAttemptMatches = htmlContent.match(safeAttemptPattern) || [];
  const totalSafeMatches = safeCompleteMatches.length + safeAttemptMatches.length;

  if (parentMatches.length > totalSafeMatches) {
    errors.push("Forbidden parent window access detected. Only 'parent.postMessage' for game completion and attempts is permitted.");
  }

  if (postMessageMatches.length > totalSafeMatches) {
    errors.push("Forbidden postMessage usage. Only sending 'game_complete' or 'game_attempt' to the parent is permitted.");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
