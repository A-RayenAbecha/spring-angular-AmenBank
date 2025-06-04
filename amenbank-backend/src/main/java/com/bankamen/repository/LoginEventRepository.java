package com.bankamen.repository;

import com.bankamen.entity.LoginEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface LoginEventRepository extends JpaRepository<LoginEvent, Long> {

    // Find recent login events
    List<LoginEvent> findTop10ByOrderByTimestampDesc();

    // Find login events by username
    List<LoginEvent> findByUsernameOrderByTimestampDesc(String username);

    // Find login events by IP address
    List<LoginEvent> findByIpAddressOrderByTimestampDesc(String ipAddress);

    // Count login events after a specific timestamp
    long countByTimestampAfter(LocalDateTime timestamp);

    // Count distinct users who logged in after a specific timestamp
    @Query("SELECT COUNT(DISTINCT l.username) FROM LoginEvent l WHERE l.timestamp > :timestamp")
    long countDistinctUsersByTimestampAfter(@Param("timestamp") LocalDateTime timestamp);

    // Find login events within a date range
    List<LoginEvent> findByTimestampBetweenOrderByTimestampDesc(LocalDateTime start, LocalDateTime end);

    // Find login events after a specific timestamp
    List<LoginEvent> findByTimestampAfterOrderByTimestampDesc(LocalDateTime timestamp);

    // Custom search query for filtering login events
    @Query("SELECT l FROM LoginEvent l WHERE " +
            "(:start IS NULL OR l.timestamp >= :start) AND " +
            "(:end IS NULL OR l.timestamp <= :end) AND " +
            "(:username IS NULL OR LOWER(l.username) LIKE LOWER(CONCAT('%', :username, '%'))) AND " +
            "(:ipAddress IS NULL OR l.ipAddress LIKE CONCAT('%', :ipAddress, '%')) " +
            "ORDER BY l.timestamp DESC")
    List<LoginEvent> searchLogins(@Param("start") LocalDateTime start,
                                  @Param("end") LocalDateTime end,
                                  @Param("username") String username,
                                  @Param("ipAddress") String ipAddress);

    // Find suspicious login patterns (multiple failed attempts from same IP)
    @Query("SELECT l FROM LoginEvent l WHERE l.ipAddress = :ipAddress AND l.timestamp > :since ORDER BY l.timestamp DESC")
    List<LoginEvent> findByIPAddressAndTimestampAfter(@Param("ipAddress") String ipAddress,
                                                      @Param("since") LocalDateTime since);

    // Find login events for a specific user within a time range
    @Query("SELECT l FROM LoginEvent l WHERE l.username = :username AND l.timestamp BETWEEN :start AND :end ORDER BY l.timestamp DESC")
    List<LoginEvent> findByUsernameAndTimestampBetween(@Param("username") String username,
                                                       @Param("start") LocalDateTime start,
                                                       @Param("end") LocalDateTime end);
}