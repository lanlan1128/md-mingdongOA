$(document).ready(function(){

	//input获取焦点的时候保留原来的昵称
	var oldname;
	$(".account_name").focus(function(){
		oldname = $(this).val();
		console.log(oldname);
	});

	//修改用户昵称
	$(".account_name").change(function(){
		var val = $(this).val();
		console.log(val);
		if(val == ""){
				layer.open({
		 			type:0,
		  			title:'提示',
		  			content:'昵称不能为空！',
				}); 
				$(".account_name").val(oldname);
		}else if(checkLength(val)){
				setNickname(val,function(data){
				if(data.retflag) {          // 设置成功
									// layer.close(index);   // 关闭弹出框
									// layer.msg('昵称设置成功，页面跳转');

									// window.location.href = '/';
					$(".account_con").text(data.nickname.substring(0,1));
					console.log(data);
				}else {
					layer.msg('昵称设置失败：' + data.retmsg);
					$(".account_name").val(oldname);
				}
			});
		}else{
			layer.alert("昵称长度不能超过50个字符，一个汉字2个字符");
			$(".account_name").val(oldname);
		}
	});
})
// 用户设置昵称
function setNickname(val, func) {
	$.ajax({
		url: '/nickname',
		type: 'put',
		data: {
			nickname: val
		},
		dataType: 'json',
		success: function(data) {
			func(data);
		},
		error: function(err) {
			console.error(err)
		}
	})
}

//获取字符串长度（汉字算两个字符，字母数字算一个）
function getByteLen(val) {
  var len = 0;
  for (var i = 0; i < val.length; i++) {
    var a = val.charAt(i);
    if (a.match(/[^\x00-\xff]/ig) != null) {
      len += 2;
    }
    else {
      len += 1;
    }
  }
  return len;
}
// 验证编辑框中的文字长度，最大字符长度可以根据需要设定
function checkLength(obj) {
  var maxChars = 50;//最多字符数   
  var curr = maxChars - getByteLen(obj);
  if (curr < 0) {
    // document.getElementById("checklen").innerHTML = curr.toString();
    	return false;
  } else {
    // document.getElementById("checklen").innerHTML = '0';
    // document.getElementById("subject").readOnly = true;
    	return true;
  }
}