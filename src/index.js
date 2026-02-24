import readline from "readline";
import { execSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { getStagedDiff, getCurrentBranch, getBranchCommits, applyCommit } from "./git.js";
import { generateAIResponse } from "./ai.js";
import { COMMIT_SYSTEM_PROMPT, PR_SYSTEM_PROMPT } from "./prompt.js";
import { getConfig, setConfig, hasValidConfig } from "./config.js";
import { PROVIDERS } from "./provider.js";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const VERSION = "1.2.4";

async function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

// Ensure the user doesn't just hit enter for empty edits
function editInteractively(initialText) {
    return new Promise((resolve) => {
        const tmpFile = path.join(os.tmpdir(), `ryte_edit_${Date.now()}.txt`);
        fs.writeFileSync(tmpFile, initialText, "utf-8");

        const defaultEditor = process.platform === "win32" ? "notepad" : "vim";
        const editor = process.env.EDITOR || defaultEditor;

        console.log(`\n\x1b[33m💡 Tip: Don't forget to SAVE (Ctrl+S) before closing the editor!\x1b[0m`);
        console.log(`Opening in ${editor}... Close the editor to save.`);
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

async function setupFlow() {
    console.log("\n\x1b[36mWelcome to RYTE. Let's set up your Git Intelligence Layer.\x1b[0m");
    console.log("------------------------------------------------------------");

    console.log("\nSelect your LLM Provider:");
    const providerList = Object.keys(PROVIDERS);
    providerList.forEach((p, i) => console.log(`${i + 1}) ${p.charAt(0).toUpperCase() + p.slice(1)}`));

    const choice = await question(`\nChoose [1-${providerList.length}]: `);
    const providerKey = providerList[parseInt(choice) - 1] || "openai";

    const apiKey = await question(`Paste your ${providerKey.toUpperCase()} API Key: `);
    if (!apiKey) {
        console.error("Error: API Key is required.");
        process.exit(1);
    }

    setConfig({
        provider: providerKey,
        apiKey: apiKey,
        model: PROVIDERS[providerKey].defaultModel
    });

    console.log("\n\x1b[32m✔ Configuration saved to ~/.ryte/config.json\x1b[0m");
}

async function handleConfig() {
    const config = getConfig() || {};
    console.log("\n\x1b[36mCurrent Configuration:\x1b[0m");
    console.log(JSON.stringify(config, null, 2));

    const choice = await question("\nWould you like to reset configuration? [y/N]: ");
    if (choice.toLowerCase() === "y") {
        await setupFlow();
    }
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
        console.log("\n\x1b[33m⚠ No staged changes found.\x1b[0m");
        console.log("Use \x1b[32m`git add` \x1b[0m to stage files before committing.");
        process.exit(0);
    }

    const branch = getCurrentBranch();

    while (true) {
        try {
            console.log("\nAnalyzing staged diff...");
            const result = await generateAIResponse([
                { role: "system", content: COMMIT_SYSTEM_PROMPT },
                { role: "user", content: `Branch: ${branch}\n\nDiff:\n${diff}` }
            ]);

            const finalAction = await interactiveLoop(result.text, "Commit Message");

            if (finalAction !== "REGENERATE") {
                applyCommit(finalAction);
                console.log("\n\x1b[32m✔ Commit applied successfully!\x1b[0m");
                break;
            }
        } catch (e) {
            console.error(`\n\x1b[31m✖ AI Generation failed:\x1b[0m ${e.message}`);
            const retry = await question("\nWould you like to try again? [y/N]: ");
            if (retry.toLowerCase() !== "y") {
                process.exit(1);
            }
        }
    }
}

async function handlePR() {
    const commits = getBranchCommits();
    if (!commits) {
        console.log("\n\x1b[33m⚠ No recent commits found.\x1b[0m");
        console.log("Ensure you have committed changes that are distinct from your main branch.");
        process.exit(0);
    }
    const branch = getCurrentBranch();

    while (true) {
        try {
            console.log("\nAnalyzing recent commits...");
            const result = await generateAIResponse([
                { role: "system", content: PR_SYSTEM_PROMPT },
                { role: "user", content: `Branch: ${branch}\n\nCommits:\n${commits}` }
            ]);

            const finalAction = await interactiveLoop(result.text, "PR Markdown Description");

            if (finalAction !== "REGENERATE") {
                console.log("\n\x1b[32mFinal PR Content:\x1b[0m\n");
                console.log(finalAction);
                console.log("\n(You can copy-paste the above into your pull request)");
                break;
            }
        } catch (e) {
            console.error(`\n\x1b[31m✖ AI Generation failed:\x1b[0m ${e.message}`);
            const retry = await question("\nWould you like to try again? [y/N]: ");
            if (retry.toLowerCase() !== "y") {
                process.exit(1);
            }
        }
    }
}

async function main() {
    const args = process.argv.slice(2);
    const cmd = args[0]?.toLowerCase();

    try {
        if (!hasValidConfig()) {
            await setupFlow();
        }

        if (cmd === "c" || cmd === "commit") {
            await handleCommit();
        } else if (cmd === "pr") {
            await handlePR();
        } else if (cmd === "config") {
            await handleConfig();
        } else {
            console.log(`
  \x1b[1;38;5;39m██████╗ \x1b[1;38;5;63m██╗   ██╗\x1b[1;38;5;129m████████╗\x1b[1;38;5;161m███████╗\x1b[0m
  \x1b[1;38;5;39m██╔══██╗\x1b[1;38;5;63m╚██╗ ██╔╝\x1b[1;38;5;129m╚══██╔══╝\x1b[1;38;5;161m██╔════╝\x1b[0m
  \x1b[1;38;5;39m██████╔╝\x1b[1;38;5;63m ╚████╔╝ \x1b[1;38;5;129m   ██║   \x1b[1;38;5;161m█████╗  \x1b[0m
  \x1b[1;38;5;39m██╔══██╗\x1b[1;38;5;63m  ╚██╔╝  \x1b[1;38;5;129m   ██║   \x1b[1;38;5;161m██╔══╝  \x1b[0m
  \x1b[1;38;5;39m██║  ██║\x1b[1;38;5;63m   ██║   \x1b[1;38;5;129m   ██║   \x1b[1;38;5;161m███████╗\x1b[0m
  \x1b[1;38;5;39m╚═╝  ╚═╝\x1b[1;38;5;63m   ╚═╝   \x1b[1;38;5;129m   ╚═╝   \x1b[1;38;5;161m╚══════╝\x1b[0m
  
  \x1b[1;38;5;46m[ THE AI-POWERED GIT INFRASTRUCTURE ]\x1b[0m
  \x1b[90mv${VERSION} | by Riflo\x1b[0m

  \x1b[33mCOMMANDS:\x1b[0m
  \x1b[32mryte c\x1b[0m      Generate semantic commit from diff
  \x1b[32mryte pr\x1b[0m     Generate PR markdown from branch commits
  \x1b[32mryte config\x1b[0m Generate or edit your local configuration

  \x1b[33mONBOARDING:\x1b[0m
  No .env required. Run \x1b[32mryte config\x1b[0m or just run \x1b[32mryte c\x1b[0m to 
  start the interactive setup.
            `);
        }
    } catch (e) {
        console.error(`\n\x1b[31m✖ Unexpected Error:\x1b[0m ${e.message}`);
        process.exit(1);
    }

    rl.close();
}

main().catch(err => {
    console.error("Unhandled error:", err);
    process.exit(1);
});
