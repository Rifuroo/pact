# RYTE

> **Write it right.** AI-powered Git workflow CLI for developers who care about clean history and velocity.

[![npm version](https://img.shields.io/npm/v/@riflo/ryte.svg?style=flat-square)](https://www.npmjs.com/package/@riflo/ryte)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg?style=flat-square)](https://nodejs.org)

---

## Introduction

Writing meaningful commit messages and well-structured Pull Requests is critical for team collaboration, but it’s often a friction point in a fast-paced development cycle. 

**ryte** is your CLI companion that bridge the gap between "coding" and "documenting". It reads your git diffs, understands the context of your changes, and generates professional, semantic-compliant messages in seconds.

### Core Value
- **Zero Friction**: Stay in the terminal. No Web UI, no heavy extensions.
- **Semantic by Default**: Automatically follows [Conventional Commits](https://www.conventionalcommits.org/).
- **Intelligent Context**: Infers motivation from diffs and branch names.
- **Interactive Control**: You are always in charge with an `Accept/Edit/Regenerate` workflow.

---

## ⚡ Quick Start

```bash
# 1. Install globally
npm install -g @riflo/ryte

# 2. Set your free AI key (get one at console.groq.com)
# Mac/Linux:
export GROQ_API_KEY="gsk_..."
# Windows (PowerShell):
$env:GROQ_API_KEY="gsk_..."

# 3. Stage your changes and go
git add .
ryte c
```

---

## The Problem It Solves

Your git log shouldn't look like this:
```bash
❌  update auth
❌  fix bug
❌  changes
❌  wip
```

With `ryte c`, it looks like this:
```bash
✅  feat(auth): implement JWT refresh token rotation
✅  fix(cart): resolve crash on empty product array
✅  refactor(db): extract query builder to repository layer
✅  chore: update dependencies to remove security vulnerabilities
```

One command. Same diff. Zero manual thinking.

---

## Installation

### Via NPM (Recommended)
```bash
npm install -g @riflo/ryte
```

### Via PNPM / Yarn
```bash
pnpm add -g @riflo/ryte
# or
yarn global add @riflo/ryte
```

---

## Usage

### 1. Generate Semantic Commit
Stage your files first, then let AI write the message.
```bash
git add .
ryte c
```
**Interactive Workflow:**
- `[A]ccept`: Applies the commit immediately.
- `[E]dit`: Opens your default editor (Vim/Notepad/Nano) to refine the message.
- `[R]egenerate`: Ask AI for another suggestion.
- `[C]ancel`: Abort the process.

### 2. Generate PR Draft
Summarize your entire branch history into a clean Markdown description.
```bash
ryte pr
```
**Example Output:**
```markdown
# 🔥 Feat: User Authentication Flow

## 📋 Summary
Introduces a complete JWT-based authentication system, including login, registration, and automatic token refresh via HTTP-only cookies.

## 🚀 Key Changes
- Implement `AuthMiddleware` for route protection
- Add `RefreshTokenRepository` for token rotation
- Create `LoginScreen` and `RegisterScreen` UI components

## ⚠️ Important Notes/Impact
- **Requires DB Migration**: Run `php artisan migrate` for the new `personal_access_tokens` table.
- **Dependency Added**: Added `firebase/php-jwt` package.

## 🔍 Reviewer Checklist
- [ ] Logic health & edge cases
- [ ] Performance considerations
- [ ] Code style & standard conformity
```

---

## How It Works

1. **Extraction**: Runs `git diff --staged` to capture your latest changes.
2. **Analysis**: Filters out lockfiles and noise, then sends the core diff to high-performance AI models (Groq Llama 3 or OpenAI GPT-4o-mini).
3. **Generation**: Crafts a semantic message (feat, fix, chore, etc.) based on the actual logic changes.
4. **Interaction**: Presents a TUI (Terminal UI) for you to review and finalize the entry.

---

## Why Not Just Use GitHub Copilot?

Fair question. Here's an honest comparison:

| Feature | GitHub Copilot | **RYTE** |
|---|---|---|
| Works natively in terminal | ❌ | ✅ |
| Diff-aware (reads what you actually changed) | ❌ | ✅ |
| Enforces Conventional Commits format | ❌ | ✅ |
| No IDE required | ❌ | ✅ |
| Free tier available | ❌ | ✅ (via Groq) |
| BYOK (Bring Your Own Key) | ❌ | ✅ |

Copilot is great for writing code. RYTE is for **documenting the intent** behind it.

---

## 🔒 Security & Privacy

We understand that sending code to an external API is a sensitive decision. Here's exactly what RYTE does and does *not* do:

| What we send | What we do NOT send |
|---|---|
| `git diff --staged` output only | Full file contents |
| Truncated to max ~16k chars | Binary files |
| Nothing from untracked files | `.env` or secret files |

- ✅ No data is stored or logged by RYTE itself.
- ✅ Lockfiles (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`) are auto-excluded.
- ✅ Minified files (`*.min.js`, `*.min.css`) are auto-excluded.
- ✅ You can use your own API key (BYOK) for complete control over data flow.
- ✅ Supports local AI models via Ollama (on roadmap).

---

## Configuration

**ryte** requires an API key to function. We support two providers:

### Groq (Recommended - Free & Instant)
Get your free key at [console.groq.com](https://console.groq.com/keys).
```powershell
# Windows
$env:GROQ_API_KEY="gsk_..."

# Linux / Mac / Git Bash
export GROQ_API_KEY="gsk_..."
```

### OpenAI 
Get your key at [platform.openai.com](https://platform.openai.com/api-keys).
```bash
export OPENAI_API_KEY="sk-..."
```

> [!TIP]
> Add these to your system environment variables to avoid setting them in every new session.

---

## Philosophy

We believe that **every commit should be written right**. A clean git history is not just about aesthetics; it's about debuggability, revertability, and understanding the "why" behind the code months after it was written.

---

## Roadmap

- [ ] **Context-Aware Radius**: Analyze importing files to suggest impact warnings.
- [ ] **JIRA / Linear / GitHub Issues**: Automatic ticket status sync.
- [ ] **Custom Rulesets**: Define your own commit linting rules for the AI.
- [ ] **Local LLM Support**: Support for Ollama/Llama.cpp for offline-only environments.

---

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

Please see [CONTRIBUTING.md](https://github.com/Rifuroo/pact/blob/main/CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests.

---

## License

Distributed under the MIT License. See [LICENSE](https://github.com/Rifuroo/ryte/blob/main/LICENSE) for more information.

---

## FAQ

**Q: Does it send my whole code to the AI?**  
A: No. It only sends the `git diff` of your staged changes. It automatically ignores binary files and common lockfiles.

**Q: Is it free?**  
A: The tool itself is free. If you use Groq, the API usage is currently free. If you use OpenAI, you pay for what you use (extremely cheap, ~$0.01 for dozens of commits).

---

Developed with ❤️ by **Riflo**
