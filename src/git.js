import { execSync } from "child_process";

export function getStagedDiff() {
    try {
        const diff = execSync(
            'git diff --staged -- . ' +
            '":(exclude)package-lock.json" ' +
            '":(exclude)pnpm-lock.yaml" ' +
            '":(exclude)yarn.lock" ' +
            '":(exclude)*.lock" ' +
            '":(exclude)*.min.js" ' +
            '":(exclude)*.min.css"',
            { encoding: "utf-8" }
        );

        const trimmed = diff.trim();

        // llama-3.1-8b-instant: 14,400 TPM. 1 token ≈ 4 chars.
        // Cap at ~16,000 chars (~4,000 tokens), leaving budget for the system prompt.
        const MAX_CHARS = 16000;

        if (trimmed.length > MAX_CHARS) {
            console.warn(
                `\x1b[33m⚠ Diff is large (${trimmed.length} chars). Truncating to fit AI token limit.\x1b[0m`
            );
            return trimmed.slice(0, MAX_CHARS) + "\n\n[... diff truncated to fit AI token limit ...]";
        }

        return trimmed;
    } catch (e) {
        console.error("Failed to get staged git diff. Are you in a git repository?");
        process.exit(1);
    }
}

export function getCurrentBranch() {
    try {
        const branch = execSync("git branch --show-current", { encoding: "utf-8" });
        return branch.trim();
    } catch (e) {
        return "";
    }
}

export function getBranchCommits(baseBranch = "main") {
    try {
        // get commits on current branch that are not on main
        const commits = execSync(`git log ${baseBranch}..HEAD --oneline`, { encoding: "utf-8" });
        return commits.trim();
    } catch (e) {
        // Fallback to latest 10 commits if main branch doesn't exist
        try {
            const commits = execSync(`git log -n 10 --oneline`, { encoding: "utf-8" });
            return commits.trim();
        } catch (err) {
            return "";
        }
    }
}

export function applyCommit(message) {
    try {
        // write message to a temp file or pass via -m safely
        execSync(`git commit -m ${JSON.stringify(message)}`, { stdio: "inherit" });
    } catch (e) {
        console.error("Failed to commit.");
    }
}
