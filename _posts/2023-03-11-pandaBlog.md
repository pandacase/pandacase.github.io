---
title: pandaBlog诞生记
date: 2023-03-11
description: (这个背景图是写这篇文章时在用的浏览器主页背景, 是用PowerPoint的简单三角形+虚化效果制作的)
categories:
  - Web开发
image: https://s1.ax1x.com/2023/03/14/pplBuvj.jpg
---

&emsp;&emsp; 在22年下半年通过某些渠道看到了一个不认识的同学的博客网站 [Stalo's Blog](https://jin-yuhan.github.io/) 点进去后被好看的UI和动画效果震撼到了, 所以就萌生了想自己也建一个网站的想法.

* 之后翻了很多中大学长的博客网站, 发现网站的功能主要有如下几种:

1. 发表文章
2. 在线留言
3. 保存友链

&emsp;&emsp; 所以我主要也是朝着这几个功能去做的, 不过一般CSE学生的博客网站都是在更项目型Blog. 个人的话还想加入更新一些日常趣事的栏目, 因为原先在米游社里面有时候就会心血来潮更几篇这种类型的文章, 然后自己每时隔一段时间回去翻看的话总能收获美好的回忆 (大多数时候是hhh).

## # 页面介绍

![Home](https://s1.ax1x.com/2023/03/15/pp3uaDJ.png)

&emsp;&emsp; 主页下面是放了一些整体上的介绍信息. 至于这个显眼的 [欸嘿] 按钮, 按下去只会变色, 就跟发出一声"欸嘿"一样没有什么特别的作用! 哈哈哈哈暂时把他当做是彩蛋吧

&emsp;&emsp; 顶部的导航栏可以用来切换页面, 其中所有带标签 [Daily] 的文章会放在Daily页面下, 不带该标签的文章会放在Blog页面下. 每篇文章下都会有一个独立的评论区. (你发现了吗, Blog页面的背景图就是该页面的源码, 这也是一个彩蛋喔)

&emsp;&emsp; Contact页面内也放置了一个评论区, 这个评论区跟文章下的评论区没有什么不同(结构功能上), 只不过这里的评论区跟文章没有关系, 用来给朋友们留言. 这个页面最底部还放有一串神秘数字欸嘿嘿, 也算是一个彩蛋吧

&emsp;&emsp; **计划新增/改进的功能:**

&emsp;&emsp; 1. 文章页面的渲染还有待优化。以及文章列表的布局后面应该要改，文章一多起来的话肯定不能用目前这种列表方案

&emsp;&emsp; 2. 保存友链的页面, 这个实际上很容易实现, 但是我身边有网站的朋友还不多, 所以暂时不着急做.

&emsp;&emsp; 3. 在Blog页面进行一个标签的细化分类, 方便访问者按标签检索文章(不过这个功能要等我文章更新多了才会考虑做hhh)

## # 开发过程

&emsp;&emsp; 一开始有这个想法的时候还对网页开发这件事如何进行完全没有概念, 百度之后才知道大概是怎么回事...

&emsp;&emsp; 用户在浏览器看到的网页页面内容就是网页的前端，而网页的后端实际上就是服务器端。网页的数据都是存储在服务器中，当用户在浏览器输入某个网页的地址时，网址实际上会被解析成网站服务器的IP地址，通过IP地址访问该服务器的时候会发出打开某一具体网页的请求。然后服务器对该请求进行响应，返回相应网页的资源（如网页源码和图片）。浏览器接收到网页的源码等资源后，渲染成网页并展示给用户。

&emsp;&emsp; 一个比较有趣的角度是，服务器返回给你一个网页后，如果你没有进行新的操作（发出新的请求），那么这个网页就是"死的"。网页的源码在你本地上，页面又根据源码来进行渲染。所以你可以直接按F12并修改源码来让页面内容发生变化。（一个有趣的例子是我的高中宿友以前在tx充值界面通过修改网页源码把自己的余额改成自己想要的数值，然后截图到处跑去装逼（笑））。这就是前端，前端只负责展示从服务器返回的内容，而之后内容可以在前端被任意修改。当然了，如果你发出了新的请求，比如刷新网页，还是会发现余额又变回了原来该有的数值，显然你修改网页源码的数据并不会修改到服务器里面储存的数据。

&emsp;&emsp; 而个人博客网站实际上更多是一种静态网站，与服务器的交互性不高。所以制作个人博客网站主要是在制作前端的页面，制作完毕后只需要把网页资源托管到一个服务器下，然后生成域名。其他人就可以通过该域名访问到我的网站资源（即pandaBlog）。

&emsp;&emsp; （评论区和访问量统计这类后端涉及比较多的功能是另外考虑的，模块独立于网页本身。最后会提到。）

&emsp;&emsp; 确定了主要的学习方向是前端之后，我就在b站找了个前端三件套教程从头开始学起(HTML, CSS, JavaScript)。这三件套里面让我受阻的实际上是CSS, 难倒是不难, 但是零零碎碎的知识点实在太多了! 学着学着就容易断掉. HTML的话没什么好说的, 很简单而且内容也很少. JS的话语法上是C和Python的结合体, 还有大量的API可以调用，实际上还是一门挺好用的脚本语言。

&emsp;&emsp; 这里补充一点，css只是页面样式渲染的基础，如果想要更高效地编写样式表文件，可以再学习一些scss，这是css的超集，向下兼容css的同时提供了一些更高效的语法。而且scss可以实现动画效果。

&emsp;&emsp; 附上Web文档: [MDN](https://developer.mozilla.org/zh-CN/) 丨 [W3school cn](https://www.w3school.com.cn/index.html)

&emsp;&emsp; 基础的前端知识学的差不多的时候, 有试着过模仿一些知名网站(如京东, b站)做一些小模块出来. 然后就发现如果从头做一个UI好看的网站还是非常难的, 身边那些有博客网站的学长都是从中学时代就开始做起, 而我才学了几个月...T^T

&emsp;&emsp; 不过最后还是在中大学长的博客网站里面找到了突破口, 他的网站是用Jekyll生成的. 于是就顺藤摸瓜去进行了一系列搜索

&emsp;&emsp; Jekyll是一个简单的博客网站生成器, 在GitHub上开源. 如果用Jekyll来构建博客网站, 可以直接使用他的模板语言和头信息结构, 整个网页结构的部署会简单得多。 而且因为有了模板语言, GitHub上面就能找到许多使用Jekyll构建的模板网页项目出来

&emsp;&emsp; 所以最后决定学习Jekyll文档内的语法, 然后寻找一个合适的模板部署到本地进行魔改来作为自己的首个网站(同时学习别人的web代码结构)

&emsp;&emsp; [Jekyll中文文档](http://jekyllcn.com/) 丨 [Jekyll主题网站](http://jekyllthemes.org/) 丨 [Jekyll搭建网站视频教程](https://www.bilibili.com/video/BV14x411t7ZU/)

&emsp;&emsp; 在官方文档中可以看到Jekyll部署出来的网页目录结构还是非常人性化的。对文章的管理非常方便. 模板语言允许在HTML中加入判断和循环语句, 而且集成了很多网页变量可以直接调用. 在比对了官方文档和模板的源码之后, 个人网页的开发思路变得清晰很多

```txt
.
├── _config.yml
├── _drafts
|   ├── begin-with-the-crazy-ideas.textile
|   └── on-simplicity-in-technology.markdown
├── _includes
|   ├── footer.html
|   └── header.html
├── _layouts
|   ├── default.html
|   └── post.html
├── _posts
|   ├── 2007-10-29-why-every-programmer-should-play-nethack.md
|   └── 2009-04-26-barcamp-boston-4-roundup.md
├── _site
├── .jekyll-metadata
└── index.html
```

1. _config 是一些基本的配置信息
2. _drafts（可选的） 是存放文章草稿的文件夹
3. _includes 是贯穿在整个网站所有页面的顶部栏和底部栏
4. _layouts 就是网页的层次结构。其中default就是网页主站本体，这是整个Jekyll结构中唯一一个有"\<head>"标签的html文件，在Jekyll的架构下，其他所有页面会自动共享其中"\<head>"的内容，所以所有的CSS和JS连接可以放在这里。post则定义了文章页面。
5. _posts 中存放的文件就是博客中的文章，可以是markdown文件，与常见的markdown编辑器不同，这里markdown的渲染规则完全由你的css定义，因为最终markdown是转化为html来展示的。

&emsp;&emsp; 再补充一些官方文档结构中没有展示的东西：可以使用一个“_sass"文件夹专门全部的css（或者scss）文件，然后再在根目录下放一个all.scss文件对所有与网页渲染有关的scss文件进行import，之后只需要在defult.html中引入all.scss的连接就可以加载全部的scss渲染。

&emsp;&emsp; 在本地部署完网站源码之后可以在命令行窗口中输入"jekyll serve file_path"来快速生成网站预览. 这是一个比较常用的功能 (其他的就自己在文档里面看啦)

&emsp;&emsp; 这里有个小技巧。如果你只是需要进行一些细微的修改，就不用在本地解析然后生成预览了，如果文章一多起来的话本地解析耗时还是比较久的。可以直接在浏览器的F12源码页面中修改，边改边看浏览器的显示效果，找到合适的效果之后 就在源码中改为相同的值 然后上传到服务器进行生效即可。

&emsp;&emsp; 然后Jekyll架构主要是学他的模板语言吧，把官方文档从头到尾看一遍其实就懂个七七八八了。下面是HTML中嵌入循环和判断的模板语言示例 (Daily页面下生成文章列表)

![源码展示](https://s1.ax1x.com/2023/03/15/pp3UbtS.png)

&emsp;&emsp; 至于网页中的大部分背景图片, 目前是部署在国内的[路过图床](https://imgse.com/)下, 不过这个图床好像没有随机图片链接的功能, 后续可能会考虑更换图床. 

&emsp;&emsp; 然后图标的制作是使用AI绘图工具来绘制.svg矢量图.

## # Markdown渲染（代码块/流程图/公式）

&emsp;&emsp; Jekyll实际上自带了一个默认的渲染器rough, 具体用法可以参考官方文档中关于"配置"和"博客"中的内容. 不过网上也有很多现成的css方案, 可以自己去找合适的css链接(一般还会附带JS链接用以实现显示行号和复制代码的按钮)放入default.html的\<head>中即可。

&emsp;&emsp; 我参考的是一位本校师兄的渲染方案（附上他的web blog：[wukan](https://wu-kan.cn/2019/01/18/%E5%9F%BA%E4%BA%8EJekyll%E6%90%AD%E5%BB%BA%E4%B8%AA%E4%BA%BA%E5%8D%9A%E5%AE%A2/)）。

&emsp;&emsp; 代码块及代码高亮采用的渲染模块是 [Prism](https://prismjs.com/)，这个官网的首页除了会教你如何使用他的渲染器，还列出了所有支持渲染的语言，进入网页后你可以直接 ctrl + f 输入语言进行搜索。

## # 添加API

&emsp;&emsp; API根据自己需求的功能去找现成的就可以了。如果是浏览量统计的API就把script代码块复制到defult.html的头部即能够在全站氛围内生效。如果是评论区这种不需要在所有地方都出现的模块 则把script代码块复制到你需要放的页面中。

* #### 浏览量统计（含分析）, 调用的是[百度统计](https://tongji.baidu.com/web5/welcome/login)的API:


```html
<script>
    var _hmt = _hmt || [];
    (function() {
        var hm = document.createElement("script");
        hm.src = "your_url";
        var s = document.getElementsByTagName("script")[0]; 
        s.parentNode.insertBefore(hm, s);
    })();
</script>
```


* #### 评论区功能：

&emsp;&emsp; 评论区功能则更迭过两个API, 之前用的是来必力的支持社交账号(支持微信/微博/QQ登录)的评论系统, 但是加载比较慢而且在移动端下有无法拉取微信登录API的bug; 所以后来改用了Valine的可支持匿名的评论系统, 也就是现在在用的这个评论区. 

&emsp;&emsp; 可以看到这个API支持在Script块中直接更改属性设置, 还是比较易用的. 具体的配置信息可以查看 [Valine快速开始](https://valine.js.org/quickstart.html)

```html
<script>
    new Valine({
        el: '#vcomments',
        appId: 'my_ID', // 填入你自己的ID
        appKey: 'my_Key', // 填入你自己的Key
        placeholder: '留下你的评论吧~', // 文本占位符内容
        meta: ['nick'], // 输入框种类
        requiredFields: ['nick'], // 必填项
        avatar: 'hide' // 评论者头像
    })
</script>
```
### # 部署到服务器

&emsp;&emsp; 最后的工作是找一个合适的服务器进行网站部署，这样别人才能访问到前文提到的那些网页资源。

&emsp;&emsp; 网站目前是部署在GitHub Pages下, 也就是使用了GitHub的域名。之后如果内容更新多了可能会考虑自己租用一个域名。

&emsp;&emsp; 至此, pandaBlog就初步完成啦! 作为本站的第一篇完成的文章, 写的有亿点啰嗦hh. 感谢你阅读到这里, 留个评论再走吧~

&emsp;&emsp; （2023-4-15 进行了一次更新）