#pragma once

#include <sstream>
#include <string>

inline int parse_and_sum(const std::string& csv) {
    std::stringstream ss(csv);
    std::string token;
    int total = 0;
    while (std::getline(ss, token, ',')) {
        total += std::stoi(token);
    }
    return total;
}
