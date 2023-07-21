---
title: Algorithms, Part I - Assignment 1
date: 2023-07-20
description: 解题思路记录
categories: 
  - algorithm
  - java
  - coursera
image: 
---

一道关于 Union-Find 的编程作业，具体要求见 [Specification](https://coursera.cs.princeton.edu/algs4/assignments/percolation/specification.php)。

> 这个作业的质量很高，而且评测报告给到的信息非常详细，甚至包括代码style。

## # 常规思路

`PercolationStats.java` 的实现自然是不用多说，无非就是在给定测试次数下不断进行独立重复实验，然后记录统计数据即可。主要是看 `Percolation.java` 的实现:

```java
public class Percolation {

    // creates n-by-n grid, with all sites initially blocked
    public Percolation(int n)

    // opens the site (row, col) if it is not open already
    public void open(int row, int col)

    // is the site (row, col) open?
    public boolean isOpen(int row, int col)

    // is the site (row, col) full?
    public boolean isFull(int row, int col)

    // returns the number of open sites
    public int numberOfOpenSites()

    // does the system percolate?
    public boolean percolates()

    // test client (optional)
    public static void main(String[] args)
}
```

对于 isOpen() 和 numberOfOpenSites() 来说，可以很自然地想到额外开一个 Boolean 数组来记录每个 site 是否被打开的状态，以及用一个 int 变量来记录打开节点的数量，初始化为0，在每一个 open 操作中自增 1。

而对于 isFull() 和 percolates()，则可以使用并查集来记录连接状态。在每一次 open() 操作中，依次检查即将被打开的节点的周围4个节点，如果也是已经打开的则可以通过 union 连接到一起。在渗透材料的顶层之上或者底层之下都可以有一个虚拟节点，分别用于连接顶层/底层所有已经打开的节点。

这样的话 isFull() 和 percolates() 都可以压缩到常数时间级别的查询：前者只需检查当前节点和虚拟top节点的root是否相同，后者只需检查虚拟bottom节点到虚拟top节点的root是否相同。

最后只需要再考虑一些corner case：比如 n = 1 的情况，做特殊化处理，即可拿到这一道题大部分的分数。

但是这一简单实现提交后很快就会发现可能顶多只能拿到90分左右，测试报告中会显示 backwash 检测不通过。

## # 解决 Backwash

所谓 backwash 就是：由于虚拟bottom节点的存在，让原本不应该有水的节点获得了从底部渗透区域流经虚拟节点反冲上来的水。这将导致部分 isFull 会返回错误的结果。

一个最简单粗暴的解决思路是使用两个 Union-Find，其中一个有 top / bottom 两个虚拟节点，以供 percolates() 函数返回正确且快速的信息，而另一个 UF 只包含 top 虚拟节点，专供 isFull() 函数返回正确的结果。

这种思路带来了不少比例的空间性能开销，不过他确实够简单够粗暴，可以直截了当解决 backwash 问题，轻松就拿满了全部的分数。

不过我在使用了这种方法之后，也尝试过挣扎一下，想找出一种可以只消耗一个 UF 的解法。而且也确实有这种可能性，因为作业评分中有一个 2 分的 memory bonus。也就是说这个作业理论可以拿到 102 分！

## # Capture the bonus！

一开始很自然地就想到了用一个 Boolean 变量来记录这个材料是否 percolate 的结果，这样的话 percolates() 将只需要直接返回该结果，而不再需要用到虚拟bottom节点，我们不需要使用额外一个 UF 的同时，backwash 问题也不会再发生！

不过实际上如何更新 Boolean 变量这一过程还是有难度的。最开始我想到的版本是在 open 的过程中进行底层检测，但是实际上一个很明显的问题就是，一个材料被打通的时候有可能是原本已经两头通了，就差中间那一格。

也就是说，也许我们需要记录的信息不仅仅是一个节点的状态是否是 open 了，还有是否能通到顶部（isFull），以及**是否能通到底部**（注意，这是很重要的一个点）。

之后从课程的讨论区发现了一个字节编码的灵感，将上述提到的3种状态整合到一个字节中：

```java
  /*  state   open    topCnt  BtmCnt
   *  0b000   No      No      No 
   *  0b100   Yes     No      No
   *  0b110   Yes     Yes     No
   *  0b101   Yes     No      Yes
   *  0b111   Yes     Yes     Yes
  */
```

这样的话，可以使用与原本相同大小的状态数组，且无需额外使用一个 UF，即可完成这一任务。

至于状态的存储，可以利用 UF 的 find() 操作来把一个集合的状态指定到根节点中。于是，open() 可以做如下修改：

首先对当前节点进行初始化（如果是第一行则110，如果是底行则101，如果 n = 1 则111，其余是100），然后在与周围的4个节点进行 union 之前，先将他们的根节点状态叠加到当前节点（使用位或运算），union完成之后在离开函数前进行两个操作：首先检查当前节点是否已经变成了 111，则则更新 Boolean 变量；然后将当前节点的状态赋给根节点的状态（此时已经和周围的节点同根了）。

然后对于 isFull() 的实现，则只需要检查**根节点**的第二位是否为 1；对于 isOpen() 的实现，则是检查**当前节点**的第一位是否为 1（因为有初始化的缘故，所以无需使用 find() 检查根节点，可以节省一定的时间开销）。

至此，内存优化完成，作业评分可以拿满 102 分。