---
title: pandaBlog诞生记
date: 2023-03-11
description: 这个背景图选用的是目前在用的浏览器主页背景~ 是用PowerPoint的简单三角形+虚化效果制作的
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

&emsp;&emsp; 主页下面是放了一些整体上的介绍信息. 至于这个显眼的 [欸嘿] 按钮, 按下去只会变色(如果你是在移动端访问, 它会被解析成回到顶部), 就跟发出一声"欸嘿"一样没有什么特别的作用! 哈哈哈哈暂时把他当做是彩蛋吧

&emsp;&emsp; 顶部的导航栏可以用来切换页面, 其中所有带标签 [Daily] 的文章会放在Daily页面下, 不带该标签的文章会放在Blog页面下. 每篇文章下都会有一个独立的评论区. (你发现了吗, Blog页面的背景图就是该页面的源码, 这也是一个彩蛋喔)

&emsp;&emsp; Contact页面内也放置了一个评论区, 这个评论区跟文章下的评论区没有什么不同(结构功能上), 只不过这里的评论区跟文章没有关系, 用来给朋友们留言. 这个页面最底部还放有一串神秘数字欸嘿嘿, 也算是一个彩蛋吧

&emsp;&emsp; 计划新增的功能:

&emsp;&emsp; 1. 文章页面的markdown转html渲染, 目前的文章页面渲染比较单调, 在md文件下编辑只有字体大小和粗体斜体下划线等这些最基本的文字表现可以生效, 而代码Block/代码高亮/公式渲染/插入note还没实现. 不过目前的开发环境还是在Windows, 后续要完善这些功能可能需要迁移到linux环境下

&emsp;&emsp; 2. 保存友链的页面, 这个实际上很容易实现, 但是我身边有网站的朋友还不多, 所以暂时不着急做.

&emsp;&emsp; 3. 在Blog页面进行一个标签的细化分类, 方便访问者按标签检索文章(不过这个功能要等我文章更新多了才会考虑做hhh)

## # 开发过程

&emsp;&emsp; 一开始有这个想法的时候还对网页开发这件事如何进行完全没有概念, 百度之后才知道大概是怎么回事...

&emsp;&emsp; 然后就在b站找了个前端三件套教程从头开始学起(HTML, CSS, JavaScript), 这三件套里面让我受阻的实际上是CSS, 难倒是不难, 但是零零碎碎的知识点实在太多了! 学着学着就容易断掉. HTML的话没什么好说的, 很简单而且内容也很少. JS的话语法上是C和Python的结合体, 所以上手也比较快.

&emsp;&emsp; 附上一个Web开发文档: [MDN](https://developer.mozilla.org/zh-CN/)

&emsp;&emsp; 基础的前端知识学的差不多的时候, 有试着过模仿一些知名网站(如京东, b站)做一些小模块出来. 不过实际上发现要从头做一个UI好看的网站还是非常难的, 身边那些有博客网站的学长都是从中学时代就开始做起, 而我才学了几个月...

&emsp;&emsp; 不过最后还是在中大学长的博客网站里面找到了突破口, 他的网站是用Jekyll生成的. Jekyll是一个简单的博客网站生成器, 在GitHub上开源. 如果用Jekyll来构建博客网站, 可以直接使用他的模板语言, 整个网页结构的部署会简单得多, 而且因为有了模板语言, GitHub上面就能找到许多使用Jekyll构建的模板网页出来

&emsp;&emsp; 所以最后决定学习Jekyll文档内的语法, 然后寻找一个合适的模板部署到本地进行魔改来作为自己的首个网站

&emsp;&emsp; [Jekyll中文文档](http://jekyllcn.com/) 丨 [Jekyll主题网站](http://jekyllthemes.org/) 丨 [Jekyll搭建网站视频教程](https://www.bilibili.com/video/BV14x411t7ZU/)

&emsp;&emsp; 在官方文档中可以看到Jekyll部署出来的网页目录结构还是非常人性化的, 对文章的管理非常方便. 模板语言允许在HTML中加入判断和循环语句, 而且集成了很多网页变量可以直接调用, 整个网页的开发思路变得清晰很多

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
|   ├── 2007-10-29-why-every-programmer-should-play-nethack.textile
|   └── 2009-04-26-barcamp-boston-4-roundup.textile
├── _site
├── .jekyll-metadata
└── index.html
```

&emsp;&emsp; 在本地部署完网站源码之后可以在命令行窗口中输入"jekyll serve file_path"来快速生成网站预览. 这是一个比较常用的功能

* HTML中嵌入循环和判断的模板语言示例 (Daily页面下生成文章列表)

```txt
<ul class="blog-posts">
    {% for post in site.posts %}
        {% if post.categories[0] == "Daily" %}
        <li class="blog-post">
            <h2><a href="{% include relative-src.html src=post.url %}">{{ post.title }}</a></h2>
            {% include post-title.html post=post %}
            <div class="post-content">
                {{ post.excerpt }}
                <div class="button"><a href="{% include relative-src.html src=post.url %}">查看文章</a></div>
            </div>
        </li>
        {% endif %}
    {% endfor %}
</ul>
```

&emsp;&emsp; 至于网页中的大部分背景图片, 目前是部署在国内的[路过图床](https://imgse.com/)下, 不过这个图床好像没有随机图片链接的功能, 后续可能会考虑更换图床. 然后图标的制作是使用Ai来绘制.svg矢量图. 完整的源码在底部导航栏的GitHub链接中可以找到.

&emsp;&emsp; 然后网页后端其实内置了一个浏览量统计, 调用的是百度统计的API:

```HTML
<script>
    var _hmt = _hmt || [];
    (function() {
        var hm = document.createElement("script");
        hm.src = "https://hm.baidu.com/hm.js...";
        var s = document.getElementsByTagName("script")[0]; 
        s.parentNode.insertBefore(hm, s);
    })();
</script>
```

&emsp;&emsp; 评论区功能则更迭过两个API, 之前用的是来必力的支持社交账号(微信/微博/QQ)登录的评论系统, 但是加载比较慢而且在移动端下有无法拉取微信登录API的bug; 所以后来改用了Valine的可支持匿名的评论系统, 也就是现在在用的这个评论区. 可以看到这个API支持在Script块中直接更改属性设置, 还是比较易用的. 具体的配置信息可以查看 [Valine快速开始](https://valine.js.org/quickstart.html)

```HTML
<script>
    new Valine({
        el: '#vcomments',
        appId: 'my_ID',
        appKey: 'my_Key',
        placeholder: '留下你的评论吧~',// 文本占位符
        meta: ['nick'],// 输入框
        requiredFields: ['nick'],// 必填项
        avatar: 'hide'// 评论者头像
    })
</script>
```

&emsp;&emsp; 网站最后是部署在GitHub Pages下, 之后如果内容更新多了可能会考虑自己租用域名来做映射

&emsp;&emsp; 至此, pandaBlog就初步完成啦! 作为本站的第一篇文章, 写的有亿点啰嗦hh. 感谢你阅读到这里, 留个评论再走吧~
