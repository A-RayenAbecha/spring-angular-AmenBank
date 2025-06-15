package com.bankamen.repository;

import com.bankamen.entity.LoanApplication;
import com.bankamen.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LoanApplicationRepository extends JpaRepository<LoanApplication, Long> {
    List<LoanApplication> findByAccount_User(User user);


}
