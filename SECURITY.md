# Security Policy

## Repository visibility note

Some older project materials may describe The Gradient as "private". This is
historical wording from the project's development stage and does not describe
the current GitHub repository visibility.

The GitHub repository for the open-source project is public.

Please do not interpret older "private" wording in archived code or
documentation as a current privacy or access guarantee.

## Scope

This policy covers security issues in The Gradient 3.6, including:

- The browser application.
- Local browser-side data handling.
- Sandboxed previews.
- Software-agent and code-execution workflows.
- Provider/model integration logic.
- Supporting client-side modules.

## Browser-first security model

The Gradient 3.6 is a browser-first application. Client-side code should be
treated as visible to the person running the application.

Do not put long-lived secret API keys, passwords, private tokens, cookies,
private certificates, or other sensitive credentials into publicly served
frontend source code.

Where a provider requires a secret credential, use an appropriate
server-side/proxy architecture instead of exposing the secret in browser code.

Never commit real credentials to Git, GitHub issues, pull requests, releases,
screenshots, examples, or documentation.

If a credential is accidentally exposed, revoke or rotate it promptly and
remove the exposed material from the repository as appropriate. Removing a
secret from the latest version does not by itself make an already-exposed
credential safe.

## Sandboxed previews

The project uses sandboxed iframe-based preview behavior for generated/live
content.

Generated HTML, JavaScript, CSS, Markdown, model output, uploaded content,
URLs, and tool output should be treated as untrusted unless a clear security
boundary has been established.

Security-sensitive preview changes should preserve appropriate isolation.

Take particular care with:

- `sandbox`.
- `srcdoc`.
- `allow-same-origin`.
- Script execution.
- Forms and popups.
- Navigation and URLs.
- Cross-frame messaging.
- DOM injection and HTML sinks.

Do not weaken sandbox restrictions simply to make a preview feature work.

## Browser storage

The application uses browser-side storage such as IndexedDB and may use
localStorage fallback behavior.

Browser storage should not be treated as a secure secret vault.

Do not introduce storage of sensitive credentials unless the design explicitly
requires it and the security implications have been considered.

## Third-party services

Model and provider integrations may transmit user-provided content to the
selected external service.

Changes that add a new provider, telemetry system, analytics service, or
other external data flow should document the behavior clearly.

Do not introduce hidden collection of user data.

## Reporting a vulnerability

Please do not publish an unpatched security vulnerability in a public GitHub
issue, pull request, discussion, or social-media post.

Use GitHub's private vulnerability reporting/security-advisory mechanism when
it is enabled for the repository.

If private reporting is unavailable, contact the maintainer through a
non-public channel associated with the project.

A useful report should include:

- A concise description.
- The affected component or file.
- Reproduction steps.
- Security impact.
- Relevant configuration details.
- A proof of concept when safe and necessary.
- Suggested remediation when available.

Do not include real secrets or private user information in a report.

## Coordinated disclosure

Please allow reasonable time for investigation, remediation, testing, and
release before publicly disclosing an unpatched vulnerability.

Maintainers may coordinate disclosure timing with the reporter.

## Security fixes

Security fixes should, where practical:

- Reduce the affected attack surface.
- Preserve or improve isolation controls.
- Include regression testing or a reproducible verification procedure.
- Avoid exposing sensitive information through logs, errors, previews, or
  model/tool output.
- Document important user-facing mitigations.

## Third-party code and assets

Before adding third-party code or assets, review their license and provenance.
Do not assume that a dependency, snippet, font, image, or model integration
can automatically be relicensed under the project's MIT License.

Third-party components may remain subject to their own licenses and notices.

## No security guarantee

This policy describes the project's intended security reporting and
maintenance process. It does not guarantee that The Gradient is free from
security vulnerabilities.

The project remains subject to the terms of its applicable open-source
license.
