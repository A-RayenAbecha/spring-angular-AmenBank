package com.bankamen.util;

import com.bankamen.entity.LoginEvent;
import com.bankamen.repository.LoginEventRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.authentication.event.AuthenticationSuccessEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class AuthenticationLogger {

    private final LoginEventRepository loginEventRepository;
    private final HttpServletRequest request;

    public AuthenticationLogger(LoginEventRepository loginEventRepository, HttpServletRequest request) {
        this.loginEventRepository = loginEventRepository;
        this.request = request;
    }

    @EventListener
    public void handleSuccess(AuthenticationSuccessEvent event) {
        System.out.println("✅ Authentication success detected!");

        String username = event.getAuthentication().getName();

        LoginEvent loginEvent = new LoginEvent();
        loginEvent.setUsername(username);
        loginEvent.setIpAddress(request.getRemoteAddr());
        loginEvent.setUserAgent(request.getHeader("User-Agent"));
        loginEvent.setTimestamp(LocalDateTime.now());

        loginEventRepository.save(loginEvent);
    }

}
