require 'json'
require 'fileutils'

def parse_numbers(csv_line)
  csv_line.split(',').map { |part| Integer(part.strip) }
end

def assert_true(condition, message)
  raise message unless condition
end

csv_line = File.read(File.join(__dir__, '..', 'existing_data.txt')).strip
values = parse_numbers(csv_line)

summary = {
  count: values.length,
  sum: values.sum,
  max: values.max,
}

File.write(File.join(__dir__, 'result_summary.json'), JSON.pretty_generate(summary) + "\n")

markdown_lines = [
  '# Ruby Rendering Preview',
  '',
  '- Unicode: café λ 🚀',
  '- Status: success',
  '',
  '```text',
  'idx | value',
  '-----------',
]
markdown_lines.concat(values.each_with_index.map { |value, index| "#{index}   | #{value}" })
markdown_lines << '```'
markdown_lines << ''
File.write(File.join(__dir__, 'render_preview.md'), markdown_lines.join("\n"))

assert_true(values.length == 5, 'Expected five values.')
assert_true(values.sum == 50, 'Expected sum to equal 50.')
assert_true(values.max == 21, 'Expected max to equal 21.')

puts '=== RUBY RENDER TEST START ==='
puts 'unicode: café λ 🚀'
puts 'json: {"language":"ruby","status":"ok"}'
puts 'idx | value'
values.each_with_index { |value, index| puts format('%3d | %d', index, value) }
warn '[stderr][ruby] Render check stderr line'
puts 'Ruby compatibility checks passed.'
