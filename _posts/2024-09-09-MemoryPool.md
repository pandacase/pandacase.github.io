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

假设一个程序有频繁申请和释放内存的需求，这实际上是一比不小的开销。


```sh
# C++ memory "hierarchy"
_________________
|  Applications |
|_______________|
      |
______↓_______________________
|C++ library (std::allocator)|
|____________________________|
      |
______↓______________________________________________________________________________
|C++ primitives (new/delete, new[]/delete[], ::operator new()/::operator delete())  |
|___________________________________________________________________________________|
      |
______↓________
| malloc/free |
|_____________|
      |
______↓______________
| OS APIs, syscalls |
|___________________|
```

因为标准的 malloc / free 函数被调用后，需要发起系统调用，即向操作系统申请和释放内存。进出内核会有性能开销、内核内部的锁会产生等待开销、申请和释放这个操作本身会有开销。

而内存池其实本质上是把内存管理从内核中剥离出来，把管理逻辑移动到用户空间中去。

具体做法是提前申请一块相对较大区域的内存，然后交由用户空间中的内存池对象管理，每当应用程序需要新的堆内存时，调用 `allocate()` 从内存池中取出一块空闲的 block，然后使用（即在空闲内存上构造和析构新的对象）

> 请注意，申请内存和构造对象是分开的操作，c++ 的 `new / delete` 把这两个操作组合在了一起，而这里实际上是由内存池初始化时先申请内存，应用程序实际使用内存块时才构造对象在内存上），

在应用程序使用完毕后，又可以调用内存池的 `deallocate()`，把内存块归还到内存池中。

如此一来，我们便避免了频繁申请/释放内存的操作。不仅程序的内存性能得到了优化，还可以大大减少堆区内存碎片化的可能性。除了以上提到的优化之外，内存块的使用还可以让应用程序在同一个块中创建的多个对象实例具有 cache locality。

## 2. Implementation

具体的内存池实现有很多种方法，比较基础（且常见）的是使用单个数组或者单个链表来完成管理。这里首先提供最简单的**数组**管理方法。

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

这里另外提供一个**链表版本**供参考：

```cpp
class MemoryPool {
public:
  ...
private:
  struct Block {
    Block* next;
  };

  size_t _blockSize;
  size_t _poolSize;
  Block* _freeList;
  void* _pool;
};
```

值得注意的是，这里使用了另外一种连续内存申请的方式，提供另一种灵活内存分配的视角。具体来说，先分配整块内存给到 _pool，最后再把这块内存中每一段的初始地址作为一个链表结点的地址。

```cpp
  MemoryPool(size_t blockSize, size_t poolSize) 
   : _blockSize(blockSize), _poolSize(poolSize) {
    _pool = operator new(blockSize * poolSize); // 分配整块内存
    _freeList = nullptr;

    // 初始化空闲链表
    for (size_t i = 0; i < poolSize; ++i) {
      auto block = reinterpret_cast<Block*>(
        static_cast<char*>(_pool) + i * blockSize
      );
      block->next = _freeList;
      _freeList = block; // 将块添加到空闲链表中
    }
  }
  
  ~MemoryPool() {
    operator delete(_pool); // 释放内存池
  }
```

> reinterpret_cast<> 是一种无视风险的指针类型强制转换，一般在比较接近底层的编程中使用。实际上是比较偏向于 c 语言风格的指针类型转换。转换后的指针只会影响编译器看待这段内存的方式，不影响内存中实际存储的内容。

```cpp
  void* allocate() {
    if (_freeList == nullptr) {
      throw std::bad_alloc();
    }

    // 从空闲链表中获取第一个块
    Block* block = _freeList;
    _freeList = _freeList->next; // 更新空闲链表的头
    return block;
  }

  void deallocate(void* ptr) {
    // 将释放的块放回空闲链表
    Block* block = reinterpret_cast<Block*>(ptr);
    block->next = _freeList;
    _freeList = block;
  }
```

在用户程序中的简单使用实例（以**数组版本**为例）：

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

在学会了自定义 STL 容器的内存分配器之后，接下来介绍 intel 提供的一个 allocator 的设计例子，同时介绍在多线程情况下如何进行进一步的优化。

## 3. What if multi-thread

前面已经提到，如果经过频繁系统调用来申请内存，那么内核中丰富的内核锁造成的锁等待会是一个不小的性能问题。把内存管理机制移动到用户空间后，锁的数量只剩下一个，其实情况已经好不少了。但是随着线程数量的提升，一个很大的性能瓶颈仍然在等待锁这个地方（当多个线程同时向内存池中申请/释放内存块时，同一时间只有一个线程可以成功），所以我们需要更加高效的内存池管理方案。

一个可以想到的方法是给内存池做分层。下层是一个大的公有内存池，而往上可以为每一个线程单独分配一个私有的内存池（私有内存池把内存块用完时向公有内存池申请更多的块）。这样，线程之间竞争 “申请/释放内存块处的锁” 的频率会大大降低。这个问题就可以得到有效的解决。

接下来会介绍 intel 的一个方案：`tbb::scalable_allocator`。有不少使用者提到，当他们仅仅将程序代码中的 `std::vector<T>` 都替换成 `std::vector<T,tbb::scalable_allocator<T>>` 时，多线程程序的性能就可以得到成倍的提升。

`tbb::scalable_allocator`（以下简称 TBB）本质上也是一个分层的内存池，只不过具体的实现机制要复杂的多，相关的论文链接可以在本文结尾查看。

![](https://s21.ax1x.com/2024/09/10/pAmNFG4.png)

这里从上图的左侧总览图可以看到，当应用程序申请大的对象时，直接从操作系统的虚拟内存中申请。但是当申请小的对象时，则每个线程会从线程独享的 thread-private heap 进行申请；而每一个 thread-private heap 又会从 Global heap (/ abandoned blocks) 中获取新的 block，或者是释放一直没有使用到的 block；最后，global heap 才真正从操作系统的虚拟内存中申请堆内存。

可以说，中间的两层结构就可以抽象作一个双层的内存池结构了。而上图的右侧则是 thread-private heap 与 global heap 的交互细节。

具体来说，thread-private heap 中的许多 blocks 是以双向链表的形式组织的，并且整个链表只有一个 active block（位于链表中间），往后是 Full block，即被使用完的 block，往前是 Empty enough block（当 full block 中的使用率低于一个预设的阈值时被称为 Empty enough）。

当某个 Full block 由于从 mailbox 中接收了足够数量的遣返块之后，如果降低到 Empty enough 的阈值，则移动到 Active Block 之前；从 Global heap 加入到这个双向链表的新的 block 也会插入在 Active Block 之前；最后，长时间待在链表头部的 unused blocks 会被重新释放到 Global heap 中。

每个双向链表的 Active block 由一个 bin 的指针进行索引，而每个线程其实可以管理多个 bin（即一个 bins 数组），这同时也意味着每个线程可以具有多个双向链表。不同 bin 指向的双向链表中的 block 是不同粒度的内存划分（如分为 16 字节、32 字节、64 字节等）。

这么设计是因为线程可能有多个内存分配请求，每个请求的对象大小不一，通过这种方式，TBB 的内存分配器可以避免内存碎片，同时保持高效的分配和释放操作。

最后可以查看单个 block 中的结构图来进一步理解：

![](https://s21.ax1x.com/2024/09/10/pAmNiiF.jpg)

一个 block 中的 object 由于大小相同且对齐，使得每个 object 的 header 变得没有必要，这些信息只需要一个统一的 block header 就可以存储。这也就是说，释放一个对象所需的所有信息都可以通过 block header 轻松获得。

另外，block 中的空闲块是由单链表来维护的（这点可以类比上一部分提供的链表实现示例，可以说结构上就是一样的）。不过这里值得注意的是，所有的空闲块实际上分成了 2 个单链表在维护，一个是 private free list，另一个是 public free list。

其实这两个 free_list 都是用来接收调用了 deallocate 返还的内存（大小是一个 object），区别在于，private 接收的是当前这个 block 归属的线程返还的内存，而 public 接收的是其他线程返还的内存。

这个时候你可能要问了，前面不是说 thread-private heap 是一个线程独享的吗，为什么这里还有其他线程参和进来？

这实际上并不矛盾，线程只会从自己的 thread-private heap 中申请内存，但是释放内存的时候就不一定是释放到自己的 heap 中去了。这是因为在许多 消费者-生产者 分工明确的应用程序中，有一些生产者线程专门负责申请内存，然后交给消费者内存去执行实际的任务，而最后消费者执行完毕后释放内存时需要释放回到原来申请这块内存的 block 中去。

而分成 private free list 和 public free list 显然也是为了不让其他线程的释放操作使得当前线程的申请/释放操作被线程锁限制了性能。（当前线程释放内存时会释放到 private free list中，申请内存也默认在这个列表申请，只有内存不足时才会考虑到 public free list 中获取）

以上便是关于 TBB 中的 thread-private heap 的具体实现。

## 4. More than memory

其实从总的来看，内存池还有一个好处，提前分配好内存可以把一部分时间性能消耗大的操作移动到程序刚启动的时候，而程序后续运行期间则可以变得更加顺滑。这个特点在高性能服务器、游戏引擎等实现中尤为重要。就以游戏引擎为例，你是希望玩游戏的时候开头小卡一下，但是后面爽快畅玩，还是希望你玩游戏的时候从头卡到尾呢？答案应该很明显了吧。

另外，文章最开头提到：内存池本质上是把内存管理从内核中剥离出来，把管理逻辑移动到用户空间中去。这其实是许多优化方案都会考虑到的方向，远不止是在内存管理方面。

比如，当我觉得线程的创建、销毁是我当前这个多线程程序的性能瓶颈，那么线程池也是一个很不错的选择；再比如，当我的应用程序需要极高的网络收发性能，那么把网络包数据平面的处理从内核迁移到用户态也是一个可以带来大量性能提升的方案，知名的 DPDK 开发套件就提供了这样的能力。

## 5. References

1. [https://medium.com/@threehappyer/memory-pool-techniques-in-c-79e01f6d2b19](https://medium.com/@threehappyer/memory-pool-techniques-in-c-79e01f6d2b19)
2. [https://stackoverflow.com/questions/31358804/whats-the-advantage-of-using-stdallocator-instead-of-new-in-c](https://stackoverflow.com/questions/31358804/whats-the-advantage-of-using-stdallocator-instead-of-new-in-c)
3. [https://stackoverflow.com/questions/826569/compelling-examples-of-custom-c-allocators](https://stackoverflow.com/questions/826569/compelling-examples-of-custom-c-allocators)
4. [https://www.intel.com/content/dam/www/public/us/en/documents/research/2007-vol11-iss-4-intel-technology-journal.pdf](https://www.intel.com/content/dam/www/public/us/en/documents/research/2007-vol11-iss-4-intel-technology-journal.pdf) **at Page 59~61 (indexed in chrome)**