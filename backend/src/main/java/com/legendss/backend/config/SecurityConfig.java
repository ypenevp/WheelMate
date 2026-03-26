package com.legendss.backend.config;

import com.legendss.backend.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/register", "/api/auth/verify", "/api/auth/login").permitAll()
                        .requestMatchers("/api/auth/me").authenticated()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/relationships/**").hasAnyRole("USER", "ADMIN")
                        .requestMatchers("/api/user/**").hasAnyRole("USER", "ADMIN", "RELATIVE", "CARETAKER")
                        .requestMatchers("/api/caretakers/**").hasRole("USER")
                        .requestMatchers("/api/wheelchairs/wheelchair/add", "/api/wheelchairs/wheelchair/delete/**", "/api/wheelchairs/wheelchair/get/**", "/api/wheelchairs/wheelchair/get/all").hasRole("USER")
                        .requestMatchers("/api/wheelchairs/wheelchair/update/**").permitAll()

                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}