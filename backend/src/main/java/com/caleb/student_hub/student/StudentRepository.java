package com.caleb.student_hub.student;

import com.caleb.student_hub.student.dto.StudentDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long>, JpaSpecificationExecutor<Student> {
    @Query("SELECT new com.caleb.student_hub.student.dto.StudentDTO(s.studentId, s.firstName, s.lastName, s.dob, s.studentClass, s.score) " +
            "FROM Student s " +
            "WHERE (:studentId IS NULL OR s.studentId = :studentId) " +
            "AND (:studentClass IS NULL OR s.studentClass = :studentClass)")
    Page<StudentDTO> findStudents(Pageable pageable,
                                                 @Param("studentId") Long studentId,
                                                 @Param("studentClass") String studentClass);}
