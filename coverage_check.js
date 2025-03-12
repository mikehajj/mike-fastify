"use strict";
const async = require('async');
const path = require('path');
const fs = require('fs');

function analyzeReport(cb) {
    async.parallel({
        "analyze coverage": (aCb) => {
            let acceptableLimit = 94;
            const coverageSummaryReport = path.normalize(path.join(__dirname, '/test/coverage/coverage-summary.json'));
            if (fs.existsSync(coverageSummaryReport)) {
                const coverageSummary = require(coverageSummaryReport);
                if (process.env.ACCEPTABLE_CI_AVG) {
                    acceptableLimit = parseFloat(process.env.ACCEPTABLE_CI_AVG);
                }
                
                if (coverageSummary && coverageSummary.total) {
                    let pct = 0, i=0;
                    for (let section in coverageSummary.total) {
                        i++;
                        if(coverageSummary['total'][section] && coverageSummary['total'][section].pct){
                            pct += coverageSummary['total'][section].pct;
                        }
                    }
                    pct = pct / i;
                    pct = pct.toFixed(2);
                    if (!pct || pct < acceptableLimit) {
                        return aCb(new Error(`Code coverage is below the acceptable limit!\n! Recorded a total of ${pct}%\n! Minimum acceptable criteria is ${acceptableLimit}%.\n! Unable to Proceed!`));
                    }
                    return aCb(null, true);
                } else {
                    return aCb(new Error("Coverage Summary Report found but contains invalid information. Unable to proceed!"));
                }
            } else {
                return aCb(new Error("No Coverage Summary Report found in test-reports folder. Unable to proceed!"));
            }
        },
        // "analyze esdocs": (aCb) => {
        //     let acceptableLimit = 50;
        //     const documentationSummaryReport = path.normalize(path.join(__dirname, '/../../', 'esdoc/coverage.json'));
        //     if (fs.existsSync(documentationSummaryReport)) {
        //         const documentationSummary = require(documentationSummaryReport);
        //         if (process.env.ACCEPTABLE_CI_AVG) {
        //             acceptableLimit = parseFloat(process.env.ACCEPTABLE_DOCS_AVG);
        //         }
        //
        //         if (documentationSummary && documentationSummary.coverage) {
        //             if(parseFloat(documentationSummary.coverage) < acceptableLimit){
        //                 return aCb(new Error(`Documentation Coverage value is below the acceptable limit ${parseFloat(documentationSummary.coverage)}/${acceptableLimit} . Unable to proceed!`));
        //             }
        //             return aCb(null, true);
        //         } else {
        //             return aCb(new Error("Documentation Summary Report found but contains invalid information. Unable to proceed!"));
        //         }
        //     } else {
        //         return aCb(new Error("No Documentation Summary Report found in test-reports folder. Unable to proceed!"));
        //     }
        // },
    }, cb);
}

analyzeReport((error) => {
    if (error) {
        console.log(`\n\n!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!`);
        console.log(`!`);
        console.log(`!`);
        console.log('! ' + error.message) ;
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
});