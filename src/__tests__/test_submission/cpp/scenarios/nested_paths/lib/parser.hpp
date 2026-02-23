// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
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
