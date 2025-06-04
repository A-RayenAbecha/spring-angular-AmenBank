package com.bankamen.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.bankamen.entity.ScheduledTransfer;

public interface ScheduledTransferRepository extends JpaRepository<ScheduledTransfer, Long> {
    List<ScheduledTransfer> findByActiveTrueAndStartDateLessThanEqualAndEndDateGreaterThanEqual(LocalDate start, LocalDate end);
}
