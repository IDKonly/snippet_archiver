# Implementation Plan: Snippet Archiver UI/UX Modernization

## Overview
This plan outlines the visual and functional modernization of the Snippet Archiver. We will transition to a modern dark-themed UI using Tailwind CSS v4, implement a robust snippet execution workflow with parameter forms, and add a real-time output console.

## Architecture Decisions
- **Tailwind CSS v4**: Use the new Vite plugin for seamless integration.
- **Component-Based UI**: Extract monolithic `App.tsx` into modular components in `src/renderer/components`.
- **IPC for Real-time Console**: Use `webContents.send` to stream `stdout`/`stderr` from the main process to the renderer instead of waiting for full execution.
- **Security Hardening**: Escape shell arguments using a robust utility in `executor.ts` to prevent command injection.
- **Debugability**: Explicitly add `id` attributes to all key interactive elements.

## Task List

### Phase 1: Foundation & Styling
- [ ] Task 1: Setup Tailwind CSS v4 and Lucide Icons.
- [ ] Task 2: Implement Base Layout (Sidebar + Content Area) with modern dark theme.
- [ ] Task 3: Security Hardening - Implement shell argument escaping in `SnippetExecutor`.

### Checkpoint: Foundation
- [ ] Application builds with Tailwind styles.
- [ ] Basic layout is visible and responsive.
- [ ] `SnippetExecutor` tests pass with special characters in parameters.

### Phase 2: Snippet Management & Filtering
- [ ] Task 4: Modernize Sidebar & Snippet List with advanced filtering (tag:xxx).
- [ ] Task 5: Componentize Snippet Cards and Selection Mode.

### Checkpoint: Management
- [ ] Advanced filtering works (multiple tags, text search).
- [ ] Snippet list is visually polished and interactive.

### Phase 3: Execution Workflow
- [ ] Task 6: Implement Dynamic Parameter Form based on `meta.json`.
- [ ] Task 7: Build Real-time Execution Console (Main -> Renderer streaming).

### Checkpoint: Execution
- [ ] Parameter forms appear correctly and pass values to executor.
- [ ] Console displays output in real-time during execution.

### Phase 4: Polish & Refinement
- [ ] Task 8: Modernize Add/Edit Modal and D&D interface.
- [ ] Task 9: Final CSS Polish and Accessibility (ARIA labels).

### Checkpoint: Complete
- [ ] All SPEC.md criteria met.
- [ ] All tests pass.
- [ ] UI is beautiful, functional, and responsive.

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Shell Injection via params | High | Use `spawn` with argument arrays correctly and escape special shell chars. |
| Performance with many snippets | Med | Virtualize the snippet list if count exceeds 1000. |
| Tailwind v4 compatibility | Low | Follow official migration/setup guide closely for Vite. |
| Console output encoding | Low | Use `iconv-lite` as already implemented for Korean characters. |

## Open Questions
- Do we need a "Clear Console" button? (Assumption: Yes, add it to the console header).
- Should the sidebar be collapsible? (Assumption: Not required for v1, but nice to have).
