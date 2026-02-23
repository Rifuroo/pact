import readline from "readline";
import { execSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { getStagedDiff, getCurrentBranch, getBranchCommits, applyCommit } from "./git.js";
import { generateAIResponse } from "./ai.js";
import { COMMIT_SYSTEM_PROMPT, PR_SYSTEM_PROMPT } from "./prompt.js";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

// Ensure the user doesn't just hit enter for empty edits
function editInteractively(initialText) {
    return new Promise((resolve) => {
        const tmpFile = path.join(os.tmpdir(), `ryte_edit_${Date.now()}.txt`);
        fs.writeFileSync(tmpFile, initialText, "utf-8");

        const editor = process.env.EDITOR || "vim";
        console.log(`\nOpening in ${editor}... Close the editor to save.`);
        try {
            execSync(`${editor} ${tmpFile}`, { stdio: "inherit" });
            const result = fs.readFileSync(tmpFile, "utf-8").trim();
            fs.unlinkSync(tmpFile);
            resolve(result);
        } catch (e) {
            console.error("Editor closed with error.");
            fs.unlinkSync(tmpFile);
            resolve(initialText);
        }
    });
}

async function interactiveLoop(initialResult, type) {
    let currentResult = initialResult;

    while (true) {
        console.log("\n" + "=".repeat(40));
        console.log(`\x1b[36mSuggested ${type}:\x1b[0m\n`);
        console.log(currentResult);
        console.log("=".repeat(40) + "\n");

        const answer = await question("Choose action: \x1b[32m[A]ccept\x1b[0m, \x1b[33m[E]dit\x1b[0m, \x1b[34m[R]egenerate\x1b[0m, \x1b[31m[C]ancel\x1b[0m : ");

        const mode = answer.trim().toUpperCase();

        if (mode === "A") {
            return currentResult;
        } else if (mode === "C") {
            console.log("Cancelled.");
            process.exit(0);
        } else if (mode === "E") {
            currentResult = await editInteractively(currentResult);
        } else if (mode === "R") {
            console.log("\nRegenerating...");
            return "REGENERATE";
        } else {
            console.log("Invalid option. Please type A, E, R, or C.");
        }
    }
}

async function handleCommit() {
    const diff = getStagedDiff();
    if (!diff) {
        console.log("No staged changes found. Use `git add` to stage files.");
        process.exit(0);
    }

    const branch = getCurrentBranch();

    while (true) {
        console.log("\nAnalyzing staged diff...");
        const result = await generateAIResponse([
            { role: "system", content: COMMIT_SYSTEM_PROMPT },
            { role: "user", content: `Branch: ${branch}\n\nDiff:\n${diff}` }
        ]);

        const finalAction = await interactiveLoop(result, "Commit Message");

        if (finalAction !== "REGENERATE") {
            applyCommit(finalAction);
            console.log("\n\x1b[32m✔ Commit applied successfully!\x1b[0m");
            break;
        }
    }
}

async function handlePR() {
    const commits = getBranchCommits();
    if (!commits) {
        console.log("No recent commits found distinct from main branch.");
        process.exit(0);
    }
    const branch = getCurrentBranch();

    while (true) {
        console.log("\nAnalyzing recent commits...");
        const result = await generateAIResponse([
            { role: "system", content: PR_SYSTEM_PROMPT },
            { role: "user", content: `Branch: ${branch}\n\nCommits:\n${commits}` }
        ]);

        const finalAction = await interactiveLoop(result, "PR Markdown Description");

        if (finalAction !== "REGENERATE") {
            console.log("\n\x1b[32mFinal PR Content:\x1b[0m\n");
            console.log(finalAction);
            console.log("\n(You can copy-paste the above into your pull request or we can pipe it to the clipboard later)");
            break;
        }
    }
}

async function main() {
    const args = process.argv.slice(2);
    const cmd = args[0]?.toLowerCase();

    if (cmd === "c" || cmd === "commit") {
        await handleCommit();
    } else if (cmd === "pr") {
        await handlePR();
    } else {
        console.log(`
\x1b[36mRYTE - AI Git Workflow Assistant\x1b[0m
Author: Riflo

Usage:
  ryte c    Generate semantic commit from staged diff
  ryte pr   Generate PR markdown description from branch commits

Set GROQ_API_KEY (Free) or OPENAI_API_KEY environment variable.
        `);
    }

    rl.close();
}

main().catch(err => {
    console.error("Unhandled error:", err);
    process.exit(1);
});
