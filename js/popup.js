$(document.body).ready(function(){
	function settings(conf) {
		var set = {
			conf : conf,
			save : function(conf) {
				chrome.extension.sendRequest({
					'action' : 'saveConfig',
					'conf' : conf
				});
				chrome.windows.getCurrent(function(topWin){
					chrome.tabs.getSelected(topWin.id, function(tab){
						var script = 'Helper.getConf();';
						chrome.tabs.executeScript(tab.id, {'code' : script});
					});
				});
			},
			toggleAutoMark : function() {
				var node = $('.auto_mark');
				node.toggleClass('checked');
				var checked = node.hasClass('checked');
				set.conf.auto_mark = checked ? true : false;
				set.save({'auto_mark': checked ? true : false});
			},
			setFont : function() {
				var node = $('.font input');
				var font = node.val();
				set.conf.font = font;
				set.save({'font': font});
			},
			setSize : function() {
				var node = $('.size input');
				var size = node.val();
				set.conf.size = size;
				set.save({'size': size});
			},
			
			setTextColor : function() {
				var node = $('.text_color input');
				var text_color = node.val();
				set.conf.text_color = text_color;
				set.save({'text_color': text_color});
			},
			
			setBgColor : function() {
				var node = $('.bg_color input');
				var bg_color = node.val();
				set.conf.bg_color = bg_color;
				set.save({'bg_color': bg_color});
			}
			,
			setSpacing : function() {
				var node = $('.spacing input');
				var spacing = node.val();
				set.conf.spacing = spacing;
				set.save({'spacing': spacing});
			},
			setScrollStart : function() {
				set.save({'scroll_start': true});
			},
			setScrollStop : function() {
				set.save({'scroll_start': false});
			},
			setScrollSpeed : function() {
				var node = $('div.scroll_speed input');
				var speed = parseInt(node.val());
				set.conf.spacing = speed;
				set.save({'scroll_speed': speed});
			},
			setMargin : function() {
				var node = $('.margin input');
				var margin = node.val();
				set.conf.margin = margin;
				set.save({'margin': margin});
			},
			setEnable : function(){
				set.save({'enabled': true});
			},
			setDisable : function() {
				set.save({'enabled': false});
			},
			loadAll : function(loadAll){
				if (loadAll) {
					$('.loadall').addClass('checked');
				} else {
					$('.loadall').removeClass('checked');
				}
				chrome.windows.getCurrent(function(topWin){
					chrome.tabs.getSelected(topWin.id, function(tab){
						var script = 'Helper.loadAll = ' + (loadAll ? 'true' : 'false') + '; Helper.doLoadAll();';
						chrome.tabs.executeScript(tab.id, {'code' : script});
					});
				});
			},
			'__end' : null
			
		}
		
		// 自动书签
		if (conf.auto_mark) {
			$('.auto_mark').addClass('checked');
		} else {
			$('.auto_mark').removeClass('checked');
		}
		$('div.auto_mark').click(function(){
			set.toggleAutoMark();
		})
		
		// 字体
		$('div.font input').val(conf.font).change(function(){
			set.setFont();
		});
		
		// 字号
		$('div.size input').val(conf.size).mouseup(function(){
			set.setSize();
		}).change(function(){
			$('#size_num').html(16 + Math.floor($('.size input').val() * 0.5));
		});
		$('#size_num').html(16 + Math.floor(conf.size * 0.5));
		
		// 文字颜色
		$('div.text_color input').val(conf.text_color).change(function(){
			set.setTextColor();
		});
		new ColorPicker({
			picker:'.text_color .picker',
			input:'.text_color input',
			example:'.text_color .color_example'
		});
		// 背景颜色
		$('div.bg_color input').val(conf.bg_color).change(function(){
			set.setBgColor();
		});
		
		new ColorPicker({
			picker:'.bg_color .picker',
			input:'.bg_color input',
			example:'.bg_color .color_example'
		});
		
		// 行间距
		$('div.spacing input').val(conf.spacing).mouseup(function(){
			set.setSpacing();
		}).change(function(){
			$('#spacing_num').html(100 + $('.spacing input').val() * 1);
		});
		$('#spacing_num').html(100 + conf.spacing * 1);
		
		// 页边距
		$('div.margin input').val(conf.margin).mouseup(function(){
			set.setMargin();
		}).change(function(){
			$('#margin_num').html(0 + $('.margin input').val() * 5);
		});
		$('#margin_num').html(0 + conf.margin * 5);
		
		// 全部载入
		$('.loadall').click(function(evt){
			set.loadAll(!$('.loadall').hasClass('checked'));
		})
		$('.mark').click(function(){
			chrome.windows.getCurrent(function(topWin){
				chrome.tabs.getSelected(topWin.id, function(tab){
					var script = 'Helper.setBookMarkToCurrentChapter();';
					chrome.tabs.executeScript(tab.id, {'code' : script});
				});
			});
		});
		
		// 滚屏
		$('div.scroll_start').click(function(evt) {
			$('div.scroll_start').addClass('hide');
			$('div.scroll_speed').removeClass('hide');
			$('div.scroll_stop').removeClass('hide');
			set.setScrollStart();
			chrome.windows.getCurrent(function(topWin){
				chrome.tabs.getSelected(topWin.id, function(tab){
					var script = 'Scroller.focus=true;Helper.getConf();';
					chrome.tabs.executeScript(tab.id, {'code' : script});
				});
			});
		});
		$('div.scroll_stop').click(function(evt) {
			$('div.scroll_stop').addClass('hide');
			$('div.scroll_speed').addClass('hide');
			$('div.scroll_start').removeClass('hide');
			set.setScrollStop();
			chrome.windows.getCurrent(function(topWin){
				chrome.tabs.getSelected(topWin.id, function(tab){
					var script = 'Helper.getConf();';
					chrome.tabs.executeScript(tab.id, {'code' : script});
				});
			});
		});
		if (conf.scroll_start) {
			$('div.scroll_start').addClass('hide');
			$('div.scroll_speed').removeClass('hide');
			$('div.scroll_stop').removeClass('hide');
		} else {
			$('div.scroll_start').removeClass('hide');
			$('div.scroll_speed').addClass('hide');
			$('div.scroll_stop').addClass('hide');
		}
		
		$('div.scroll_speed input').mouseup(function(){
			var speed = parseInt($('div.scroll_speed input').val());
			set.setScrollSpeed();
			chrome.windows.getCurrent(function(topWin){
				chrome.tabs.getSelected(topWin.id, function(tab){
					var script = 'Scroller.focus=true;Helper.getConf();';
					chrome.tabs.executeScript(tab.id, {'code' : script});
				});
			});
		});
		$('div.scroll_speed input').val(conf.scroll_speed);
		
		// 启用禁用
		$('div.enable').click(function(){
			set.setEnable();
			$('div.enable').hide();
			$('div.disable').show();
			$('div#options').show();
			chrome.windows.getCurrent(function(topWin){
				chrome.tabs.getSelected(topWin.id, function(tab){
					var script = 'Helper.init();';
					chrome.tabs.executeScript(tab.id, {'code' : script});
				});
			});
		})
		$('div.disable').click(function(){
			set.setDisable();
			$('div.enable').show();
			$('div.disable').hide();
			$('div#options').hide();
		})
		if (conf.enabled) {
			$('div.enable').hide();
			$('div.disable').show();
			$('div#options').show();
		} else {
			$('div.enable').show();
			$('div.disable').hide();
			$('div#options').hide();
		}
		return set;
	}
	chrome.extension.sendRequest({'action' : 'getConfig'}, function (conf) {
		var set = settings(conf);
		$('section#menu').show();
		
		// section switch
		$('div.font').click(function(){
			$('section#font').show();
			$('section#menu').hide();
		});
		$('div.color').click(function(){
			$('section#color').show();
			$('section#menu').hide();
		});
		$('div.layout').click(function(){
			$('section#layout').show();
			$('section#menu').hide();
		});
		$('div.scroll').click(function(){
			$('section#scroll').show();
			$('section#menu').hide();
		});
		$('footer').click(function(){
			$('section#font').hide();
			$('section#color').hide();
			$('section#scroll').hide();
			$('section#layout').hide();
			$('section#menu').show();
		});
	});
})