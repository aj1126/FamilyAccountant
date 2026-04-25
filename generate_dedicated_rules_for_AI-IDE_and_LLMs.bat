# 1. Define the AI context and behavioral rules payload
$aiRulesContent = @"
# Global AI Instructions & Project Context

## 1. Core Architectural Directive
**CRITICAL:** Make sure all features, architectural decisions, and code implementations work seamlessly for multi-users and multiple platforms—specifically Windows 11 (via React/Electron) and Android (via React Native).

## 2. Multi-User & Synchronization
* Always factor in shared household workspaces and role-based access.
* Database and state logic must account for offline-first sync engines, queueing, and additive transactions (avoid destructive overrides).

## 3. Environment & Tooling
* Provide terminal commands and scripts exclusively in Windows PowerShell or Command Prompt. Do NOT provide BASH scripts.
* Assume the local development environment is running on a Windows 11 PC.
* Emphasize non-destructive file operations and clearly separate backend (Node.js/NestJS) from frontend configurations.
"@

# 2. Write to a standard Markdown file for human and AI reference
Set-Content -Path "AI_INSTRUCTIONS.md" -Value $aiRulesContent -Encoding UTF8

# 3. Write to .cursorrules (Automatically read by many AI-integrated IDEs)
Set-Content -Path ".cursorrules" -Value $aiRulesContent -Encoding UTF8

# 4. Stage, commit, and push the new context files to the remote repository
git add AI_INSTRUCTIONS.md .cursorrules
git commit -m "chore: establish strict AI context rules for multi-platform and Windows workflows"
git push origin Chore-Import_ChatGPTcontent