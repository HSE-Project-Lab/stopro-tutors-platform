package ru.stopro.controller;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ru.stopro.domain.entity.User;
import ru.stopro.dto.analytics.TeacherStudentHeatmapDto;
import ru.stopro.repository.UserRepository;
import ru.stopro.service.TeacherAnalyticsService;

/**
 * Контроллер аналитики для преподавателя.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/analytics/teacher")
@RequiredArgsConstructor
@Tag(name = "Teacher Analytics", description = "API аналитики для преподавателя")
@PreAuthorize("hasAnyAuthority('TEACHER', 'ROLE_TEACHER', 'ADMIN', 'ROLE_ADMIN')")
public class TeacherAnalyticsController {

    private final TeacherAnalyticsService analyticsService;
    private final UserRepository userRepository;

    @Operation(
        summary = "Тепловая карта группы",
        description = "Возвращает аналитику всех учеников учителя: heatmap по заданиям, radar навыков, слабые темы, прогноз баллов"
    )
    @GetMapping("/students-heatmap")
    public ResponseEntity<List<TeacherStudentHeatmapDto>> getStudentsHeatmap(
            @AuthenticationPrincipal UserDetails userDetails) {
        
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<TeacherStudentHeatmapDto> result = analyticsService.getStudentsHeatmap(user.getId());
        
        if (result.isEmpty()) {
            log.debug("Учитель {} не имеет данных аналитики (нет групп или студентов)", user.getId());
            return ResponseEntity.ok(Collections.emptyList());
        }
        
        return ResponseEntity.ok(result);
    }

    @Operation(
        summary = "Детальная аналитика ученика",
        description = "Возвращает полную аналитику конкретного ученика"
    )
    @GetMapping("/student/{studentId}/detail")
    public ResponseEntity<TeacherStudentHeatmapDto> getStudentDetail(
            @PathVariable UUID studentId,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        User teacher = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (!analyticsService.isTeacherOfStudent(teacher.getId(), studentId)) {
            log.warn("Учитель {} попытался получить доступ к аналитике студента {}", 
                    teacher.getId(), studentId);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        TeacherStudentHeatmapDto result = analyticsService.buildStudentHeatmap(studentId);
        
        if (result == null) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(result);
    }
}
