package com.legendss.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.function.Function;

@Service
public class JwtService {

    private final byte[] secret;
    private final long expiration;

    public JwtService(
            @Value("${security.jwt.secret-key}") String secret,
            @Value("${security.jwt.expiration-time}") long expiration
    ) {
        this.secret = secret.getBytes();
        this.expiration = expiration;
    }

    public String generateToken(String email, String role) {
        return Jwts.builder()
                .subject(email)
                .claim("role", role)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(Keys.hmacShaKeyFor(secret))
                .compact();
    }

    public String extractEmail(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public String extractRole(String token) {
        return extractClaim(token, claims -> claims.get("role", String.class));
    }

    private <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        Claims claims = Jwts.parser()
                .verifyWith(Keys.hmacShaKeyFor(secret))
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return claimsResolver.apply(claims);
    }
}