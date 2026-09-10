# 🛡️ MCP SHIELD

> **Secure the Tools Your AI Trusts.**  
> *Runtime Integrity & Threat Protection Gateway for AI Agents using Model Context Protocol (MCP).*

---

## 📌 Executive Summary

**MCP SHIELD** is an enterprise-grade zero-trust runtime security layer designed to sit directly between autonomous AI agents and downstream Model Context Protocol (MCP) servers.

```
                      ┌────────────────────────┐
                      │  AI AGENTS (AUTONOMOUS)│
                      └───────────┬────────────┘
                                  │ (tool dispatch)
                                  ▼
             ╔════════════════════════════════════════════╗
             ║        🛡️  MCP SHIELD SECURITY CORE         ║
             ║   • Canonical SHA-256 Fingerprinting       ║
             ║   • Agent RBAC Authorization Matrix        ║
             ║   • Prompt Injection & Intent Scanner      ║
             ║   • Poisoned Output Quarantine             ║
             ║   • In-Line JSON-RPC 2.0 Interception      ║
             ╚════════════════════════════════════════════╝
                                  │
                                  ▼  (ALLOWED ONLY)
                      ┌────────────────────────┐
                      │      MCP SERVERS       │
                      │  [FILES, TOOLS, APIS]  │
                      └────────────────────────┘
```

When an attack or unapproved tool drift is detected, **MCP SHIELD enforces a strict zero-forward block**. The malicious request is rejected at the proxy boundary, guaranteeing that the target MCP server receives **0 executions** and leaks **0 credentials**.

---

## ✨ Key Security Capabilities

1. **Deterministic Canonical SHA-256 Fingerprinting**: Generates strict cryptographic hashes across tool definitions (name, description, parameter schemas, permissions) to prevent rug pulls and silent server mutations.
2. **In-Line JSON-RPC 2.0 Interception Proxy**: Intercepts `tools/list` and `tools/call` in real time before execution dispatch.
3. **Prompt Injection & Malicious Description Defense**: Scans manifests and runtime parameter payloads for instruction overrides, system escapes, and credential exfiltration sinks.
4. **Cross-Server Hijacking Prevention**: Blocks compromised MCP tools from attempting side-effect calls against unauthorized secondary servers (e.g. calculator tool commanding an email sender).
5. **Tool Output Poisoning Quarantine**: Inspects tool return data and sanitizes embedded prompt injections before autonomous agents ingest the output.
6. **Legitimate Developer Evolution Gate**: Formal human-in-the-loop developer update workflow requiring approved signatures and automatic baseline recalculation (`v1.0 -> Dev Update -> Sec Review -> v1.1 Trusted`).
7. **Mathematical Zero-Execution Proof Telemetry**: Logs and verifies that blocked dispatches result in `Forwarded: NO (0%)` and `Server Runs: 0`.

---

## 🔬 Interactive 9-Scenario Attack Lab

MCP SHIELD includes a comprehensive attack testbed:

| Scenario | Attack Vector | Mitigation Action |
|---|---|---|
| **1. Manifest Tampering / Rug Pull** | Silent modification of tool description on disk | 🛑 Hard BLOCK (SHA-256 mismatch) |
| **2. Malicious Tool Description** | Tool description embedding prompt injection & sink URL | 🛑 Hard BLOCK (Heuristic & Fingerprint) |
| **3. Malicious Output Poisoning** | Tool payload returning malicious injection | ⚠️ Quarantined & Sanitized |
| **4. Prompt Injection in Parameters** | Request parameters carrying system escape sequence | 🛑 Hard BLOCK (Parameter Intent Scan) |
| **5. Cross-Server Hijacking** | Low-privilege tool triggering email/admin tool | 🛑 Hard BLOCK (Cross-Server Barrier) |
| **6. Permission Escalation** | Tool requesting unapproved network/disk scopes | 🟡 Flagged for Human Review |
| **7. Rogue / Unknown Tool** | Unregistered `FreeDataExporter` invocation | 🛑 Hard BLOCK (Zero-Trust Registry) |
| **8. Data Exfiltration Defense** | `API_KEY` or credentials dispatched to webhook | 🛑 Hard BLOCK (DLP Filter) |
| **9. Unauthorized Tool Update** | Unsigned metadata change in production | 🟡 Flagged for Developer Approval |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18.x or higher
- npm / yarn / pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/<your-username>/mcp-shield.git
cd mcp-shield

# Install dependencies
npm install
```

### Running the Acceptance Test Suite

```bash
# Runs 10/10 automated security & zero-execution proof acceptance tests
npm test
```

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to experience the Living AI Security Command Center.

### Production Build

```bash
npm run build
npm start
```

---

## 🛠️ Architecture & Tech Stack

- **Framework**: Next.js 14 (App Router & Route Handlers)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS & Custom Cybernetic Glassmorphic Theme
- **Animations & Micro-Interactions**: Framer Motion
- **Data Visualizations**: Recharts
- **Icons**: Lucide React
- **Cryptography**: Node.js `crypto` (Deterministic Canonical JSON SHA-256)
- **MCP Transport**: In-Process & HTTP JSON-RPC 2.0 Proxy (`/api/mcp/v1`)

---

## 📄 License

MIT License. Developed for Cybersecurity PS2 — MCP Tool Integrity.
