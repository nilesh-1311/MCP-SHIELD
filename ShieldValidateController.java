package com.mcp.shield;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/shield")
public class ShieldValidateController {

    @PostMapping("/validate")
    public ResponseEntity<Map<String, Object>> validate(@RequestBody Map<String, Object> request) {
        String tool = (String) request.get("tool");
        Map<String, Object> params = (Map<String, Object>) request.get("params");
        String paramsStr = params != null ? params.toString().toLowerCase() : "";
        String toolLower = tool != null ? tool.toLowerCase() : "";

        Map<String, Object> response = new HashMap<>();

        // 1. Return "BLOCKED" for destructive/dangerous patterns
        boolean isDestructive = paramsStr.contains("delete")
                             || paramsStr.contains("drop table")
                             || paramsStr.contains("rm -rf")
                             || paramsStr.contains("../")
                             || paramsStr.contains("truncate");

        if (isDestructive) {
            response.put("status", "BLOCKED");
            response.put("reason", "Security Block: Destructive pattern or path traversal detected in parameters");
            return ResponseEntity.ok(response);
        }

        // 2. Return "PENDING_APPROVAL" for email_sender or send/email/notify params
        boolean needsApproval = "email_sender".equals(toolLower)
                             || paramsStr.contains("send")
                             || paramsStr.contains("email")
                             || paramsStr.contains("notify");

        if (needsApproval) {
            response.put("status", "PENDING_APPROVAL");
            response.put("requestId", "req_" + System.currentTimeMillis());
            response.put("reason", "Human Sign-off Required: Action involves external transmission / email notification");
            return ResponseEntity.ok(response);
        }

        // 3. Return "ALLOWED" for safe tools and params
        response.put("status", "ALLOWED");
        response.put("result", "Tool execution validated and allowed by security policy");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/approve")
    public ResponseEntity<Map<String, Object>> approve(@RequestBody Map<String, Object> request) {
        Object approvedObj = request.get("approved");
        boolean approved = Boolean.TRUE.equals(approvedObj) || "true".equalsIgnoreCase(String.valueOf(approvedObj));

        Map<String, Object> response = new HashMap<>();
        if (approved) {
            response.put("status", "ALLOWED");
            response.put("result", "Human approval granted. Action executed successfully.");
        } else {
            response.put("status", "BLOCKED");
            response.put("reason", "Human approval rejected by Security Administrator.");
        }
        return ResponseEntity.ok(response);
    }
}