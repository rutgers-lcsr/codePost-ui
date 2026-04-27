# Sample R file — grade distribution analysis

library(ggplot2)

# Simulate student grades
set.seed(42)
n_students <- 200

grades <- data.frame(
  student_id = seq_len(n_students),
  hw_avg     = rnorm(n_students, mean = 82, sd = 12),
  midterm    = rnorm(n_students, mean = 75, sd = 15),
  final      = rnorm(n_students, mean = 78, sd = 14)
)

# Clamp to [0, 100]
grades[, -1] <- lapply(grades[, -1], function(x) pmin(pmax(x, 0), 100))

# Calculate weighted final grade
grades$total <- with(grades, hw_avg * 0.3 + midterm * 0.3 + final * 0.4)

# Assign letter grades
assign_letter <- function(score) {
  cut(score,
      breaks = c(-Inf, 60, 70, 80, 90, Inf),
      labels = c("F", "D", "C", "B", "A"),
      right  = FALSE)
}
grades$letter <- assign_letter(grades$total)

# Summary statistics
cat("Grade Distribution Summary\n")
cat("==========================\n")
cat(sprintf("Mean:   %.1f\n", mean(grades$total)))
cat(sprintf("Median: %.1f\n", median(grades$total)))
cat(sprintf("Std:    %.1f\n", sd(grades$total)))
cat("\nLetter grade counts:\n")
print(table(grades$letter))
