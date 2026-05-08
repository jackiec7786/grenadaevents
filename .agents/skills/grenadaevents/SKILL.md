```markdown
# grenadaevents Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches you the core development patterns and conventions used in the `grenadaevents` repository, a TypeScript project built with Next.js. You'll learn about file naming, import/export styles, commit message patterns, and how to write and organize tests. This guide will help you contribute code that matches the established style and structure of the codebase.

## Coding Conventions

### File Naming
- Use **camelCase** for file names.
  - Example: `eventList.tsx`, `userProfile.ts`

### Import Style
- Mixed import styles are used.
  - **Named imports**:
    ```typescript
    import { getEvents } from './eventService';
    ```
  - **Default imports**:
    ```typescript
    import React from 'react';
    ```
  - **Side-effect imports**:
    ```typescript
    import './styles/global.css';
    ```

### Export Style
- Prefer **named exports**.
  ```typescript
  // eventService.ts
  export function getEvents() { ... }
  export const EVENT_LIMIT = 10;
  ```

### Commit Patterns
- Commit messages are **freeform** and may include prefixes.
- Average commit message length: ~26 characters.
  - Example: `fix: update event date logic`
  - Example: `add new event form`

## Workflows

### Adding a New Feature
**Trigger:** When you need to add a new feature or component.
**Command:** `/add-feature`

1. Create a new file using camelCase in the appropriate directory.
2. Implement your feature using TypeScript and Next.js conventions.
3. Use named exports for your functions or components.
4. Import dependencies using the mixed import style as needed.
5. Write a corresponding test file named `featureName.test.ts` or `featureName.test.tsx`.
6. Commit your changes with a clear, concise message.

### Fixing a Bug
**Trigger:** When you need to fix a bug in the codebase.
**Command:** `/fix-bug`

1. Locate the relevant file(s) and make the necessary changes.
2. Ensure you follow the coding conventions for file naming, imports, and exports.
3. Update or add tests in `*.test.ts` or `*.test.tsx` files to cover the bug fix.
4. Commit your changes with a descriptive message (e.g., `fix: correct event sorting`).

### Writing and Running Tests
**Trigger:** When adding new code or updating existing functionality.
**Command:** `/run-tests`

1. Write tests in files matching the pattern `*.test.ts` or `*.test.tsx`.
2. Use the project's test runner (framework unknown; check project scripts or documentation).
3. Run the tests to ensure all pass before committing.

## Testing Patterns

- Test files are named with the pattern `*.test.ts` or `*.test.tsx`.
- The specific testing framework is **unknown**; check the project's `package.json` for details.
- Place test files alongside the code they test or in a dedicated `__tests__` directory.
- Example test file:
  ```typescript
  // eventList.test.ts
  import { render } from '@testing-library/react';
  import { EventList } from './eventList';

  test('renders event list', () => {
    // test implementation
  });
  ```

## Commands
| Command      | Purpose                                 |
|--------------|-----------------------------------------|
| /add-feature | Start the process of adding a new feature/component |
| /fix-bug     | Begin fixing a bug in the codebase      |
| /run-tests   | Run all project tests                   |
```
