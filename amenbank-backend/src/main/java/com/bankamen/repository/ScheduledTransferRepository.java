package com.bankamen.repository;

import com.bankamen.entity.ScheduledTransfer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface ScheduledTransferRepository extends JpaRepository<ScheduledTransfer, Long> {
    List<ScheduledTransfer> findByActiveTrueAndStartDateLessThanEqualAndEndDateGreaterThanEqual(LocalDate start, LocalDate end);
}
