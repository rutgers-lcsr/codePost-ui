source("helpers.R")

sum_value <- parse_and_sum("3,5,8,13,21")
stopifnot(sum_value == 50)

cat(sprintf("[r][multi_file_import] sum=%d\n", sum_value))
