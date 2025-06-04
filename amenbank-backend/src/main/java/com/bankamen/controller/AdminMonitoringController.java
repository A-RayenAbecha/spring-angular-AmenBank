package com.bankamen.controller;

import com.bankamen.entity.LoginEvent;
import com.bankamen.entity.Transaction;
import com.bankamen.entity.TransactionType;
import com.bankamen.entity.User;
import com.bankamen.repository.UserRepository;
import com.bankamen.service.MonitoringService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/admin/monitoring")
@PreAuthorize("hasRole('SUPERADMIN')")
public class AdminMonitoringController {

    @Autowired
    private MonitoringService monitoringService;

    @GetMapping("/transactions")
    public ResponseEntity<List<Transaction>> filterTransactions(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end,
            @RequestParam(required = false) TransactionType type,
            @RequestParam(required = false) String username
    ) {
        return ResponseEntity.ok(monitoringService.getFilteredTransactions(start, end, type, username));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> dashboard() {
        Map<String, Object> dashboard = new HashMap<>();
        dashboard.put("lastTransactions", monitoringService.getRecentTransactions());
        dashboard.put("anomalyDetected", monitoringService.detectLargeTransactions(10000.0)); // Exemple
        return ResponseEntity.ok(dashboard);
    }

    @GetMapping("/kpi")
    public ResponseEntity<Map<String, Object>> getIndicators() {
        return ResponseEntity.ok(monitoringService.getKPI());
    }

    @GetMapping("/logins")
    public ResponseEntity<List<LoginEvent>> filterLoginEvents(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String ipAddress
    ) {
        return ResponseEntity.ok(monitoringService.getFilteredLogins(start, end, username, ipAddress));
    }

    @Autowired
    private UserRepository userRepository;

    @PutMapping("/reactivate/{username}")
    public ResponseEntity<String> reactivateUser(@PathVariable String username) {
        Optional<User> optionalUser = userRepository.findByUsername(username);
        if (optionalUser.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = optionalUser.get();
        user.setEnabled(true);
        user.setFailedLoginAttempts(0);
        userRepository.save(user);

        return ResponseEntity.ok("User reactivated successfully.");
    }
}