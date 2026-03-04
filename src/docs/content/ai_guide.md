# AI Settings & Usage Guide

This guide covers how to configure AI features at the **organization** and **course** levels, how inheritance works between them, and how to monitor AI usage across your platform.

---

## Overview

codePost integrates with multiple AI providers to power two key features:

- **AI Comment Generation** — graders can draft a comment and use AI to refine it for clarity, tone, and helpfulness.
- **AI Test Script Generation** — instructors can generate test scripts from assignment specifications and example code.

AI settings can be configured at two levels:

| Level            | Who configures it         | Scope                                                |
| ---------------- | ------------------------- | ---------------------------------------------------- |
| **Organization** | Org admins (`isOrgStaff`) | Shared API key & model for all (or selected) courses |
| **Course**       | Course admins             | Per-course key, or inherit from the org              |

---

## Organization-Level AI Settings

Organization administrators can set up a shared AI configuration that courses can inherit, eliminating the need for every course admin to manage their own API key.

### Configuring Organization AI

1. Go to the **Organization Dashboard**.
2. Click the **AI Settings** tab.
3. Fill in:
   - **Provider** — Gemini, OpenAI, Ollama, or Custom.
   - **API Key** — your provider API key (stored encrypted).
   - **Base URL** — required for Ollama or custom providers.
   - **Model** — e.g. `gemini-2.5-flash`, `gpt-4o-mini`.
4. Set the **Course Access Policy**:
   - **All courses** — every course in the org can use the shared key.
   - **Selected courses** — only courses you explicitly add to the list.
   - **Disabled** — no courses inherit; each course must use its own key.
5. Optionally toggle:
   - **AI Enabled** — master switch for all AI features org-wide.
   - **AI Comment Generation** — toggle comment generation independently.
6. Click **Save**.

> [!IMPORTANT]
> Setting the course access policy to **Disabled** does not affect courses that have their own API key configured — it only controls whether courses can _inherit_ the organization's key.

---

## Course-Level AI Settings

Course admins configure AI for their specific course under **Course Settings > General > AI Features**.

### Using Organization Settings (Recommended)

If your organization has already configured AI and your course is allowed:

1. A banner will appear: **"Organization AI is available."**
2. Leave **Use own API key** toggled _off_.
3. The course will automatically use the organization's provider, model, and key.
4. You can still toggle AI features on/off for this course independently.

### Using Your Own API Key

If you prefer to use a different provider or key:

1. Toggle **Use own API key** _on_.
2. Enter your **Provider**, **API Key**, **Base URL** (if needed), and **Model**.
3. Click **Save**.

### AI Feature Toggles

Regardless of where the key comes from, each course has two independent toggles:

- **AI Enabled** — master switch for all AI features in this course.
- **AI Comment Generation** — specifically controls whether graders can use AI comment refinement.

> [!NOTE]
> Disabling AI at the organization level takes precedence — the course toggle has no effect if the org has disabled AI.

---

## Usage Tracking & Analytics

Every AI API call is recorded with token counts, cost estimates, and metadata. Usage data is available at three levels.

### Course-Level Usage

Course admins can view AI usage for their course:

1. Go to **Course Settings > General**.
2. Scroll to the **AI Usage** card below AI settings.
3. View total requests, tokens, estimated cost, and a breakdown by assignment.
4. Use the date range picker and granularity selector (hourly, daily, monthly) to zoom in.

### Organization-Level Usage

Org admins can view aggregated usage across all courses:

1. Go to **Organization Dashboard > AI Usage** tab.
2. View totals and charts for the entire organization.
3. The breakdown table shows per-course usage.

### Platform-Level Usage (Superusers)

Platform staff can view usage across the entire platform:

1. Go to the **codePost Admin** dashboard.
2. Click the **AI Usage** tab.
3. View platform-wide totals with per-organization breakdown.
4. Optionally filter by a specific organization.

### What's Tracked

Each AI call records:

| Field              | Description                                       |
| ------------------ | ------------------------------------------------- |
| **Provider**       | Which AI provider was used (Gemini, OpenAI, etc.) |
| **Model**          | The specific model (e.g., `gpt-4o-mini`)          |
| **Request type**   | `comment_generation` or `test_generation`         |
| **Input tokens**   | Tokens sent to the model                          |
| **Output tokens**  | Tokens returned by the model                      |
| **Estimated cost** | USD cost estimate based on published pricing      |
| **Status**         | `success` or `error`                              |
| **User**           | The grader or instructor who triggered it         |

---

## Supported Providers

| Provider          | Key required | Base URL                             | Notes                                            |
| ----------------- | ------------ | ------------------------------------ | ------------------------------------------------ |
| **Google Gemini** | Yes          | No                                   | Default: `gemini-2.5-flash`                      |
| **OpenAI**        | Yes          | No                                   | Default: `gpt-4o-mini`                           |
| **Ollama**        | No           | Yes (e.g., `http://localhost:11434`) | Self-hosted, no cost tracking                    |
| **Custom**        | Yes          | Yes                                  | Any OpenAI-compatible API (e.g., Portkey, Azure) |

---

## Cost Estimation

Cost estimates are calculated from published per-model token pricing and recorded alongside each usage record. Self-hosted models (Ollama) and unknown models report $0.

Current tracked rates include:

- **Gemini**: `gemini-2.5-flash`, `gemini-2.5-pro`, `gemini-2.0-flash`, `gemini-1.5-flash`, `gemini-1.5-pro`
- **OpenAI**: `gpt-4o`, `gpt-4o-mini`, `gpt-4.1`, `gpt-4.1-mini`, `gpt-4.1-nano`, `o3-mini`

> [!NOTE]
> Rates are approximate and may lag behind provider pricing changes. They are intended for budgeting visibility, not billing.

---

## Frequently Asked Questions

**Q: Can a course use AI without an organization key?**
Yes. Toggle **Use own API key** on and enter the course's credentials directly.

**Q: What happens if the org disables AI after courses are already using it?**
All courses inheriting the org key will lose AI access immediately. Courses with their own key are unaffected.

**Q: Is the API key visible to course admins?**
No. API keys are write-only — they can be set but never read back via the API or UI.

**Q: Does AI usage affect grading performance?**
No. Usage recording is asynchronous and wrapped in error handling — a failure to record never blocks the grading workflow.
