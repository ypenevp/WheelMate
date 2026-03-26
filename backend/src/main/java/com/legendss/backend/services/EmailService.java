package com.legendss.backend.services;


import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendVerificationCode(String email, String code) {
        var message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("Email verification");
        message.setText("Verification code: " + code);
        mailSender.send(message);
    }
}