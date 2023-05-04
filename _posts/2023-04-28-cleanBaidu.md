---
title: 油猴插件介绍 & 百度净化脚本
date: 2023-04-28
description: 文末还有一些其他好用的浏览器插件推荐！背景图是其中一个插件的演示
categories: 
  - Javascript
image: https://s1.ax1x.com/2023/05/04/p9tpyLT.png
---

本人同时在用edge、chrome和firefox，三款浏览器分别用bing、google、baidu搜索引擎。三者对比之下就发现百度的搜索界面真的放满了广告，又杂又乱。实在忍受不下就写了这个简易的脚本对其进行净化。顺便介绍一下大名鼎鼎的油猴插件的使用。

## # 油猴插件-Tampermonkey

![image](https://s1.ax1x.com/2023/04/28/p9lR6gg.png)

油猴插件是一个用户脚本的管理器和运行器。可以把一些简单的用户脚本保存在插件中，指定他到了某个网站的时候加载完毕后自动运行你放置的脚本。脚本可以是自己写的，也可以在脚本商店里面获取。

用户脚本可以做到的事情包括但不限于：屏蔽网页中的广告、修改网页中的显示内容、给网页新增一些功能（比如在网上买书的时候自动显示其豆瓣评分）。

**在此安装**：[Tampermonkey](https://www.tampermonkey.net/)

> 注：firefox可以直接在自己的扩展商店中搜到tampermonkey。其他浏览器如果搜不到就点连接进去官网安装，不过除Edge浏览器外可能会默认跳转到谷歌商店进行下载，这个时候需要梯子。

## # 获取在线用户脚本

油猴的面世已经有十几二十年之久了，所以积累了大量的用户脚本，除了GitHub之外可以在以下网站中获取自己所需的脚本：

[Greasy Fork](https://greasyfork.org/en) 丨 [OpenUserJS](https://openuserjs.org/) 丨 [Userscript](https://www.userscript.zone/)

网上也有很多推荐用户脚本的文章，随便列举一个：[2023油猴脚本推荐](https://www.v1tx.com/post/best-tampermonkey-scripts/)

## # 自己制作脚本

点击油猴插件，选择【添加新脚本】，即可进入脚本编辑页面。最前面的多行注释是头部配置信息，可以按照自己脚本的用途进行修改，这里列举常用的信息：
- name：脚本名称
- description：描述脚本的用途，方便别人阅读
- version：脚本版本号，由你自己控制
- author：脚本作者
- match：指定这个脚本生效的网站。例如 " https://www.baidu.com/* " 表示所有以 " https://www.baidu.com/ " 开头的网页都会自动运行这个脚本。
- grant：用来声明这个脚本所需访问的油猴API权限（例如 GM_getValue、GM_setValue、GM_xmlhttpRequest）

之后就是脚本具体的代码，放在 " // Your code here... " 之后。这里举一个简单的例子，你可以在把match的值设置为百度域名之后，在这个部分填入一句代码：

```js
    document.getElementById("su").value="( •̀ ω •́ )✧";
```

然后新打开一个百度搜索页面，点击油猴插件，勾选你刚刚常见的这个脚本。刷新网页后你就可以看到【百度一下】按钮变成了【( •̀ ω •́ )✧】，是不是很神奇呢！之后无论怎么刷新网页都是这样子的，因为油猴插件默认会在每次网页加载后运行一次被勾选的脚本。

## # baiduClearner

实现的逻辑非常的简单，无非就是对照着百度网页源码中各个html元素的id或者className，然后调用js去将html元素中的css值进行修改。下面列举主要几个板块

比如对搜索结果链接的字体样式修改如下：

```js
    // a标签 文字样式
    let aTags = document.getElementsByTagName("a");
    for(let i = 0; i < aTags.length; i++){
        aTags[i].style.textDecoration="none";
        aTags[i].style.color="black";
        aTags[i].addEventListener("mouseenter", function(){
            this.style.textDecoration="underline";
        })
        aTags[i].addEventListener("mouseleave", function(){
            this.style.textDecoration="none";
        })
    }
```

对搜索结果匹配出来的关键字样式修改如下：

```js
    // 关键字 颜色
    let emTags = document.getElementsByTagName("em");
    for(let i = 0; i < emTags.length; i++){
        emTags[i].style.textDecoration="none";
        emTags[i].style.color="#4e6ef2";
    }
    let fontTags = document.getElementsByTagName("font");
    for(let i = 0; i < fontTags.length; i++){
        fontTags[i].style.color="#4e6ef2";
    }
```

页面元素清除（含广告）：

```js
    // 隐藏百度logo
    let img = document.getElementsByClassName("index-logo-src");
    img[0].style.visibility="hidden";

    // 去除收藏/举报icon
    removeElementsByClassName("icon_X09BS")

    // 去除右侧热搜栏
    removeElementById("con-ar")
    removeElementById("con-right-bottom")
    removeElementsByClassName("FYB_RD");
    removeElementsByClassName("cr-content");
    removeElementsByClassName("hint_right_middle");
    removeElementsByClassName("_2z1q32z");

    // 去除顶部右侧用户信息和foot
    removeElementById("u");
    removeElementById("foot");
```

最后再完善一下运行逻辑，比如在页面中再次点击百度搜索时对子页面进行刷新后，仍然会触发以上的净化代码。这一用户脚本就差不多完成了。

**优化前：**
![image](https://s1.ax1x.com/2023/04/28/p9lRcvQ.jpg)

**优化后：**
![iamge](https://s1.ax1x.com/2023/04/28/p9lR2uj.jpg)

## # 用户脚本 vs 浏览器插件

这是两种不同的浏览器拓展方式，都是用来给用户的浏览过程提供额外的服务。

用户脚本相比浏览器插件会更加轻量级一点，一般如果只是想实现一些简单的功能会选择去使用用户脚本，而且大部分用户脚本下载后你可以直接看到源码，所以你可以直接在代码层面上进行个性化调整。不过浏览器拓展一般可以带来的功能会更强大，因为用户脚本实际上也是依托浏览器插件(Tampermonkey)进行运行的。

还有一点就是，用户脚本里面可能会有放有恶意代码或者推广代码，使用风险会比浏览器插件大（浏览器上架商店至少会经过一层审查），所以使用用户脚本的话一定要注意安全防范。

## # 一些好用的浏览器插件推荐

这里推荐的插件默认都是来自 Edge / google / firefox 这三大PC端主流浏览器。

-  广告屏蔽类插件：(这两个都支持屏蔽自定义)
   - AdBlock
   - AdBlocker

-  视频倍速控制器：
   可以控制几乎所有网页上的视频倍速，包括那些开了会员才能使用加速的网站！（说的就是你百度网盘），而且倍率可以自己输入，比如 x1.15
   - Video Speed Controller
   - Global Speed

-  网页批注插件：
   这边推荐一款国产的插件：[五彩](https://www.dotalk.cn/product/wucai)。
   在网页上进行批注后，会一直保存在云端，下一次打开这个网页依然可以看到批注，也可以到个人账户中统一进行管理。而且给出的荧光笔笔色非常的好看（不知道你有没有用过斑马荧光笔，就是那种系列的色号！）
   个人使用下来的体验还是很不错的，推荐下载。

-  各种各样的chatGPT/newBing插件：
   在进行搜索时，会有一个chat会话框放在右栏，自动把你的搜索关键词放进GPT或者newbing然后再返回聊天结果给你。
   这种就太多了，不一一例举，个人在用的是 Bing chat in Google（说是in google实际上三个浏览器都能安装）

-  浏览器主页修改：
   其实这种插件一般来说用不上，因为直接把浏览器主页设置为新标签页就已经很清爽了，个人非常喜欢google浏览器的新标签页：
   不过如果你想要可以设置背景图和放置标签的主页也是有的，[WeTab](https://www.wetab.link/) 就是其中一个。


