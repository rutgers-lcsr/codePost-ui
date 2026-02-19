def parse_csv(csv_line)
  csv_line.split(',').map { |value| Integer(value.strip) }
end
