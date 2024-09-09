---
title: Memory Pool
date: 2024-09-09
description: 
categories: 
  - memory
  - cpp
image: 
---

关于内存池的基本实现和概念扩展。

## 1. Why mem pool needed.

假设一个程序有频繁申请和释放内存的需求，这实际上是一比不小的开销。因为标准的 malloc / free 函数被调用后，需要发起系统调用，即向操作系统申请和释放内存。进出内核会有性能开销、内核内部的锁会产生等待开销、申请和释放这个操作本身会有开销。

而内存池其实本质上是把内存管理从内核中剥离出来，把管理逻辑移动到用户空间中去。

具体做法是提前申请一块相对较大区域的内存，然后交由用户空间中的内存池对象管理，每当应用程序需要新的堆内存时，调用 `allocate()` 从内存池中取出一块空闲的 block，然后使用（即在空闲内存上构造和析构新的对象）

> 请注意，申请内存和构造对象是分开的操作，c++ 的 `new / delete` 把这两个操作组合在了一起，而这里实际上是由内存池初始化时先申请内存，应用程序实际使用内存块时才构造对象在内存上），

在应用程序使用完毕后，又可以调用内存池的 `deallocate()`，把内存块归还到内存池中。

如此一来，我们便避免了频繁申请/释放内存的操作。不仅程序的内存性能得到了优化，还可以大大减少堆区内存碎片化的可能性。除了以上提到的优化之外，内存块的使用还可以让应用程序在同一个块中创建的多个对象实例具有 cache locality。

## 2. Implementation

具体的内存池实现有很多种方法，比较基础（且常见）的是使用单个数组或者单个链表来完成管理。这里首先提供最简单的数组管理方法。

```cpp
class memory_pool {
public:
  ...
private:
  size_t _block_size;
  size_t _block_cnt;
  std::vector<char*> _free_blocks;
  std::mutex _mutex;
};
```

私有成员采用一个 vector（vector 即使把对象创建在栈上，其实际的数据也存放在堆上，这里符合我们的预期），一个多线程锁用于避免多线程申请/释放内存块时导致的不一致状态（vector 并不是一个线程安全的对象，如果是链表的话当然也不是）。另外，内存块指针使用 `char*` 是一个常见的技巧，因为 char 的单位是 1 byte，所以使用 char* 指针可以进行最细粒度的内存控制。

在内存池的构造函数中，传入每个块的大小和块的数量进行初始化：(`operator new / detele` 与 `new / delete` 不同，他只会申请内存而不会调用对象类型的构造函数。)

```cpp
public:
  memory_pool(size_t block_size, size_t block_cnt)
   : _block_size(block_size), _block_cnt(block_cnt) {
    for (size_t i = 0; i < _block_cnt; ++i) {
      _free_blocks.push_back(static_cast<char*>(::operator new(_block_size)));
    }
  }

  ~memory_pool() {
    for (auto block : _free_blocks) {
      ::operator delete(block);
    }
  }
```

申请/释放内存块的接口实现也很简单：前者调用之后从数组尾部取出一个内存块，然后把内存指针返回给应用程序；后者将传入的内存指针收回到空闲块的数组中。值得注意的是这两种操作都需要上锁，避免当多个线程对同一个 vector 同时执行 push/pop 时导致了数据结构进入不一致的状态（可能造成内存泄漏，也可能造成访问非法内存区域）。

```cpp
  void* allocate() {
    std::lock_guard<std::mutex> lock(_mutex);
    if (_free_blocks.empty()) {
      throw std::bad_alloc();
    }
    void* block = _free_blocks.back();
    _free_blocks.pop_back();
    return block;
  }

  void deallocate(void* block) {
    std::lock_guard<std::mutex> lock(_mutex);
    _free_blocks.push_back(static_cast<char*>(block));
  }
```

以上便是一个极其简单的实现了，在生产环境中还有许多不足，但作为一个 startup 的版本，用于初步理解内存池的工作原理还是有比较大的帮助。

在用户程序中的简单使用实例：

```cpp
memory_pool pool1(BLOCK_SIZE, BLOCK_COUNT);
void* block = pool.allocate();
auto arr = new (block) std::array<int, 5>{1, 2, 3, 4, 5};
// using it...
```

当然，你可能很快就发现这里例子中隐含的问题。一是管理这单块内存也是一个比较麻烦的事情，要确保这个 block 指针不会用着用着越界（超过 BLOCK_SIZE）。以及，这里创建的是 array 对象，array 的一大特点是数组大小是固定的，所以数据和对象元数据可以存储在一起，但是如果是 vector、map 这类可变大小的容器，很显然实际数据和对象数据是分开存储的。所以如果我们在分配的内存块上构造一个新的 vector(or map)，那么只有对象元数据是真的放在我们的内存块上，其实际的数据内存还是被编译器分配到内存块之外的区域（仍然位于堆中）。

前者可以通过引入新的机制来解决（比如在每个块的尾部放置内存哨兵），或者让程序员小心一点就可以了（站着说话不腰疼.jpg）。而后者就比较麻烦了，需要我们定义一个新的内存分配器来替换掉 std::vector 默认使用的 std::allocator。

实际上，std::vector 的模板参数是有两个的：

```cpp
std::vector<typename T, typename Allocator = std::allocator<T>>
```

c++ 允许程序员自定义内存分配器，并传入 vector 的第二个模板参数中：

```cpp
std::vector<int, MyAllocator<int>> vec(MyAllocator<int>());
```

在 Allocator 内部通常需要自定义以下几个接口：(c++11 之前还需要定义 construct 和 destory)

```cpp
template <class T>
class MyAllocator {
public:
  using value_type = T;

  MyAllocator() noexcept {}
  template <class U> MyAllocator(const MyAllocator<U>&) noexcept {}

  // Allocate memory for n objects
  T* allocate(std::size_t n) {
    // Custom allocation logic
  }

  // Deallocate memory for n objects
  void deallocate(T* p, std::size_t n) {
    // Custom deallocation logic
  }

  // Equality comparison
  bool operator==(const MyAllocator& other) const noexcept {
    // Default implementation assuming all allocators are equal
    return true; 
  }

  bool operator!=(const MyAllocator& other) const noexcept {
    return !(operator==(other));
  }
};
```

> 运算符 == 和 != 用于判断两个 vector\<T, allocator\<T\>\> 对象是否是等效的，这主要决定了在移动/交换对象时发生的行为（相同分配器的对象可以直接交换指针，而不同分配器的对象需要重新构造数据并拷贝内容）。

在学会了自定义 STL 容器的内存分配器之后，接下来介绍 intel 提供的一个 allocator 的设计例子，并且介绍在多线程情况下如何进行进一步的优化。

## 3. What if multi-thread




## 4. More than memory



## 5. References

1. [https://medium.com/@threehappyer/memory-pool-techniques-in-c-79e01f6d2b19](https://medium.com/@threehappyer/memory-pool-techniques-in-c-79e01f6d2b19)
2. [https://stackoverflow.com/questions/31358804/whats-the-advantage-of-using-stdallocator-instead-of-new-in-c](https://stackoverflow.com/questions/31358804/whats-the-advantage-of-using-stdallocator-instead-of-new-in-c)
3. [https://stackoverflow.com/questions/826569/compelling-examples-of-custom-c-allocators](https://stackoverflow.com/questions/826569/compelling-examples-of-custom-c-allocators)
4. [https://www.intel.com/content/dam/www/public/us/en/documents/research/2007-vol11-iss-4-intel-technology-journal.pdf](https://www.intel.com/content/dam/www/public/us/en/documents/research/2007-vol11-iss-4-intel-technology-journal.pdf) **at Page 59~61 (indexed in chrome)**