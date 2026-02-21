# Claude Web Interface (Improved)

A modified version of [claude-code-webui](https://github.com/sugyan/claude-code-webui) with personal improvements.

> A modern web interface for Claude Code CLI - Transform your command-line coding experience into an intuitive web-based chat interface.

---

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) >= 20.0.0
- [Git](https://git-scm.com/)
- [Claude CLI](https://github.com/anthropics/claude-code) installed and authenticated

### Setup

```bash
# Clone the repo
git clone https://github.com/Sultansmooth/Claude-Web-Interface-Improved.git
cd Claude-Web-Interface-Improved

# Install dependencies
npm install

# Install globally so you can run it from anywhere
npm install -g .
```

Then just run:

```bash
claude-code-webui
```

And open your browser to http://localhost:8080.

### Updating

Pull the latest changes and reinstall:

```bash
cd Claude-Web-Interface-Improved
git pull
npm install -g .
```

> **Note:** Do not use `npm update -g claude-code-webui` — that would overwrite this version with the original unmodified package.

---

## CLI Options

| Option                 | Description                                              | Default     |
| ---------------------- | -------------------------------------------------------- | ----------- |
| `-p, --port <port>`    | Port to listen on                                        | 8080        |
| `--host <host>`        | Host address to bind to (use 0.0.0.0 for all interfaces) | 127.0.0.1   |
| `--claude-path <path>` | Path to claude executable                                | Auto-detect |
| `-d, --debug`          | Enable debug mode                                        | false       |

### Examples

```bash
# Default (localhost:8080)
claude-code-webui

# Custom port
claude-code-webui --port 3000

# Accessible from other devices on your network
claude-code-webui --host 0.0.0.0 --port 9000

# Debug mode
claude-code-webui --debug
```

---

## Credits

Based on [sugyan/claude-code-webui](https://github.com/sugyan/claude-code-webui). Licensed under MIT.
