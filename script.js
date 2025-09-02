// server.js (FINAL, UPGRADED VERSION)
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const fetch = require("node-fetch");
const app = express();

// --- DATABASE (SQL) SETUP ---
const db = new sqlite3.Database('./tasks.db', (err) => {
    if (err) console.error("Database connection error:", err.message);
    else console.log("Connected to the SQLite database.");
});
db.run(`CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, description TEXT NOT NULL, is_completed INTEGER DEFAULT 0)`);

app.use(cors());
app.use(express.json());

// --- API ROUTES for OBJECTIVES (The Slate) ---

// GET all saved objectives
app.get("/tasks", (req, res) => {
    db.all("SELECT * FROM tasks ORDER BY id DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// POST a new objective to save it
app.post("/tasks", (req, res) => {
    const { description } = req.body;
    if (!description) return res.status(400).json({ error: "Description is required." });
    const sql = `INSERT INTO tasks (description, is_completed) VALUES (?, 0)`;
    db.run(sql, [description], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: this.lastID, description });
    });
});

// UPDATE an objective's status
app.put("/tasks/:id", (req, res) => {
    const { is_completed } = req.body;
    db.run(`UPDATE tasks SET is_completed = ? WHERE id = ?`, [is_completed, req.params.id], (err) => {
         if (err) return res.status(500).json({ error: err.message });
         res.json({ message: "Task updated" });
    });
});

// --- NEW, DEDICATED AI ROUTE (Query Assist) ---

// POST to this endpoint ONLY to get an AI query. It does NOT save anything.
app.post("/generate-query", async (req, res) => {
    const { description } = req.body;
    if (!description) return res.status(400).json({ error: "Description required for AI query." });

    const GEMINI_PROXY_URL = process.env.GEMINI_PROXY_URL;
    if (!GEMINI_PROXY_URL) return res.status(500).json({ error: "Gemini proxy URL is not configured." });

    const prompt = `Based on this data analyst task, write a generic SQL query. Format as one line. If not data-related, say "N/A". Task: "${description}"`;
    
    try {
        const proxyResponse = await fetch(GEMINI_PROXY_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt }),
        });
        const responseData = await proxyResponse.json();
        let generatedSql = "N/A";
        if (responseData.candidates && responseData.candidates[0].content) {
            generatedSql = responseData.candidates[0].content.parts[0].text.trim().replace(/\n/g, " ");
        }
        res.json({ generated_sql: generatedSql });
    } catch (error) {
        console.error("Error calling Gemini proxy:", error);
        res.status(500).json({ error: "Failed to connect to AI service." });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`To-Do List server running on port ${PORT}`));
