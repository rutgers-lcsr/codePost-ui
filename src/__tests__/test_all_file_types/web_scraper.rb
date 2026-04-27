# frozen_string_literal: true

# Sample Ruby file — simple web scraper simulation.

require 'uri'
require 'net/http'
require 'json'

module WebScraper
  class Page
    attr_reader :url, :status, :headers, :body

    def initialize(url:, status:, headers: {}, body: '')
      @url = url
      @status = status
      @headers = headers
      @body = body
    end

    def success?
      (200..299).include?(status)
    end

    def content_type
      headers['content-type']&.split(';')&.first&.strip
    end

    def links
      body.scan(/href=["']([^"']+)["']/).flatten.map do |href|
        URI.join(url, href).to_s rescue nil
      end.compact.uniq
    end
  end

  class Crawler
    MAX_DEPTH = 3

    def initialize(base_url)
      @base_url = URI(base_url)
      @visited = Set.new
      @results = []
    end

    def crawl(url = @base_url.to_s, depth: 0)
      return if depth > MAX_DEPTH || @visited.include?(url)

      @visited.add(url)
      page = fetch(url)
      return unless page&.success?

      @results << { url: page.url, status: page.status, links: page.links.size }
      page.links.each { |link| crawl(link, depth: depth + 1) }
    end

    def report
      puts "Crawled #{@results.size} pages:"
      @results.each do |r|
        puts "  #{r[:status]} #{r[:url]} (#{r[:links]} links)"
      end
    end

    private

    def fetch(url)
      uri = URI(url)
      response = Net::HTTP.get_response(uri)
      Page.new(
        url: url,
        status: response.code.to_i,
        headers: response.to_hash.transform_values(&:first),
        body: response.body
      )
    rescue StandardError => e
      warn "Failed to fetch #{url}: #{e.message}"
      nil
    end
  end
end

if __FILE__ == $PROGRAM_NAME
  crawler = WebScraper::Crawler.new('https://example.com')
  crawler.crawl
  crawler.report
end
