#include <cassert>
#include <iostream>

#include "../lib/parser.hpp"

int main() {
    auto values = parse_csv("1,2,3,4");
    assert(values.size() == 4);
    std::cout << "[cpp][nested_paths] count=" << values.size() << std::endl;
    return 0;
}
