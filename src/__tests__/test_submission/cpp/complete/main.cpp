#include <algorithm>
#include <cassert>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <numeric>
#include <sstream>
#include <string>
#include <vector>

std::vector<int> parse_numbers(const std::string& csv_line) {
    std::vector<int> values;
    std::stringstream ss(csv_line);
    std::string token;
    while (std::getline(ss, token, ',')) {
        values.push_back(std::stoi(token));
    }
    return values;
}

int main() {
    std::ifstream input("../existing_data.txt");
    assert(input.good() && "Input file should exist.");

    std::string line;
    std::getline(input, line);
    auto values = parse_numbers(line);
    assert(values.size() == 5 && "Expected five values from fixture input.");

    int total = std::accumulate(values.begin(), values.end(), 0);
    int max_value = *std::max_element(values.begin(), values.end());

    std::ofstream output("result_summary.txt");
    output << "count=" << values.size() << "\n";
    output << "sum=" << total << "\n";
    output << "max=" << max_value << "\n";

    std::ofstream markdown("render_preview.md");
    markdown << "# C++ Rendering Preview\n\n";
    markdown << "- Unicode: café λ 🚀\n";
    markdown << "- Status: success\n\n";
    markdown << "```text\n";
    markdown << "idx | value\n";
    markdown << "-----------\n";
    for (size_t i = 0; i < values.size(); ++i) {
        markdown << i << "   | " << values[i] << "\n";
    }
    markdown << "```\n";

    assert(total == 50 && "Sum should match fixture data.");
    assert(max_value == 21 && "Max should match fixture data.");

    std::cout << "=== C++ RENDER TEST START ===" << std::endl;
    std::cout << "unicode: café λ 🚀" << std::endl;
    std::cout << "json: {\"language\":\"cpp\",\"status\":\"ok\"}" << std::endl;
    std::cout << "idx | value" << std::endl;
    for (size_t i = 0; i < values.size(); ++i) {
        std::cout << std::setw(3) << i << " | " << values[i] << std::endl;
    }
    std::cerr << "[stderr][cpp] Render check stderr line" << std::endl;
    std::cout << "CPP compatibility checks passed." << std::endl;
    return 0;
}
