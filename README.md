# Nexus Android ADB Security 🛡️📱

A futuristic, cyberpunk-themed interface for advanced Android device management, debloating, and security auditing.

## 📖 Overview

Nexus Android ADB Security (featuring the PurgeView engine) is a powerful desktop application built with React and TypeScript designed to give users granular control over their Android devices via ADB (Android Debug Bridge).

Moving away from boring command lines, this project wraps powerful ADB utilities in a high-fidelity, sci-fi "hacker" aesthetic while providing robust safety features like persistent sessions and destructive action confirmations.

## ✨ Key Features

### 🖥️ PurgeView Shell

A persistent, terminal-emulator interface for direct ADB communication.

*   **Persistent Sessions**: Connection state survives tab switching and app minimizing using smart session storage.
*   **Cyberpunk Aesthetic**: CRT scanlines, retro-terminal fonts, and glowing text effects.
*   **Auto-Scroll & History**: mimics real terminal behavior.
*   **Visual Feedback**: Distinct styles for system messages, errors, and success states.

### 📦 PurgeView Package Manager

A visual interface to manage installed Android packages.

*   **Debloating Tool**: Easily find and disable/uninstall system bloatware.
*   **Smart Filtering**: Filter by System/User apps, Enabled/Disabled status, or search by package name.
*   **Safety First**: "Hold-to-confirm" or Double-click safety mechanisms for destructive actions (Uninstall).
*   **Performance Optimized**: Uses memoization to handle large package lists smoothly.

### 🎨 UI/UX

*   **Responsive Design**: Fluid layouts using Tailwind CSS.
*   **No External Assets**: All icons are rendered as optimized inline SVGs (no heavy font downloads).
*   **Animations**: Smooth transitions for list filtering and modal interactions.

## 🛠️ Tech Stack

*   **Frontend Framework**: React (v18+)
*   **Language**: TypeScript / JavaScript (ES6+)
*   **Styling**: Tailwind CSS
*   **State Management**: React Hooks (useState, useEffect, useRef)
*   **Icons**: Custom Inline SVGs (Lucide-style)
*   **Build Tool**: Vite / Webpack (Assumed based on React setup)

## 🚀 Getting Started

### Prerequisites

*   Node.js (v16 or higher)
*   NPM or Yarn
*   ADB installed and added to system PATH
*   An Android device with USB Debugging Enabled

### Installation

1.  Clone the repository:
    ```sh
    git clone https://github.com/OmarAj1/NexusAndroidAdbSecurity.git
    ```
2.  Navigate to the project directory:
    ```sh
    cd NexusAndroidAdbSecurity
    ```
3.  Install dependencies:
    ```sh
    npm install
    # or
    yarn install
    ```
4.  Run the development server:
    ```sh
    npm run dev
    # or
    yarn dev
    ```

## 🕹️ Usage

### Connecting to Shell

1.  Navigate to the **Shell** tab.
2.  Click "**ESTABLISH LINK**".
3.  Once the "**Identity Verified**" message appears, type `help` to see available commands.

### Managing Apps

1.  Navigate to the **PurgeView (Packages)** tab.
2.  Use the **Filter Bar** to search for specific apps (e.g., `com.google...`).
3.  Click the **Power Icon** to Enable/Disable an app.
4.  Click the **Trash Icon** to Uninstall. **Note**: You must confirm the action by clicking "**CONFIRM?**" within 3 seconds.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

## 🏷️ Repository Topics (for GitHub)

android adb security debloater react typescript cyberpunk-ui terminal-emulator package-manager privacy tools android-security shell
