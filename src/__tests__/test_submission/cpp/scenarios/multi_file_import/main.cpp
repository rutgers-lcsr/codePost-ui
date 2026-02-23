// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
#include <cassert>
#include <iostream>
#include <string>

#include "math_utils.hpp"

int main() {
    const std::string csv = "3,5,8,13,21";
    const int sum = parse_and_sum(csv);
    assert(sum == 50);
    std::cout << "[cpp][multi_file_import] sum=" << sum << std::endl;
    return 0;
}
