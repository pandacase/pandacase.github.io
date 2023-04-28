---
title: 油猴插件介绍and百度净化脚本
date: 2023-04-28
description: 文末还有一些其他好用的浏览器插件推荐！
categories: 
  - Javascript
image: https://s1.ax1x.com/2023/03/12/ppM1bX4.jpg
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

之后就是脚本具体的代码，放在 " // Your code here... " 之后。