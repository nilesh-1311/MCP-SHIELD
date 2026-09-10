-- ==============================================================================
-- MCP SHIELD — PRODUCTION SUPABASE (POSTGRESQL) SCHEMA
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tools Registry Table
CREATE TABLE IF NOT EXISTS mcp_tools (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    version TEXT NOT NULL DEFAULT '1.0.0',
    description TEXT NOT NULL,
    input_schema JSONB NOT NULL DEFAULT '{}'::jsonb,
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    risk_classification TEXT NOT NULL CHECK (risk_classification IN ('SAFE', 'SENSITIVE', 'DANGEROUS')),
    capability TEXT NOT NULL CHECK (capability IN ('read-only', 'write', 'destructive', 'exfiltration-capable')),
    author TEXT,
    status TEXT NOT NULL CHECK (status IN ('TRUSTED', 'SUSPICIOUS', 'COMPROMISED', 'BLOCKED', 'PENDING_REVIEW')),
    trust_level TEXT NOT NULL CHECK (trust_level IN ('VERIFIED_OFFICIAL', 'INTERNAL_DEVELOPER', 'UNVERIFIED_COMMUNITY', 'UNTRUSTED')),
    trusted_fingerprint TEXT NOT NULL,
    current_fingerprint TEXT,
    approved_by TEXT,
    is_honeypot BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mcp_tools_name ON mcp_tools (LOWER(name));
CREATE INDEX IF NOT EXISTS idx_mcp_tools_status ON mcp_tools (status);

-- 3. Tool Versions & Manifest History Table
CREATE TABLE IF NOT EXISTS mcp_tool_versions (
    id TEXT PRIMARY KEY,
    tool_id TEXT NOT NULL REFERENCES mcp_tools(id) ON DELETE CASCADE,
    version TEXT NOT NULL,
    fingerprint TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    approved BOOLEAN NOT NULL DEFAULT FALSE,
    approved_by TEXT,
    changelog TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mcp_tool_versions_tool_id ON mcp_tool_versions (tool_id);

-- 4. Agent RBAC & Guardrail Policies Table
CREATE TABLE IF NOT EXISTS mcp_agent_policies (
    agent_id TEXT PRIMARY KEY,
    agent_name TEXT NOT NULL,
    role TEXT NOT NULL,
    allowed_tools JSONB NOT NULL DEFAULT '[]'::jsonb,
    review_required_tools JSONB NOT NULL DEFAULT '[]'::jsonb,
    blocked_tools JSONB NOT NULL DEFAULT '[]'::jsonb,
    max_risk_threshold INTEGER NOT NULL DEFAULT 60 CHECK (max_risk_threshold BETWEEN 0 AND 100),
    allow_dynamic_updates BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Security Audit Log & Real-Time Events Table (Tamper-Evident Hash Chain)
CREATE TABLE IF NOT EXISTS mcp_security_events (
    id TEXT PRIMARY KEY,
    tool_id TEXT NOT NULL,
    tool_name TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    risk_score INTEGER NOT NULL DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100),
    decision TEXT NOT NULL CHECK (decision IN ('ALLOW', 'REVIEW', 'BLOCK')),
    reason TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    executed BOOLEAN NOT NULL DEFAULT FALSE,
    prev_hash TEXT NOT NULL DEFAULT '0000000000000000000000000000000000000000000000000000000000000000',
    entry_hash TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mcp_security_events_timestamp ON mcp_security_events (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_mcp_security_events_decision ON mcp_security_events (decision);
CREATE INDEX IF NOT EXISTS idx_mcp_security_events_agent ON mcp_security_events (agent_id);

-- 6. Threat Intel & Forensics Table
CREATE TABLE IF NOT EXISTS mcp_threats (
    id TEXT PRIMARY KEY,
    tool_id TEXT NOT NULL,
    tool_name TEXT NOT NULL,
    agent_id TEXT,
    type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    description TEXT NOT NULL,
    evidence TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'RESOLVED', 'INVESTIGATING')),
    action_taken TEXT NOT NULL CHECK (action_taken IN ('ALLOW', 'REVIEW', 'BLOCK')),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mcp_threats_status ON mcp_threats (status);
CREATE INDEX IF NOT EXISTS idx_mcp_threats_type ON mcp_threats (type);
CREATE INDEX IF NOT EXISTS idx_mcp_threats_timestamp ON mcp_threats (timestamp DESC);

-- 7. Human-in-the-Loop Approvals Table
CREATE TABLE IF NOT EXISTS mcp_approvals (
    id TEXT PRIMARY KEY,
    tool_id TEXT NOT NULL,
    tool_name TEXT NOT NULL,
    version TEXT NOT NULL,
    requested_by TEXT NOT NULL,
    agent_id TEXT,
    proposed_fingerprint TEXT NOT NULL,
    previous_fingerprint TEXT,
    changes_summary TEXT NOT NULL,
    risk_score INTEGER NOT NULL DEFAULT 70,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    decided_at TIMESTAMPTZ,
    decided_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_mcp_approvals_status ON mcp_approvals (status);

-- 8. Persistent Detector Scans Table
CREATE TABLE IF NOT EXISTS mcp_scans (
    id TEXT PRIMARY KEY,
    scan_type TEXT NOT NULL CHECK (scan_type IN ('DESCRIPTION', 'REQUEST_PARAM', 'OUTPUT', 'INTEGRITY', 'CROSS_SERVER', 'EXFILTRATION')),
    target TEXT NOT NULL,
    passed BOOLEAN NOT NULL DEFAULT TRUE,
    threats_detected JSONB NOT NULL DEFAULT '[]'::jsonb,
    risk_score_impact INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
