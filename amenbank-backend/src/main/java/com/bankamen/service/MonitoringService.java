package com.bankamen.service;

import com.bankamen.entity.LoginEvent;
import com.bankamen.entity.Transaction;
import com.bankamen.entity.TransactionType;
import com.bankamen.repository.BankAccountRepository;
import com.bankamen.repository.LoginEventRepository;
import com.bankamen.repository.TransactionRepository;
import com.bankamen.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class MonitoringService {

    @Autowired
    private TransactionRepository transactionRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private BankAccountRepository bankAccountRepository;
    @Autowired
    private LoginEventRepository loginEventRepository;
    @Autowired
    private NotificationService notificationService;

    public List<Transaction> getFilteredTransactions(LocalDateTime start, LocalDateTime end,
                                                     TransactionType type, String username) {
        return transactionRepository.searchTransactions(start, end, type, username);
    }

    public List<Transaction> getRecentTransactions() {
        return transactionRepository.findTop10ByOrderByDateDesc();
    }

    public boolean detectLargeTransactions(Double threshold) {
        return transactionRepository.countLargeTransactions(threshold) > 0;
    }

    // ✅ Enhanced periodic check every 5 minutes for suspicious transactions
    @Scheduled(fixedRate = 5 * 60 * 1000) // every 5 minutes
    public void detectSuspiciousTransactions() {
        double suspiciousThreshold = 10000.0;
        double largeTransactionThreshold = 50000.0;

        LocalDateTime fiveMinutesAgo = LocalDateTime.now().minusMinutes(5);

        // Check for suspicious transactions
        List<Transaction> suspiciousTransactions = transactionRepository
                .findByDateAfterAndAmountGreaterThan(fiveMinutesAgo, suspiciousThreshold);

        for (Transaction tx : suspiciousTransactions) {
            log.warn("🚨 Suspicious transaction detected! Amount: {} on Account ID: {}",
                    tx.getAmount(), tx.getAccount().getId());

            // Create notification for suspicious transaction
            if (tx.getAmount() >= largeTransactionThreshold) {
                notificationService.createLargeTransactionNotification(tx);
            } else {
                notificationService.createSuspiciousTransactionNotification(tx);
            }
        }

        // Check for multiple failed login attempts
        detectFailedLoginAttempts();
    }

    private void detectFailedLoginAttempts() {
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);

        // This would require a method in LoginEventRepository to find failed attempts
        // You'll need to add this based on your LoginEvent entity structure

        // Example implementation - adjust based on your LoginEvent entity
        // List<LoginEvent> failedAttempts = loginEventRepository.findFailedAttemptsAfter(oneHourAgo);
        // Map<String, Long> failedAttemptsByUser = failedAttempts.stream()
        //     .collect(Collectors.groupingBy(LoginEvent::getUsername, Collectors.counting()));

        // failedAttemptsByUser.entrySet().stream()
        //     .filter(entry -> entry.getValue() >= 5) // 5 or more failed attempts
        //     .forEach(entry -> {
        //         notificationService.createFailedLoginNotification(entry.getKey(), "Multiple IPs");
        //     });
    }

    public Map<String, Object> getKPI() {
        Map<String, Object> kpi = new HashMap<>();
        kpi.put("totalUsers", userRepository.count());
        kpi.put("totalTransactions", transactionRepository.count());
        kpi.put("activeAccounts", bankAccountRepository.countByActiveTrue());
        kpi.put("transactionsToday", transactionRepository.countByDateAfter(LocalDateTime.now().minusDays(1)));
        kpi.put("loginsToday", loginEventRepository.countByTimestampAfter(LocalDateTime.now().minusDays(1)));
        kpi.put("unreadNotifications", notificationService.getUnreadCount());
        return kpi;
    }

    public List<LoginEvent> getAllLogins() {
        return loginEventRepository.findAll(Sort.by(Sort.Direction.DESC, "timestamp"));
    }

    public List<LoginEvent> getFilteredLogins(LocalDateTime start, LocalDateTime end,
                                              String username, String ipAddress) {
        return loginEventRepository.searchLogins(start, end, username, ipAddress);
    }

    public List<LoginEvent> getRecentLogins() {
        return loginEventRepository.findTop10ByOrderByTimestampDesc();
    }

    public List<LoginEvent> getLoginsByUser(String username) {
        return loginEventRepository.findByUsernameOrderByTimestampDesc(username);
    }

    public List<LoginEvent> getLoginsByIP(String ipAddress) {
        return loginEventRepository.findByIpAddressOrderByTimestampDesc(ipAddress);
    }

    public long countLoginsToday() {
        LocalDateTime today = LocalDateTime.now().minusDays(1);
        return loginEventRepository.countByTimestampAfter(today);
    }

    public long countUniqueUsersToday() {
        LocalDateTime today = LocalDateTime.now().minusDays(1);
        return loginEventRepository.countDistinctUsersByTimestampAfter(today);
    }
}