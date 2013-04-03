//background.js
var ResourceCache = {};
var Config = function (onloadCallback) {
	// 错误处理
	var db_err = function (transaction, error){
		console.log('DB error was: '+ error.message +'(Code:'+ error.code +')');
		var fatal_error = true;
		if(fatal_error){
			return true;
		}
		return false;
	}
	// conf对象定义
	var conf = {
		// 默认值
		def : {
			font : '微软雅黑',
			size : 20,
			margin : 10,
			spacing : 20,
			text_color : 'FFF',
			bg_color : '000',
			auto_mark : true,
			scroll_start : false,
			scroll_speed : 50,
			enabled : true
		},
		// 配置版本
		version : 1,
		// 全部载入
		load_all: false,
		// 打开db资源
		db : openDatabase('q3_qidian_read_db', '0.1', 'Qidian Reader Database', 4096),
		// 定义callback函数
		onload : onloadCallback,
		// 取得所有配置属性
		getAll : function(){
			var settings = {};
			for (key in conf.def) {
				settings[key] = conf[key];
			}
			return settings;
		},
		// 读取数据
		load : function() {
			var sql = 'SELECT settings FROM q3_settings WHERE version = ' + conf.version + ';';
			// 开启事务
			conf.db.transaction(function (transaction){
				transaction.executeSql(sql, [], function(transaction, results) {
					// 未独到数据
					if (results.rows.length == 0) {
						// 使用默认值
						for (key in conf.def) {
							conf[key] = conf.def[key];
						}
						// 保存
						conf.save();
					} else {
						// 将数据库中结果设入对象
						var row = results.rows.item(0);
						var data = $.parseJSON(row.settings);
						for (key in conf.def) {
							if (data[key]) {
								conf[key] = data[key];
							} else {
								conf[key] = conf.def[key];
							}
						}
					}
					// 触发callback
					conf.onload(conf.getAll());
				}, db_err);
			});
		},
		// 保存数据
		save: function() {
			// 使用replace into简化逻辑
			var sql = 'REPLACE INTO q3_settings values(?, ?);';
			// 开启事务
			conf.db.transaction(function (transaction){
				transaction.executeSql(sql, [conf.version, JSON.stringify(conf.getAll())], null, db_err);
			});
		}
	}
	// 建表, 使用if not exists 简化逻辑
	//var sql_create = 'CREATE TABLE IF NOT EXISTS settings (version INTEGER NOT NULL PRIMARY KEY, font VARCHAR(64), size INTEGER, margin INTEGER, spacing INTEGER, text_color CHAR(6), bg_color CHAR(6), auto_mark INTEGER);';
	var sql_create1 = 'DROP TABLE IF EXISTS settings;';
	var sql_create2 = 'CREATE TABLE IF NOT EXISTS q3_settings (version INTEGER NOT NULL PRIMARY KEY, settings VARCHAR(64000));'
	
	conf.db.transaction(function (transaction){
		transaction.executeSql(sql_create1, [], null, db_err);
		transaction.executeSql(sql_create2, [], function() {conf.load()}, db_err);
	});
	return conf;
}
// 设置page action 图标
function setIcon(name, tab) {
	chrome.pageAction.setIcon({
		'tabId' : tab.id,
		'path' : 'img/' + name + '.png'
	});
}
function getMaskImage(url, callback) {
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if (xhr.status == 200) {
				img = 'data:image/gif;base64,' + base64(xhr.responseText);
				var mimg = new MaskImage(url, conf.text_color, callback);
				ming = null;
			} else {
				callback(null);
			}
		}
	}
	xhr.open('GET', url, true);
	xhr.overrideMimeType('image/gif; charset=x-user-defined');
	xhr.send();
}
// 请求远程文件
function httpGet(url, charset, callback) {
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if (xhr.status == 200) {
				callback(xhr.responseText);
			} else {
				callback(null);
			}
		}
	}
	xhr.open('GET', url, true);
	xhr.overrideMimeType('text/plain; charset=' + charset);
	xhr.send();
}
// 读取本地文件
function loadLocalFile(file, callback) {
	if (ResourceCache[file]) {
		callback(ResourceCache[file]);
		return;
	}
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			ResourceCache[file] = xhr.responseText;
			callback(xhr.responseText);
		}
	}
	xhr.open("GET", chrome.extension.getURL(file), true);
	xhr.send();
}

// 读取站点配置
function getSite(tab, callback) {
	// 读文件
	loadLocalFile('/sites/sites_define.json', function(data){
		// 解析json数据
		eval('var sites = ' + data + ';');
		var url = tab.url
		// 遍历站点配置
		for (key in sites) {
			var site = sites[key];
			for (var i = 0; i < site.url.length; i++) {
				var match = site.url[i];
				// 匹配当前url, 读取此站点配置
				if (url.match(match)) {
					if (conf.enabled) {
						loadLocalFile('/sites/' + sites[key].file + '.json', function(json) {
							if (json) {
								// 触发 content script中callback
								callback(json);
								// 显示page_action icon
							}
						});
					}
					chrome.pageAction.show(tab.id);
					return;
				}
			}
		}
	});
}
// 读取资源文件
function getRes(file, callback) {
	loadLocalFile('/res/' + file, callback);
}
// 渲染模板文件
function tplRender(file, bind, callback) {
	getRes(file, function(tpl) {
		for (key in bind) {
			tpl = tpl.replace(new RegExp('\\$\\{' + key + '\\}\\$', 'ig'), bind[key]);
		}
		callback(tpl);
	});
};

// 根据conf信息,更新页面css
function updateCss(tab, width) {
	//生成bind对象
	var bind = {
		'font' : conf.font,
		'text_color' : conf.text_color,
		'bg_color' : conf.bg_color,
	}
	bind.size = 16 + Math.floor(conf.size * 0.5);
	bind.spacing = 100 + conf.spacing * 1;
	bind.margin = 0 + conf.margin * 5;
	bind.img_width = width - bind.margin * 2;
	bind.p_space = parseInt((bind.size * (100 + parseInt(bind.spacing)) / 100) / 2);


	// 渲染模板
	tplRender('chap.css', bind, function(css){
		// 生存js代码 (在文档后append style标签)
		var script = css.replace(/\r?\n/g, "\\n").replace(/[\t ]+/g, ' ').replace(/'/g, '\\\'').replace(/"/, '\\"');
		script = '$(document.body).append("<style>'+script+'</style>");';
		// 执行脚本 更新样式
		chrome.tabs.executeScript(tab.id, {'code' : script});
	});
}
// 通信请求callback
function onRequest(req, sender, callback) {
	// 设置图标
	if (req.action == 'setIcon') {
		setIcon(req.name, sender.tab);
	// 取得conf信息
	} else if (req.action == 'getConfig') {
		callback(conf.getAll());
	// 保存conf信息
	} else if (req.action == 'saveConfig') {
		// 遍历赋值
		for (key in req.conf) {
			conf[key] = req.conf[key];
		}
		// 保存
		conf.save();
	// 取远程文件
	} else if (req.action == "httpGet") {
		httpGet(req.url, req.charset, callback);
	// 取本地文件
	} else if (req.action == "getRes") {
		getRes(req.file, callback);
	// 渲染模板
	} else if (req.action == "tplRender") {
		tplRender(req.file, req.bind, callback);
	// 更新css
	} else if (req.action == 'updateCss') {
		updateCss(sender.tab, req.width);
	// 取站点信息
	} else if (req.action == 'getSite') {
		getSite(sender.tab, callback);
	// 取图片
	} else if (req.action == 'getMaskImage') {
		getMaskImage(req.url, callback);
	}
}


// 配置对象初始化
var conf = new Config(function(){
	// 挂入request钩子
	chrome.extension.onRequest.addListener(onRequest);
});