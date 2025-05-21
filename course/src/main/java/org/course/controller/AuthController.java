package org.course.controller;

import jakarta.validation.Valid;
import org.course.dto.AuthRequest;
import org.course.dto.AuthResponse;
import org.course.dto.RefreshTokenRequest;
import org.course.entity.RefreshToken;
import org.course.entity.User;
import org.course.service.JwtService;
import org.course.service.RefreshTokenService;
import org.course.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserService userService;
    private final RefreshTokenService refreshTokenService;

    public AuthController(AuthenticationManager authenticationManager, JwtService jwtService, UserService userService, RefreshTokenService refreshTokenService) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userService = userService;
        this.refreshTokenService = refreshTokenService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> authenticateAndGetToken(@Valid @RequestBody AuthRequest authRequest) {
        logger.info("Отримано запит на логін для email: {}", authRequest.email());
        Authentication authentication = null;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(authRequest.email(), authRequest.password())
            );
            if (authentication.isAuthenticated()) {
                User user = userService.findByEmail(authRequest.email());
                logger.debug("Аутентифікація успішна для користувача: {}", user.getEmail());
                String accessToken = jwtService.generateToken(user);
                RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);
                logger.info("Логін успішний. Згенеровано access token та refresh token.");
                return ResponseEntity.ok(new AuthResponse(accessToken, refreshToken.getToken()));
            } else {
                logger.warn("Аутентифікація невдала для email: {}", authRequest.email());
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
            }
        } catch (Exception e) {
            logger.error("Помилка під час аутентифікації для email: {}", authRequest.email(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Помилка під час аутентифікації");
        } finally {
            logger.info("Завершено обробку запиту на логін для email: {}", authRequest.email());
        }
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<AuthResponse> refreshToken(@RequestBody RefreshTokenRequest refreshTokenRequest) {
        return refreshTokenService.findByToken(refreshTokenRequest.refreshToken())
                .map(refreshTokenService::verifyExpiration)
                .map(RefreshToken::getUser)
                .map(user -> {
                    String accessToken = jwtService.generateToken(user);
                    return ResponseEntity.ok(new AuthResponse(accessToken, refreshTokenRequest.refreshToken()));
                })
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Invalid refresh token"));
    }
}