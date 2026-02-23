// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
#include <cassert>
#include <fstream>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

std::vector<int> parse_numbers(const std::string& csv_line) {
    // TODO(student): Parse comma-separated integers and return them.
    return {};
}

int main() {
    std::ifstream input("../existing_data.txt");
    std::string line;
    std::getline(input, line);

    auto values = parse_numbers(line);

    std::ofstream output("starter_output.txt");
    output << "TODO: write summary for " << values.size() << " numbers" << std::endl;

    assert(!values.empty() && "Starter assertion intentionally triggers until parse_numbers is implemented.");
    std::cout << "Starter template completed." << std::endl;
    return 0;
}
