require 'nokogiri'
require 'json'

def parse_html
    doc = Nokogiri::HTML("<h1>Hello World</h1>")
    puts doc.at_css("h1").text
end

parse_html
