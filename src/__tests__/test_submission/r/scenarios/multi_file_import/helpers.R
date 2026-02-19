parse_and_sum <- function(csv_line) {
  values <- as.numeric(strsplit(csv_line, ",")[[1]])
  sum(values)
}
