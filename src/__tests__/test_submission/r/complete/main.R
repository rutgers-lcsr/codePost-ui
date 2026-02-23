# Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
parse_numbers <- function(csv_line) {
  as.numeric(strsplit(csv_line, ",")[[1]])
}

csv_line <- trimws(readLines("../existing_data.txt", warn = FALSE)[1])
values <- parse_numbers(csv_line)

sum_value <- sum(values)
max_value <- max(values)

summary_lines <- c(
  sprintf("count=%d", length(values)),
  sprintf("sum=%d", sum_value),
  sprintf("max=%d", max_value)
)
writeLines(summary_lines, "result_summary.txt")

markdown_lines <- c(
  "# R Rendering Preview",
  "",
  "- Unicode: café λ 🚀",
  "- Status: success",
  "",
  "```text",
  "idx | value",
  "-----------",
  sprintf("%d   | %d", seq_along(values) - 1, values),
  "```",
  ""
)
writeLines(markdown_lines, "render_preview.md")

png("plot.png", width = 700, height = 400)
plot(values, type = "b", col = "steelblue", pch = 19,
     main = "R Compatibility Plot", xlab = "Index", ylab = "Value")
dev.off()

stopifnot(length(values) == 5)
stopifnot(sum_value == 50)
stopifnot(max_value == 21)

cat("=== R RENDER TEST START ===\n")
cat("unicode: café λ 🚀\n")
cat("json: {\"language\":\"r\",\"status\":\"ok\"}\n")
cat("idx | value\n")
for (i in seq_along(values)) {
  cat(sprintf("%3d | %d\n", i - 1, values[i]))
}
message("[stderr][r] Render check stderr line")
cat("R compatibility checks passed.\n")
