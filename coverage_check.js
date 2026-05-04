"use strict";
const path = require("path");
const fs = require("fs");

const METRIC_KEYS = ["lines", "statements", "functions", "branches"];

/**
 * NYC json-summary "total" block has one object per metric (lines, statements, …), each with .pct.
 * This script enforces the **arithmetic mean** of those four percentages >= threshold (default 95).
 * That is **not** the same as the first column in the NYC "All files" text row (often lines %).
 *
 * Override threshold: ACCEPTABLE_CI_AVG (e.g. 95).
 * Stricter: COVERAGE_MIN_EACH_METRIC=1 also requires every metric pct >= threshold (not only the average).
 * @returns {void}
 */
function analyzeReport() {
    let acceptableLimit = 95;
    if (process.env.ACCEPTABLE_CI_AVG) {
        acceptableLimit = parseFloat(String(process.env.ACCEPTABLE_CI_AVG).trim());
    }
    const coverageSummaryReport = path.normalize(path.join(__dirname, "tests", "coverage", "coverage-summary.json"));
    if (!fs.existsSync(coverageSummaryReport)) {
        throw new Error("No Coverage Summary Report found in tests/coverage folder. Unable to proceed!");
    }
    const coverageSummary = require(coverageSummaryReport);
    if (!coverageSummary || !coverageSummary.total) {
        throw new Error("Coverage Summary Report found but contains invalid information. Unable to proceed!");
    }
    const total = coverageSummary.total;
    const values = [];
    for (const key of METRIC_KEYS) {
        const block = total[key];
        if (!block || typeof block.pct !== "number") {
            throw new Error(`Coverage summary missing metric "${key}" or its pct field.`);
        }
        values.push(block.pct);
    }
    const averagePct = values.reduce((a, b) => a + b, 0) / values.length;
    const averageStr = averagePct.toFixed(2);
    const requireEach = process.env.COVERAGE_MIN_EACH_METRIC === "1" || process.env.COVERAGE_MIN_EACH_METRIC === "true";
    const minPct = Math.min(...values);
    if (averagePct + 1e-9 < acceptableLimit) {
        throw new Error(
            `Code coverage average of the four NYC totals (${METRIC_KEYS.join(", ")}) is ${averageStr}% ` +
                `(lines ${values[0].toFixed(2)}%, statements ${values[1].toFixed(2)}%, ` +
                `functions ${values[2].toFixed(2)}%, branches ${values[3].toFixed(2)}%). ` +
                `Minimum required average is ${acceptableLimit}%. ` +
                `Note: the "All files" line in the text report is usually lines-only (${values[0].toFixed(2)}%), not this four-way average.`
        );
    }
    if (requireEach && minPct + 1e-9 < acceptableLimit) {
        throw new Error(
            `COVERAGE_MIN_EACH_METRIC is set: lowest of the four metrics is ${minPct.toFixed(2)}%, ` +
                `below required ${acceptableLimit}%.`
        );
    }
}

try {
    analyzeReport();
} catch (error) {
    console.log(`\n\n!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    console.log(`!`);
    console.log(`!`);
    console.log("! " + error.message);
    console.log(`!`);
    console.log(`!`);
    console.log(`!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n\n`);
    process.exit(-1);
}
console.log(`\n\n*****************************************************************************************************`);
console.log(`*`);
console.log(`*`);
console.log(`* Coverage report(s) analysis complete, all section pass minimum required, proceeding with pipeline ...`);
console.log(`*`);
console.log(`*`);
console.log(`*****************************************************************************************************\n\n`);
