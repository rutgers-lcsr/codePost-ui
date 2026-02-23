# Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
require 'nokogiri'
require 'json'

def parse_html
    doc = Nokogiri::HTML("<h1>Hello World</h1>")
    puts doc.at_css("h1").text
end

parse_html
