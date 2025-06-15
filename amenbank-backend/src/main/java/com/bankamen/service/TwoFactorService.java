package com.bankamen.service;

import com.bankamen.entity.User;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class TwoFactorService {

    private final ConcurrentHashMap<String, String> userTokenCache = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();

    // Generate 6-digit token and send via email or SMS
    public String generateAndSendToken(User user) {
        String token = String.format("%06d", random.nextInt(999999));

        // Store token against username (implement expiration if you want)
        userTokenCache.put(user.getUsername(), token);

        // TODO: send token via email or SMS
        System.out.println("2FA Token for user " + user.getUsername() + ": " + token);

        return token;
    }

    public boolean verifyToken(String username, String token) {
        String cachedToken = userTokenCache.get(username);
        if (cachedToken != null && cachedToken.equals(token)) {
            userTokenCache.remove(username); // invalidate token once used
            return true;
        }
        return false;
    }
}

