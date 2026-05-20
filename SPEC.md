# Spec: Snippet Archiver UI/UX Modernization

## Objective
The objective is to transform the Snippet Archiver into a more professional, user-friendly, and secure application. This involves a visual overhaul using Tailwind CSS, improving the snippet execution workflow with auto-generated parameter forms, and providing real-time feedback through an execution console.

### User Stories
- As a user, I want to see a beautiful and organized list of my snippets so I can find them quickly.
- As a user, I want to be prompted for parameters before executing a script so I don't have to edit the code.
- As a user, I want to see the output of my scripts (Python/CMD) directly in the app to verify they worked.
- As a user, I want to filter snippets by multiple tags simultaneously to handle large archives.

## Tech Stack
- **Runtime**: Node.js v24.15.0+
- **Framework**: Electron v42.0.0, React v19
- **Styling**: Tailwind CSS v4 (with `@tailwindcss/vite`)
- **Icons**: Lucide React
- **Logging/Telemetry**: Pino, OpenTelemetry

## Commands
- Build: `npm run build`
- Test: `npm test`
- Dev: `npm run dev`
- Start: `npm start`

## Project Structure
```
archive/           → Project-local snippet storage
src/
  common/          → Shared types and constants
  main/            → Electron main process (Node.js)
  renderer/        → Electron renderer process (React + Tailwind)
    components/    → Reusable UI components
dist/              → Build artifacts
```

## Code Style
- **React**: Functional components with hooks.
- **Styling**: Tailwind CSS utility classes. 
- **Debugability**: All major UI components (Sidebar, SearchBar, SnippetCard, ParameterForm, Console) MUST have unique `id` attributes (e.g., `id="main-sidebar"`).
- **Naming**: camelCase for variables/functions, PascalCase for components/interfaces.

Example Component:
```tsx
const SnippetCard = ({ snippet, onClick }: Props) => (
  <div 
    id={`snippet-card-${snippet.id}`}
    className="p-4 bg-slate-800 rounded-lg hover:ring-2 hover:ring-blue-500 cursor-pointer transition-all"
    onClick={onClick}
  >
    <h3 className="font-bold text-white">{snippet.title}</h3>
  </div>
);
```

## Testing Strategy
- **Main Process**: Jest for unit and integration tests (Repository, Executor).
- **Renderer**: Manual verification via `npm run dev`. Automated tests for pure logic if added.
- **Security**: Mandatory verification of shell argument escaping for Python/CMD.

## Boundaries
- **Always do**: 
  - Sanitize and escape all parameters before shell execution.
  - Use IDs on major UI elements.
  - Keep the system compilable between tasks.
- **Ask first**: 
  - Adding heavy 3rd-party UI libraries (beyond Tailwind/Lucide).
  - Changing the `archive` folder structure.
- **Never do**: 
  - Use `dangerouslySetInnerHTML` with unsanitized snippet content.
  - Pass raw user input directly to `child_process.spawn` or `exec`.
  - Hardcode system-specific paths.

## Success Criteria
1. **Advanced Filtering**: Search bar supports tag-based filtering (e.g., `tag:python tag:utility`) and full-text search.
2. **Auto-Parameter Forms**: Clicking a snippet with `parameters` in `meta.json` opens a modal/form to input values before execution.
3. **Execution Console**: A dedicated area in the UI displays `stdout` and `stderr` from Python and CMD snippets in real-time.
4. **Tailwind Visuals**: Complete UI overhaul following a modern, dark-themed aesthetic.
5. **No Regressions**: All 7 existing tests must pass, and existing snippets must remain functional.

## Open Questions
- Should the console support full ANSI colors immediately, or is plain text sufficient for the first version? (Plan: Start with plain text, add ANSI if implementation is "simple" as per user hint).
