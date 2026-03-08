package com.caleb.student_hub.student.dto;

import java.time.LocalDate;

public record StudentDTO(Long studentId, String firstName, String lastName, LocalDate dob, String studentClass, int score) {}
