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
import java.util.Scanner;

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


    // ✅ Periodic check every 5 minutes for large transactions
    @Scheduled(fixedRate = 5 * 60 * 1000) // every 5 minutes
    public void detectSuspiciousTransactions() {
        double anomalyThreshold = 10000.0;

        LocalDateTime fiveMinutesAgo = LocalDateTime.now().minusMinutes(5);
        List<Transaction> recentTransactions = transactionRepository
                .findByDateAfterAndAmountGreaterThan(fiveMinutesAgo, anomalyThreshold);

        if (!recentTransactions.isEmpty()) {
            for (Transaction tx : recentTransactions) {
                log.warn("🚨 Suspicious transaction detected! Amount: {} on Account ID: {}", tx.getAmount(), tx.getAccount().getId());
            }

        }}

    public Map<String, Object> getKPI() {
        Map<String, Object> kpi = new HashMap<>();
        kpi.put("totalUsers", userRepository.count());
        kpi.put("totalTransactions", transactionRepository.count());
        kpi.put("activeAccounts", bankAccountRepository.countByActiveTrue());
        kpi.put("transactionsToday", transactionRepository.countByDateAfter(LocalDateTime.now().minusDays(1)));
        return kpi;
    }

    public List<LoginEvent> getAllLogins() {
        return loginEventRepository.findAll(Sort.by(Sort.Direction.DESC, "timestamp"));
    }

}

