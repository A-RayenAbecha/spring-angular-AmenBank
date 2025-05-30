package com.bankamen.repository;

import com.bankamen.entity.BankAccount;
import com.bankamen.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface BankAccountRepository extends JpaRepository<BankAccount, Long> {
    List<BankAccount> findByUserId(Long userId);

    Optional<BankAccount> findByUser(User user);
    long countByActiveTrue();

}
