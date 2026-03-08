package com.caleb.student_hub.student;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDate;

@Entity
@Table(name = "students")
public record Student(
    @Id
    @Column(name = "student_id")
    Long studentId,

    @Column(name = "first_name")
    String firstName,

    @Column(name = "last_name")
    String lastName,

    @Column(name = "dob")
    LocalDate dob,

    @Column(name = "student_class")
    String studentClass,

    @Column(name = "score")
    Integer score
) {
}
