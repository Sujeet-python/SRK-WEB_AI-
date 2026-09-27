# Contributing to The Gradient 3.6

Thank you for your interest in contributing to The Gradient.

The Gradient 3.6 is a browser-first AI engineering workspace. It is intended
to remain approachable for developers and contributors while keeping the
core application lightweight.

## Repository visibility note

Some older project text or development materials may describe The Gradient as
"private". That wording refers to the project's earlier development stage or
historical naming and is not the current GitHub repository visibility.

The GitHub repository for the open-source project is public.

Please rely on the repository's current GitHub visibility and current
documentation rather than older "private" wording found in archived or
development materials.

## Project goals

Contributions should improve usefulness, reliability, maintainability,
accessibility, security, or documentation.

The Gradient includes:

- Learn workflows.
- Software Development workflows.
- Imagine workflows.
- Canvas workflows.
- Document workflows.
- Reusable AI workflows/pipelines.
- Sandboxed code previews and software-agent iteration.
- Multiple AI provider/model integrations.
- Browser-side local storage.

## Before contributing

Please:

1. Read the README and understand the area you are changing.
2. Search existing issues and pull requests before starting duplicate work.
3. Read SECURITY.md before reporting or investigating security-sensitive
   issues.
4. Never commit API keys, passwords, tokens, cookies, private credentials, or
   other secrets.
5. Check the license of third-party code, fonts, images, libraries, and other
   assets before adding them.

## Development

The current 3.6 application is browser-first. For the core application,
there is no required package installation or build step.

A typical workflow is:

1. Clone the repository.
2. Open `index.html` in a modern browser, or use a local static HTTP server
   when browser security policies require HTTP.
3. Make a focused change.
4. Test the affected workspace and related shared functionality.
5. Check the browser console for errors.
6. Test normal and failure paths where practical.
7. Update documentation when behavior or configuration changes.

## Architecture

Important modules include areas such as:

- `app.js` for core application behavior and shared state.
- `mode-router.js` for workspace routing and mode metadata.
- `software-mode.js` for software-development behavior.
- `software-agent.js` for coding-agent and sandbox workflows.
- `preview-engine.js` for previews and code rendering.
- `workflows.js` for reusable multi-step AI workflows.
- `document-studio.js` for document-related functionality.
- Supporting state, shell, and hardening modules used by the 3.6 application.

The exact structure may change as the project evolves.

## Coding guidelines

Prefer:

- Small, focused, reviewable changes.
- Existing project patterns where practical.
- Clear names and straightforward control flow.
- Defensive handling of malformed model output and network failures.
- Useful user-facing error states.
- Accessible controls and keyboard behavior.
- Minimal unrelated UI or architectural changes.
- Comments for non-obvious security or compatibility decisions.

Avoid:

- Committing secrets.
- Copying third-party code without checking its license.
- Removing or weakening sandbox/security controls without justification.
- Trusting generated HTML, JavaScript, JSON, URLs, or tool arguments without
  appropriate validation or escaping.
- Introducing unnecessary dependencies.
- Mixing large unrelated refactors into a focused bug fix.

## AI-assisted development

AI tools may be used to assist development.

Contributors remain responsible for reviewing submitted changes for:

- Correctness.
- Security.
- Privacy implications.
- License compatibility.
- Accessibility.
- Browser compatibility.
- Error handling.
- Unnecessary complexity.

AI-generated output should be reviewed before it is committed or submitted.

## Testing

For normal changes, verify that:

- The application loads without unexpected errors.
- The affected workspace opens and behaves correctly.
- Failure states are handled.
- Network/API failures do not leave the interface unusable.
- Generated previews retain their intended sandboxing.
- Existing local state is not unnecessarily lost.
- Changed controls remain usable from keyboard and smaller screens.

For Software Development changes, test both a successful path and a
failure/recovery path when the environment permits it.

## Pull requests

A pull request should normally include:

- A clear explanation of what changed.
- Why the change was needed.
- Testing performed.
- Relevant limitations or known issues.
- Screenshots or a short recording for significant UI changes when useful.

Please keep unrelated changes out of the same pull request when practical.

## Issues

For bugs, include:

- Browser and operating system when relevant.
- Reproduction steps.
- Expected behavior.
- Actual behavior.
- Safe-to-share console or network errors.
- A minimal example where possible.

Never publish API keys, authentication tokens, private user data, or other
secrets in public issues.

## Contributions and licensing

The repository is distributed under the MIT License.

By submitting code or other material, contributors should ensure that they
have the necessary rights or permission to submit that material and that
their contribution can be used in an open-source project.

Do not submit material copied from a third party unless its license or other
permission allows the intended use.

## Maintainer discretion

Maintainers may decline changes that introduce unacceptable security risks,
license problems, unnecessary complexity, or behavior that conflicts with
the project's goals.

Thank you for contributing to The Gradient.
