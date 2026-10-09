#include "../dynamic_array.hpp"
#include <cassert>
#include <cstdio>
#include <string>

int main() {
    DynamicArray<int> a;
    assert(a.empty() && a.capacity() == 0);

    for (int i = 0; i < 9; ++i) a.push_back(i * 10);
    assert(a.size() == 9);
    assert(a.capacity() == 16);  // 1 -> 2 -> 4 -> 8 -> 16
    assert(a[8] == 80);

    a.insert(0, -1);
    assert(a[0] == -1 && a[1] == 0 && a.size() == 10);

    a.erase(0);
    assert(a[0] == 0 && a.size() == 9);

    a.pop_back();
    assert(a.size() == 8 && a[7] == 70);

    DynamicArray<int> b = a;  // copies, doesn't share
    b[0] = 99;
    assert(a[0] == 0 && b[0] == 99);

    DynamicArray<std::string> words;
    words.push_back("tempo");
    words.push_back("long run");
    assert(words.at(1) == "long run");

    bool threw = false;
    try { words.at(5); } catch (const std::out_of_range&) { threw = true; }
    assert(threw);

    std::puts("dynamic array: all tests passed");
}
