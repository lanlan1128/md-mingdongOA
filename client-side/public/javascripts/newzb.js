////////////////////////////////////////日历控件js///////////////////////////////////////

//日历控件
// var nowDate = new Date();
$(".datepicker").datepicker({
				language: 'zh-CN',
//				trigger: $(".end-input-group-btn"),
				format: 'yyyy-mm-dd',
				autoPick: 'ture',
				autoHide: 'ture',
				// date: new Date(nowDate), // Or '02/14/2014'
				startView: 0, //开始界面是显示date
			});
$("#ClearBtn").click(function() {
				 $(".datepicker").val("");
			});

////////////////////////////////////////新增页js///////////////////////////////////////

$(document).ready(function(){
	 console.log($("#a").attr('value'));
	 console.log($("#b").attr('value'));
	 console.log($("#e").attr('value'));
	 console.log($("#q").attr('value'));
	 var prt= $("#e").attr('value');
	 if(prt==undefined){
	 	var nowDate = new Date();
		// $("#prtdata").val(nowDate);
		$(".datepicker").datepicker({
			date:nowDate
		});
		$(".sidebar_li").children("a").addClass("aChecked");
		$(".menu_li").children("a").removeClass("aChecked");
		$(".project_select").removeAttr("disabled");
	 }else{
	 	$(".sidebar_li").children("a").removeClass("aChecked");
	 }
	 //小写字母换大写字母
	 $(".order").click(function(){
	 	var num = $(this).text();
		var th = $(this);
		intToChinese(num,th);
	 });
		
document.onkeydown=function(event){   
    var e = event || window.event || arguments.callee.caller.arguments[0];   
    if (e.keyCode == 13 && e.shiftKey) {    
        // ; 
        e.returnValue = false;
        e.preventDefault();   
    }  
 }; 

//监听textarea框的键盘按下事件
$(".txt_long").keydown(function(e){
	var theEvent = window.event || e; 
	var code = theEvent.keyCode || theEvent.which; 
	if (code == 13 && theEvent.shiftKey) { 
		$(this).siblings("button").not(".dsn").click();
		// $(this).blur();
	} 
});

//隐藏显示昵称下拉框
	$(".account_con").click(function(e){
		e.stopPropagation();
		var $top_arrow = $(this).siblings("div");
		if($top_arrow.hasClass("dsn")){
			$top_arrow.removeClass("dsn");
		}else{
			$top_arrow.addClass("dsn");
		}
	});

	$(".top_arrow").click(function(e){
		e.stopPropagation();
	});

	$("body").click(function(){
		var $top_arrow = $(".top_arrow");
		if($top_arrow.hasClass("dsn")){
			
		}else{
			$top_arrow.addClass("dsn");
		}
	});
//三角形按钮折叠功能
	$(".zedie").click(function(){
		var $item_con = $(this).parent().siblings(".item_con");

        if($item_con.hasClass("dsn")){
			$item_con.removeClass("dsn");
			$(this).children(".arrow-icon").removeClass("icon-right-arrow");
			$(this).children(".arrow-icon").addClass("icon-up-arrow");
		}
		else
		{
            $item_con.addClass("dsn");
            $(this).children(".arrow-icon").removeClass("icon-up-arrow");
			$(this).children(".arrow-icon").addClass("icon-right-arrow");
		}

	});

//添加按钮
	$(".addBtn").click( function(){
      	// var a = $.trim($(this).siblings(".txt_long").val());
      	var ol = $(this).parent().siblings("ol");
      	var $this = $(this);
      	var order_num = $(this).parent().next().children().length;
      	//核对周报日期是否已填
    	if(checkDates()){
    		//核对项目是否已填
    		if(checkItems()){
	    		//核对是否有周报id，没有发ajax填入隐藏域
	    		if(checkZBid()){
	    			//核对明细项是否有重复
	    			// if(checkDetailsRepeated($this)){
	    				//添加一条发ajax存入数据库
		    			addItemAjax($this)
	    			// }
		    		
	    		}else{
	    			//使文本域失去焦点
	    			$this.siblings(".txt_long").blur();
	    		}
		    }else{
		    	$this.siblings(".txt_long").blur();
		    }
	    }else{
	    	$this.siblings(".txt_long").blur();
	    }
	});

//预览按钮
	$("#previewBtn").click(function(){
		//判断是否有周报id
		var zbid = $.trim($("#zb_id").val());
		if(zbid.length == 0){
			layer.open({
			  type:0,
			  title:'提示',
			  content:'您还未填写周报内容!',
			}); 
		}else{
			// if(checkRequiredItems()){
				renderingPreview(zbid);
			// }

		}
		
	});

//删除图标
	$(document).on("click",".dele-icon",function(){
		var $this = $(this);
		var prtcontentid = $(this).parents(".item_content_row").attr("id"); 
		var prtcontentList = $( ".sortable" ).sortable( "toArray" );

		//发ajax数据库删除
    		if(deleteItemAjax($this,prtcontentid,prtcontentList)){
    			var $items = $(".sortable");
    			$(this).parents(".item_content_row").remove();
    			refreshSort($items);
    		}
	});

//修改图标
	$(document).on("click",".amend-icon",function(){
		var change_cont = $(this).siblings("pre").text();
		console.log(change_cont);
		var change_div = $(this).parents(".item_content_row ").parent("ol").siblings("div");
		var prtcontentid = $(this).parents(".item_content_row").attr("id");

		change_div.children(".txt_long").val(change_cont);
		change_div.children(".txt_long").attr("id",prtcontentid);
		change_div.children(".addBtn").addClass("dsn");
		change_div.children(".changeBtn").removeClass("dsn");
	});

//修改按钮
	$(".changeBtn").click(function(){
		var prtcontentid = $(this).siblings(".txt_long").attr("id");
		var changeOK_cont = $(this).siblings(".txt_long").val().trim();
		var changeOK_loca = $(this).parent("div").siblings("ol").children("#"+prtcontentid).children("div").children("pre");
		var $this = $(this);
		if(changeOK_cont==""){
			layer.open({
				  type:0,
				  title:'提示',
				  content:'修改内容不能为空!',
			});
			$(this).siblings("input").blur();  
		}else{
			//判断明细项内容是否重复
			// if(checkDetailsRepeated($this)){
				if(changeItemAjax($this,prtcontentid)){
					// changeOK_loca.text(changeOK_cont);
					 var newString = $this.siblings(".txt_long").val().trim();
					// newString = newString.replace(/_@/g, '<br/>');
					// newString = newString.replace(/\s/g, '&nbsp;');
					changeOK_loca.html(newString);
					$(this).siblings(".addBtn").removeClass("dsn");
					$(this).addClass("dsn");
					$(this).siblings(".txt_long").val("");
					$(this).siblings(".txt_long").attr("id","");
				}else{
					$(this).siblings(".txt_long").blur();
				}
			// }
		}
	});
//拖动明细项
	$( ".sortable" ).sortable(
		{	axis: "y",
			stop: function(event, ui ) {
				var prtcontentid = $(this).sortable( "toArray" );
				if(sortableAjax(prtcontentid)){
					$items = ui.item.parent();
					refreshSort($items);
				}else{
					$(this).sortable( "cancel" );
					var prtcontentid = $(this).sortable( "toArray" );
					console.log(prtcontentid);
				}	
			}
	});

	//textarea支持tab缩进
    $("textarea").on(
            'keydown',
            function(e) {
                if (e.keyCode == 9) {
                    e.preventDefault();
                    var indent = '    ';
                    var start = this.selectionStart;
                    var end = this.selectionEnd;
                    var selected = window.getSelection().toString();
                    selected = indent + selected.replace(/\n/g, '\n' + indent);
                    this.value = this.value.substring(0, start) + selected
                            + this.value.substring(end);
                    this.setSelectionRange(start + indent.length, start
                            + selected.length);
                }
            });
});

//保存按钮
function save(){
	//确认日期已填
	if(checkDates()){
		//确认项目已填
		if(checkItems()){
    		//新增周报头表
    		checkZBid();
	    }
	}
	 
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
		//判断必填项是否已全部填写
		if(checkRequiredItems()){
			submitAjax();
		}
		
	}
}

////////////////////////////////////////核对方法///////////////////////////////////////
//判断日期是否已填
function checkDates(){
	var date = $.trim($("#prtdata").val());
	
	if(date !== "" ){
		return true;
	}
	else{
		layer.open({
		  type:0,
		  title:'提示',
		  content:'请选择周报日期!',
		}); 
		return false;
	}
}

//判断项目是否已填
function checkItems(){
	var item = $.trim($("#project").val());

	if(item.length == 0){
		layer.open({
		  type:0,
		  title:'提示',
		  content:'请选择项目',
		}); 
		return false;
	}else if(item == "请选择项目"){
		layer.open({
		  type:0,
		  title:'提示',
		  content:'请点击项目的下拉列表，选择具体项目!',
		}); 
		return false;
	}else{
		return true;
	}
}

//判断是否有周报ID
function checkZBid(){
	var zbid = $.trim($("#zb_id").val());
	if(zbid.length == 0){
		if(getZBid()){
			return true;
		}else{
			return false;
		}
	}else{
		return true;
	}
}

//判断必填项是否已填
function checkRequiredItems(){
	var rptitems = $("#a").attr('value');
	var rpt = JSON.parse(rptitems);
	console.log(rpt);
	var flag = true; 

	$.each(rpt,function(index,ele){
		if(ele.isrequire_E.isrequire == 'Y'){
			var $ol = $("#" + ele.rptitemcode).siblings(".item_con").children("ol").html();
			console.log($ol);
			if( $ol==""||$ol==null){
				layer.open({
				  type:0,
				  title:'提示',
				  content:'必填项不能为空，没有内容请填写无!',
				});
				flag = false;
				return false;
			}
		}
		
	});
	return flag;
}

//核对明细项是否重复
function checkDetailsRepeated($this){
	//input框的内容
	var addcont = $.trim($this.siblings(".txt_long").val());
    var $li = $this.parent().siblings("ol").children("li");
    var flag = true; 
    var licont="";
    $li.each(function(index,element){
    	licont = $.trim($(this).children("pre").val());
    	if(addcont == licont){
    		layer.open({
				  type:0,
				  title:'提示',
				  content:'明细项内容重复，请重新填写!',
				});
    		flag = false;
    		return false;
    	}
    })
    return flag;
}

////////////////////////////////////////发ajax请求///////////////////////////////////////
//发ajax请求生成周报ID
function getZBid(){
	var date = $.trim($("#prtdata").val());
	var projectid = $.trim($("#project").val());
	var param = {
			"prtdate" : date,
			"projectid" :projectid
	}; 
	var success = false;
	$.ajax({
		url : "/prt",
		type : "post",
		dataType : "json",
		data : param,
		async: false,
		error : function(){
			layer.alert("系统ajax交互错误!")
		},
		success : function(data) {
			if (data.retflag) {
				//获取到的周报id填入隐藏域
				$("#zb_id").val(data.prtid);
				success = true;
				$("#prtdata").attr("disabled","disabled");
				$("#project").attr("disabled","disabled");
				$("#prtdata").css("cursor","not-allowed");
				$("#project").css("cursor","not-allowed");

			}else {
				layer.alert(data.retmsg);
			}			
		}  
	});
	return success;
}

//新增明细项
function addItemAjax($this){
	var prtcontentdescr = $this.siblings(".txt_long").val().trim();
	// var prtconten = $this.siblings(".txt_long").html();
	// var newString = $this.siblings(".txt_long").val().replace(/\n/g, '_@').replace(/\r/g, '_#');
	// newString = newString.replace(/_@/g, '<br/>');
	// newString = newString.replace(/\s/g, '&nbsp;');
	var prtid = $.trim($("#zb_id").val());
	var prtitemcode = $this.parents(".item_con").siblings(".item_title").attr("id");
	var ol = $this.parent().siblings("ol");
	var order_num = $this.parent().next().children().length;
	var param = {
			"prtcontentdescr" : prtcontentdescr,
			"prtid" : prtid,
			"prtitemcode" : prtitemcode,
			"prtcontentorder": order_num
	}; 
	$.ajax({
		url : "/prtcontent",
		type : "post",
		dataType : "json",
		data : param,
		error : function(){
			layer.alert("系统ajax交互错误!");
			$this.siblings("input").blur();
			
		},
		success : function(data) {
			if (data.retflag) {
				prtcontent = data.prtcontent;

				if(prtcontent instanceof Array) {
					$.each(prtcontent, function(i, prtcontent) {
						ol.append('<li class="item_content_row clearfix" id='+prtcontent.prtcontentid+'>'+
						              	'<span class="order fl"></span>'+
						              	'<div class="order_con fl">'+
						                	'<pre class="item_content_p">'+ prtcontent.prtcontentdescr +'</pre>'+
						                	'<span class="amend-icon"><i class=" iconfont icon-amend"></i></span>'+
						                	'<span class="dele-icon"><i class=" iconfont icon-trash"></i></span>'+
						                '</div>'+
						               '</li>'
						    		);
					})
				}else {
					ol.append('<li class="item_content_row clearfix" id='+prtcontent.prtcontentid+'>'+
					              	'<span class="order fl"></span>'+
					              	'<div class="order_con fl">'+
					                	'<pre class="item_content_p">'+ prtcontent.prtcontentdescr +'</pre>'+
					                	'<span class="amend-icon"><i class=" iconfont icon-amend"></i></span>'+
					                	'<span class="dele-icon"><i class=" iconfont icon-trash"></i></span>'+
					                '</div>'+
					               '</li>'
					    		);
				}
				

				refreshSort(ol);
				//把input清空
				$this.siblings(".txt_long").val("");
			}else {
				layer.alert(data.retmsg);
				$this.siblings(".txt_long").blur();
			}			
		}  
	});
}

//修改明细项
function changeItemAjax($this,prtcontentid){
	// var prtcontentdescr = $.trim($this.siblings(".txt_long").val());
	var newString = $this.siblings(".txt_long").val().trim();
	// newString = newString.replace(/_@/g, '<br/>');
	// newString = newString.replace(/\s/g, '&nbsp;');
	var prtid = $.trim($("#zb_id").val());
	var prtitemcode = $this.parents(".item_con").siblings(".item_title").attr("id");
	var id = prtcontentid;
	// var order_num = $this.parent().next().children().length-1;
	var order_num = $this.parent("div").siblings("ol").children("#"+prtcontentid).index();
	var param = {
			"prtcontentdescr" : newString,
			"prtcontentorder": order_num,
			"prtid": prtid,
			"prtitemcode": prtitemcode
	};
	var success = false;
	$.ajax({
		url : "/prtcontent/" + id,
		type : "put",
		dataType : "json",
		async:false,
		data : param,
		error : function(){
			layer.alert("系统ajax交互错误!");
		},
		success : function(data) {
			if (data.retflag) {
				  console.log(data.retmsg);
				  success = true;
			}else {
				layer.alert(data.retmsg);
			}			
		}  
	});
	return success;
}

//提交时请求提交id
function submitAjax(){
	var prtid = $.trim($("#zb_id").val());
	var param = {
			"prtid" : prtid
	}; 
	$.ajax({
			url : "/prtdc",
			type : "post",
			dataType : "json",
			data : param,
			cache : false,
			error : function(){
				layer.alert("系统ajax交互错误!")
			},
			success : function(data) {
				if (data.retflag) {
					layer.alert(data.retmsg); 
				}else {
					layer.alert(data.retmsg);
				}			
			}  
	});
}
//删除工作内容
function deleteItemAjax($this,prtcontentid,prtcontentList){
	var prtid = $.trim($("#zb_id").val());
	var prtcontentList = prtcontentList;
	var id = prtcontentid;
	var param = {
			"prtcontentList" : prtcontentList,
			"prtid":prtid
	}; 
	var success = false;
	$.ajax({
			url : "/prtcontent/" + id,
			type : "delete",
			dataType : "json",
			data : param,
			async: false,
			error : function(){
				layer.alert("系统ajax交互错误!")
			},
			success : function(data) {
				if (data.retflag) {
					// layer.alert(data.retmsg);
					success = true; 
				}else {
					layer.alert(data.retmsg);
				}			
			}  
	});
	return success;
}

//拖动明细项Ajax
function sortableAjax(prtcontentList){
	var prtid = $.trim($("#zb_id").val());
	var prtcontentList = prtcontentList;
	var param = {
			"prtcontentList" : prtcontentList,
			"prtid":prtid
	}; 
	var success = false;
	$.ajax({
			url : "/prtcontentsDisplayOrder",
			type : "put",
			dataType : "json",
			data : param,
			async: false,
			error : function(){
				layer.alert("系统ajax交互错误!")
			},
			success : function(data) {
				if (data.retflag) {
					console.log(data.retmsg);
					success = true; 
				}else {
					layer.alert(data.retmsg);
				}			
			}  
	});
	return success;
}


////////////////////////////////////////渲染预览页///////////////////////////////////////
function renderingPreview(prtid){
	var layerH = $(window).height() * 4/5;
	layerH = layerH > 800 ? 800 : layerH;

	var windowWidth = $(window).width();
	var layerW = windowWidth * 9/10;
	layerW = windowWidth > 1200 ? 1000 : layerW;
	
	var index = layer.open({
	      type: 2,
	      title: "周报预览",
	      shadeClose: false,
	      shade: true,
	      move: false,
	      maxmin: true,
	      scrollbar: false,
	      area: [layerW + 'px', layerH + 'px'],
	      content: "/prtdt/" + prtid + "?page=true"
	    });

}

function rendering(prt){
	var data = prt;
	var date = data.prtitArr;
	console.log(date);
	$("#prtdata").val(date);
}
//遍历排序
function refreshSort($items){
	var $item= $items.children("li");
	$item.each(function(index, element){
		$(this).children(".order").text("("+($(this).index()+1)+") ");
		console.log($(this).index());
	});
}

