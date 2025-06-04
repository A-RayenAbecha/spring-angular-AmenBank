package com.bankamen.service;

import com.bankamen.dto.Installment;
import com.bankamen.dto.LoanApplicationRequest;
import com.bankamen.dto.LoanSimulationRequest;
import com.bankamen.dto.LoanSimulationResponse;
import com.bankamen.entity.BankAccount;
import com.bankamen.entity.LoanApplication;
import com.bankamen.entity.LoanStatus;
import com.bankamen.entity.User;
import com.bankamen.exception.BusinessException;
import com.bankamen.repository.BankAccountRepository;
import com.bankamen.repository.LoanApplicationRepository;
import com.bankamen.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class LoanService {

    @Autowired
    BankAccountRepository bankAccountRepository;
    @Autowired
    UserRepository userRepository;
    @Autowired
    LoanApplicationRepository loanRepository;




    public LoanSimulationResponse simulateLoan(LoanSimulationRequest request) {
        double P = request.getAmount();
        double r = request.getInterestRate() / 100 / 12;
        int n = request.getTermInMonths();

        double monthlyPayment = (P * r) / (1 - Math.pow(1 + r, -n));
        double totalPayment = monthlyPayment * n;

        List<Installment> schedule = new ArrayList<>();
        double remaining = P;

        for (int i = 1; i <= n; i++) {
            double interest = remaining * r;
            double principal = monthlyPayment - interest;
            remaining -= principal;

            Installment inst = new Installment();
            inst.setMonth(i);
            inst.setPrincipal(principal);
            inst.setInterest(interest);
            inst.setTotal(monthlyPayment);
            schedule.add(inst);
        }

        LoanSimulationResponse response = new LoanSimulationResponse();
        response.setMonthlyPayment(monthlyPayment);
        response.setTotalPayment(totalPayment);
        response.setSchedule(schedule);

        return response;
    }
    public LoanApplication submitLoanRequest(LoanApplicationRequest request, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("Utilisateur introuvable"));

        BankAccount account = bankAccountRepository.findById(request.getAccountId())
                .orElseThrow(() -> new BusinessException("Compte introuvable"));

        // Optional: verify the account belongs to the user to prevent abuse
        if (!account.getUser().getId().equals(user.getId())) {
            throw new BusinessException("Compte non associé à l'utilisateur");
        }

        LoanApplication application = new LoanApplication();
        application.setAmount(request.getAmount());
        application.setInterestRate(request.getInterestRate());
        application.setTermInMonths(request.getTermInMonths());
        application.setAccount(account);
        application.setStatus(LoanStatus.PENDING);

        return loanRepository.save(application);
    }
    public List<LoanApplication> getUserLoanApplications(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("Utilisateur introuvable"));
        return loanRepository.findByAccount_User(user);
    }

    public LoanApplication getUserLoanApplication(Long id, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("Utilisateur introuvable"));

        LoanApplication application = loanRepository.findById(id).orElse(null);
        if (application != null && application.getAccount().getUser().getId().equals(user.getId())) {
            return application;
        }
        return null;
    }



}
