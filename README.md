# WheelMate
> Modular smart wheelchair platform improving mobility, safety and independence for wheelchair users via real-time GPS tracking and SOS emergency alerts.

---

## Table of Contents
- [Introduction](#-introduction)
- [Features](#-features)
- [API Documentation](#-api-documentation)
- [Hardware Schematics](#-schematic)
- [Tech Stack](#-tech-stack)
- [Installation Guide](#-installation-guide)
- [Usage](#-usage)
- [Future Improvements](#-future-improvements)
- [License](#-license)

---

## Introduction

**The problem:**
- In emergency situations, users often cannot call for help quickly or reliably.
- Wheelchair users lack smart tools for real-time navigation adapted to their mobility needs.
- Caregivers and family members have no way to remotely monitor the user's location or safety.
- Wheelchair users often struggle to find accessible routes suitable for their mobility needs.

**Our solution:**

WheelMate is a modular IoT platform for smart wheelchairs. It combines an ESP32-based hardware module with a Spring Boot backend and a mobile app to deliver real-time GPS/GSM tracking, a one-press SOS panic button, and a user-friendly on-device display. It also features an accelerometer-based SOS panic signal that can automatically detect emergencies, along with an intelligent navigation system tailored for wheelchair-accessible routes. Emergency signals are automatically dispatched to registered contacts and volunteer organizations.

---

## Features

### Core Features
- Real-time tracking of the wheelchair's location.
- Fall/flip detection with accelerometer sensor, data triggers SOS alert.
- SOS panic button — instantly alerts registered contacts and volunteer organizations.
- Smart mobility-aware navigation (avoids stairs, curbs, inaccessible routes).
- On-device display (OLED) showing navigation info and real time.
- Sensor indicating whether there is someone in the wheelchair.

### Extra Features
- User authentication.
- Volunteer organizations system.
- Sensor indicating whether the wheelchair is moving too fast.

---

## API Documentation

Base URL: `http://localhost:7070/api`

### Wheelchair

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST`   | `/wheelchair/addwheelchair` | Add a wheelchair with GPS coordinates and speed. |
| `GET`    | `/wheelchair/getallwheelchair` | Get all wheelchairs from DB. |
| `GET`    | `/wheelchair/getwheelchair/{id}` | Get a single wheelchair by ID. |
| `PATCH`  | `/wheelchair/updatewheelchair/{id}` | Update wheelchair parameters. |
| `DELETE` | `/wheelchair/deletewheelchair/{id}` | Delete a wheelchair by ID. |

---

### Caretaker

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST`   | `/caretaker/add` | Add a new caretaker with name and number. |
| `GET`    | `/caretaker/get/{id}` | Get a single caretaker by ID. |
| `GET`    | `/caretaker/getall` | Get all caretakers. |
| `PATCH`  | `/caretaker/update/{id}` | Update a caretaker's name or number. |
| `DELETE` | `/caretaker/delete/{id}` | Delete a caretaker by ID. |

---

### Reletionships

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST`   | `/caretaker/add` | Connect caretaker with user. |
| `POST`   | `/relative/add` | Connect relative with user. |
| `GET`    | `/caretakers` | Get all caretaker. |
| `GET`    | `/relatives` | Get all relatives. |

---

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register?role=CARETAKER` | Register user with email, username and password. |
| `POST` | `/auth/verify` | Verify user with a code sent to their email. |
| `POST` | `/auth/login` | Login a verified user with email and password. |
| `GET`  | `/auth/me` | Get the currently authenticated user. |
| `GET`  | `/auth/getallusers` | Get all authenticated users from DB. |

---

### User Profile

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST`   | `/userprofile/createuserprofile` | Create a user profile with address, photo and telephone. |
| `GET`    | `/userprofile/getuserprofile/{id}` | Get a user profile by ID. |
| `PATCH`  | `/userprofile/updateuserprofile/{id}` | Update a user profile by ID. |
| `DELETE` | `/userprofile/deleteuserprofile/{id}` | Delete a user profile by ID. |

---

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| `PATCH` | `/admin/users/role` | Update user's role . |

---
## Schematic

![Modules architecture](docx/images/modules.png)


---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Firmware** | C++ (Arduino framework), ESP32 S3 |
| **Sensors** | NEO-6M GPS, SIM800L GSM, MPU6050 |
| **Display** | SSD1306 OLED display |
| **Backend** | Spring Boot |
| **Database** | PostgreSQL |
| **Authentication** | JWT |
| **Frontend** | React Native (Expo) |
| **Build tools** | Maven, PlatformIO |

---

## Installation Guide

### Prerequisites
- Java 25+
- Maven 3.9+
- PostgreSQL
- PlatformIO
- Node.js 24+ (for mobile app)

---

## Future Improvements
- Obstacle detection via ultrasonic sensor.
- Joystick-controlled module for intuitive wheelchair navigation.
- Voice control integration for blind people.
- Extended battery life and power management optimization.
- Offline navigation support in low-connectivity areas.

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
