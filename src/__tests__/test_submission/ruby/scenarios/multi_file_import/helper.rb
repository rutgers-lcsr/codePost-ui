def parse_and_sum(csv_line)
  csv_line.split(',').map { |value| Integer(value.strip) }.sum
end
