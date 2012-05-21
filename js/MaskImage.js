// url: 图片地址, txt_color: 图片文字颜色, node: 插入父节点, callback:处理完成后回调函数
var MaskImage = function(url, txt_color, callback){
	var txt_color = Color.hexToRgb(txt_color);
	var pic = new Image();

	// 图片数据全部载入
	$(pic).load(function(evt){
		
		var img = evt.srcElement;
		cw = img.width;
		ch = img.height;
		// 生成canvas对象
		cvs = document.createElement('canvas');
		// 设置高宽与背景色
		cvs.width = cw;
		cvs.height = ch;

		// 取得context
		var c = cvs.getContext('2d');
		// 绘制图像
		c.drawImage(img, 0, 0);
		// 取得像素信息
		var pix = c.getImageData(0, 0, cw, ch);

		// 处理遮罩逻辑
		var len = pix.data.length;
		for (var i =0 ; i < len; i = i + 4) {

			// 移除尾部空白
			if (pix.data[i+3] < 255) {
				cvs.height = Math.floor(i / cw / 4);
				break;
			}
			// 遮罩逻辑
			pix.data[i+3] = 255 - pix.data[i] * pix.data[i] / 255;
			pix.data[i] = txt_color[0];
			pix.data[i+1] = txt_color[1];
			pix.data[i+2] = txt_color[2];
		}
		// 重绘
		c.putImageData(pix, 0,0);
		c = pix = null;
		// run callback
		callback({'width':cw, 'height':ch, 'url':cvs.toDataURL("image/png")});
		cvs = null;
	});
	// 载入图片
	pic.src = url;
	url = null;
}
