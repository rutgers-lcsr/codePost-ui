require_relative './helper'

sum_value = parse_and_sum('3,5,8,13,21')
raise 'Expected sum=50' unless sum_value == 50

puts "[ruby][multi_file_import] sum=#{sum_value}"
