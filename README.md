# PACT

> **Every commit is a pact.** AI-powered Git workflow CLI for developers who care about clean history and velocity.

[![npm version](https://img.shields.io/npm/v/pact-ai.svg?style=flat-square)](https://www.npmjs.com/package/pact-ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg?style=flat-square)](https://nodejs.org)

---

## Introduction

Writing meaningful commit messages and well-structured Pull Requests is critical for team collaboration, but it’s often a friction point in a fast-paced development cycle. 

**pact** is your CLI companion that bridge the gap between "coding" and "documenting". It reads your git diffs, understands the context of your changes, and generates professional, semantic-compliant messages in seconds.

### Core Value
- **Zero Friction**: Stay in the terminal. No Web UI, no heavy extensions.
- **Semantic by Default**: Automatically follows [Conventional Commits](https://www.conventionalcommits.org/).
- **Intelligent Context**: Infers motivation from diffs and branch names.
- **Interactive Control**: You are always in charge with an `Accept/Edit/Regenerate` workflow.

---

## ⚡ Quick Start

### Installation
```bash
npm install -g pact-ai
```

### Setup API Key
```bash
# Get your free key at console.groq.com
export GROQ_API_KEY="gsk_..."
```

### usage
```bash
git add .
pact c
```

---

## Installation

### Via NPM (Recommended)
```bash
npm install -g pact-ai
```

### Via PNPM / Yarn
```bash
pnpm add -g pact-ai
# or
yarn global add pact-ai
```

---

## Usage

### 1. Generate Semantic Commit
Stage your files first, then let AI write the message.
```bash
git add .
pact c
```
**Interactive Workflow:**
- `[A]ccept`: Applies the commit immediately.
- `[E]dit`: Opens your default editor (Vim/Notepad/Nano) to refine the message.
- `[R]egenerate`: Ask AI for another suggestion.
- `[C]ancel`: Abort the process.

### 2. Generate PR Draft
Summarize your entire branch history into a clean Markdown description.
```bash
pact pr
```
It analyzes all commits in your current branch vs `main` and generates a structured PR title and body.

---

## How It Works

1. **Extraction**: Runs `git diff --staged` to capture your latest changes.
2. **Analysis**: Filters out lockfiles and noise, then sends the core diff to high-performance AI models (Groq Llama 3 or OpenAI GPT-4o-mini).
3. **Generation**: Crafts a semantic message (feat, fix, chore, etc.) based on the actual logic changes.
4. **Interaction**: Presents a TUI (Terminal UI) for you to review and finalize the "pact".

---

## Configuration

**pact** requires an API key to function. We support two providers:

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

We believe that **every commit is a pact** between you and your future self (and your teammates). A clean git history is not just about aesthetics; it's about debuggability, revertability, and understanding the "why" behind the code months after it was written.

---

## Roadmap

- [ ] **Context-Aware Radius**: Analyze importing files to suggest impact warnings.
- [ ] **JIRA / Linear / GitHub Issues**: Automatic ticket status sync.
- [ ] **Custom Rulesets**: Define your own commit linting rules for the AI.
- [ ] **Local LLM Support**: Support for Ollama/Llama.cpp for offline-only environments.

---

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

Please see [CONTRIBUTING.md](file:///d:/pact/CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests.

---

## License

Distributed under the MIT License. See `LICENSE` for more information.

---

## FAQ

**Q: Does it send my whole code to the AI?**  
A: No. It only sends the `git diff` of your staged changes. It automatically ignores binary files and common lockfiles.

**Q: Is it free?**  
A: The tool itself is free. If you use Groq, the API usage is currently free. If you use OpenAI, you pay for what you use (extremely cheap, ~$0.01 for dozens of commits).

---

Developed with ❤️ by **Riflo**
