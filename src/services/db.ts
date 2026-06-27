import { db } from "./firebase";
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc } from "firebase/firestore";

export interface Student {
  id: string;
  name: string;
  avatar: string;
  stars: number;
  streak: number;
  lastActive: string;
}

export interface ActivityLog {
  id: string;
  studentId: string;
  studentName: string;
  gameId: string;
  gameTitle: string;
  startTime: string;
  finishTime: string;
  duration: number; // in seconds
  attempts: number;
  correctAnswers: number;
  incorrectAnswers: number;
  hintsUsed: number;
  completionRate: number; // 0 to 100
  rewardEarned: string; // e.g. "⭐ Star"
  device: string;
  browser: string;
}

export interface Game {
  id: string;
  title: string;
  topic: string;
  subject: string;
  age: number;
  difficulty: "Easy" | "Medium" | "Hard";
  htmlContent: string;
  published: boolean;
  createdAt: string;
  assignedStudentId?: string;
}

// Initial default games to populate if none exist
const DEFAULT_GAMES: Game[] = [
  {
    id: "marble-add",
    title: "🔵 Marble Addition",
    topic: "Addition",
    subject: "Mathematics",
    age: 5,
    difficulty: "Easy",
    published: true,
    createdAt: new Date().toISOString(),
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: system-ui, sans-serif;
      text-align: center;
      padding: 10px;
      margin: 0;
      background: #fdfefe;
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
      background: #eef2f6;
      border: 3px dashed #cbd5e1;
      border-radius: 16px;
      padding: 12px;
      min-width: 100px;
      display: flex;
      justify-content: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    .plus { font-size: 2rem; align-self: center; font-weight: bold; color: #64748b; }
    .marble {
      width: 28px;
      height: 28px;
      background: radial-gradient(circle at 8px 8px, #38bdf8, #0284c7);
      border-radius: 50%;
      box-shadow: 0 4px 6px rgba(0,0,0,0.15);
    }
    .marble.red {
      background: radial-gradient(circle at 8px 8px, #fca5a5, #dc2626);
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
    <h2>Marble Addition 🧮</h2>
    <div class="instruction">How many marbles are there altogether?</div>
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
    
    // Draw marbles
    const grp1 = document.getElementById('grp1');
    const grp2 = document.getElementById('grp2');
    for(let i=0; i<num1; i++) {
      let m = document.createElement('div');
      m.className = 'marble';
      grp1.appendChild(m);
    }
    for(let i=0; i<num2; i++) {
      let m = document.createElement('div');
      m.className = 'marble red';
      grp2.appendChild(m);
    }
    
    // Set options
    let options = new Set([answer]);
    while(options.size < 3) {
      options.add(Math.floor(Math.random() * 8) + 1);
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
          // Friendly feedback triggered in parent, but let's notify attempt
          parent.postMessage({ type: 'game_attempt', success: false }, '*');
        }
      };
      opts.appendChild(b);
    });
  </script>
</body>
</html>`
  },
  {
    id: "balloon-count",
    title: "🎈 Balloon Counting",
    topic: "Counting",
    subject: "Mathematics",
    age: 5,
    difficulty: "Easy",
    published: true,
    createdAt: new Date().toISOString(),
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: system-ui, sans-serif;
      text-align: center;
      padding: 10px;
      margin: 0;
      background: #fdfefe;
      color: #333;
      user-select: none;
    }
    .container { max-width: 400px; margin: 0 auto; }
    h2 { margin: 10px 0; color: #0ea5e9; }
    .instruction { font-size: 1.1rem; font-weight: bold; margin-bottom: 15px; }
    .balloon-area {
      display: flex;
      justify-content: center;
      gap: 15px;
      margin: 25px 0;
      min-height: 120px;
    }
    .balloon {
      width: 40px;
      height: 50px;
      background: #ff7b90;
      border-radius: 50% 50% 50% 50% / 40% 40% 60% 60%;
      position: relative;
      animation: float 2s infinite ease-in-out alternate;
    }
    .balloon::after {
      content: "";
      position: absolute;
      bottom: -6px;
      left: 17px;
      border-left: 3px solid transparent;
      border-right: 3px solid transparent;
      border-top: 6px solid #ff7b90;
    }
    .balloon-string {
      width: 2px;
      height: 25px;
      background: #cbd5e1;
      position: absolute;
      bottom: -30px;
      left: 19px;
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
    @keyframes float {
      0% { transform: translateY(0) rotate(-3deg); }
      100% { transform: translateY(-10px) rotate(3deg); }
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Balloon Counting 🎈</h2>
    <div class="instruction">Count the balloons floating in the air!</div>
    <div class="balloon-area" id="balloons"></div>
    <div class="options" id="opts"></div>
  </div>
  
  <script>
    let answer = Math.floor(Math.random() * 5) + 1;
    const colors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
    
    // Draw balloons
    const bArea = document.getElementById('balloons');
    for(let i=0; i<answer; i++) {
      let b = document.createElement('div');
      b.className = 'balloon';
      let col = colors[i % colors.length];
      b.style.background = col;
      b.style.animationDelay = (i * 0.3) + 's';
      
      // Inject pseudo-style for triangle helper
      let style = document.createElement('style');
      style.innerHTML = \`.balloon:nth-child(\${i+1})::after { border-top-color: \${col}; }\`;
      document.head.appendChild(style);
      
      let string = document.createElement('div');
      string.className = 'balloon-string';
      b.appendChild(string);
      bArea.appendChild(b);
    }
    
    // Set options
    let options = new Set([answer]);
    while(options.size < 3) {
      options.add(Math.floor(Math.random() * 6) + 1);
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
</html>`
  },
  {
    id: "fruit-basket",
    title: "🍎 Fruit Basket",
    topic: "Counting",
    subject: "Mathematics",
    age: 6,
    difficulty: "Easy",
    published: true,
    createdAt: new Date().toISOString(),
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: system-ui, sans-serif;
      text-align: center;
      padding: 10px;
      margin: 0;
      background: #fdfefe;
      color: #333;
      user-select: none;
    }
    .container { max-width: 400px; margin: 0 auto; }
    h2 { margin: 10px 0; color: #10b981; }
    .instruction { font-size: 1.1rem; font-weight: bold; margin-bottom: 15px; }
    .basket {
      background: #f5e6d3;
      border: 4px solid #b45309;
      border-radius: 0 0 100px 100px;
      padding: 30px 20px;
      margin: 20px auto;
      width: 220px;
      display: flex;
      justify-content: center;
      gap: 10px;
      flex-wrap: wrap;
      box-shadow: inset 0 10px 10px rgba(0,0,0,0.1);
    }
    .fruit {
      font-size: 2.2rem;
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
    <h2>Fruit Basket 🍎</h2>
    <div class="instruction">How many fruits are in the basket?</div>
    <div class="basket" id="basket"></div>
    <div class="options" id="opts"></div>
  </div>
  
  <script>
    let answer = Math.floor(Math.random() * 5) + 3; // 3 to 7
    const fruits = ['🍎', '🍊', '🍌', '🍐', '🍓'];
    
    const bArea = document.getElementById('basket');
    for(let i=0; i<answer; i++) {
      let f = document.createElement('span');
      f.className = 'fruit';
      f.innerText = fruits[Math.floor(Math.random() * fruits.length)];
      bArea.appendChild(f);
    }
    
    // Set options
    let options = new Set([answer]);
    while(options.size < 3) {
      options.add(Math.floor(Math.random() * 8) + 2);
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
</html>`
  }
];

export const LocalDB = {
  async init() {
    try {
      const snap = await getDocs(collection(db, "games"));
      if (snap.empty) {
        // Pre-populate Firestore with standard games
        for (const game of DEFAULT_GAMES) {
          await setDoc(doc(db, "games", game.id), game);
        }
        console.log("Firestore games collection pre-populated successfully.");
      }
    } catch (e) {
      console.warn("Unable to reach Firestore during initialization, relying on offline localCache.");
    }
  },

  // Students CRUD
  async getStudents(): Promise<Student[]> {
    try {
      const snap = await getDocs(collection(db, "students"));
      return snap.docs.map(doc => doc.data() as Student);
    } catch (e) {
      console.error("Firestore getStudents failed", e);
      return [];
    }
  },

  async getStudent(id: string): Promise<Student | undefined> {
    try {
      const snap = await getDoc(doc(db, "students", id));
      return snap.exists() ? (snap.data() as Student) : undefined;
    } catch (e) {
      console.error("Firestore getStudent failed", e);
      return undefined;
    }
  },

  async saveStudent(student: Student): Promise<void> {
    try {
      await setDoc(doc(db, "students", student.id), student);
    } catch (e) {
      console.error("Firestore saveStudent failed", e);
    }
  },

  // Games CRUD
  async getGames(): Promise<Game[]> {
    try {
      const snap = await getDocs(collection(db, "games"));
      return snap.docs.map(doc => doc.data() as Game);
    } catch (e) {
      console.error("Firestore getGames failed", e);
      return [];
    }
  },

  async getGame(id: string): Promise<Game | undefined> {
    try {
      const snap = await getDoc(doc(db, "games", id));
      return snap.exists() ? (snap.data() as Game) : undefined;
    } catch (e) {
      console.error("Firestore getGame failed", e);
      return undefined;
    }
  },

  async saveGame(game: Game): Promise<void> {
    try {
      await setDoc(doc(db, "games", game.id), game);
    } catch (e) {
      console.error("Firestore saveGame failed", e);
    }
  },

  async deleteGame(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, "games", id));
    } catch (e) {
      console.error("Firestore deleteGame failed", e);
    }
  },

  // Analytics Logs
  async getLogs(): Promise<ActivityLog[]> {
    try {
      const snap = await getDocs(collection(db, "analytics"));
      return snap.docs.map(doc => doc.data() as ActivityLog);
    } catch (e) {
      console.error("Firestore getLogs failed", e);
      return [];
    }
  },

  async saveLog(log: ActivityLog): Promise<void> {
    try {
      await setDoc(doc(db, "analytics", log.id), log);
    } catch (e) {
      console.error("Firestore saveLog failed", e);
    }
  }
};

export default LocalDB;
