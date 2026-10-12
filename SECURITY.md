# Security Policy

Nusantara Video Studio is committed to maintaining high standards of software security, privacy, and data safety.

---

## 1. Supported Versions

| Version | Supported | Security Patch Policy |
| :--- | :--- | :--- |
| **1.0.x (Production Release)** | **Yes** | Active security fixes & patches |
| < 1.0.0 (Preview / Phase 1–9) | No | Legacy milestone builds |

---

## 2. Threat Model & Security Architecture

1. **Principle of Least Privilege:**
   * Tauri permissions in `src-tauri/capabilities/default.json` restrict access strictly to essential filesystem and desktop dialog operations.
   * Arbitrary shell command execution is prohibited.

2. **FFmpeg Execution Safety:**
   * Arguments are passed exclusively via structured string arrays (`spawn` argument vectors). Shell string concatenation (`sh -c` or `cmd.exe /c`) is strictly avoided to eliminate command injection vulnerabilities.
   * Executable paths are validated before invocation.

3. **Privacy & Data Redaction:**
   * Application diagnostics reports automatically redact authorization tokens (`Bearer ...`), API keys, passwords, and user directory names (`C:\Users\<username>`).
   * No telemetry or crash dumps are sent to remote servers without explicit user consent.

4. **Project Compatibility & Safety:**
   * `.nvproj` files undergo strict JSON schema validation.
   * Untrusted project files attempting path traversal or schema version manipulation are safely rejected without executing untrusted scripts.

---

## 3. Reporting a Vulnerability

If you discover a security vulnerability in Nusantara Video Studio:
1. **Do not create a public GitHub issue.**
2. Send an email to the security team at **security@nusantarastudio.id** with:
   * Description of the vulnerability and affected component.
   * Step-by-step reproduction instructions or proof-of-concept.
   * Impact assessment.
3. You will receive an acknowledgment within 48 hours.
4. Coordinated disclosure will follow once a patch is verified and deployed.
