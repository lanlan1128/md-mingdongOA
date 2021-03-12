//日历插件
var date = {
				elem: '#date',
				format: 'YYYY-MM-DD',
			    // min: laydate.now(),
				max: '2099-06-16',
				// istime: true,
				istoday: true,
				// festival: true, //显示节日
			};
			laydate(date);

$(document).ready(function(){

//设置默认日期为当天日期
	var nowDate = laydate.now();
	$(".txt_short").val(nowDate);

//三角形按钮折叠功能
	$(".arrow-icon").click(function(){
		var $item_con = $(this).parent().siblings(".item_con");

        if($item_con.hasClass("dsn")){
			$item_con.removeClass("dsn");
			$(this).removeClass("icon-right-arrow");
			$(this).addClass("icon-up-arrow");
		}
		else
		{
            $item_con.addClass("dsn");
            $(this).removeClass("icon-up-arrow");
			$(this).addClass("icon-right-arrow");
		}

	});

//添加按钮
	$(".addBtn").click( function(){
      	var a = $.trim($(this).siblings("input").val());
      	var ol = $(this).parent().siblings("ol");
      	var order_num = $(this).parent().next().children().length;
    	//var f1 = checkDates();
    	//var f2 = checkItems();

    	//if(f1 && f2){
    		//核对是否有周报id，没有发ajax填入隐藏域
    		checkZBid();
    		//添加一条发ajax存入数据库
    		//addItemAjax($this);
    		//把输入的数据填到下面
	    	ol.append(
	              '<li class="item_content_row">'+'(' + (order_num+1) + ')'+'.'+
	                '<p class="item_content_p">'+ a +'</p>'+
	                '<span class="amend-icon"><i class=" iconfont icon-amend"></i></span>'+
	                '<span class="dele-icon"><i class=" iconfont icon-trash"></i></span>'+
	               '</li>'
	    		);
	    	//把input清空
	    	$(this).siblings("input").val("");
	    //}
	});

//预览按钮
	$("#previewBtn").click(function(){
		layer.open({
  			type: 1,
  			title:'周报预览',
  			area: ['700px', '800px'],
  			scrollbar: false,
  			content: $('#preId') //这里content是一个DOM，注意：最好该元素要存放在body最外层，否则可能被其它的相对元素所影响
		});
	});

//删除图标
	$(document).on("click",".dele-icon",function(){
		//发ajax数据库删除
    		//if(deleteItemAjax(id)){
    			$(this).parent().remove();
    		//}
	});

//修改图标
	$(document).on("click",".amend-icon",function(){
		var change_cont = $(this).siblings("p").text();
		console.log(change_cont);
		var change_div = $(this).parent("li").parent("ol").siblings("div");
		change_div.children("input").val(change_cont);
		change_div.children(".addBtn").addClass("dsn");
		change_div.children(".changeBtn").removeClass("dsn");
	});

//修改按钮
	$(".changeBtn").click(function(){
		var changeOK_cont = $(this).siblings("input").val();
		var changeOK_loca = $(this).parent("div").siblings("ol").children("li").children("p");
		changeOK_loca.text(changeOK_cont);
		$(this).siblings(".addBtn").removeClass("dsn");
		$(this).addClass("dsn");
		$(this).siblings("input").val("");
	});


})

//保存按钮
function save(){
	//确认日期已填
	var f1 = checkDates();
	//确认项目已填
	var f2 = checkItems();

	if(f1 && f2){
    		//核对是否有周报id，没有发ajax填入隐藏域
    		checkZBid();
    		//保存时发ajax
    		saveAjax();
	    }
	layer.open({
		  type:0,
		  title:'提示',
		  content:'保存成功!',
		}); 
}

//提交按钮
function submit(){
	//判断是否有周报id
	var zbid = $.trim($("#zb_id").val());
	if(zbid.length == 0){
		layer.open({
		  type:0,
		  title:'提示',
		  content:'您还未填写周报内容!',
		}); 
	}else{
		submitAjax(zbid);
	}
}

////////////////////////////////////////核对方法///////////////////////////////////////
//判断日期是否已填
function checkDates(){
	var date = $.trim($("#date").val());
	
	if(date !== null ){
		return true;
	}
	else{
		return false;
		layer.open({
		  type:0,
		  title:'提示',
		  content:'请选择周报日期!',
		});  
	}
}

//判断项目是否已填
function checkItems(){
	var item = $.trim($("#project").val());

	if(item.length == 0){
		return false;
		layer.open({
		  type:0,
		  title:'提示',
		  content:'请选择项目',
		}); 
	}else if(item == "请选择项目"){
		return false;
		layer.open({
		  type:0,
		  title:'提示',
		  content:'请点击项目的下拉列表，选择具体项目!',
		}); 
	}else{
		return true;
	}
}

//判断是否有周报ID
function checkZBid(){
	var zbid = $.trim($("#zb_id").val());
	if(zbid.length == 0){
		getZBid();
	}else{
		return true;
	}
}


////////////////////////////////////////发ajax请求///////////////////////////////////////
//发ajax请求获取周报ID
function getZBid(){
	var date = $.trim($("#date").val());
	var item = $.trim($("#project").val());
	var param = {
			"date" : date,
			"item" : item
	}; 
	$.ajax({
		url : "",
		type : "post",
		dataType : "json",
		data : param,
		cache : false,
		error : function(){
			layer.alert("系统ajax交互错误!")
		},
		success : function(data) {
			if (data.ajaxReturnBean.retflag) {
				//获取到的周报id填入隐藏域
				$("#zb_id").val(data.ajaxReturnBean.retmsg);
			}else {
				layer.alert(data.ajaxReturnBean.retmsg);
			}			
		}  
	});
}

//添加一条发ajax存入数据库
function addItemAjax(this_input){
	var item_content = $.trim(this_input.val());
	var param = {
			"item_content" : item_content
	}; 
	$.ajax({
		url : "",
		type : "post",
		dataType : "json",
		data : param,
		cache : false,
		error : function(){
			layer.alert("系统ajax交互错误!")
		},
		success : function(data) {
			if (data.ajaxReturnBean.retflag) {
				console.log(data.ajaxReturnBean.retmsg);
			}else {
				console.log(data.ajaxReturnBean.retmsg);
			}			
		}  
	});
}

//保存时发ajax
function saveAjax(){
	$.ajax({
		url : "",
		type : "post",
		dataType : "json",
		data : param,
		cache : false,
		error : function(){
			layer.alert("系统ajax交互错误!")
		},
		success : function(data) {
			if (data.ajaxReturnBean.retflag) {
				console.log(data.ajaxReturnBean.retmsg);
				layer.open({
		  			type:0,
		 			title:'提示',
		  			content:'保存成功!',
				}); 
			}else {
				console.log(data.ajaxReturnBean.retmsg);
			}			
		}  
	});
}

//提交时请求提交id
function submitAjax(id){
	var param = {
			"zbid" : id
	}; 
	$.ajax({
			url : "",
			type : "post",
			dataType : "json",
			data : param,
			cache : false,
			error : function(){
				layer.alert("系统ajax交互错误!")
			},
			success : function(data) {
				if (data.ajaxReturnBean.retflag) {
					console.log(data.ajaxReturnBean.retmsg);
					layer.open({
			  			type:0,
			 			title:'提示',
			  			content:'提交成功!',
					}); 
				}else {
					console.log(data.ajaxReturnBean.retmsg);
				}			
			}  
	});
}
//删除工作内容
function deleteItemAjax(id){
	var param = {
			"RPTCONTENTID" : id//报表事项ID
	}; 
	$.ajax({
			url : "",
			type : "post",
			dataType : "json",
			data : param,
			cache : false,
			error : function(){
				layer.alert("系统ajax交互错误!")
			},
			success : function(data) {
				if (data.ajaxReturnBean.retflag) {
					console.log(data.ajaxReturnBean.retmsg);
					layer.open({
			  			type:0,
			 			title:'提示',
			  			content:'删除成功!',
					});
					return true; 
				}else {
					console.log(data.ajaxReturnBean.retmsg);
				}			
			}  
	});
}









////////////////////////////////////////发ajax请求//////////////////////////////
function previewEditExtract(id){
var param = {
		'RPTID':id 
	}
	$.ajax({
		url : "",
		type : "post",
		dataType : "json",
		data : param,
		cache : false,
		error : function(){
			layer.alert("系统ajax交互错误!")
		},
		success : function(data) {
			if (data.ajaxReturnBean.retflag) {
				var prenode = data.shuju;
				dataRenderingEditPage(prenode);
			}else {
				console.log(data.ajaxReturnBean.retmsg);
			}			
		}  
	});
}

////////////////////////////////////////数据渲染页面//////////////////////////////
function dataRenderingEditPage(data){

}