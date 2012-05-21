// Helper
var Helper = {
	siteConf : null,
	extConf : {},
	// 当前章节对象
	nowChapter : null,
	// 下一章对象
	nextChapter : null,
	loadAll : false,
	scrollListen: null,
	lastBookmark : 0,
	listenRunning : false,
	setSite : function(conf) {
		Helper.siteConf = conf;
	},
	// 键盘快捷
	keyboardShortcut : function(evt){
		console.log(evt.keyCode);
		switch (evt.keyCode) {
			// goto list page
			case 13:
				location.href = Helper.nowChapter.listUrl;
				break;
			// set bookmark
			case 77:
				break;
			// toggle auto scroll
			case 83:
				Scroller.toggle();
				break;
				
		}
	},
	setBookMarkToCurrentChapter : function(){
		var chap = Helper.findCurrentChapter();
		if (chap == null) {
			console.log('ERR: can\'t find current chapter!');
			return;
		}
		Helper.bookmark(chap);
	},
	// 设置当前章
	setNowChapter : function(chapter, nextCallback) {
		Helper.nowChapter = null;
		Helper.nowChapter = chapter;
		// 绘制新的当前页
		Helper.nowChapter.draw();
		// 载入下一页
		if (!chapter.last && !chapter.nextVip) {
			Helper.nextChapter = null;
			Helper.nextChapter = new Chapter(Helper.nowChapter.nextUrl, nextCallback);
		}
	},
	// 载入全部章节
	doLoadAll : function() {
		if (Helper.loadAll) {
			Helper.cleanScrollListener();
			Helper.setNowChapter(Helper.nextChapter, Helper.loadAllCallback);
		} else {
			Helper.setScrollListener();
		}
	},
	loadAllCallback : function(chap) {
		if (Helper.loadAll) {
			window.setTimeout(function(){
				Helper.setNowChapter(chap, Helper.loadAllCallback);
			}, 1000);
		} else {
			Helper.setScrollListener();
		}
	},
	//查找当前显示的章节
	findCurrentChapter : function(){
		var titles = $('.q3_title');
		var pos = title = null;
		for (var i = titles.length - 1; i >=0 ; i--) {
			title = $(titles[i]);
			pos = title.position();
			if (pos.top + title.height() < document.body.scrollTop + window.innerHeight) {
				return {bookId:title.attr('bookid'), chapterId:title.attr('chapid')};
			}
		}
		return null;
	},
	// 滚屏事件处理
	scrollListener : function(evt) {
		if (Helper.listenRunning) {
			return;
		}
		Helper.listenRunning = true;
		// 卷屏判断
		if ((document.body.scrollHeight - document.body.scrollTop  -  window.innerHeight) < Helper.siteConf.drawTriggerHeight * $(window).height()) {
			// 绘制下一页
			if (Helper.nowChapter.loadOk && !Helper.nowChapter.last && !Helper.nowChapter.nextVip && Helper.nextChapter && Helper.nextChapter.loadOk) {
				// 将当前页对象替换为下一页对象
				Helper.setNowChapter(Helper.nextChapter);
			// 绘制最后一页提示
			} else if (Helper.nowChapter.last) {
				Helper.nowChapter.drawLast();
				Helper.cleanScrollListener();
			// 绘制最后公众章节提示
			} else if (Helper.nowChapter.nextVip) {
				Helper.nowChapter.drawVip();
				Helper.cleanScrollListener();
			} 
		}
		// 自动书签
		if (Helper.extConf.auto_mark) {
			Helper.setBookMarkToCurrentChapter();
		}
		if (Helper.siteConf.maskImageGet) {
			// 图片显隐 优化vip章节内存占用
			var imgs = $('.q3_cont img');
			var imgh = imgw = imgTop = imgBtm = pos = jimg= img = null;
			var scrTop = document.body.scrollTop;
			var scrBtm = scrTop + window.innerHeight;
			var len = imgs.length;
			var hfix = window.innerHeight * 2;
			for (var i = 0; i < len; i++) {
				if (imgs[i]) {
					img = imgs[i];
					jimg = $(img);
					imgh = img.height;
					imgw = img.width;
					imgTop = jimg.position().top - hfix;
					imgBtm = imgTop + imgh + hfix;
					if (jimg.attr('srcurl') == 'none') {
						if (imgBtm < scrTop || imgTop > scrBtm) {
							jimg.attr('srcurl', img.src);
							img.src = 'data:image/gif;base64,R0lGODlhAQABAJEAAAAAAP///////wAAACH5BAEHAAIALAAAAAABAAEAAAICVAEAOw==';
							img.height = imgh;
							img.width = imgw;
							console.log('hide', i);
						}
					} else {
						if (imgBtm >= scrTop && imgTop <= scrBtm) {
							img.src = jimg.attr('srcurl');
							jimg.attr('srcurl', 'none');
							console.log('show', i);
						}
					}
				}
			}
		}
		Helper.listenRunning = false;
	},
	bookmark: function(chap) {
		if (chap.chapterId != Helper.lastBookmark) {
			var xhr = new XMLHttpRequest();
			var url = Helper.siteConf.bookmark.url;
			var data = Helper.siteConf.bookmark.data(chap);
			var header = Helper.siteConf.bookmark.header;
	
			xhr.onreadystatechange = function() {
				if (xhr.readyState == 4) {
					if (xhr.status == 200) {
						console.log('bookmark', xhr.responseText);
					}
				}
			}
			xhr.open('POST', url, true);
			for (key in header) {
				xhr.setRequestHeader(header[key][0], header[key][1]);
			}
			xhr.send(data);
			Helper.lastBookmark = chap.chapterId;
		}
	},
	setScrollListener : function(){
		if (!Helper.scrollListen) {
			Helper.scrollListen = window.setInterval(Helper.scrollListener, 200);
		}
	},
	cleanScrollListener : function() {
		if (Helper.scrollListen) {
			window.clearInterval(Helper.scrollListen);
		}
	},
	// 分析器
	parser : function(str, rules, obj) {
		if (str && str != '' && rules) {
			for (key in rules) {
				var rule = rules[key];
				if (rule) {
					if (rule.constructor.toString().indexOf('Function') >= 0) {
						obj[key] = rule(str);
					} else {
						var match = str.match(rule);
						if (match) {
							obj[key] = match.length > 1 ? match[1] : true;
						}
					}
				}
			}
		}
	},
	// 字符串模板渲染
	renderStr : function(str, bind) {
		if (str && bind) {
			for (key in bind) {
				if (bind[key]) {
					var type = typeof(bind[key]);
					if (type == 'string' || type == 'number') {
						str = str.replace(new RegExp('\\$\\{' + key + '\\}\\$', 'ig'), bind[key]);
					}
				}
			}
		}
		return str;
	},
	// 文件模板渲染
	renderFile : function (file, bind, callback) {
		chrome.extension.sendRequest({
			'action' : 'tplRender',
			'file' : file,
			'bind' : bind
		}, callback);
	},
	// 章节解析后处理
	parserFix: function(chapter){
		// 处理site定义中的parserFix
		var bind = chapter.getAll();
		for (key in Helper.siteConf.parserFixRender) {
			chapter[key] = Helper.renderStr(Helper.siteConf.parserFixRender[key], bind);
		}
		// 章节正文内容的换行替换
		if (chapter.content) {
			chapter.content = '<p>' + chapter.content.replace(/\n/g, "</p>\n<p>") + '</p>';
		}
		// 最后一页
		if (chapter.last) {
			chapter.nextUrl = chapter.listUrl;
		}
		// 第一页
		if (chapter.first) {
			chapter.prevUrl = chapter.listUrl;
		}
		// 最后公众章节
		if (chapter.nextVip) {
			chapter.nextUrl = chapter.listUrl;
		}
	},
	updateCss: function() {
		chrome.extension.sendRequest({'action' : 'updateCss', 'width' : $(window).width()});
	},
	setCursor : function() {
		$(window).keydown(function(){
			$(document.body).addClass('nocursor');
		}).mousemove(function(){
			$(document.body).removeClass('nocursor');
		});
	},
	onConfChange : function(change) {
		// 滚屏处理
		if (change.scroll_start == true) {
			Scroller.start();
		} else if(change.scroll_start == false) {
			Scroller.stop();
		}
		if (change.scroll_speed == 0 || change.scroll_speed > 0) {
			Scroller.speed(change.scroll_speed);
		}
		// 是否需要更新样式
		var cssProp = ['font','size','margin','spacing','text_color','bg_color'];
		var prop;
		for (var i = 0; i < cssProp.length; i++) {
			prop = cssProp[i];
			if (change[prop]) {
				Helper.updateCss();
				break;
			}
		}
	},
	getConf: function() {
		chrome.extension.sendRequest({'action' : 'getConfig'}, function(conf){
			var change = {};
			var changed = false;
			for (key in conf) {
				if (conf[key] != Helper.extConf[key]) {
					changed = true;
					change[key] = conf[key];
				}
			}
			Helper.extConf = conf;
			if (changed) {
				Helper.onConfChange(change);
			}
			//window.setTimeout(Helper.getConf, 1000);
		});
	},
	init : function(){
		chrome.extension.sendRequest({'action' : 'getSite'}, function(site){

			eval('var site = ' + site + ';');
			//清理页面
			site.clean();
			$(document.body).html('<div id="DivNewMask" style="display:none"></div><div id="q3_all_chap"></div>');
			// 取扩展配置
			Helper.getConf();
			Scroller.init();
			$(window).focus(Helper.getConf);
			// 更新css
			//Helper.updateCss();
			//Helper.setCursor();
			// 设置站点配置
			Helper.setSite(site);
			// 载入并解析当前页面
			new Chapter(location.href, function(chapter){
				Helper.setNowChapter(chapter);
				Helper.setScrollListener();
				$(window).keydown(Helper.keyboardShortcut);
			})
		});
	},
	'__end' : null
}

// 章节对象
var Chapter = function (url, callback){
	var chap = {
		'bookId' : null,
		'chapterId' : null,
		'pageId' : null,
		'prevId' : null,
		'nextId' : null,

		'content' : null,
		'bookName' : null,
		'chapterName' : null,
		'authorName' : null,
		
		'bookUrl' : null,
		'chapterUrl' : null,
		'pageUrl' : null,
		'prevUrl' : null,
		'nextUrl' : null,


		'first' : false,
		'last' : false,
		'nextVip' : false,
		'loadOk' : false,
		'drawOk' : false,
		'url' : url,

		// 取得所有属性
		getAll : function() {
			var obj = {};
			for (key in this) {
				if (typeof(this[key]) != 'function') {
					obj[key] = this[key];
				}
			}
			return obj;
		},
		// 绘制章节
		draw : function () {
			var bind = this.getAll();
			var tpl = '';
			// 解析章节模板
			if (typeof chap.pageId == undefined || chap.pageId < 1 || ($('.q3_title').length < 1)) {
				tpl = 'chap.html';
			} else {
				tpl = 'chap_no_title.html';
			}
			Helper.renderFile(tpl, bind, function(html){
				$('#q3_all_chap').append(html);
			});
		},
		// 绘制最后一页信息
		drawLast : function() {
			Helper.renderFile('over.html', Helper.nowChapter.getAll(), function(html) {
				$('#q3_all_chap').append(html);
			});
		},
		// 绘制最后公众章节信息
		drawVip: function() {
			Helper.renderFile('vip.html', Helper.nowChapter.getAll(), function(html) {
				$('#q3_all_chap').append(html);
			});
		},
		setLoadOk : function() {
			this.loadOk = true;
			chrome.extension.sendRequest({'action' : 'setIcon', 'name' : 'rock'});
		},
		setLoading : function () {
			this.loadOk = false;
			chrome.extension.sendRequest({'action' : 'setIcon', 'name' : 'rock_plus'});
		},
		'__end' : null
	}
	chap.setLoading();
	// url解析
	Helper.parser(url, Helper.siteConf.urlParser, chap);
	// 取页面
	chrome.extension.sendRequest({'action' : 'httpGet', 'url' : url, 'charset' : Helper.siteConf.charset}, function(page){

		// 页面内容解析
		Helper.parser(page, Helper.siteConf.pageParser, chap);
				
		// 需要二次http请求
		if (Helper.siteConf.httpGet) {
			var http = Helper.siteConf.httpGet;
			// 二次http url解析来源类型
			var res;
			if (http.res == 'page' ) {
				res = page;
			} else if (http.res == 'url') {
				res = url;
			}
			// 解析url
			var match = res.match(http.reg);
			
			if (match) {
				// 发起二次http请求
				chrome.extension.sendRequest({'action' : 'httpGet', 'url' : match[1], 'charset' : Helper.siteConf.charset}, function(subpage){
					
					// 内容解析
					Helper.parser(subpage, http.pageParser, chap);
					// 处理parserFix
					Helper.parserFix(chap);

					chap.setLoadOk();
					if (callback) {
						callback(chap);
					}
				});
			} else {
				Helper.parserFix(chap);
				chap.setLoadOk();
				if (callback) {
					callback(chap);
				}
			}
		// 遮罩图片
		} else if (Helper.siteConf.maskImageGet) {
			var mask = Helper.siteConf.maskImageGet;
			// 遮罩图片 url解析来源类型
			var res;
			if (mask.res == 'page' ) {
				res = page;
			} else if (mask.res == 'url') {
				res = url;
			}
			var match = res.match(mask.reg);
			
			var url = mask.escape ? unescape(match[1]) : match[1];
			chrome.extension.sendRequest({'action' : 'getMaskImage', url:match[1].replace(/&amp;/ig, '&')}, function(img){
				// 处理parserFix
				Helper.parserFix(chap);
				chap.content = '<img align="center" src="'+ img.url + '" srcurl="none" />';
				chap.setLoadOk();
				if (callback) {
					callback(chap);
				}
			});
		} else {
			// 处理parserFix
			Helper.parserFix(chap);
			chap.setLoadOk();
			if (callback) {
				callback(chap);
			}
		}
	});
	return chap;
}
var Scroller = {
	timer : null,
	focus : false,
	keydown : false,
	timeout : 15,
	offset : 1,
	toggle : function() {
		if (Scroller.timer)	 {
			Scroller.keydown = true;
			Scroller.focus = false;
			Scroller.stop();
		} else {
			Scroller.keydown = false;
			Scroller.focus = true;
			Scroller.start();
		}
	},
	start : function() {
		if (!Scroller.timer) {
			Scroller.timer = window.setInterval(Scroller.scroll, Scroller.timeout);
		}
	},
	scroll : function() {
		if (Scroller.focus && !Scroller.keydown) {
			window.scroll(0, window.pageYOffset + Scroller.offset)
		}
	},
	stop : function() {
		if (Scroller.timer) {
			window.clearInterval(Scroller.timer);
			Scroller.timer = null;
		}
	},
	speed : function(speed) {
		Scroller.timeout = 5 + parseInt(speed*speed/300);
		if (Scroller.timer) {
			Scroller.stop();
			Scroller.start();
		}
	},
	listen: function() {
		$(window).keydown(function(evt){
			Scroller.keydown = true;
			Scroller.focus = true;
		}).keyup(function(){
			Scroller.keydown = false;
			Scroller.focus = true;
		}).mousedown(function(){
			Scroller.focus = true;
		}).focus(function(){
			Scroller.focus = true;
		}).blur(function(){
			Scroller.focus = false;	
		});
	},
	init : function() {
		Scroller.listen();
		//Scroller.start();
	},
	'__end' : null
};

Helper.init();
