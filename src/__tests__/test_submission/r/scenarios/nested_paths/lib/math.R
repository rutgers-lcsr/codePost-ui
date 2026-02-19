parse_csv <- function(csv_line) {
  as.numeric(strsplit(csv_line, ",")[[1]])
}
