---
title: Dynamic array
summary: A fixed block of memory that swaps itself for a bigger one when it fills up.
source: dynamic_array.hpp
---

An array is one block of memory with the elements packed side by side. That's what makes it fast: element `i` lives at `start + i × size of one element`, so reading any index is one sum and one lookup, no matter how big the array is.

The catch is that the block has a fixed size. You can't just extend it, because the memory right after it might already belong to something else.

A dynamic array (`std::vector` in C++) gets around this by keeping two numbers: **size**, how many elements are actually in use, and **capacity**, how many fit in the block it currently owns. While there's spare room, `push_back` just writes into the next free slot. When it's full, it:

1. allocates a new block, twice as big
2. copies every element across
3. frees the old block

That copy is O(n), which sounds bad for something you call in a loop. But because the capacity doubles, each copy buys as many cheap pushes as it just paid for. Push n elements and the total copying is at most 1 + 2 + 4 + … + n, which is under 2n. Spread over n pushes, that's a constant amount of work each: **amortised O(1)**. Watch the "copies per push" counter below settle under 2 however many times you push.

Inserting or erasing anywhere other than the end is a different story: everything after that index has to shuffle along one slot, so it's O(n).
