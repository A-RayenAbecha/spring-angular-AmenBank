package com.bankamen.repository;

import com.bankamen.entity.Transaction;
import com.bankamen.entity.TransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long>, JpaSpecificationExecutor<Transaction> {

    // Fixed with JOIN FETCH to load account and user data
    @Query("SELECT t FROM Transaction t " +
            "LEFT JOIN FETCH t.account a " +
            "LEFT JOIN FETCH a.user u " +
            "WHERE (:start IS NULL OR t.date >= :start) AND " +
            "(:end IS NULL OR t.date <= :end) AND " +
            "(:type IS NULL OR t.type = :type) AND " +
            "(:username IS NULL OR u.username = :username) " +
            "ORDER BY t.date DESC")
    List<Transaction> searchTransactions(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            @Param("type") TransactionType type,
            @Param("username") String username
    );

    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.amount > :threshold")
    long countLargeTransactions(@Param("threshold") Double threshold);

    // Fixed with JOIN FETCH for recent transactions
    @Query("SELECT t FROM Transaction t " +
            "LEFT JOIN FETCH t.account a " +
            "LEFT JOIN FETCH a.user u " +
            "ORDER BY t.date DESC " +
            "LIMIT 10")
    List<Transaction> findTop10ByOrderByDateDesc();

    // Fixed with JOIN FETCH for account-based queries
    @Query("SELECT t FROM Transaction t " +
            "LEFT JOIN FETCH t.account a " +
            "LEFT JOIN FETCH a.user u " +
            "WHERE t.account.id = :accountId " +
            "ORDER BY t.date DESC")
    List<Transaction> findByAccountId(@Param("accountId") Long accountId);

    // Fixed filtres personnalisés with JOIN FETCH
    @Query("SELECT t FROM Transaction t " +
            "LEFT JOIN FETCH t.account a " +
            "LEFT JOIN FETCH a.user u " +
            "WHERE t.account.id = :accountId AND t.type = :type " +
            "ORDER BY t.date DESC")
    List<Transaction> findByAccountIdAndType(@Param("accountId") Long accountId,
                                             @Param("type") TransactionType type);

    @Query("SELECT t FROM Transaction t " +
            "LEFT JOIN FETCH t.account a " +
            "LEFT JOIN FETCH a.user u " +
            "WHERE t.account.id = :accountId AND t.date BETWEEN :start AND :end " +
            "ORDER BY t.date DESC")
    List<Transaction> findByAccountIdAndDateBetween(@Param("accountId") Long accountId,
                                                    @Param("start") LocalDateTime start,
                                                    @Param("end") LocalDateTime end);

    @Query("SELECT t FROM Transaction t " +
            "LEFT JOIN FETCH t.account a " +
            "LEFT JOIN FETCH a.user u " +
            "WHERE t.account.id = :accountId AND t.amount BETWEEN :min AND :max " +
            "ORDER BY t.date DESC")
    List<Transaction> findByAccountIdAndAmountBetween(@Param("accountId") Long accountId,
                                                      @Param("min") Double min,
                                                      @Param("max") Double max);

    // Fixed for suspicious transaction detection
    @Query("SELECT t FROM Transaction t " +
            "LEFT JOIN FETCH t.account a " +
            "LEFT JOIN FETCH a.user u " +
            "WHERE t.date > :after AND t.amount > :amount " +
            "ORDER BY t.date DESC")
    List<Transaction> findByDateAfterAndAmountGreaterThan(@Param("after") LocalDateTime after,
                                                          @Param("amount") Double amount);

    // This one doesn't need JOIN FETCH as it's just counting
    long countByDateAfter(LocalDateTime date);
}