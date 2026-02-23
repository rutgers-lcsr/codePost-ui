# Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
parse_csv <- function(csv_line) {
  as.numeric(strsplit(csv_line, ",")[[1]])
}
