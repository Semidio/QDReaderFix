function base64(str) {
	var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
	var chr1, chr2, chr3 = "";
	var enc1, enc2, enc3, enc4 = "";
	var output = '';
	var i = 0;
	do {
		chr1 = str.charCodeAt(i++) & 0xff;
		chr2 = str.charCodeAt(i++) & 0xff;
		chr3 = str.charCodeAt(i++) & 0xff;
		
		enc1 = chr1 >> 2;
		enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
		enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
		enc4 = chr3 & 63;
		
		if (isNaN(chr2)) {
			enc3 = enc4 = 64;
		} else if (isNaN(chr3)) {
			enc4 = 64;
		}
		output = output + keyStr.charAt(enc1) + keyStr.charAt(enc2) + keyStr.charAt(enc3) + keyStr.charAt(enc4);
		//chr1 = chr2 = chr3 = enc1 = enc2 = enc3 = enc4 = "";
	} while (i < str.length);
	return output;
}