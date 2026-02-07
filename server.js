import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const DATA_DIR = path.join(__dirname, 'server-data');
const CHECKLIST_FILE = path.join(DATA_DIR, 'checklist.json');
const DATA_FILE = path.join(DATA_DIR, 'data.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// --- MIGRATION & INITIALIZATION ---
// Check if old checklist.json exists but new data.json does not
if (fs.existsSync(CHECKLIST_FILE) && !fs.existsSync(DATA_FILE)) {
    console.log("Migrating legacy checklist.json to data.json...");
    try {
        const oldData = JSON.parse(fs.readFileSync(CHECKLIST_FILE, 'utf8'));

        // Convert old structure to categories format
        const categories = [];
        if (oldData.written) {
            categories.push({ id: 'c1', label: '필기 (Written)', items: oldData.written });
        }
        if (oldData.practical) {
            categories.push({ id: 'c2', label: '실기 (Practical)', items: oldData.practical });
        }

        const initialData = {
            currentProjectId: 'p1',
            projects: [
                {
                    id: 'p1',
                    title: '2026 BIG DATA ANALYST',
                    subtitle: 'D-DAY DASHBOARD',
                    theme: 'neon-blue',
                    dDayConfig: [
                        { id: 'd1', label: '필기 시험', date: '2026-04-04T09:00:00', color: '--neon-cyan' },
                        { id: 'd2', label: '실기 시험', date: '2026-06-20T09:00:00', color: '--neon-pink' }
                    ],
                    categories: categories
                }
            ]
        };

        fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), 'utf8');
        // Rename old file to avoid confusion/re-migration
        fs.renameSync(CHECKLIST_FILE, path.join(DATA_DIR, 'checklist.old.json'));
        console.log("Migration complete.");
    } catch (err) {
        console.error("Migration failed:", err);
    }
}

// Default Data if nothing exists
const INITIAL_DATA = {
    currentProjectId: 'p1',
    projects: [
        {
            id: 'p1',
            title: '2026 BIG DATA ANALYST',
            subtitle: 'D-DAY DASHBOARD',
            theme: 'neon-blue',
            dDayConfig: [
                { id: 'd1', label: '필기 시험', date: '2026-04-04T09:00:00', color: '--neon-cyan' },
                { id: 'd2', label: '실기 시험', date: '2026-06-20T09:00:00', color: '--neon-pink' }
            ],
            categories: [
                {
                    id: 'c1',
                    label: '필기 (Written)',
                    items: [
                        {
                            id: 'w1',
                            label: '1과목: 빅데이터 분석 기획',
                            targetDate: '2026-01-31',
                            isExpanded: true,
                            subItems: [
                                { id: 'w1-1', label: '빅데이터의 이해', checked: false },
                                { id: 'w1-2', label: '데이터 거버넌스', checked: false }
                            ]
                        }
                    ]
                }
            ]
        }
    ]
};

// --- QUOTES LOGIC ---
const QUOTES = [
    "형님, 오늘도 열공입니다!",
    "빅분기 마스터가 머지않았습니다!",
    "데이터는 거짓말을 하지 않습니다. 형님의 노력도 마찬가지입니다.",
    "오늘 한 줄의 코드가 내일의 합격을 만듭니다.",
    "포기하지 않는 순간, 이미 합격입니다.",
    "꾸준함이 가장 강력한 알고리즘입니다.",
    "Error는 성장의 신호입니다. 디버깅하러 가시죠!",
    "형님, 2026년 빅데이터 분석기사 주인공은 형님입니다.",
    "Just Do. 데이터 분석.",
    "어제보다 똑똑해진 오늘의 나를 믿으세요."
];

function getDailyQuote() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);

    // Deterministic rotation based on day of year
    const quoteIndex = dayOfYear % QUOTES.length;
    return QUOTES[quoteIndex];
}

// --- API ENDPOINTS ---

// Get All Data
app.get('/api/data', (req, res) => {
    if (fs.existsSync(DATA_FILE)) {
        try {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            res.json(JSON.parse(data));
        } catch (err) {
            console.error("Error reading data:", err);
            res.json(INITIAL_DATA);
        }
    } else {
        res.json(INITIAL_DATA);
    }
});

// Save All Data
app.post('/api/data', (req, res) => {
    try {
        const newData = req.body;
        fs.writeFileSync(DATA_FILE, JSON.stringify(newData, null, 2), 'utf8');
        res.json({ success: true, message: "Data saved successfully" });
    } catch (err) {
        console.error("Error saving data:", err);
        res.status(500).json({ success: false, message: "Failed to save data" });
    }
});

// Legacy Endpoint Redirect (Optional, or just remove)
app.get('/api/checklist', (req, res) => {
    res.status(410).json({ message: "Endpoint deprecated. Use /api/data" });
});

// Get Daily Quote
app.get('/api/quote', (req, res) => {
    const quote = getDailyQuote();
    res.json({ quote });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
