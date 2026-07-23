# 🔒 Security-Focused DevPod

This DevPod is designed for security research and development, based on the r-mcpsec configuration.

## 📦 What's Included

- **🖼️ Base Image**: Node.js 20 on Debian Bullseye
- **🔤 Language Support**: JavaScript/Node.js development environment
- **🧬 VS Code Extensions**:
  - Markdown Mermaid: Create diagrams in Markdown
  - Markdown Preview Enhanced: Advanced Markdown preview features

## ✨ Features

- Port 8282 forwarded with auto-notification
- Latest npm automatically installed
- Yarn package manager pre-configured
- Optimized for security research workflows

## 🚀 Usage

1. Open this folder in VS Code
2. When prompted, click "Reopen in Container"
3. The container will build and run `npm install -g npm@latest && yarn install`
4. Port 8282 will be available for your applications

## 🌐 Port Configuration

- **🔌 Port 8282**: Labeled as "Hello Remote World"
- Auto-forward notifications enabled

## 🔨 Post-Create Setup

The following commands run automatically after container creation:
- Updates npm to the latest version
- Runs `yarn install` to install project dependencies

## 📋 Requirements

- Docker Desktop or Docker Engine
- VS Code with Dev Containers extension
- Node.js project with package.json (for yarn install)