package com.bankamen.service;

import com.bankamen.entity.BankAccount;
import com.bankamen.entity.User;
import com.bankamen.repository.BankAccountRepository;
import com.bankamen.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BankAccountService {

    @Autowired
    private BankAccountRepository bankAccountRepo;

    @Autowired
    private UserRepository userRepository;


    public List<BankAccount> getAccountsByUser(Long userId) {
        return bankAccountRepo.findByUserId(userId);
    }

    public BankAccount createAccount(BankAccount account, Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        account.setUser(user);
        return bankAccountRepo.save(account);
    }
    public boolean userOwnsAccount(Long accountId, String username) {
        BankAccount account = bankAccountRepo.findById(accountId).orElse(null);
        return account != null && account.getUser().getUsername().equals(username);
    }

    public BankAccount getAccountDetails(Long accountId) {
        return bankAccountRepo.findById(accountId).orElseThrow();
    }
}
