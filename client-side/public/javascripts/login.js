$(function() {
	/* 表单处理 */
	$('.login-input').bind('input propertychange', function() {
		if($(this).val() !== '') {
			$(this).siblings('.clean-icon').show();
		}else {
			$(this).siblings('.clean-icon').hide();
		}
	}).trigger('input');

	// 删除input的内容
	$('.clean-icon').click(function() {
		$(this).hide()
			   .siblings('input').val('');
	})

	// 切换密码的可见状态
	$('.look-icon').click(function() {
		var $input = $(this).siblings('input');

		switchClass.call(this, 'icon-eye-close', 'icon-eye', function(classNum) {
			if(classNum == 'class1') {
				$input.prop('type', 'password');

			}else if(classNum == 'class2'){
				$input.prop('type', 'text');
			}
		});
	})

	var switchClass = function(class1, class2, func) {
		if($(this).hasClass(class1)) {
			$(this).removeClass(class1)
				   .addClass(class2)
			func('class2');
		}else if($(this).hasClass(class2)) {
			$(this).removeClass(class2)
				   .addClass(class1)
			func('class1');
		}
	}

	// 提交表单
	$('.login-form').submit(function(e) {
		e.preventDefault();

		// 校验
		var $username = $('#username');
		var $password = $('#password');
		if($username.val() === '') {
			showError('用户名不能为空');
			$username.focus();
			return false;
		}

		if($password.val() === '') {
			showError('密码不能为空');
			$password.focus();
			return false;
		}

		$.ajax({
			url: '/login',
			type: 'post',
			data: {
				username: $username.val(),
				password: $password.val(),
				keepPassword: $('#keepPassword').prop('checked')
			},
			dataType: 'json',
			success: function(data) {
				if(data.retflag) {        // 登录成功

					//  提示用户添加昵称
					if(data.insertOper) {   
						layer.prompt({
							title: '设置昵称',
							btn2: function(index){
						        window.location.href = '/';
						    }
						}, function(val, index){
							if(val.trim() == '') {
								return;
							}

							setNickname(val, function(data) {
								if(data.retflag) {          // 设置成功
									layer.close(index);   // 关闭弹出框
									layer.msg('昵称设置成功，页面跳转');

									window.location.href = '/';

								}else {

									layer.msg('昵称设置失败：' + data.retmsg);
								}
							})
						});

					}else {
  						window.location.href = '/';
					}
				}else {
					showError(data.retmsg);
				}
			},
			error: function(err) {
				showError(err.responseText)
			}
		})

		function showError(text) {
			var $errorBlock = $('#error-block');
			$errorBlock.text(text)
					   .addClass('show');

			setTimeout(function() {
				$errorBlock.removeClass('show');
			}, 1500)
		}
	}) // end 提交表单

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
});


