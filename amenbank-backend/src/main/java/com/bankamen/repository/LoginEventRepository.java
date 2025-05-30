package com.bankamen.repository;

import com.bankamen.entity.LoginEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface LoginEventRepository extends JpaRepository<LoginEvent, Long> {
    List<LoginEvent> findByTimestampBetween(LocalDateTime start, LocalDateTime end);
    List<LoginEvent> findByUsernameAndTimestampBetween(String username, LocalDateTime start, LocalDateTime end);
}
