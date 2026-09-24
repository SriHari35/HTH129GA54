/* =========================================
   CODEGUARD AI
   Frontend Prototype
========================================= */


/* =========================================
   DOM ELEMENTS
========================================= */

const codeInput = document.getElementById("codeInput");
const lineNumbers = document.getElementById("lineNumbers");
const results = document.getElementById("results");
const reviewSection = document.getElementById("reviewSection");
const analysisScreen = document.getElementById("analysisScreen");


/* =========================================
   STORAGE
========================================= */

const CODEGUARD_STORAGE = "codeguard_reviews";
const CODEGUARD_SETTINGS = "codeguard_settings";


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

    if (!codeInput) return;

    codeInput.value = sampleCode;

    updateLineNumbers();

    focusReview();
}


/* =========================================
   FOCUS REVIEW
========================================= */

function focusReview() {

    if (!reviewSection) return;

    reviewSection.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

    setTimeout(() => {

        if (codeInput) {
            codeInput.focus();
        }

    }, 500);
}


/* =========================================
   CLEAR CODE
========================================= */

function clearCode() {

    if (!codeInput) return;

    codeInput.value = "";

    updateLineNumbers();

    if (results) {
        results.classList.add("hidden");
    }
}


/* =========================================
   LINE NUMBERS
========================================= */

function updateLineNumbers() {

    if (!codeInput || !lineNumbers) return;

    const lines =
        codeInput.value.split("\n").length;

    let output = "";

    for (let i = 1; i <= lines; i++) {
        output += i + "\n";
    }

    lineNumbers.textContent = output;
}


/* =========================================
   EDITOR EVENTS
========================================= */

if (codeInput) {

    codeInput.addEventListener(
        "scroll",
        function () {

            if (lineNumbers) {
                lineNumbers.scrollTop =
                    codeInput.scrollTop;
            }

        }
    );

    codeInput.addEventListener(
        "input",
        updateLineNumbers
    );
}


/* =========================================
   START ANALYSIS
========================================= */

function startAnalysis() {

    if (!codeInput) return;

    const code =
        codeInput.value.trim();

    if (!code) {

        alert(
            "Paste some code or load the demo before starting the review."
        );

        return;
    }

    if (reviewSection) {
        reviewSection.classList.add("hidden");
    }

    if (analysisScreen) {

        analysisScreen.classList.remove("hidden");

        analysisScreen.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

    }

    setTimeout(() => {

        const issues =
            analyzeCode(code);

        if (analysisScreen) {
            analysisScreen.classList.add("hidden");
        }

        if (reviewSection) {
            reviewSection.classList.remove("hidden");
        }

        showResults(issues);

        saveCurrentCodeReview(code, issues);

        if (results) {

            results.classList.remove("hidden");

            results.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }

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
                line.includes("=")
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
                line.includes("+")
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
                        "TODO item detected",

                    line:
                        lineNumber,

                    confidence:
                        65,

                    description:
                        "This code contains an unfinished task or reminder.",

                    suggestion:
                        "Complete the task or remove the TODO before release."

                });

            }

        }
    );


    return issues;
}


/* =========================================
   RISK CALCULATION
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

    let riskLevel = "SAFE";

    if (score >= 70) {
        riskLevel = "HIGH";
    }

    else if (score >= 40) {
        riskLevel = "MEDIUM";
    }

    else if (score > 0) {
        riskLevel = "LOW";
    }


    /* =====================================
       MAIN SCORE
    ===================================== */

    setText("riskScore", score);
    setText("riskPercent", score + "%");
    setText("riskLevel", riskLevel);


    /* =====================================
       COUNTS
    ===================================== */

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


    setText("securityCount", security);
    setText("bugCount", bugs);
    setText("performanceCount", performance);
    setText("smellCount", smells);
    setText("issueCount", issues.length);


    /* =====================================
       REVIEW PAGE CARDS
    ===================================== */

    setText("security", security);
    setText("bugs", bugs);
    setText("performance", performance);
    setText("smells", smells);


    /* =====================================
       RISK BARS
    ===================================== */

    const securityRisk =
        Math.min(security * 25, 100);

    const bugRisk =
        Math.min(bugs * 25, 100);

    const performanceRisk =
        Math.min(performance * 25, 100);

    const qualityRisk =
        Math.min(smells * 20, 100);


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

        setElementText(
            gateTitle,
            "RELEASE BLOCKED"
        );

        setElementText(
            gateMessage,
            "Critical security or code risks were detected. Resolve the issues before release."
        );

        setElementText(
            gateIcon,
            "✕"
        );

    }

    else if (score >= 40) {

        setElementText(
            gateTitle,
            "REVIEW REQUIRED"
        );

        setElementText(
            gateMessage,
            "Several risks were detected. Review the findings before releasing."
        );

        setElementText(
            gateIcon,
            "!"
        );

    }

    else if (score > 0) {

        setElementText(
            gateTitle,
            "LOW RISK"
        );

        setElementText(
            gateMessage,
            "Some minor issues were detected. Review them before production."
        );

        setElementText(
            gateIcon,
            "!"
        );

    }

    else {

        setElementText(
            gateTitle,
            "RELEASE CLEAR"
        );

        setElementText(
            gateMessage,
            "No obvious security or quality issues were detected."
        );

        setElementText(
            gateIcon,
            "✓"
        );

    }


    /* =====================================
       ISSUE LIST
    ===================================== */

    const issuesContainer =
        document.getElementById(
            "issuesContainer"
        );

    if (issuesContainer) {

        issuesContainer.innerHTML = "";

        if (issues.length === 0) {

            issuesContainer.innerHTML = `
                <div class="empty-state">
                    <strong>No obvious issues detected</strong>
                    <p>Your code passed the current CodeGuard checks.</p>
                </div>
            `;

        }

        else {

            const sortedIssues =
                [...issues].sort(
                    (a, b) =>
                        severityValue(b.severity) -
                        severityValue(a.severity)
                );

            sortedIssues
                .slice(0, 5)
                .forEach(issue => {

                    const item =
                        document.createElement("div");

                    item.className =
                        "issue-item";

                    item.innerHTML = `
                        <div class="issue-main">

                            <span class="severity-dot ${escapeHTML(issue.severity)}"></span>

                            <div>
                                <strong>
                                    ${escapeHTML(issue.title)}
                                </strong>

                                <small>
                                    Line ${issue.line}
                                </small>
                            </div>

                        </div>

                        <div class="issue-meta">

                            <span class="severity-badge">
                                ${escapeHTML(issue.severity.toUpperCase())}
                            </span>

                            <span>
                                ${issue.confidence}% confidence
                            </span>

                        </div>

                        <p>
                            ${escapeHTML(issue.description)}
                        </p>

                        <small>
                            Suggested fix:
                            ${escapeHTML(issue.suggestion)}
                        </small>
                    `;

                    issuesContainer.appendChild(item);

                });

        }

    }


    /* =====================================
       AI INSIGHT
    ===================================== */

    const aiInsightTitle =
        document.getElementById(
            "aiInsightTitle"
        );

    const aiInsight =
        document.getElementById(
            "aiInsight"
        );


    if (issues.length === 0) {

        setElementText(
            aiInsightTitle,
            "Clean review detected"
        );

        setElementText(
            aiInsight,
            "No obvious issues were detected by the current static analysis rules."
        );

    }

    else {

        const critical =
            issues.filter(
                i => i.severity === "critical"
            ).length;

        if (critical > 0) {

            setElementText(
                aiInsightTitle,
                `${critical} critical finding${critical > 1 ? "s" : ""} detected`
            );

            setElementText(
                aiInsight,
                "The review identified high-impact security concerns that should be investigated before release."
            );

        }

        else {

            setElementText(
                aiInsightTitle,
                "Review findings before release"
            );

            setElementText(
                aiInsight,
                "CodeGuard detected potential issues. Static analysis findings should be verified by the developer."
            );

        }

    }

}


/* =========================================
   HELPER: SET TEXT
========================================= */

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent = value;
    }

}


function setElementText(element, value) {

    if (element) {
        element.textContent = value;
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

    const bar =
        document.getElementById(barId);

    const valueElement =
        document.getElementById(valueId);


    if (valueElement) {
        valueElement.textContent =
            value + "%";
    }

    if (bar) {

        setTimeout(() => {

            bar.style.width =
                value + "%";

        }, 100);

    }

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

    if (results) {
        results.classList.add("hidden");
    }

    if (codeInput) {
        codeInput.value = "";
        updateLineNumbers();
    }

    if (reviewSection) {

        reviewSection.scrollIntoView({
            behavior: "smooth"
        });

    }

}


/* =========================================
   HTML ESCAPE
========================================= */

function escapeHTML(text) {

    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =========================================
   REVIEW STORAGE
========================================= */

function getStoredReviews() {

    try {

        return JSON.parse(
            localStorage.getItem(
                CODEGUARD_STORAGE
            )
        ) || [];

    }

    catch (error) {

        return [];

    }

}


function saveStoredReviews(reviews) {

    localStorage.setItem(
        CODEGUARD_STORAGE,
        JSON.stringify(reviews)
    );

}


function addStoredReview(review) {

    const reviews =
        getStoredReviews();

    reviews.unshift(review);

    saveStoredReviews(reviews);

}


function saveCurrentCodeReview(
    code,
    issues
) {

    const score =
        calculateRisk(issues);

    addStoredReview({

        id:
            "review_" + Date.now(),

        type:
            "CODE",

        file:
            "source-code",

        date:
            new Date().toLocaleString(),

        bugs:
            issues.filter(
                i => i.type === "bug"
            ).length,

        security:
            issues.filter(
                i => i.type === "security"
            ).length,

        performance:
            issues.filter(
                i => i.type === "performance"
            ).length,

        smells:
            issues.filter(
                i => i.type === "code_smell"
            ).length,

        total:
            issues.length,

        risk:
            score,

        code:
            code

    });

}


/* =========================================
   GITHUB PR DEMO
========================================= */

function demoPR() {

    const repository =
        document.getElementById(
            "repository"
        );

    const prNumber =
        document.getElementById(
            "prNumber"
        );

    const branch =
        document.getElementById(
            "branch"
        );

    const message =
        document.getElementById(
            "prMessage"
        );


    if (repository) {
        repository.value =
            "codeguard/demo-project";
    }

    if (prNumber) {
        prNumber.value = "42";
    }

    if (branch) {
        branch.value = "main";
    }

    if (message) {

        message.innerHTML =
            "Demo Pull Request loaded. Click <strong>Analyze Pull Request</strong> to continue.";

    }

}


/* =========================================
   ANALYZE PR
========================================= */

function analyzePR() {

    const repository =
        document.getElementById(
            "repository"
        );

    const prNumber =
        document.getElementById(
            "prNumber"
        );

    const status =
        document.getElementById(
            "prStatus"
        );

    const message =
        document.getElementById(
            "prMessage"
        );


    if (!repository || !prNumber) {
        return;
    }


    if (
        !repository.value.trim() ||
        !prNumber.value.trim()
    ) {

        alert(
            "Please enter a GitHub repository and PR number."
        );

        return;
    }


    if (status) {

        status.textContent =
            "ANALYZING";

    }


    if (message) {

        message.innerHTML =
            "CodeGuard AI is analyzing the pull request...";

    }


    setTimeout(() => {

        const result = {

            files: 8,

            bugs: 2,

            security: 1,

            performance: 2

        };


        setPRValue(
            "filesChanged",
            result.files
        );

        setPRValue(
            "prBugs",
            result.bugs
        );

        setPRValue(
            "prSecurity",
            result.security
        );

        setPRValue(
            "prPerformance",
            result.performance
        );


        if (status) {

            status.textContent =
                "REVIEW";

        }


        if (message) {

            message.innerHTML =
                "<strong>Analysis completed.</strong> CodeGuard detected several issues that should be reviewed before merging.";

        }


        addStoredReview({

            id:
                "PR #" + prNumber.value,

            type:
                "GITHUB PR",

            file:
                repository.value,

            date:
                new Date().toLocaleString(),

            bugs:
                result.bugs,

            security:
                result.security,

            performance:
                result.performance,

            smells:
                0,

            total:
                result.bugs +
                result.security +
                result.performance,

            risk:
                "MEDIUM"

        });

    }, 1400);

}


/* =========================================
   PR NUMBER ANIMATION
========================================= */

function setPRValue(id, value) {

    const element =
        document.getElementById(id);

    if (!element) return;

    let current = 0;

    element.textContent = "0";

    const timer =
        setInterval(() => {

            current++;

            element.textContent =
                current;

            if (current >= value) {

                clearInterval(timer);

                element.textContent =
                    value;

            }

        }, 80);

}


/* =========================================
   SETTINGS
========================================= */

function defaultCodeGuardSettings() {

    return {

        security: true,

        performance: true,

        smells: true,

        suggestions: true,

        autoPR: false,

        riskAlerts: true,

        completionAlerts: true,

        language: "JavaScript",

        threshold: "Medium",

        mode: "Standard"

    };

}


function loadCodeGuardSettings() {

    let settings =
        defaultCodeGuardSettings();


    try {

        const saved =
            JSON.parse(
                localStorage.getItem(
                    CODEGUARD_SETTINGS
                )
            );

        if (saved) {

            settings = {
                ...settings,
                ...saved
            };

        }

    }

    catch (error) {

        // Use defaults.

    }


    setSettingChecked(
        "securityToggle",
        settings.security
    );

    setSettingChecked(
        "performanceToggle",
        settings.performance
    );

    setSettingChecked(
        "smellToggle",
        settings.smells
    );

    setSettingChecked(
        "suggestionToggle",
        settings.suggestions
    );

    setSettingChecked(
        "autoPR",
        settings.autoPR
    );

    setSettingChecked(
        "riskAlerts",
        settings.riskAlerts
    );

    setSettingChecked(
        "completionAlerts",
        settings.completionAlerts
    );


    setSettingValue(
        "defaultLanguage",
        settings.language
    );

    setSettingValue(
        "riskThreshold",
        settings.threshold
    );

    setSettingValue(
        "reviewMode",
        settings.mode
    );

}


function saveSettings() {

    const settings = {

        security:
            getSettingChecked(
                "securityToggle"
            ),

        performance:
            getSettingChecked(
                "performanceToggle"
            ),

        smells:
            getSettingChecked(
                "smellToggle"
            ),

        suggestions:
            getSettingChecked(
                "suggestionToggle"
            ),

        autoPR:
            getSettingChecked(
                "autoPR"
            ),

        riskAlerts:
            getSettingChecked(
                "riskAlerts"
            ),

        completionAlerts:
            getSettingChecked(
                "completionAlerts"
            ),

        language:
            getSettingValue(
                "defaultLanguage"
            ),

        threshold:
            getSettingValue(
                "riskThreshold"
            ),

        mode:
            getSettingValue(
                "reviewMode"
            )

    };


    localStorage.setItem(
        CODEGUARD_SETTINGS,
        JSON.stringify(settings)
    );


    alert(
        "Settings saved successfully."
    );

}


function resetSettings() {

    if (
        !confirm(
            "Reset all CodeGuard settings?"
        )
    ) {
        return;
    }


    localStorage.removeItem(
        CODEGUARD_SETTINGS
    );

    loadCodeGuardSettings();

    alert(
        "Settings have been reset."
    );

}


function getSettingChecked(id) {

    const element =
        document.getElementById(id);

    return element
        ? element.checked
        : false;

}


function setSettingChecked(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (element) {

        element.checked =
            Boolean(value);

    }

}


function getSettingValue(id) {

    const element =
        document.getElementById(id);

    return element
        ? element.value
        : "";

}


function setSettingValue(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (
        element &&
        value
    ) {

        element.value =
            value;

    }

}


/* =========================================
   DASHBOARD STATISTICS
========================================= */

function getReviewStatistics() {

    const reviews =
        getStoredReviews();


    return {

        reviews:
            reviews.length,

        bugs:
            reviews.reduce(
                (sum, r) =>
                    sum +
                    Number(r.bugs || 0),
                0
            ),

        security:
            reviews.reduce(
                (sum, r) =>
                    sum +
                    Number(r.security || 0),
                0
            ),

        performance:
            reviews.reduce(
                (sum, r) =>
                    sum +
                    Number(r.performance || 0),
                0
            ),

        smells:
            reviews.reduce(
                (sum, r) =>
                    sum +
                    Number(r.smells || 0),
                0
            )

    };

}


/* =========================================
   CLEAR HISTORY
========================================= */

function clearHistory() {

    if (
        !confirm(
            "Are you sure you want to clear your review history?"
        )
    ) {
        return;
    }


    localStorage.removeItem(
        CODEGUARD_STORAGE
    );

    location.reload();

}


/* =========================================
   PAGE INITIALIZATION
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        updateLineNumbers();

        loadCodeGuardSettings();

    }
);