/* =========================================
   CODEGUARD AI
   Frontend Prototype
========================================= */


const codeInput =
    document.getElementById("codeInput");

const lineNumbers =
    document.getElementById("lineNumbers");

const results =
    document.getElementById("results");

const reviewSection =
    document.getElementById("reviewSection");

const analysisScreen =
    document.getElementById("analysisScreen");


/* =========================================
   SAMPLE CODE
========================================= */

const sampleCode = `const express = require("express");
const mysql = require("mysql");

const app = express();

const username = "admin";
const password = "admin123";

app.get("/user", (req, res) => {

    const userId = req.query.id;

    const query =
        "SELECT * FROM users WHERE id = " + userId;

    db.query(query, (error, result) => {

        if (error) {
            console.log(error);
        }

        eval(req.query.code);

        res.json(result);

    });

});

app.listen(3000);`;


/* =========================================
   LOAD SAMPLE
========================================= */

function loadSample() {

    codeInput.value = sampleCode;

    updateLineNumbers();

    focusReview();

}


/* =========================================
   FOCUS REVIEW
========================================= */

function focusReview() {

    reviewSection.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

    setTimeout(() => {

        codeInput.focus();

    }, 500);

}


/* =========================================
   CLEAR
========================================= */

function clearCode() {

    codeInput.value = "";

    updateLineNumbers();

    results.classList.add("hidden");

}


/* =========================================
   LINE NUMBERS
========================================= */

function updateLineNumbers() {

    const lines =
        codeInput.value.split("\n").length;

    let output = "";

    for (let i = 1; i <= lines; i++) {

        output += i + "\n";

    }

    lineNumbers.textContent =
        output;

}


/* =========================================
   SYNC SCROLL
========================================= */

codeInput.addEventListener(
    "scroll",
    function () {

        lineNumbers.scrollTop =
            codeInput.scrollTop;

    }
);


codeInput.addEventListener(
    "input",
    updateLineNumbers
);


/* =========================================
   ANALYSIS
========================================= */

function startAnalysis() {

    const code =
        codeInput.value.trim();

    if (!code) {

        alert(
            "Paste some code or load the demo before starting the review."
        );

        return;

    }


    reviewSection.classList.add("hidden");

    analysisScreen.classList.remove("hidden");

    analysisScreen.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });


    setTimeout(() => {

        const issues =
            analyzeCode(code);

        analysisScreen.classList.add("hidden");

        reviewSection.classList.remove("hidden");

        showResults(issues);

        results.classList.remove("hidden");

        results.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }, 2600);

}


/* =========================================
   CODE ANALYZER
========================================= */

function analyzeCode(code) {

    const issues = [];

    const lines =
        code.split("\n");


    lines.forEach(
        (line, index) => {

            const lineNumber =
                index + 1;

            const lower =
                line.toLowerCase();


            /* ==============================
               HARDCODED PASSWORD
            ============================== */

            if (
                (
                    lower.includes("password") ||
                    lower.includes("passwd")
                )
                &&
                (
                    line.includes("=")
                )
                &&
                (
                    line.includes('"') ||
                    line.includes("'")
                )
            ) {

                issues.push({

                    type: "security",

                    severity: "critical",

                    title:
                        "Hardcoded credential detected",

                    line:
                        lineNumber,

                    confidence:
                        96,

                    description:
                        "A password or credential appears to be stored directly in source code.",

                    suggestion:
                        "Move credentials into environment variables or a secure secret manager."

                });

            }


            /* ==============================
               EVAL
            ============================== */

            if (
                lower.includes("eval(")
            ) {

                issues.push({

                    type: "security",

                    severity: "critical",

                    title:
                        "Unsafe eval() usage",

                    line:
                        lineNumber,

                    confidence:
                        98,

                    description:
                        "Dynamically executing user-controlled code can lead to arbitrary code execution.",

                    suggestion:
                        "Remove eval() and use a safe, explicitly defined operation instead."

                });

            }


            /* ==============================
               SQL INJECTION
            ============================== */

            if (
                (
                    lower.includes("select") ||
                    lower.includes("insert") ||
                    lower.includes("update") ||
                    lower.includes("delete")
                )
                &&
                (
                    line.includes("+")
                )
            ) {

                issues.push({

                    type: "security",

                    severity: "critical",

                    title:
                        "Possible SQL injection",

                    line:
                        lineNumber,

                    confidence:
                        94,

                    description:
                        "SQL appears to be constructed through string concatenation.",

                    suggestion:
                        "Use parameterized queries or prepared statements."

                });

            }


            /* ==============================
               CONSOLE.LOG
            ============================== */

            if (
                lower.includes("console.log")
            ) {

                issues.push({

                    type: "code_smell",

                    severity: "low",

                    title:
                        "Debug logging detected",

                    line:
                        lineNumber,

                    confidence:
                        71,

                    description:
                        "Debug output may expose information or create unnecessary production logs.",

                    suggestion:
                        "Use a structured logging framework or remove unnecessary logging."

                });

            }


            /* ==============================
               LOOSE EQUALITY
            ============================== */

            if (
                line.includes("==") &&
                !line.includes("===")
            ) {

                issues.push({

                    type: "bug",

                    severity: "medium",

                    title:
                        "Loose equality comparison",

                    line:
                        lineNumber,

                    confidence:
                        82,

                    description:
                        "Loose equality can perform implicit type conversion and cause unexpected behavior.",

                    suggestion:
                        "Use strict equality (===) when comparing values."

                });

            }


            /* ==============================
               INNERHTML
            ============================== */

            if (
                lower.includes("innerhtml")
            ) {

                issues.push({

                    type: "security",

                    severity: "high",

                    title:
                        "Potential XSS sink",

                    line:
                        lineNumber,

                    confidence:
                        88,

                    description:
                        "Assigning untrusted content to innerHTML can create cross-site scripting vulnerabilities.",

                    suggestion:
                        "Prefer textContent or sanitize untrusted HTML before inserting it."

                });

            }


            /* ==============================
               TODO
            ============================== */

            if (
                lower.includes("todo")
            ) {

                issues.push({

                    type: "code_smell",

                    severity: "low",

                    title:
                        "Unresolved TODO",

                    line:
                        lineNumber,

                    confidence:
                        61,

                    description:
                        "This code contains a TODO marker that may indicate unfinished work.",

                    suggestion:
                        "Resolve the TODO or create a tracked development task."

                });

            }

        }
    );


    return issues;

}


/* =========================================
   CALCULATE RISK
========================================= */

function calculateRisk(issues) {

    let score = 0;


    issues.forEach(issue => {

        if (issue.severity === "critical") {

            score += 28;

        }

        else if (issue.severity === "high") {

            score += 20;

        }

        else if (issue.severity === "medium") {

            score += 10;

        }

        else {

            score += 4;

        }

    });


    return Math.min(score, 100);

}


/* =========================================
   SHOW RESULTS
========================================= */

function showResults(issues) {

    const score =
        calculateRisk(issues);


    let level = "SAFE";


    if (score >= 70) {

        level = "HIGH";

    }

    else if (score >= 40) {

        level = "MEDIUM";

    }

    else if (score > 0) {

        level = "LOW";

    }


    /* COUNTS */

    const security =
        issues.filter(
            i => i.type === "security"
        ).length;


    const bugs =
        issues.filter(
            i => i.type === "bug"
        ).length;


    const performance =
        issues.filter(
            i => i.type === "performance"
        ).length;


    const smells =
        issues.filter(
            i => i.type === "code_smell"
        ).length;


    /* BASIC RESULTS */

    document.getElementById(
        "riskScore"
    ).textContent = score;


    document.getElementById(
        "riskPercent"
    ).textContent = score + "%";


    document.getElementById(
        "riskLevel"
    ).textContent = level;


    document.getElementById(
        "securityCount"
    ).textContent = security;


    document.getElementById(
        "bugCount"
    ).textContent = bugs;


    document.getElementById(
        "performanceCount"
    ).textContent = performance;


    document.getElementById(
        "smellCount"
    ).textContent = smells;


    document.getElementById(
        "issueCount"
    ).textContent = issues.length;


    /* =====================================
       RISK BREAKDOWN
    ===================================== */

    const securityRisk =
        Math.min(security * 30, 100);

    const bugRisk =
        Math.min(bugs * 25, 100);

    const performanceRisk =
        Math.min(performance * 25, 100);

    const qualityRisk =
        Math.min(smells * 15, 100);


    setRiskBar(
        "securityBar",
        "securityRisk",
        securityRisk
    );

    setRiskBar(
        "bugBar",
        "bugRisk",
        bugRisk
    );

    setRiskBar(
        "performanceBar",
        "performanceRisk",
        performanceRisk
    );

    setRiskBar(
        "qualityBar",
        "qualityRisk",
        qualityRisk
    );


    /* =====================================
       RELEASE GATE
    ===================================== */

    const gateTitle =
        document.getElementById("gateTitle");

    const gateMessage =
        document.getElementById("gateMessage");

    const gateIcon =
        document.getElementById("gateIcon");


    if (score >= 70) {

        gateTitle.textContent =
            "RELEASE BLOCKED";

        gateMessage.textContent =
            "High-risk findings require attention before this code should be released.";

        gateIcon.textContent =
            "!";

    }

    else if (score >= 40) {

        gateTitle.textContent =
            "REVIEW REQUIRED";

        gateMessage.textContent =
            "Several findings should be reviewed before release.";

        gateIcon.textContent =
            "!";

    }

    else if (score > 0) {

        gateTitle.textContent =
            "LOW RISK";

        gateMessage.textContent =
            "Minor findings were detected. Review them before shipping.";

        gateIcon.textContent =
            "✓";

    }

    else {

        gateTitle.textContent =
            "RELEASE CLEAR";

        gateMessage.textContent =
            "No obvious high-risk issues were detected.";

        gateIcon.textContent =
            "✓";

    }


    /* =====================================
       ISSUE LIST
    ===================================== */

    const container =
        document.getElementById(
            "issuesContainer"
        );


    container.innerHTML = "";


    if (issues.length === 0) {

        container.innerHTML = `

            <div class="issue">

                <div class="issue-top">

                    <div class="issue-main">

                        <span
                            class="severity-dot low"
                        ></span>

                        <span class="issue-title">
                            No obvious issues detected
                        </span>

                    </div>

                    <span class="issue-badge low">
                        CLEAR
                    </span>

                </div>

                <p class="issue-description">
                    The current static checks did not identify
                    any obvious problems.
                </p>

            </div>

        `;

    }


    const topIssues =
        issues
            .sort(
                (a, b) =>
                    severityValue(b.severity)
                    -
                    severityValue(a.severity)
            )
            .slice(0, 5);


    topIssues.forEach(issue => {

        const element =
            document.createElement("div");


        element.className =
            "issue";


        element.innerHTML = `

            <div class="issue-top">

                <div class="issue-main">

                    <span
                        class="severity-dot ${issue.severity}"
                    ></span>

                    <span class="issue-title">
                        ${escapeHTML(issue.title)}
                    </span>

                    <span class="issue-line">
                        Line ${issue.line}
                    </span>

                </div>

                <span
                    class="issue-badge ${issue.severity}"
                >
                    ${issue.severity.toUpperCase()}
                </span>

            </div>


            <p class="issue-description">
                ${escapeHTML(issue.description)}
            </p>


            <div class="confidence">

                AI confidence:
                <strong>
                    ${issue.confidence}%
                </strong>

                ·
                ${issue.certainty || "Likely issue"}

            </div>

        `;


        container.appendChild(element);

    });


    /* =====================================
       AI INSIGHT
    ===================================== */

    const insightTitle =
        document.getElementById(
            "aiInsightTitle"
        );

    const insight =
        document.getElementById(
            "aiInsight"
        );


    if (issues.length === 0) {

        insightTitle.textContent =
            "Clean review detected";

        insight.textContent =
            "No obvious issues were detected by the current analysis rules. More advanced AI analysis can be added to inspect deeper logic and architectural risks.";

    }

    else {

        const critical =
            issues.filter(
                i => i.severity === "critical"
            ).length;


        if (critical > 0) {

            insightTitle.textContent =
                `${critical} critical finding${critical > 1 ? "s" : ""} require attention`;

            insight.textContent =
                "The analysis found security-sensitive patterns that could create significant release risk. Address the highest-confidence findings first.";

        }

        else {

            insightTitle.textContent =
                "Review findings before release";

            insight.textContent =
                "The detected issues are not necessarily all confirmed bugs. Use confidence and severity together when deciding what needs engineering attention.";

        }

    }

}


/* =========================================
   RISK BAR
========================================= */

function setRiskBar(
    barId,
    valueId,
    value
) {

    document.getElementById(
        valueId
    ).textContent = value;


    setTimeout(() => {

        document.getElementById(
            barId
        ).style.width =
            value + "%";

    }, 100);

}


/* =========================================
   SEVERITY VALUE
========================================= */

function severityValue(severity) {

    const values = {

        critical: 4,

        high: 3,

        medium: 2,

        low: 1

    };


    return values[severity] || 0;

}


/* =========================================
   NEW REVIEW
========================================= */

function newReview() {

    results.classList.add("hidden");

    codeInput.value = "";

    updateLineNumbers();

    reviewSection.scrollIntoView({
        behavior: "smooth"
    });

}


/* =========================================
   HTML ESCAPE
========================================= */

function escapeHTML(text) {

    return text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =========================================
   INITIALIZE
========================================= */

updateLineNumbers();