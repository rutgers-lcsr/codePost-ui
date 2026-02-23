# Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
require_relative '../lib/math_utils'

values = parse_csv('1,2,3,4')
raise 'Expected 4 values' unless values.length == 4

puts "[ruby][nested_paths] count=#{values.length}"
