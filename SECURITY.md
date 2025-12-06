# Security Policy

## Supported Versions

We actively support the latest version of Nexus Android ADB Security. Please ensure you are testing against the latest available release before reporting a vulnerability.

| Version | Supported          |
| ------- | ------------------ |
| 4.x.x   | :white_check_mark: |
| 3.x.x   | :x:                |
| < 3.0   | :x:                |

## Reporting a Vulnerability

We take the security of our project seriously. If you discover a vulnerability, please follow these steps:

1.  **Do NOT open a public issue.** Publicly logging a vulnerability can put users at risk before a fix is available.

2.  **Email the Maintainer:** Please send a detailed report to **[INSERT YOUR EMAIL HERE]**.

3.  **Include Details:**
    *   Step-by-step instructions to reproduce the issue.
    *   Impact of the vulnerability.
    *   Any relevant logs or screenshots.

### Response Timeline

*   **Acknowledgment:** We aim to acknowledge reports within **48 hours**.
*   **Assessment:** We will assess the severity and impact within **1 week**.
*   **Fix:** A fix will be released as soon as possible, depending on complexity.

## Security Features & Usage Protection

This project interacts with ADB (Android Debug Bridge), which grants high-level access to connected devices. To mitigate risks and ensure safe operation, the following security mechanisms are implemented directly within the application code:

### 1. Destructive Action Safeguards

The `PurgeView` engine includes built-in friction for all destructive actions to prevent accidental data loss.

*   **Two-Step Confirmation:** Uninstalling a package is never a single-click action. Users must click the trash icon, which transforms into a "CONFIRM?" button, requiring a second, distinct interaction within a 3-second window.

*   **Auto-Reset Logic:** If the confirmation is not clicked within 3 seconds, the button automatically reverts to its safe state, preventing stale "armed" buttons from lingering in the UI.

*   **Blur Protection:** If the user clicks "Uninstall" but then clicks away (loses focus), the button immediately resets to safety, ensuring that returning to the window later doesn't result in an accidental click.

### 2. Session Security & Persistence

The Secure Shell implements a robust session management system to balance usability with security.

*   **Session Isolation:** Command history and connection state are stored in `sessionStorage`, which is cleared automatically when the browser tab or application window is closed. This prevents sensitive command history from persisting across application restarts.

*   **State Recovery:** The application verifies an active session token upon re-mounting. If the token is missing or invalid (e.g., after a manual purge), the user is forced to re-authenticate via the "Establish Link" boot sequence.

*   **No External Transmission:** All terminal commands and package operations are executed locally on the user's machine. No telemetry, command logs, or device identifiers are sent to external servers or cloud storage.

### 3. Visual Security Feedback

The User Interface provides immediate visual cues to indicate the security state of the application.

*   **Live Status Indicators:** The shell header displays a pulsing "LIVE" or red "OFFLINE" indicator, giving users instant feedback on their connection status.

*   **System Messages:** Critical system events (connection established, identity verified, session purged) are highlighted in distinct colors within the terminal log to distinguish them from standard user input.

Thank you for helping keep this project safe!
