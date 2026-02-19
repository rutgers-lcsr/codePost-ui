parse_numbers <- function(csv_line) {
  # TODO(student): parse comma-separated numeric values.
  numeric(0)
}

csv_line <- trimws(readLines("../existing_data.txt", warn = FALSE)[1])
values <- parse_numbers(csv_line)

writeLines(sprintf("TODO count=%d", length(values)), "starter_output.txt")

stopifnot("Starter assertion intentionally triggers until parse_numbers is implemented." = length(values) > 0)
