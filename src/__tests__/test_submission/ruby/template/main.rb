require 'json'

def parse_numbers(csv_line)
  # TODO(student): parse comma-separated integers.
  []
end

csv_line = File.read(File.join(__dir__, '..', 'existing_data.txt')).strip
values = parse_numbers(csv_line)

File.write(File.join(__dir__, 'starter_output.txt'), "TODO count=#{values.length}\n")

raise 'Starter assertion intentionally triggers until parse_numbers is implemented.' unless values.length.positive?

puts 'Ruby starter template ran.'
