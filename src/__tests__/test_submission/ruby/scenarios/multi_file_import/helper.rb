# Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
def parse_and_sum(csv_line)
  csv_line.split(',').map { |value| Integer(value.strip) }.sum
end
