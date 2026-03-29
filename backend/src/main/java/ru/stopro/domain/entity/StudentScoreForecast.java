package ru.stopro.domain.entity;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "student_score_forecasts", uniqueConstraints = {
		@UniqueConstraint(name = "uq_score_forecast_student_date", columnNames = {"student_id",
				"forecast_date"})}, indexes = {@Index(name = "idx_score_forecast_student", columnList = "student_id"),
						@Index(name = "idx_score_forecast_date", columnList = "forecast_date")})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentScoreForecast extends BaseEntity {

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "student_id", nullable = false)
	private User student;

	@Column(name = "forecast_date", nullable = false)
	private LocalDate forecastDate;

	@Column(name = "predicted_score", nullable = false)
	private Integer predictedScore;

	@Column(name = "confidence_low")
	private Integer confidenceLow;

	@Column(name = "confidence_high")
	private Integer confidenceHigh;

	@Column(name = "source", nullable = false, length = 30)
	@Builder.Default
	private String source = "DASHBOARD";
}
