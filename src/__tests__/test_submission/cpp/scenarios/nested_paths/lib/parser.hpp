#pragma once

#include <sstream>
#include <string>
#include <vector>

inline std::vector<int> parse_csv(const std::string& csv) {
    std::vector<int> values;
    std::stringstream ss(csv);
    std::string token;
    while (std::getline(ss, token, ',')) {
        values.push_back(std::stoi(token));
    }
    return values;
}
