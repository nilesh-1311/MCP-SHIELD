# Enterprise AI & MCP Tool Policy 2026

1. **Zero-Trust Baseline**: All MCP tools must present a cryptographic SHA-256 fingerprint verified against the SecOps baseline.
2. **Access Control**: Agents must only execute tools authorized for their explicit role profile.
3. **No Exfiltration**: Transmissions to unvetted external hosts are strictly intercepted and dropped.
4. **Approval Required**: Sensitive operations (e.g. Email Dispatch, Permission Escalation) require human sign-off.