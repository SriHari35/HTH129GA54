const OpenAI = require("openai");
require("dotenv").config();

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();
const PORT = 3000;

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Health check
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "CodeGuard AI Backend is running 🚀"
    });
});

// AI Code Review
app.post("/api/review", async (req, res) => {
    try {
        const { code, language } = req.body;

        if (!code || !code.trim()) {
            return res.status(400).json({
                success: false,
                message: "Code is required."
            });
        }

        const prompt = `
You are CodeGuard AI, an expert software security and code-review assistant.

Analyze the following ${language || "programming"} code.

Identify:
1. Security vulnerabilities
2. Bugs and possible runtime errors
3. Performance problems
4. Code quality issues
5. Maintainability problems

For every issue provide:
- title
- severity: Critical, High, Medium, Low, or Info
- category
- line number if identifiable
- explanation
- recommended fix

Also provide:
- overall risk score from 0 to 100
- short summary
- security score
- bug score
- performance score
- quality score

Return ONLY valid JSON using this structure:

{
  "summary": "short summary",
  "riskScore": 0,
  "securityScore": 0,
  "bugScore": 0,
  "performanceScore": 0,
  "qualityScore": 0,
  "issues": [
    {
      "title": "",
      "severity": "",
      "category": "",
      "line": 0,
      "explanation": "",
      "fix": ""
    }
  ]
}

CODE TO REVIEW:

${code}
`;

        const response = await openai.responses.create({
            model: "gpt-5.6-terra",
            reasoning: {
                effort: "medium"
            },
            input: prompt
        });

        const output = response.output_text;

        let result;

        try {
            result = JSON.parse(output);
        } catch (parseError) {
            return res.status(500).json({
                success: false,
                message: "AI returned an invalid JSON response.",
                raw: output
            });
        }

        res.json({
            success: true,
            result
        });

    } catch (error) {
        console.error("AI review error:", error);

        res.status(500).json({
            success: false,
            message: "AI review failed.",
            error: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`CodeGuard AI Backend running at http://localhost:${PORT}`);
});