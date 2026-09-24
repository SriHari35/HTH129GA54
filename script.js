(() => {

    const KEY = "codeguard_reviews";
    const SETTINGS_KEY = "codeguard_settings";

    const $ = (id) => document.getElementById(id);

    const esc = (value) =>
        String(value ?? "").replace(/[&<>"']/g, (char) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[char]));


    /* =========================================================
       SAMPLE CODE
    ========================================================= */

    const sample = `const express = require("express");
const mysql = require("mysql");
const app = express();

const password = "admin123";

app.get("/user", (req, res) => {

    const userId = req.query.id;

    const query =
        "SELECT * FROM users WHERE id = " + userId;

    db.query(query, (error, result) => {

        if (error) console.log(error);

        eval(req.query.code);

        res.json(result);

    });
});`;


    /* =========================================================
       LOCAL STORAGE
    ========================================================= */

    const reviews = () => {
        try {
            return JSON.parse(
                localStorage.getItem(KEY) || "[]"
            );
        } catch {
            return [];
        }
    };


    const saveReviews = (data) => {
        localStorage.setItem(
            KEY,
            JSON.stringify(data.slice(0, 100))
        );
    };


    const getSettings = () => {

        const defaults = {
            autoAnalysis: false,
            saveHistory: true,
            notifications: true,
            securityScan: true,
            bugDetection: true,
            performanceScan: true,
            qualityScan: true,
            developerName: "Developer",
            defaultLanguage: "javascript",
            defaultFileName: "review.js"
        };

        try {

            return {
                ...defaults,
                ...JSON.parse(
                    localStorage.getItem(SETTINGS_KEY) || "{}"
                )
            };

        } catch {

            return defaults;

        }
    };


    const storeSettings = (settings) => {

        localStorage.setItem(
            SETTINGS_KEY,
            JSON.stringify(settings)
        );

    };


    /* =========================================================
       CODE EDITOR
    ========================================================= */

    function lines() {

        const input = $("codeInput");
        const numbers = $("lineNumbers");

        if (!input || !numbers) return;

        const count = Math.max(
            1,
            input.value.split("\n").length
        );

        numbers.textContent =
            Array.from(
                { length: count },
                (_, index) => index + 1
            ).join("\n");
    }


    function loadSample() {

        const input = $("codeInput");

        if (!input) return;

        input.value = sample;

        lines();

        if ($("fileName")) {
            $("fileName").textContent = "demo-review.js";
        }

        focusReview();
    }


    function focusReview() {

        $("reviewSection")?.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

        setTimeout(() => {
            $("codeInput")?.focus();
        }, 300);
    }


    function clearCode() {

        if ($("codeInput")) {
            $("codeInput").value = "";
        }

        lines();

        $("results")?.classList.add("hidden");
        $("analysisScreen")?.classList.add("hidden");
        $("reviewSection")?.classList.remove("hidden");

    }


    /* =========================================================
       STATIC ANALYZER
    ========================================================= */

    function analyze(code) {

        const findings = [];

        code.split("\n").forEach((line, index) => {

            const lineNumber = index + 1;
            const lower = line.toLowerCase();


            /* HARD-CODED CREDENTIAL */

            if (
                (
                    lower.includes("password") ||
                    lower.includes("api_key") ||
                    lower.includes("apikey")
                ) &&
                line.includes("=") &&
                /["']/.test(line)
            ) {

                findings.push({
                    type: "security",
                    severity: "critical",
                    title: "Hardcoded credential detected",
                    line: lineNumber,
                    confidence: 96,
                    description:
                        "A credential appears directly in source code.",
                    suggestion:
                        "Move credentials to environment variables or a secret manager."
                });

            }


            /* EVAL */

            if (lower.includes("eval(")) {

                findings.push({
                    type: "security",
                    severity: "critical",
                    title: "Unsafe eval() usage",
                    line: lineNumber,
                    confidence: 98,
                    description:
                        "Dynamic execution can enable arbitrary code execution.",
                    suggestion:
                        "Remove eval() and use a safe explicit operation."
                });

            }


            /* SQL INJECTION */

            if (
                /\b(select|insert|update|delete)\b/i.test(line) &&
                line.includes("+")
            ) {

                findings.push({
                    type: "security",
                    severity: "critical",
                    title: "Possible SQL injection",
                    line: lineNumber,
                    confidence: 94,
                    description:
                        "SQL appears to use string concatenation.",
                    suggestion:
                        "Use parameterized queries."
                });

            }


            /* INNERHTML */

            if (lower.includes("innerhtml")) {

                findings.push({
                    type: "security",
                    severity: "high",
                    title: "Potential XSS sink",
                    line: lineNumber,
                    confidence: 88,
                    description:
                        "Untrusted HTML insertion can create XSS risk.",
                    suggestion:
                        "Prefer textContent or sanitize input."
                });

            }


            /* CONSOLE.LOG */

            if (lower.includes("console.log")) {

                findings.push({
                    type: "code_smell",
                    severity: "low",
                    title: "Debug logging detected",
                    line: lineNumber,
                    confidence: 71,
                    description:
                        "Debug output may be unnecessary in production.",
                    suggestion:
                        "Use structured logging or remove debug output."
                });

            }


            /* LOOSE EQUALITY */

            if (
                /(^|[^=])==([^=]|$)/.test(line)
            ) {

                findings.push({
                    type: "bug",
                    severity: "medium",
                    title: "Loose equality comparison",
                    line: lineNumber,
                    confidence: 82,
                    description:
                        "Loose equality performs implicit type conversion.",
                    suggestion:
                        "Use strict equality where appropriate."
                });

            }


            /* TODO */

            if (/\bTODO\b/i.test(line)) {

                findings.push({
                    type: "code_smell",
                    severity: "low",
                    title: "Unresolved TODO",
                    line: lineNumber,
                    confidence: 61,
                    description:
                        "A TODO may indicate unfinished work.",
                    suggestion:
                        "Resolve it or track it as a task."
                });

            }

        });

        return findings;
    }


    /* =========================================================
       RISK SCORE
    ========================================================= */

    function risk(findings) {

        const weights = {
            critical: 28,
            high: 20,
            medium: 10,
            low: 4
        };

        return Math.min(
            100,
            findings.reduce(
                (total, finding) =>
                    total + (weights[finding.severity] || 0),
                0
            )
        );
    }


    /* =========================================================
       RENDER REVIEW RESULTS
    ========================================================= */

    function show(findings) {

        const score = risk(findings);

        const security = findings.filter(
            item => item.type === "security"
        ).length;

        const bugs = findings.filter(
            item => item.type === "bug"
        ).length;

        const quality = findings.filter(
            item => item.type === "code_smell"
        ).length;


        const set = (id, value) => {

            if ($(id)) {
                $(id).textContent = value;
            }

        };


        /* SCORE */

        set("riskScore", score);
        set("riskPercent", score + "%");

        set(
            "riskLevel",
            score >= 70
                ? "HIGH"
                : score >= 40
                    ? "MEDIUM"
                    : score
                        ? "LOW"
                        : "SAFE"
        );


        /* COUNTS */

        set("securityCount", security);
        set("bugCount", bugs);
        set("performanceCount", 0);
        set("smellCount", quality);

        set("issueCount", findings.length);


        /* RISK BARS */

        const bars = [
            ["securityRisk", security * 30],
            ["bugRisk", bugs * 25],
            ["performanceRisk", 0],
            ["qualityRisk", quality * 15]
        ];


        bars.forEach(([id, value]) => {

            value = Math.min(100, value);

            set(id, value);

            const bar = $(id.replace("Risk", "Bar"));

            if (bar) {

                setTimeout(() => {
                    bar.style.width = value + "%";
                }, 50);

            }

        });


        /* RISK CIRCLE */

        const circle =
            document.querySelector(".risk-circle");

        if (circle) {

            circle.style.background =
                `conic-gradient(
                    #7c5cff ${score * 3.6}deg,
                    #18202d ${score * 3.6}deg
                )`;

        }


        /* RELEASE GATE */

        set(
            "gateTitle",
            score >= 70
                ? "RELEASE BLOCKED"
                : score >= 40
                    ? "REVIEW REQUIRED"
                    : score
                        ? "LOW RISK"
                        : "RELEASE CLEAR"
        );


        set(
            "gateMessage",
            score >= 70
                ? "High-risk findings require attention before release."
                : score >= 40
                    ? "Several findings should be reviewed before release."
                    : score
                        ? "Minor findings were detected."
                        : "No obvious high-risk issues were detected."
        );


        set(
            "gateIcon",
            score >= 40 ? "!" : "✓"
        );


        /* ISSUE LIST */

        const box = $("issuesContainer");

        if (box) {

            if (!findings.length) {

                box.innerHTML = `
                    <div class="issue">
                        <div class="issue-title">
                            No obvious issues detected
                        </div>

                        <p class="issue-description">
                            The current static checks found no obvious problems.
                        </p>
                    </div>
                `;

            } else {

                const severityWeight = {
                    critical: 4,
                    high: 3,
                    medium: 2,
                    low: 1
                };


                box.innerHTML =
                    findings
                        .slice()
                        .sort(
                            (a, b) =>
                                severityWeight[b.severity] -
                                severityWeight[a.severity]
                        )
                        .slice(0, 8)
                        .map(item => `

                            <div class="issue">

                                <div class="issue-top">

                                    <div class="issue-main">

                                        <span
                                            class="severity-dot ${item.severity}"
                                        ></span>

                                        <span class="issue-title">
                                            ${esc(item.title)}
                                        </span>

                                        <span class="issue-line">
                                            Line ${item.line}
                                        </span>

                                    </div>

                                    <span
                                        class="issue-badge ${item.severity}"
                                    >
                                        ${item.severity.toUpperCase()}
                                    </span>

                                </div>

                                <p class="issue-description">
                                    ${esc(item.description)}
                                </p>

                                <div class="confidence">
                                    AI confidence:
                                    <strong>
                                        ${item.confidence}%
                                    </strong>
                                    ·
                                    ${esc(item.suggestion)}
                                </div>

                            </div>

                        `)
                        .join("");

            }

        }


        /* AI INSIGHT */

        set(
            "aiInsightTitle",
            findings.length
                ? "Review findings before release"
                : "Clean review detected"
        );


        set(
            "aiInsight",
            findings.length
                ? "Static analysis found patterns that deserve engineering review. Severity and confidence are indicators, not proof of a defect."
                : "No obvious issues were detected by the current rules."
        );

    }


    /* =========================================================
       START ANALYSIS
    ========================================================= */

    function startAnalysis() {

        const input = $("codeInput");

        const code =
            input?.value.trim();


        if (!code) {

            alert(
                "Paste some code or load the demo before starting the review."
            );

            return;
        }


        $("reviewSection")?.classList.add("hidden");

        $("results")?.classList.add("hidden");

        $("analysisScreen")?.classList.remove("hidden");


        $("analysisScreen")?.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });


        setTimeout(() => {

            const findings =
                analyze(code);


            show(findings);


            $("analysisScreen")?.classList.add("hidden");

            $("reviewSection")?.classList.remove("hidden");

            $("results")?.classList.remove("hidden");


            /* SAVE REVIEW */

            const settings =
                getSettings();


            if (settings.saveHistory !== false) {

                const data =
                    reviews();


                data.unshift({

                    id: Date.now(),

                    file:
                        $("fileName")?.textContent ||
                        "review.js",

                    language:
                        $("language")?.value ||
                        "javascript",

                    date:
                        new Date().toISOString(),

                    risk:
                        risk(findings),

                    issues:
                        findings.length,

                    security:
                        findings.filter(
                            item =>
                                item.type === "security"
                        ).length,

                    bugs:
                        findings.filter(
                            item =>
                                item.type === "bug"
                        ).length,

                    performance: 0,

                    quality:
                        findings.filter(
                            item =>
                                item.type === "code_smell"
                        ).length

                });


                saveReviews(data);

            }


            $("results")?.scrollIntoView({
                behavior: "smooth"
            });


            refreshDashboardData();

        }, 1800);

    }


    /* =========================================================
       NEW REVIEW
    ========================================================= */

    function newReview() {

        clearCode();

        $("reviewSection")?.scrollIntoView({
            behavior: "smooth"
        });

    }


    /* =========================================================
       DASHBOARD
    ========================================================= */

    function dashboard() {

        const data =
            reviews();


        const totalIssues =
            data.reduce(
                (sum, item) =>
                    sum + Number(item.issues || 0),
                0
            );


        const securityIssues =
            data.reduce(
                (sum, item) =>
                    sum + Number(item.security || 0),
                0
            );


        const averageRisk =
            data.length
                ? Math.round(
                    data.reduce(
                        (sum, item) =>
                            sum + Number(item.risk || 0),
                        0
                    ) / data.length
                )
                : 0;


        const set = (id, value) => {

            if ($(id)) {
                $(id).textContent = value;
            }

        };


        set(
            "dashboardTotalReviews",
            data.length
        );

        set(
            "dashboardTotalIssues",
            totalIssues
        );

        set(
            "dashboardSecurityIssues",
            securityIssues
        );

        set(
            "dashboardAverageRisk",
            averageRisk
        );

        set(
            "dashboardRiskScore",
            averageRisk
        );

        set(
            "dashboardRiskLabel",
            averageRisk >= 70
                ? "HIGH"
                : averageRisk >= 40
                    ? "MEDIUM"
                    : averageRisk
                        ? "LOW"
                        : "SAFE"
        );


        /* RISK CATEGORY BARS */

        const total =
            Math.max(totalIssues, 1);


        const security =
            data.reduce(
                (sum, item) =>
                    sum + Number(item.security || 0),
                0
            );


        const bugs =
            data.reduce(
                (sum, item) =>
                    sum + Number(item.bugs || 0),
                0
            );


        const performance =
            data.reduce(
                (sum, item) =>
                    sum + Number(item.performance || 0),
                0
            );


        const quality =
            data.reduce(
                (sum, item) =>
                    sum + Number(item.quality || 0),
                0
            );


        const updateBar = (textId, barId, value) => {

            const percentage =
                Math.min(
                    100,
                    Math.round(
                        (value / total) * 100
                    )
                );


            set(textId, percentage);

            if ($(barId)) {
                $(barId).style.width =
                    percentage + "%";
            }

        };


        updateBar(
            "dashboardSecurityRisk",
            "dashboardSecurityBar",
            security
        );

        updateBar(
            "dashboardBugRisk",
            "dashboardBugBar",
            bugs
        );

        updateBar(
            "dashboardPerformanceRisk",
            "dashboardPerformanceBar",
            performance
        );

        updateBar(
            "dashboardQualityRisk",
            "dashboardQualityBar",
            quality
        );


        /* RECENT REVIEWS */

        const recent =
            $("dashboardRecentReviews");


        if (recent) {

            recent.innerHTML =
                data
                    .slice(0, 5)
                    .map(item => `

                        <tr>

                            <td>
                                ${esc(item.file)}
                            </td>

                            <td>
                                ${esc(item.language)}
                            </td>

                            <td>
                                ${item.issues || 0}
                            </td>

                            <td>
                                ${item.risk || 0}/100
                            </td>

                            <td>
                                ${new Date(
                                    item.date
                                ).toLocaleString()}
                            </td>

                        </tr>

                    `)
                    .join("")
                    ||
                    `
                        <tr>
                            <td
                                colspan="5"
                                class="empty"
                            >
                                No reviews yet.
                            </td>
                        </tr>
                    `;

        }

    }


    function refreshDashboardData() {

        dashboard();

        history();

        reports();

    }


    /* =========================================================
       HISTORY
    ========================================================= */

    function history() {

        const data =
            reviews();


        const list =
            $("historyList");


        if (!list) return;


        if (!data.length) {

            list.innerHTML = "";

            $("historyEmpty")
                ?.classList.remove("hidden");

        } else {

            $("historyEmpty")
                ?.classList.add("hidden");


            renderHistory(data);

        }


        /* SUMMARY */

        const totalIssues =
            data.reduce(
                (sum, item) =>
                    sum + Number(item.issues || 0),
                0
            );


        const averageRisk =
            data.length
                ? Math.round(
                    data.reduce(
                        (sum, item) =>
                            sum + Number(item.risk || 0),
                        0
                    ) / data.length
                )
                : 0;


        const last =
            data[0];


        if ($("historyTotalReviews")) {
            $("historyTotalReviews").textContent =
                data.length;
        }


        if ($("historyTotalIssues")) {
            $("historyTotalIssues").textContent =
                totalIssues;
        }


        if ($("historyAverageRisk")) {
            $("historyAverageRisk").textContent =
                averageRisk;
        }


        if ($("historyLastReview")) {

            $("historyLastReview").textContent =
                last
                    ? new Date(last.date)
                        .toLocaleDateString()
                    : "—";

        }

    }


    function renderHistory(data) {

        const list =
            $("historyList");


        if (!list) return;


        list.innerHTML =
            data.map(item => `

                <div
                    class="history-item"
                    data-risk="${getRiskCategory(item.risk)}"
                    data-search="${esc(
                        `${item.file} ${item.language}`
                    ).toLowerCase()}"
                >

                    <div class="history-file">

                        <div class="history-file-icon">
                            ◈
                        </div>

                        <div>

                            <strong>
                                ${esc(item.file)}
                            </strong>

                            <span>
                                ${esc(item.language)}
                            </span>

                        </div>

                    </div>


                    <div class="history-stat">

                        <span>
                            ISSUES
                        </span>

                        <strong>
                            ${item.issues || 0}
                        </strong>

                    </div>


                    <div class="history-stat">

                        <span>
                            SECURITY
                        </span>

                        <strong>
                            ${item.security || 0}
                        </strong>

                    </div>


                    <div class="history-stat">

                        <span>
                            RISK
                        </span>

                        <strong>
                            ${item.risk || 0}/100
                        </strong>

                    </div>


                    <div class="history-date">

                        ${new Date(
                            item.date
                        ).toLocaleString()}

                    </div>

                </div>

            `).join("");

    }


    function getRiskCategory(score) {

        score =
            Number(score || 0);


        if (score >= 70) {
            return "critical";
        }

        if (score >= 40) {
            return "warning";
        }

        return "safe";

    }


    function filterReviewHistory() {

        const search =
            ($("historySearch")?.value || "")
                .toLowerCase()
                .trim();


        const filter =
            $("historyFilter")?.value ||
            "all";


        document
            .querySelectorAll(".history-item")
            .forEach(item => {

                const text =
                    item.dataset.search || "";

                const category =
                    item.dataset.risk || "";


                const matchesSearch =
                    !search ||
                    text.includes(search);


                const matchesFilter =
                    filter === "all" ||
                    category === filter;


                item.style.display =
                    matchesSearch &&
                    matchesFilter
                        ? ""
                        : "none";

            });

    }


    function clearReviewHistory() {

        if (!confirm(
            "Clear all saved review history?"
        )) {
            return;
        }


        localStorage.removeItem(KEY);

        history();

        dashboard();

        reports();

    }


    /* =========================================================
       REPORTS
    ========================================================= */

    function reports() {

        const data =
            reviews();


        const set = (id, value) => {

            if ($(id)) {
                $(id).textContent = value;
            }

        };


        const totalIssues =
            data.reduce(
                (sum, item) =>
                    sum + Number(item.issues || 0),
                0
            );


        const security =
            data.reduce(
                (sum, item) =>
                    sum + Number(item.security || 0),
                0
            );


        const bugs =
            data.reduce(
                (sum, item) =>
                    sum + Number(item.bugs || 0),
                0
            );


        const performance =
            data.reduce(
                (sum, item) =>
                    sum + Number(item.performance || 0),
                0
            );


        const quality =
            data.reduce(
                (sum, item) =>
                    sum + Number(item.quality || 0),
                0
            );


        const averageRisk =
            data.length
                ? Math.round(
                    data.reduce(
                        (sum, item) =>
                            sum + Number(item.risk || 0),
                        0
                    ) / data.length
                )
                : 0;


        set(
            "reportTotalReviews",
            data.length
        );

        set(
            "reportSecurityIssues",
            security
        );

        set(
            "reportBugIssues",
            bugs
        );

        set(
            "reportAverageRisk",
            averageRisk
        );


        set(
            "reportTotalIssues",
            totalIssues
        );


        set(
            "breakdownSecurity",
            security
        );

        set(
            "breakdownBugs",
            bugs
        );

        set(
            "breakdownPerformance",
            performance
        );

        set(
            "breakdownQuality",
            quality
        );


        /* CATEGORY BARS */

        const denominator =
            Math.max(
                totalIssues,
                1
            );


        const setBar = (
            percentId,
            barId,
            value
        ) => {

            const percentage =
                Math.min(
                    100,
                    Math.round(
                        (value / denominator) * 100
                    )
                );


            set(
                percentId,
                percentage + "%"
            );


            if ($(barId)) {
                $(barId).style.width =
                    percentage + "%";
            }

        };


        setBar(
            "reportSecurityPercent",
            "reportSecurityBar",
            security
        );

        setBar(
            "reportBugPercent",
            "reportBugBar",
            bugs
        );

        setBar(
            "reportPerformancePercent",
            "reportPerformanceBar",
            performance
        );

        setBar(
            "reportQualityPercent",
            "reportQualityBar",
            quality
        );


        /* OUTCOMES */

        let safe = 0;
        let warning = 0;
        let critical = 0;


        data.forEach(item => {

            const category =
                getRiskCategory(item.risk);


            if (category === "safe") {
                safe++;
            } else if (category === "warning") {
                warning++;
            } else {
                critical++;
            }

        });


        set(
            "reportSafeCount",
            safe
        );

        set(
            "reportWarningCount",
            warning
        );

        set(
            "reportCriticalCount",
            critical
        );


        /* AI REPORT */

        if (!data.length) {

            set(
                "reportInsightTitle",
                "No review data yet"
            );

            set(
                "reportInsight",
                "Complete a code review to generate your first release intelligence report."
            );

        } else {

            set(
                "reportInsightTitle",
                "Report generated from your review history"
            );

            set(
                "reportInsight",
                `CodeGuard has analyzed ${data.length} review${data.length === 1 ? "" : "s"} with an average risk score of ${averageRisk}/100.`
            );

        }

    }


    function refreshReports() {

        reports();

    }


    /* =========================================================
       SETTINGS
    ========================================================= */

    function loadSettings() {

        const settings =
            getSettings();


        const checkboxes = [
            "autoAnalysis",
            "saveHistory",
            "notifications",
            "securityScan",
            "bugDetection",
            "performanceScan",
            "qualityScan"
        ];


        checkboxes.forEach(id => {

            if ($(id)) {
                $(id).checked =
                    Boolean(settings[id]);
            }

        });


        if ($("developerName")) {
            $("developerName").value =
                settings.developerName;
        }


        if ($("defaultLanguage")) {
            $("defaultLanguage").value =
                settings.defaultLanguage;
        }


        if ($("defaultFileName")) {
            $("defaultFileName").value =
                settings.defaultFileName;
        }

    }


    function saveSettings() {

        const current =
            getSettings();


        const updated = {

            ...current,

            autoAnalysis:
                $("autoAnalysis")?.checked ??
                current.autoAnalysis,

            saveHistory:
                $("saveHistory")?.checked ??
                current.saveHistory,

            notifications:
                $("notifications")?.checked ??
                current.notifications,

            securityScan:
                $("securityScan")?.checked ??
                current.securityScan,

            bugDetection:
                $("bugDetection")?.checked ??
                current.bugDetection,

            performanceScan:
                $("performanceScan")?.checked ??
                current.performanceScan,

            qualityScan:
                $("qualityScan")?.checked ??
                current.qualityScan,

            developerName:
                $("developerName")?.value ||
                current.developerName,

            defaultLanguage:
                $("defaultLanguage")?.value ||
                current.defaultLanguage,

            defaultFileName:
                $("defaultFileName")?.value ||
                current.defaultFileName

        };


        storeSettings(updated);


        const status =
            $("settingsSaveStatus");


        if (status) {

            status.classList.add("visible");

            clearTimeout(
                window.codeGuardSettingsTimer
            );


            window.codeGuardSettingsTimer =
                setTimeout(() => {

                    status.classList.remove(
                        "visible"
                    );

                }, 1500);

        }

    }


    function clearAllCodeGuardData() {

        if (!confirm(
            "This will delete all CodeGuard review history and settings. Continue?"
        )) {
            return;
        }


        localStorage.removeItem(KEY);

        localStorage.removeItem(
            SETTINGS_KEY
        );


        alert(
            "All CodeGuard local data has been cleared."
        );


        location.reload();

    }


    /* =========================================================
       GITHUB PR DEMO
    ========================================================= */

    function clearPRForm() {

        if ($("githubRepo")) {
            $("githubRepo").value = "";
        }

        if ($("githubPR")) {
            $("githubPR").value = "";
        }

        $("prPreview")?.classList.add("hidden");
        $("prResults")?.classList.add("hidden");
        $("prAnalysisScreen")?.classList.add("hidden");

    }


    function analyzePullRequest() {

        const repo =
            $("githubRepo")?.value.trim();


        const pr =
            $("githubPR")?.value.trim();


        if (!repo || !pr) {

            alert(
                "Enter a repository and pull request number first."
            );

            return;
        }


        /* DEMO PR INFORMATION */

        if ($("prPreview")) {

            $("prPreview")
                .classList.remove("hidden");

        }


        if ($("prTitle")) {
            $("prTitle").textContent =
                `Pull Request ${pr}`;
        }


        if ($("prRepo")) {
            $("prRepo").textContent =
                repo;
        }


        if ($("prBranch")) {
            $("prBranch").textContent =
                "feature/update";
        }


        if ($("prFiles")) {
            $("prFiles").textContent = "4";
        }


        if ($("prAdditions")) {
            $("prAdditions").textContent = "42";
        }


        if ($("prDeletions")) {
            $("prDeletions").textContent = "8";
        }


        $("prAnalysisScreen")
            ?.classList.remove("hidden");


        $("prPreview")
            ?.classList.add("hidden");


        $("prResults")
            ?.classList.add("hidden");


        $("prAnalysisScreen")
            ?.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });


        setTimeout(() => {

            renderPRResults();

        }, 1800);

    }


    function renderPRResults() {

        $("prAnalysisScreen")
            ?.classList.add("hidden");


        $("prResults")
            ?.classList.remove("hidden");


        const score = 42;


        const set = (id, value) => {

            if ($(id)) {
                $(id).textContent = value;
            }

        };


        set(
            "prRiskScore",
            score
        );


        set(
            "prSecurityCount",
            1
        );


        set(
            "prBugCount",
            1
        );


        set(
            "prPerformanceCount",
            0
        );


        set(
            "prQualityCount",
            1
        );


        set(
            "prIssueCount",
            3
        );


        set(
            "prGateTitle",
            "REVIEW REQUIRED"
        );


        set(
            "prGateMessage",
            "The demo pull request contains findings that should be reviewed before merge."
        );


        set(
            "prGateIcon",
            "!"
        );


        const container =
            $("prIssuesContainer");


        if (container) {

            container.innerHTML = `

                <div class="issue">

                    <div class="issue-top">

                        <div class="issue-main">

                            <span class="severity-dot critical"></span>

                            <span class="issue-title">
                                Potential security issue
                            </span>

                            <span class="issue-line">
                                Changed file
                            </span>

                        </div>

                        <span class="issue-badge critical">
                            CRITICAL
                        </span>

                    </div>

                    <p class="issue-description">
                        The demonstration PR contains a pattern
                        that requires security review.
                    </p>

                </div>


                <div class="issue">

                    <div class="issue-top">

                        <div class="issue-main">

                            <span class="severity-dot medium"></span>

                            <span class="issue-title">
                                Possible bug
                            </span>

                            <span class="issue-line">
                                Changed file
                            </span>

                        </div>

                        <span class="issue-badge medium">
                            MEDIUM
                        </span>

                    </div>

                    <p class="issue-description">
                        A code path in the changed files may
                        require additional validation.
                    </p>

                </div>


                <div class="issue">

                    <div class="issue-top">

                        <div class="issue-main">

                            <span class="severity-dot low"></span>

                            <span class="issue-title">
                                Code quality observation
                            </span>

                            <span class="issue-line">
                                Changed file
                            </span>

                        </div>

                        <span class="issue-badge low">
                            LOW
                        </span>

                    </div>

                    <p class="issue-description">
                        A maintainability improvement may be
                        useful before merging.
                    </p>

                </div>

            `;

        }


        set(
            "prAiInsight",
            "This is a frontend demonstration of the GitHub PR workflow. Real GitHub repository access requires an authenticated backend integration."
        );


        $("prResults")
            ?.scrollIntoView({
                behavior: "smooth"
            });

    }


    function newPRReview() {

        clearPRForm();

        $("githubRepo")?.focus();

    }


    /* =========================================================
       INITIALIZATION
    ========================================================= */

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            /* Review editor */

            const input =
                $("codeInput");


            if (input) {

                input.addEventListener(
                    "input",
                    lines
                );


                input.addEventListener(
                    "scroll",
                    () => {

                        if ($("lineNumbers")) {

                            $("lineNumbers").scrollTop =
                                input.scrollTop;

                        }

                    }
                );

            }


            lines();


            /* Dashboard */

            dashboard();


            /* History */

            history();


            /* Reports */

            reports();


            /* Settings */

            loadSettings();


            /* Default file name */

            const settings =
                getSettings();


            if ($("fileName")) {

                $("fileName").textContent =
                    settings.defaultFileName ||
                    "review.js";

            }


            /* Default language */

            if ($("language")) {

                $("language").value =
                    settings.defaultLanguage ||
                    "javascript";

            }

        }
    );


    /* =========================================================
       GLOBAL FUNCTIONS
    ========================================================= */

    window.loadSample =
        loadSample;

    window.focusReview =
        focusReview;

    window.clearCode =
        clearCode;

    window.startAnalysis =
        startAnalysis;

    window.newReview =
        newReview;

    window.filterReviewHistory =
        filterReviewHistory;

    window.clearReviewHistory =
        clearReviewHistory;

    window.refreshReports =
        refreshReports;

    window.saveSettings =
        saveSettings;

    window.clearAllCodeGuardData =
        clearAllCodeGuardData;

    window.clearPRForm =
        clearPRForm;

    window.analyzePullRequest =
        analyzePullRequest;

    window.newPRReview =
        newPRReview;


})();