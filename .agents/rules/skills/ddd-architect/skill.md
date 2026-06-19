---
trigger: manual
---

---

name: ddd-architect
description: Use this skill when the user asks for a new feature, project, or modification. It defines the standard for creating technical specifications before coding
---

# Documentation-Driven Development Protocol

## Phase 1: Context & Intent

Before suggesting a solution, analyze the request and create a file named `specs/[feature-name].md`.

## Phase 2: The Spec Template

The specification file must contain:

1. **User Story**: Who is this for and why?
2. **Interface Definitions**:
    - If API: Define endpoints, request bodies, and response schemas (OpenAPI style).
    - If CLI: Define commands, flags, and output examples.
    - If UI: Describe the component hierarchy and state.
3. **Edge Cases**: List at least 3 potential failure modes.
4. **Implementation Plan**: A step-by-step checklist for the coding phase.

## Phase 3: Approval

Present the link to the created file and ask the user for sign-off.
