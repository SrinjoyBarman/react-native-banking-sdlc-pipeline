---
description: 'Use when: reviewing or working with files that may contain secrets, environment variables, or sensitive configuration. Prevents accidental exposure of .env contents.'
applyTo: '**/*'
---

# Sensitive Files

Never read, write, display, summarize, or reference the contents of `.env`, `.env.*`,
or any file containing secrets — even if it appears in the editor context.
