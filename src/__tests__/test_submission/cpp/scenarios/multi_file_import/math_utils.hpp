// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
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
