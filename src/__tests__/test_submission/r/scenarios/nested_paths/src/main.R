source("../lib/math.R")

values <- parse_csv("1,2,3,4")
stopifnot(length(values) == 4)

cat(sprintf("[r][nested_paths] count=%d\n", length(values)))
