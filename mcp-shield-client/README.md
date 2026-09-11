# MCP Shield Client (SOC Security Enforcement Demo)

A web-based MCP Client Agent that connects to an existing Stdio Model Context Protocol (MCP) server (`C:\Users\jayas\OneDrive\Desktop\Mcp3\.agents\skills\index.js`) and demonstrates real-time tool-call security enforcement.

---

## Quick Start (3 Steps)

### Step 1: Install Dependencies
Open a terminal in the `mcp-shield-client` directory:
```bash
npm install
```
*(This automatically installs dependencies for both root and the client frontend).*

---

### Step 2: Run Development Mode (Combined Backend + Frontend)
Run the following single command to launch both the Express Backend and React Frontend concurrently:
```bash
npm run dev
```

---

### Step 3: Open the Dashboard
Open your browser and navigate to:
- **Frontend Dashboard:** [http://localhost:5190](http://localhost:5190)
- **Backend API Server:** [http://localhost:3005](http://localhost:3005)

---

## Features
1. **Live MCP Stdio Connection:** Automatically spawns and connects to `C:\Users\jayas\OneDrive\Desktop\Mcp3\.agents\skills\index.js` via `@modelcontextprotocol/sdk`.
2. **Dynamic Tool Discovery:** Queries `/api/tools` to list tools supported by the server (`file_reader`, `report_generator`).
3. **Real-time Security Badges:** Displays green `ALLOWED` or red `BLOCKED` badges with exact security enforcement rationale returned by the Spring Boot shield proxy.
4. **Interactive Chat & Presets:** Includes intent parsing and one-click demo presets for hackathon presentation.
