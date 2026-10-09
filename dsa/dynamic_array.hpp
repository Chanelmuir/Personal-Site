#pragma once
#include <cstddef>
#include <stdexcept>
#include <utility>

// A growable array: a fixed-size block of memory that gets swapped
// for a bigger one whenever it fills up. std::vector works the same way.
template <typename T>
class DynamicArray {
public:
    DynamicArray() = default;

    ~DynamicArray() { delete[] data_; }

    // Copying makes a fresh block, so the two arrays never share memory
    DynamicArray(const DynamicArray& other)
        : data_(other.capacity_ ? new T[other.capacity_] : nullptr),
          size_(other.size_),
          capacity_(other.capacity_) {
        for (std::size_t i = 0; i < size_; ++i)
            data_[i] = other.data_[i];
    }

    DynamicArray& operator=(DynamicArray other) {
        swap(other);
        return *this;
    }

    std::size_t size() const { return size_; }
    std::size_t capacity() const { return capacity_; }
    bool empty() const { return size_ == 0; }

    // O(1): the address of element i is data_ + i
    T& operator[](std::size_t i) { return data_[i]; }
    const T& operator[](std::size_t i) const { return data_[i]; }

    T& at(std::size_t i) {
        if (i >= size_) throw std::out_of_range("index out of range");
        return data_[i];
    }

    // Amortised O(1): usually there's a free slot, and when
    // there isn't, doubling puts the next copy twice as far away
    void push_back(const T& value) {
        if (size_ == capacity_) grow();
        data_[size_++] = value;
    }

    // O(1): the slot stays allocated, it just stops counting
    void pop_back() {
        if (size_ == 0) throw std::out_of_range("array is empty");
        --size_;
    }

    // O(n): everything after index shifts one slot right
    void insert(std::size_t index, const T& value) {
        if (index > size_) throw std::out_of_range("index out of range");
        if (size_ == capacity_) grow();
        for (std::size_t i = size_; i > index; --i)
            data_[i] = data_[i - 1];
        data_[index] = value;
        ++size_;
    }

    // O(n): everything after index shifts one slot left
    void erase(std::size_t index) {
        if (index >= size_) throw std::out_of_range("index out of range");
        for (std::size_t i = index; i + 1 < size_; ++i)
            data_[i] = data_[i + 1];
        --size_;
    }

    void swap(DynamicArray& other) noexcept {
        std::swap(data_, other.data_);
        std::swap(size_, other.size_);
        std::swap(capacity_, other.capacity_);
    }

private:
    // O(n): allocate double the space, copy everything across,
    // then free the old block
    void grow() {
        std::size_t new_capacity = capacity_ == 0 ? 1 : capacity_ * 2;
        T* bigger = new T[new_capacity];
        for (std::size_t i = 0; i < size_; ++i)
            bigger[i] = std::move(data_[i]);
        delete[] data_;
        data_ = bigger;
        capacity_ = new_capacity;
    }

    T* data_ = nullptr;
    std::size_t size_ = 0;
    std::size_t capacity_ = 0;
};
