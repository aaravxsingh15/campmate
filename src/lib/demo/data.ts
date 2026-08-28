/**
 * Deterministic demo dataset. Dates are computed relative to "now" so the
 * dashboard always looks alive. Clearly labelled as demo in the UI.
 */

function addDays(days: number, base = new Date()) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

export type DemoTopic = {
  id: string;
  unit: string;
  title: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "WEAK";
  confidence: number;
};

export type DemoCourse = {
  id: string;
  name: string;
  code: string;
  color: string;
  topics: DemoTopic[];
};

export type DemoTask = {
  id: string;
  title: string;
  courseId: string | null;
  type: "ASSIGNMENT" | "PROJECT" | "EXAM" | "LAB" | "STUDY_SESSION" | "CUSTOM";
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate: string | null;
  estimateMins: number | null;
};

export type DemoExam = {
  id: string;
  title: string;
  courseId: string;
  date: string;
  location: string;
};

export type DemoDocument = {
  id: string;
  filename: string;
  courseId: string | null;
  type: "SYLLABUS" | "LECTURE_NOTES" | "ASSIGNMENT" | "QUESTION_PAPER" | "LAB" | "TIMETABLE" | "OTHER";
  status: "PENDING" | "PROCESSING" | "READY" | "FAILED";
  sizeBytes: number;
  pageCount: number;
  createdAt: string;
};

export type DemoQuiz = {
  id: string;
  label: string;
  courseId: string;
  scorePct: number;
  correctCount: number;
  totalCount: number;
  createdAt: string;
};

function t(
  id: string,
  unit: string,
  title: string,
  status: DemoTopic["status"],
  confidence: number,
): DemoTopic {
  return { id, unit, title, status, confidence };
}

export const demoCourses: DemoCourse[] = [
  {
    id: "c-dm",
    name: "Discrete Mathematics",
    code: "MA202",
    color: "#ff6a1f",
    topics: [
      t("dm-1", "Unit 1", "Set Theory", "COMPLETED", 88),
      t("dm-2", "Unit 1", "Relations", "COMPLETED", 80),
      t("dm-3", "Unit 2", "Equivalence Relations", "IN_PROGRESS", 62),
      t("dm-4", "Unit 2", "Partial Orders", "IN_PROGRESS", 55),
      t("dm-5", "Unit 3", "Lattices", "WEAK", 34),
      t("dm-6", "Unit 3", "Boolean Algebra", "NOT_STARTED", 0),
      t("dm-7", "Unit 4", "Graph Theory", "WEAK", 40),
      t("dm-8", "Unit 4", "Trees & Spanning Trees", "NOT_STARTED", 0),
    ],
  },
  {
    id: "c-oop",
    name: "Object Oriented Programming",
    code: "CS204",
    color: "#4aa3ff",
    topics: [
      t("oop-1", "Unit 1", "Classes & Objects", "COMPLETED", 90),
      t("oop-2", "Unit 1", "Constructors & Destructors", "COMPLETED", 84),
      t("oop-3", "Unit 2", "Inheritance", "COMPLETED", 78),
      t("oop-4", "Unit 2", "Polymorphism", "IN_PROGRESS", 66),
      t("oop-5", "Unit 2", "Virtual Functions", "IN_PROGRESS", 58),
      t("oop-6", "Unit 3", "Templates", "WEAK", 32),
      t("oop-7", "Unit 3", "STL Containers", "NOT_STARTED", 0),
      t("oop-8", "Unit 3", "Exception Handling", "NOT_STARTED", 0),
    ],
  },
  {
    id: "c-dsa",
    name: "Data Structures & Algorithms",
    code: "CS206",
    color: "#c98bff",
    topics: [
      t("dsa-1", "Unit 1", "Arrays & Linked Lists", "COMPLETED", 85),
      t("dsa-2", "Unit 1", "Stacks & Queues", "COMPLETED", 82),
      t("dsa-3", "Unit 2", "Trees & BST", "IN_PROGRESS", 64),
      t("dsa-4", "Unit 2", "Heaps", "IN_PROGRESS", 60),
      t("dsa-5", "Unit 3", "Graphs & Traversal", "WEAK", 38),
      t("dsa-6", "Unit 3", "Shortest Paths", "NOT_STARTED", 0),
      t("dsa-7", "Unit 4", "Dynamic Programming", "NOT_STARTED", 0),
    ],
  },
  {
    id: "c-ml",
    name: "Machine Learning",
    code: "CS310",
    color: "#3fd6a8",
    topics: [
      t("ml-1", "Unit 1", "Linear Regression", "COMPLETED", 80),
      t("ml-2", "Unit 1", "Logistic Regression", "IN_PROGRESS", 62),
      t("ml-3", "Unit 2", "Decision Trees", "IN_PROGRESS", 54),
      t("ml-4", "Unit 2", "Bias-Variance Tradeoff", "WEAK", 36),
      t("ml-5", "Unit 3", "Neural Networks", "NOT_STARTED", 0),
      t("ml-6", "Unit 3", "Regularization", "NOT_STARTED", 0),
    ],
  },
  {
    id: "c-eco",
    name: "Engineering Economics",
    code: "HS201",
    color: "#f0a92c",
    topics: [
      t("eco-1", "Unit 1", "Demand & Supply", "COMPLETED", 92),
      t("eco-2", "Unit 1", "Elasticity", "COMPLETED", 86),
      t("eco-3", "Unit 2", "Cost Analysis", "COMPLETED", 80),
      t("eco-4", "Unit 2", "Market Structures", "IN_PROGRESS", 70),
      t("eco-5", "Unit 3", "Time Value of Money", "IN_PROGRESS", 65),
    ],
  },
  {
    id: "c-lab",
    name: "DSA Laboratory",
    code: "CS216",
    color: "#8b95a5",
    topics: [
      t("lab-1", "Week 1-3", "Implementation: Linked Lists", "COMPLETED", 88),
      t("lab-2", "Week 4-6", "Implementation: Trees", "IN_PROGRESS", 60),
      t("lab-3", "Week 7-9", "Implementation: Graphs", "NOT_STARTED", 0),
    ],
  },
];

export const demoExams: DemoExam[] = [
  { id: "e-dm", title: "Discrete Mathematics — Mid Sem", courseId: "c-dm", date: addDays(12), location: "Hall B, Block 3" },
  { id: "e-oop", title: "OOP — Mid Sem", courseId: "c-oop", date: addDays(18), location: "Hall A, Block 3" },
  { id: "e-dsa", title: "DSA — Mid Sem", courseId: "c-dsa", date: addDays(21), location: "Hall B, Block 3" },
  { id: "e-ml", title: "Machine Learning — Quiz 2", courseId: "c-ml", date: addDays(6), location: "Room 214" },
];

export const demoTasks: DemoTask[] = [
  { id: "task-1", title: "DSA Assignment 3 — Graph traversal", courseId: "c-dsa", type: "ASSIGNMENT", status: "IN_PROGRESS", priority: "HIGH", dueDate: addDays(1), estimateMins: 150 },
  { id: "task-2", title: "Economics Report — Market structures case study", courseId: "c-eco", type: "ASSIGNMENT", status: "TODO", priority: "HIGH", dueDate: addDays(4), estimateMins: 180 },
  { id: "task-3", title: "ML Project — Milestone 1 submission", courseId: "c-ml", type: "PROJECT", status: "TODO", priority: "MEDIUM", dueDate: addDays(9), estimateMins: 300 },
  { id: "task-4", title: "OOP Lab — Templates exercise", courseId: "c-oop", type: "LAB", status: "TODO", priority: "MEDIUM", dueDate: addDays(3), estimateMins: 90 },
  { id: "task-5", title: "Revise Lattices (Hasse diagrams)", courseId: "c-dm", type: "STUDY_SESSION", status: "TODO", priority: "HIGH", dueDate: addDays(2), estimateMins: 45 },
  { id: "task-6", title: "Discrete Maths — practice past paper 2023", courseId: "c-dm", type: "STUDY_SESSION", status: "TODO", priority: "MEDIUM", dueDate: addDays(8), estimateMins: 60 },
  { id: "task-7", title: "Submit DSA Lab record", courseId: "c-lab", type: "LAB", status: "DONE", priority: "LOW", dueDate: addDays(-3), estimateMins: 30 },
];

export const demoDocuments: DemoDocument[] = [
  { id: "d-1", filename: "Semester 5 Syllabus.pdf", courseId: null, type: "SYLLABUS", status: "READY", sizeBytes: 842_000, pageCount: 14, createdAt: addDays(-20) },
  { id: "d-2", filename: "OOP Notes — Unit 2.pdf", courseId: "c-oop", type: "LECTURE_NOTES", status: "READY", sizeBytes: 2_140_000, pageCount: 31, createdAt: addDays(-18) },
  { id: "d-3", filename: "Discrete Maths — Unit 3 Lattices.pdf", courseId: "c-dm", type: "LECTURE_NOTES", status: "READY", sizeBytes: 1_320_000, pageCount: 22, createdAt: addDays(-15) },
  { id: "d-4", filename: "DSA Assignment 3.pdf", courseId: "c-dsa", type: "ASSIGNMENT", status: "READY", sizeBytes: 190_000, pageCount: 3, createdAt: addDays(-6) },
  { id: "d-5", filename: "Mid Sem Exam Schedule.pdf", courseId: null, type: "TIMETABLE", status: "READY", sizeBytes: 96_000, pageCount: 1, createdAt: addDays(-4) },
  { id: "d-6", filename: "ML Previous Year Paper 2023.pdf", courseId: "c-ml", type: "QUESTION_PAPER", status: "PROCESSING", sizeBytes: 410_000, pageCount: 6, createdAt: addDays(0) },
];

export const demoQuizzes: DemoQuiz[] = [
  { id: "q-1", label: "OOP — Inheritance & Polymorphism", courseId: "c-oop", scorePct: 80, correctCount: 8, totalCount: 10, createdAt: addDays(-9) },
  { id: "q-2", label: "Discrete Maths — Relations", courseId: "c-dm", scorePct: 70, correctCount: 7, totalCount: 10, createdAt: addDays(-7) },
  { id: "q-3", label: "DSA — Trees & BST", courseId: "c-dsa", scorePct: 65, correctCount: 13, totalCount: 20, createdAt: addDays(-5) },
  { id: "q-4", label: "Discrete Maths — Lattices", courseId: "c-dm", scorePct: 40, correctCount: 4, totalCount: 10, createdAt: addDays(-2) },
  { id: "q-5", label: "ML — Regression", courseId: "c-ml", scorePct: 72, correctCount: 18, totalCount: 25, createdAt: addDays(-1) },
];

export const demoSemester = {
  id: "sem-demo",
  label: "Semester 5 · Autumn 2026",
  startDate: addDays(-45),
  endDate: addDays(75),
};

export const demoProfile = {
  name: "Aarav Sharma",
  college: "Indian Institute of Technology",
  program: "B.Tech Computer Science",
  year: 3,
  careerGoal: "Machine Learning Engineer",
  studyHours: 18,
};
