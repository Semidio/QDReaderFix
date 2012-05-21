var Color = {
	'hexToRgb' : function (hex) {
		var rs = gs = bs = '';
		var r = g = b = 0;
		str = $.trim(hex.replace('#', ''));
		if (hex.length == 3) {
			rs = hex.charAt(0) + hex.charAt(0);
			gs = hex.charAt(1) + hex.charAt(1);
			bs = hex.charAt(2) + hex.charAt(2);
		} else if (hex.length == 6) {
			rs = hex.substr(0, 2);
			gs = hex.substr(2, 2);
			bs = hex.substr(4, 2);
		} else {
			return null;
		}
		
		r = parseInt(rs, 16);
		g = parseInt(gs, 16);
		b = parseInt(bs, 16);
		return [r, g, b]
	},
	rgbToHex : function(rgb) {
		return Color.toHex(rgb[0]) + Color.toHex(rgb[1]) + Color.toHex(rgb[2]);
	},
	toHex : function(N) {
	if (N==null) return "00";
		N=parseInt(N);
		if (N==0 || isNaN(N)) {
			return "00"
		}
		N=Math.max(0,N); 
		N=Math.min(N,255); 
		N=Math.round(N);
		return "0123456789ABCDEF".charAt((N-N%16)/16) + "0123456789ABCDEF".charAt(N%16);
	},
	'__end': null
}