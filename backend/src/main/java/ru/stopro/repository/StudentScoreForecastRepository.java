package ru.stopro.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import ru.stopro.domain.entity.StudentScoreForecast;

@Repository
public interface StudentScoreForecastRepository extends JpaRepository<StudentScoreForecast, UUID> {

	Optional<StudentScoreForecast> findByStudent_IdAndForecastDate(UUID studentId, LocalDate forecastDate);

	List<StudentScoreForecast> findByStudent_IdAndIsDeletedFalseOrderByForecastDateAsc(UUID studentId);
}
