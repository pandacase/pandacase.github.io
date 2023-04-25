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
	var originalTitle = document.title;
	var timeoutId; // 定时器 ID
	window.onblur = function() {
		document.title = '欸！！？？ (*ﾟﾛﾟ)!!';
	}
	window.onfocus = function() {
		document.title = '嗨嗨嗨！ ヾ(^▽^*)))';
		clearTimeout(timeoutId);
		// 持续一秒后还原页面标题
		timeoutId = setTimeout(function() {
			document.title = originalTitle;
		}, 1000);  
	}


	// Contact 文本复制器
	const eletments = document.getElementsByClassName("copy-link");
	const array = Array.from(eletments);

	array.forEach(function(element){
		const copyText = element.textContent;
		element.addEventListener("click", () => {
			// 将文本复制到剪切板
			navigator.clipboard.writeText(copyText); 
			// 提示信息
			alert("panda已经帮你放进剪切板啦");
		})
	});
	

})();
//↑↑ 这对括号是对前面定义的匿名函数进行执行！