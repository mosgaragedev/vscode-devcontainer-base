# 💡 Basic Development DevPod

This DevPod provides a general-purpose development environment with the following features:

## 📦 What's Included

- **🖼️ Base Image**: Debian-based development container
- **🐳 Docker-in-Docker**: Build and run containers within your development environment
- **🟢 Node.js**: Full Node.js development environment
- **🧬 VS Code Extensions**:
  - Roo Cline: AI-powered coding assistant
  - GistFS: Access GitHub Gists directly in VS Code
  - GitHub Copilot: AI pair programming
  - GitHub Copilot Chat: Conversational AI assistance

## ✨ Features

- Runs with privileged access to support Docker operations
- Configured for the `vscode` user
- Persistent container (won't shutdown on disconnect)

## 🚀 Usage

1. Open this folder in VS Code
2. When prompted, click "Reopen in Container"
3. Wait for the container to build and start
4. All tools and extensions will be automatically installed

## 📋 Requirements

- Docker Desktop or Docker Engine
- VS Code with Dev Containers extension
- Active GitHub Copilot subscription (for Copilot features)