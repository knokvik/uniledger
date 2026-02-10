# UniLedger Documentation Quick Reference

Welcome to the UniLedger repository! This guide helps you navigate the comprehensive documentation.

## 📚 Documentation Files

### 1. [REPOSITORY_STRUCTURE.md](./REPOSITORY_STRUCTURE.md) (620 lines)
**Complete reference guide for every file in the repository**

#### What's Inside:
- 📁 Root configuration files and their purposes
- 🔧 Smart contract files (Counter & Bank) with detailed explanations
- ⚛️ Frontend components (10 React components explained)
- 🤖 CI/CD workflows (8 GitHub Actions files)
- 📦 Dependency management files
- 🎨 Development tool configurations

#### When to Use:
- ❓ "What does this file do?"
- 📖 Understanding the repository architecture
- 🔍 Finding where specific functionality lives
- 🆕 Onboarding new developers

---

### 2. [WORKFLOW_GUIDE.md](./WORKFLOW_GUIDE.md) (950 lines)
**Complete development workflow from setup to production**

#### What's Inside:
- 🚀 Development setup (step-by-step)
- 💻 Smart contract development workflow
- 🎨 Frontend development workflow
- 🧪 Testing strategies (unit, integration, E2E)
- 🔄 CI/CD pipeline explanation
- 🚢 Deployment workflows (LocalNet, TestNet, MainNet)
- 🛠️ Common development tasks with code examples
- 🐛 Troubleshooting guide

#### When to Use:
- 🔨 "How do I develop a feature?"
- 🧪 "How do I test my changes?"
- 🚀 "How do I deploy?"
- 🐛 "Something's broken, how do I fix it?"

---

## 🎯 Quick Navigation by Task

### Setting Up Development Environment
→ [WORKFLOW_GUIDE.md - Development Setup](./WORKFLOW_GUIDE.md#development-setup)

### Understanding a Specific File
→ [REPOSITORY_STRUCTURE.md - Search for filename](./REPOSITORY_STRUCTURE.md)

### Creating a New Smart Contract
→ [WORKFLOW_GUIDE.md - Adding a New Smart Contract](./WORKFLOW_GUIDE.md#adding-a-new-smart-contract)

### Creating a New Frontend Component  
→ [WORKFLOW_GUIDE.md - Adding a New Frontend Component](./WORKFLOW_GUIDE.md#adding-a-new-frontend-component)

### Running Tests
→ [WORKFLOW_GUIDE.md - Testing Workflow](./WORKFLOW_GUIDE.md#testing-workflow)

### Deploying to Production
→ [WORKFLOW_GUIDE.md - Deployment Workflow](./WORKFLOW_GUIDE.md#deployment-workflow)

### Understanding CI/CD
→ [REPOSITORY_STRUCTURE.md - CI/CD Workflows](./REPOSITORY_STRUCTURE.md#cicd-workflows)  
→ [WORKFLOW_GUIDE.md - CI/CD Pipeline](./WORKFLOW_GUIDE.md#cicd-pipeline)

### Troubleshooting Issues
→ [WORKFLOW_GUIDE.md - Troubleshooting](./WORKFLOW_GUIDE.md#troubleshooting)

---

## 📖 Documentation Structure

```
UniLedger Documentation
│
├── README.md                    ← Project overview & features
│   └── High-level introduction to UniLedger platform
│
├── REPOSITORY_STRUCTURE.md      ← File-by-file reference
│   ├── Root Level Files
│   ├── Root Level Directories
│   ├── Smart Contracts Project
│   ├── Frontend Project
│   └── CI/CD Workflows
│
├── WORKFLOW_GUIDE.md            ← Development workflows
│   ├── Development Setup
│   ├── Smart Contract Workflow
│   ├── Frontend Workflow
│   ├── Testing Workflow
│   ├── CI/CD Pipeline
│   ├── Deployment Workflow
│   └── Common Development Tasks
│
├── Alokit_setup.md             ← AlgoKit setup instructions
│   └── Step-by-step AlgoKit installation
│
└── projects/
    ├── contracts/README.md      ← Contract-specific docs
    └── frontend/README.md       ← Frontend-specific docs
```

---

## 🚀 Getting Started (Fast Track)

### For New Developers:

1. **Read** → [README.md](./README.md) - Understand what UniLedger is
2. **Setup** → [WORKFLOW_GUIDE.md - Development Setup](./WORKFLOW_GUIDE.md#development-setup)
3. **Explore** → [REPOSITORY_STRUCTURE.md](./REPOSITORY_STRUCTURE.md) - Learn the codebase
4. **Build** → [WORKFLOW_GUIDE.md - Smart Contract/Frontend Workflow](./WORKFLOW_GUIDE.md)

### For Quick Reference:

- **File purpose?** → Search in [REPOSITORY_STRUCTURE.md](./REPOSITORY_STRUCTURE.md)
- **How to do X?** → Search in [WORKFLOW_GUIDE.md](./WORKFLOW_GUIDE.md)
- **Error/Issue?** → [WORKFLOW_GUIDE.md - Troubleshooting](./WORKFLOW_GUIDE.md#troubleshooting)

---

## 🔑 Key Concepts

### Repository Type
**AlgoKit Workspace** - Monorepo with smart contracts (Python) and frontend (React/TypeScript)

### Project Structure
```
contracts/    → Algorand smart contracts (PyTeal)
frontend/     → React web application (TypeScript)
.github/      → CI/CD workflows (GitHub Actions)
```

### Development Stack
- **Blockchain:** Algorand (fast finality, low fees)
- **Smart Contracts:** Python with AlgoKit/PyTeal
- **Frontend:** React + TypeScript + Vite
- **Testing:** pytest (contracts), Jest + Playwright (frontend)
- **Deployment:** GitHub Actions to LocalNet/TestNet/MainNet

### Key Tools
- **AlgoKit** - Algorand development framework
- **Poetry** - Python dependency management
- **pnpm** - Node.js package manager
- **Vite** - Frontend build tool

---

## 💡 Pro Tips

### Finding Information Fast

1. **Use Ctrl+F (search)** in documentation files
2. **Check Table of Contents** at the top of each document
3. **Follow "Significance" sections** for why something matters
4. **Look for code examples** in WORKFLOW_GUIDE.md

### Learning the Codebase

1. Start with [README.md](./README.md) for big picture
2. Read [REPOSITORY_STRUCTURE.md](./REPOSITORY_STRUCTURE.md) for file organization
3. Follow [WORKFLOW_GUIDE.md](./WORKFLOW_GUIDE.md) to build something
4. Explore actual code files with context

### When Stuck

1. Check [WORKFLOW_GUIDE.md - Troubleshooting](./WORKFLOW_GUIDE.md#troubleshooting)
2. Search documentation for error message
3. Review relevant section in [REPOSITORY_STRUCTURE.md](./REPOSITORY_STRUCTURE.md)
4. Ask team with specific context

---

## 📊 Documentation Stats

- **Total Documentation:** 1,775+ lines
- **Files Explained:** 130+ files
- **Workflows Documented:** 8 CI/CD workflows
- **Code Examples:** 40+ practical examples
- **Components Documented:** 10 React components
- **Smart Contracts:** 2 (Counter, Bank) fully explained

---

## 🤝 Contributing to Documentation

Found something unclear or missing? Please:

1. Open an issue describing what needs clarification
2. Submit a PR with improvements
3. Keep documentation updated when making code changes

**Good documentation is code!** 📝

---

## 📞 Support

- **Repository:** https://github.com/knokvik/uniledger
- **Algorand Docs:** https://developer.algorand.org/
- **AlgoKit Docs:** https://developer.algorand.org/docs/get-started/algokit/

---

**Built with ❤️ for campus communities**
