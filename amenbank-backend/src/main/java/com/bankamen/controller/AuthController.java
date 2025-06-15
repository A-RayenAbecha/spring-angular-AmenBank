package com.bankamen.controller;

import com.bankamen.config.TwoFactorAuthConfig;
import com.bankamen.dto.LoginRequest;
import com.bankamen.dto.ResetPasswordRequest;
import com.bankamen.dto.SignUpRequest;
import com.bankamen.dto.TwoFactorRequest;
import com.bankamen.entity.Role;
import com.bankamen.entity.User;
import com.bankamen.repository.UserRepository;
import com.bankamen.service.EmailService;
import com.bankamen.service.TwoFactorService;
import com.bankamen.service.JwtService ;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import org.springframework.security.core.AuthenticationException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private TwoFactorAuthConfig twoFactorAuthConfig;

    @Autowired
    private TwoFactorService twoFactorService;

    @Autowired
    private JwtService jwtService;
    @Autowired
    private EmailService emailService;

    @PostMapping("/signup")
    public ResponseEntity<String> registerUser(@Valid @RequestBody SignUpRequest signUpRequest) {
        // Check if username or email already exists
        if (userRepository.existsByUsername(signUpRequest.getUsername())) {
            return ResponseEntity.badRequest().body("Error: Username is already taken!");
        }
        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity.badRequest().body("Error: Email is already in use!");
        }

        // Create new user account
        User user = new User();
        user.setUsername(signUpRequest.getUsername());
        user.setEmail(signUpRequest.getEmail());
        user.setPassword(passwordEncoder.encode(signUpRequest.getPassword()));
        user.setFirstName(signUpRequest.getFirst_name());
        user.setLastName(signUpRequest.getLast_name());
        user.setCin(signUpRequest.getCin());
        user.setDateOfBirth(signUpRequest.getDateOfBirth());

        try {
            // Map the provided role string to the enum
            Role role = Role.valueOf(signUpRequest.getRole().toUpperCase());
            user.setRole(role);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Error: Invalid role provided. Available roles: CLIENT, RESPONSABLE, SUPERADMIN");
        }

        userRepository.save(user);
        return ResponseEntity.ok("User registered successfully");
    }


    @Autowired
    private AuthenticationManager authenticationManager;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        Optional<User> optionalUser = userRepository.findByUsername(loginRequest.getUsername());

        if (optionalUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid username or password");
        }

        User user = optionalUser.get();

        if (!user.isEnabled()) {
            emailService.sendAlert(
                    "rayenabecha@gmail.com",
                    "Alerte : Compte désactivé",
                    "Tentative de connexion au compte désactivé : " + user.getUsername()
            );
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Account is disabled. Contact administrator.");
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getUsername(),
                            loginRequest.getPassword()
                    )
            );

            // Successful password verification
            user.setFailedLoginAttempts(0);
            user.setLastLogin(LocalDateTime.now());

            if (user.isTwoFactorEnabled()) {
                // ✅ Generate email code
                String code = String.format("%06d", new Random().nextInt(999999));
                LocalDateTime expiry = LocalDateTime.now().plusMinutes(5);

                user.setEmail2FACode(code);
                user.setEmail2FAExpiry(expiry);
                userRepository.save(user);

                // ✅ Send email
                emailService.sendAlert(
                        user.getEmail(),
                        "Code de vérification 2FA",
                        "Voici votre code de vérification : " + code + "\nCe code expirera dans 5 minutes."
                );

                return ResponseEntity.ok(Map.of(
                        "message", "2FA code sent to email.",
                        "twoFactorRequired", true
                ));
            }

            // ✅ No 2FA required → return token directly
            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwtToken = jwtService.generateToken(user);
            System.out.println("✅ JWT generated for " + user.getUsername() + ": " + jwtToken);

            // Create response with user data
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Login successful");
            response.put("role", user.getRole().name());
            response.put("token", jwtToken);
            response.put("user", user);  // Include the full user object

            return ResponseEntity.ok(response);

        } catch (AuthenticationException ex) {
            int failedAttempts = user.getFailedLoginAttempts() + 1;
            user.setFailedLoginAttempts(failedAttempts);

            if (failedAttempts >= 5) {
                user.setEnabled(false);
            }

            userRepository.save(user);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    failedAttempts >= 5 ?
                            "Account locked after 5 failed attempts. Contact admin." :
                            "Invalid username or password. Attempt " + failedAttempts + "/5"
            );
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logoutUser() {
        // Ici, côté serveur, pas grand chose à faire avec JWT stateless.
        // Tu peux juste retourner OK, le client supprimera son token JWT.
        SecurityContextHolder.clearContext();
        return ResponseEntity.ok(Map.of("message", "Logout successful"));
    }






    @PostMapping("/2fa-verify")
    public ResponseEntity<?> verifyTwoFactor(@RequestBody TwoFactorRequest request) {
        Optional<User> userOpt = userRepository.findByUsername(request.getUsername());

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }

        User user = userOpt.get();

        if (!user.isTwoFactorEnabled()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("2FA not enabled for this user");
        }

        // Check code and expiry
        if (user.getEmail2FACode() == null || user.getEmail2FAExpiry() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("No 2FA code found");
        }

        if (LocalDateTime.now().isAfter(user.getEmail2FAExpiry())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("2FA code expired");
        }

        if (!request.getToken().equals(user.getEmail2FACode())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid 2FA code");
        }

        // ✅ Success — Invalidate the code
        user.setEmail2FACode(null);
        user.setEmail2FAExpiry(null);
        userRepository.save(user);

        // Generate JWT
        String jwt = jwtService.generateToken(user);

        return ResponseEntity.ok(Map.of(
                "message", "2FA verification successful",
                "token", jwt,
                "role", user.getRole().name()
        ));
    }




    // 1) Demander réinitialisation (mot de passe oublié)
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestParam String email) {
        Optional<User> userOptional = userRepository.findByEmail(email);
        if (userOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Email non trouvé.");
        }

        User user = userOptional.get();
        String token = UUID.randomUUID().toString();
        user.setResetToken(token);
        user.setResetTokenExpiry(LocalDateTime.now().plusMinutes(15));
        userRepository.save(user);

        String resetLink = "http://localhost:4200/reset-password?token=" + token;
        String subject = "Réinitialisation de votre mot de passe";
        String content = "Bonjour,\n\nVeuillez cliquer sur ce lien pour réinitialiser votre mot de passe :\n"
                + resetLink + "\n\nCe lien expire dans 15 minutes.\n\nCordialement,\nAmenbANK";

        emailService.sendAlert(user.getEmail(), subject, content);

        return ResponseEntity.ok(Map.of("message", "Un lien de réinitialisation a été envoyé à votre email."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        Optional<User> optionalUser = userRepository.findByResetToken(request.getToken());

        if (optionalUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Token invalide.");
        }

        User user = optionalUser.get();

        if (user.getResetTokenExpiry() == null || user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Token expiré.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Mot de passe réinitialisé avec succès."));
    }

}
