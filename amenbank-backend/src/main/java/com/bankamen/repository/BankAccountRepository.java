package com.bankamen.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.bankamen.entity.BankAccount;
import com.bankamen.entity.User;

public interface BankAccountRepository extends JpaRepository<BankAccount, Long> {
    List<BankAccount> findByUserId(Long userId);

    Optional<BankAccount> findByUser(User user);
    long countByActiveTrue();

    boolean existsByAccountNumber(String accountNumber);
    Optional<BankAccount> findByAccountNumber(String accountNumber);
}
