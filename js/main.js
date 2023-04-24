(function () {
	// 顶部导航栏
	var header = document.getElementById("mainHeader");

	function changeHeader() {
		var scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
		header.classList.toggle("header-background", scrollTop >= 50 || document.body.classList.contains("nav-open"));
	}

	var didScroll = false;

	$(window).scroll(function () {
		didScroll = true;
	});

	setInterval(function() {
		if (didScroll) {
			didScroll = false;
			changeHeader();
		}
	}, 100);

	changeHeader();

	document.getElementById("open-nav").addEventListener("click", function (event) {
		event.preventDefault();
		document.body.classList.toggle("nav-open");
		changeHeader();
	});

	$("a[href*=\\#]").on("click", function (event) {
		if(this.pathname === window.location.pathname) {
			event.preventDefault();

			$("html, body").animate({
				scrollTop: $(this.hash).offset().top
			}, 500);
		}
	});


	// 网页标题
	var originalTitle = document.title; // 保存原来的页面标题
	var timeoutId; // 定义一个定时器 ID
	window.onblur = function() {
		document.title = '欸!!?? (*ﾟﾛﾟ)!!'; // 更改页面标题为“未响应！”
	}
	window.onfocus = function() {
		document.title = '没什么事啦(*σ´∀`)σ'; // 显示“骗你啦~”提示
		clearTimeout(timeoutId); // 清除之前的定时器
		timeoutId = setTimeout(function() {
			document.title = originalTitle; // 更改回原来的页面标题
		}, 1000); // 一秒钟后将页面标题更改回原来的标题
	}


})();
//↑↑ 这对括号是对前面定义的匿名函数进行执行！