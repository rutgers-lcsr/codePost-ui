// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
#include <cassert>
#include <iostream>

#include "../lib/parser.hpp"

int main() {
    auto values = parse_csv("1,2,3,4");
    assert(values.size() == 4);
    std::cout << "[cpp][nested_paths] count=" << values.size() << std::endl;
    return 0;
}
