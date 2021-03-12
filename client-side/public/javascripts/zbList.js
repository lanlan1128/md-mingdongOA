////////////////////////////////////////周报列表日历控件//////////////////////////////
//初始化日期（一星期内）
			var now = new Date();
			var nowTime = now.getTime();
			var day = now.getDay();
			var oneDayLong = 24 * 60 * 60 * 1000;

			var MondayTime = nowTime - (day - 1) * oneDayLong;
			var SundayTime = nowTime + (7 - day) * oneDayLong;

			var monday = new Date(MondayTime);
			var sunday = new Date(SundayTime);
			console.log(monday);
			console.log(sunday);
			var inStarDate = Todate(monday);
			var inEndDate = Todate(sunday);
			

//初始化日期（一年内）
// var inStarDate = new Date().getFullYear() + '-01-01';
// console.log(inStarDate);
// var inEndDate = new Date().getFullYear() + 1 + '-01-01';
// console.log(inEndDate);

//开始日期的最大值和最小值
var minStartDate;
var maxStartDate;
//结束日期的最大值和最小值
var minEndDate;
var maxEndDate;
//开始日期、结束日期
var stardate;
var enddate;
$("#start").datepicker({
	language: 'zh-CN',
//				trigger: $(".start-input-group-btn"),
	format: 'yyyy-mm-dd',
	autoPick: 'ture',
	autoHide: 'ture',
	date: new Date(inStarDate),
	startView: 0, //开始界面是显示日期
});
$("#end").datepicker({
	language: 'zh-CN',
//				trigger: $(".end-input-group-btn"),
	format: 'yyyy-mm-dd',
	autoPick: 'ture',
	autoHide: 'ture',
	date: new Date(inEndDate), // Or '02/14/2014'
	startView: 0, //开始界面是显示date
});

//初始化的时候设置开始日期和结束日期的最大最小值
setStartMaxMin();
setEndMaxMin();

//隐藏开始日期的日历选择面板时重置结束日期的max,min
$("#start").on('hide.datepicker', function() {
	setEndMaxMin();
});
//隐藏结束日期的日历选择面板时重置开始日期的max,min
$("#end").on('hide.datepicker', function() {
	setStartMaxMin();
});
//显示开始日期的日历选择面板时重置开始日期的max,min
$("#start").on('show.datepicker',function(){
	setStartMaxMin();
});
//显示结束日期的日历选择面板时重置结束日期的max,min
$("#end").on('show.datepicker',function(){
	setEndMaxMin();
});

//清除按钮
$("#startClearBtn").click(function() {
	var endcont = $("#end").val();
	if(endcont==""){
		layer.open({
			  type:0,
			  title:'提示',
			  content:'开始日期和结束日期不能同时为空!',
			}); 
	}else{
		$("#start").val("");
		setStartMaxMin();
		$("#end").datepicker('setStartDate', new Date("0000-00-00"));
		$("#end").datepicker('setEndDate', new Date("0000-00-00"));
	}
	
});

$("#endClearBtn").click(function() {
	var startcont = $("#start").val();
	if(startcont==""){
		layer.open({
			  type:0,
			  title:'提示',
			  content:'开始日期和结束日期不能同时为空!',
			}); 
	}else{
		$("#end").val("");
		setEndMaxMin();
		$("#start").datepicker('setStartDate', new Date("0000-00-00"));
		$("#start").datepicker('setEndDate', new Date("0000-00-00"));
	}
	
});

//input框获取焦点时，给stardate、enddate赋值
$("#start").focus(function(){
	startdate = $(this).val();
});

$("#end").focus(function(){
	enddate = $(this).val();
});

//手动清空文本框
$("#start").blur(function(){
	var nowStarDate = $("#start").val();
	console.log(nowStarDate);
	if(nowStarDate==""){
		var endcont = $("#end").val();
		if(endcont==""){
			$("#start").val(startdate);
			layer.open({
				  type:0,
				  title:'提示',
				  content:'开始日期和结束日期不能同时为空!',
				}); 
		}else{
			setEndMaxMin();
		}
	}
	
});
$("#end").blur(function(){
	var nowEndDate = $("#end").val();
	console.log(nowEndDate);
	if(nowEndDate==""){
		var startcont = $("#start").val();
		if(startcont==""){
			$("#end").val(enddate);
			layer.open({
				  type:0,
				  title:'提示',
				  content:'开始日期和结束日期不能同时为空!',
				});
		}else{
			setStartMaxMin();
		}
	}
});

//计算此日期的上一年日期
function calLastYear(f) {
	//				var f=$("#start").val();
	var n = new Date(f);
	var formdata = n.getTime() - 365 * 24 * 60 * 60 * 1000;
	var ny = new Date(formdata);
	var result = Todate(ny);
	return result;
}
//计算此日期的下一年日期
function calNextYear(f) {
	//				var f=$("#start").val();
	var n = new Date(f);
	var formdata = n.getTime() + 365 * 24 * 60 * 60 * 1000;
	var ny = new Date(formdata);
	var result = Todate(ny);
	return result;
}

//Todate方法
function Todate(num) { //Fri Oct 31 18:00:00 UTC+0800 2008
	num = num + "";
	var date = "";
	var month = new Array();
	month["Jan"] = 01;
	month["Feb"] = 02;
	month["Mar"] = 03;
	month["Apr"] = 04;
	month["May"] = 05;
	month["Jun"] = 06;
	month["Jul"] = 07;
	month["Aug"] = 08;
	month["Sep"] = 09;
	month["Oct"] = 10;
	month["Nov"] = 11;
	month["Dec"] = 12;
	var week = new Array();
	week["Mon"] = "一";
	week["Tue"] = "二";
	week["Wed"] = "三";
	week["Thu"] = "四";
	week["Fri"] = "五";
	week["Sat"] = "六";
	week["Sun"] = "日";
	str = num.split(" ");
	date = str[3] + "/";
	date = date + month[str[1]] + "/" + str[2];
	console.log(date);
	return date;
}
//设置结束日期最大最小值方法
function setEndMaxMin() {
	//获取实际开始日期
	var nowStarDate = $("#start").val();
	console.log(nowStarDate);
	//如果实际开始日期不为0，结束日期的最小值为实际开始日期的值nowStarDate，结束日期的最大值为实际开始日期下一年的值
	if(nowStarDate !== "") {
		minEndDate = nowStarDate;
		maxEndDate = calNextYear(nowStarDate);
		console.log(minEndDate);
		console.log(maxEndDate);
		//设置结束日期的最大值和最小值
		$("#end").datepicker('setStartDate', new Date(minEndDate));
		$("#end").datepicker('setEndDate', new Date(maxEndDate));
	} else {
		var nowEndDate = $("#end").val();
		console.log(nowEndDate);
		if(nowEndDate == "") {
			$("#end").datepicker('setStartDate', new Date("0000-00-00"));
			$("#end").datepicker('setEndDate', new Date("0000-00-00"));
			$("#start").datepicker('setStartDate', new Date("0000-00-00"));
			$("#start").datepicker('setEndDate', new Date("0000-00-00"));
		}else{
			$("#end").datepicker('setStartDate', new Date("0000-00-00"));
			$("#end").datepicker('setEndDate', new Date("0000-00-00"));
		}
	}

}
//设置开始日期最大最小值方法
function setStartMaxMin() {
	//获取实际结束日期
	var nowEndDate = $("#end").val();
	console.log(nowEndDate);
	//如果实际结束日期不为0，开始日期的最大值为实际结束日期的值nowEndDate，开始日期的最小值为实际结束日期前一年的值
	if(nowEndDate !== "") {
		maxStartDate = nowEndDate;
		minStartDate = calLastYear(nowEndDate);
		console.log(maxStartDate);
		console.log(minStartDate);
		//设置开始日期的最大值和最小值
		$("#start").datepicker('setStartDate', new Date(minStartDate));
		$("#start").datepicker('setEndDate', new Date(maxStartDate));
	} else {
		var nowStarDate = $("#start").val();
		console.log(nowStarDate);
		if(nowStarDate == "") {
			$("#end").datepicker('setStartDate', new Date("0000-00-00"));
			$("#end").datepicker('setEndDate', new Date("0000-00-00"));
			$("#start").datepicker('setStartDate', new Date("0000-00-00"));
			$("#start").datepicker('setEndDate', new Date("0000-00-00"));

		}else{
			$("#start").datepicker('setStartDate', new Date("0000-00-00"));
			$("#start").datepicker('setEndDate', new Date("0000-00-00"));
		}
	}

}
////////////////////////////////////////周报列表js//////////////////////////////

//定义被选中下载的周报日期
	var zbDate;
//定义存放周报id的数组
	var arr = new Array(); 

$(document).ready(function() {
	 
	console.log($("#w").val())
	layout();

	//查询周报列表
	query();

	//预览[已提交]按钮
	$(document).on("click",".preSubmittedBtn",function(){
		var RPTID = $(this).parents("li").attr('id');
		//周报明细表（提交）详情提取ajax
		previewSubmitExtract(RPTID);
	});
	$(document).on("click",".preEditBtn",function(){
		var RPTID = $(this).parents("li").attr('id');
		//周报明细表（提交）详情提取ajax
		previewEditExtract(RPTID);
	});
	
	//点击隐藏显示昵称下拉框
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

	//勾选需要下载的周报
	$(document).on("click",".checkbox",function(){
		console.log($(this).is(':checked'));
		var $item = $(this).parents(".listCss").children("li");
		var $this = $(this);
		// var zbnewDate = $(this).siblings(".zbTime").text();
		var submark = $(this).val();
		//判断是勾选还是取消勾选
		if($(this).is(':checked')){
			//判断周报是否已提交
			if(submark=="V"){
				//判断周报日期是否一致
				whetherZbdateIsSame($this);
			}else{
				$(this).prop("checked", false);
					layer.open({
				  		type:0,
				  		title:'提示',
				  		content:'此周报尚未提交，不能勾选下载!',
					}); 
			}
			//遍历列表，如果勾选数量等于列表数量，自动勾选全选
			eachListAutoAllcheck($item);
		}else{
			$("#zbcheckAll").prop("checked", false);
			//遍历列表，若被勾选数目为0，清空zbDate、arr
			eachListClear($item);
		}
	});

	//点击批量下载按钮
	$(".downloadBtn").click(function(){
		$(".listarr").empty();
		$(".downDate").val(zbDate);
		arr=[];
		var count = 0;
		var $item = $(this).parent().siblings("ul").children("li");
		$item.each(function(index,element){
			if($(this).children("input").is(':checked')){
				var zbid = $(this).attr('id');
				$(".listarr").append(
						'<input class="dawnArr" type="hidden" name="prtidList['+count+']" value='+zbid+'>'
					)
				arr.push(zbid);
				count++;
			}
		});
		console.log(arr);
		if(count==0){
			layer.open({
				  		type:0,
				  		title:'提示',
				  		content:'你还未选择需要下载的周报!',
					});
		}else{
			$("#down-form").submit();
		}
	});


	//点击全选checkbox
	$('#zbcheckAll').click(function(){
		var $item = $(this).parent().siblings("ul").children("li");
		//判断是选取还是取消选中
		if($(this).is(':checked')){
			//判断周报列表里是否有尚未提交的周报
			if(checkSubmark($item)){
				//判断列表是否只有一个周报,若只有一个，选中
				if(whetherListHasOnlyOne($item)){
					$("input[type='checkbox']").prop("checked",true); 
					 zbDate = $(".listCss").children("li").children(".zbTime").text();
				}else{
					//当周报不止一个时，遍历周报时间是否一致
					eachListZbdateIsSame($item);
				}
			}else{
				$("input[type='checkbox']").prop("checked", false);
			}
		}else{
			//若为取消选中，取消全选，form表单清空
			$("#zbcheckAll").removeAttr("checked"); 
			$("input[type='checkbox']").prop("checked",false); 
			zbDate = "";
			$(".downDate").val(zbDate);
			$(".listarr").empty();
		}
	});

});

////////////////////////////////////////发ajax请求//////////////////////////////

//查询周报列表
function query() {
	//清空列表
	$('#prtList').empty();
	$('.reminder').empty();
	zbDate="";
	$(".downDate").val(zbDate);
	$(".listarr").empty();

	var RPTBEGINDATE = $("#start").val();
	var RPTENDDATE = $("#end").val();
	var projectid = $("#project").val();
	var memberid = $("#numbers").val();
	console.log(memberid);
	if(memberid==undefined){
		if (projectid == "全部") {
			var param = {
			prtdateBegin: RPTBEGINDATE,
			prtdateEnd: RPTENDDATE
	   		}
		}else {
			var param = {
			prtdateBegin: RPTBEGINDATE,
			prtdateEnd: RPTENDDATE,
			projectid: projectid
		   }
		}
	}else{
		if (projectid == "全部") {
			var param = {
			prtdateBegin: RPTBEGINDATE,
			prtdateEnd: RPTENDDATE,
			memberid: memberid
	   		}
		}else {
			var param = {
			prtdateBegin: RPTBEGINDATE,
			prtdateEnd: RPTENDDATE,
			projectid: projectid,
			memberid: memberid
		   }
		}
	}
	
	$.ajax({
		url: "/prts",
		type: "get",
		dataType: "json",
		data: param,
		cache: false,
		error: function() {
			layer.alert("系统ajax交互错误!")
		},
		success: function(data) {
			if (data.retflag) {
				console.log(data.prtList.length);
				if(data.prtList.length==0){
					var $p=$('<p class="" >没有查到符合条件的周报 !</p>');
					$('.reminder').append($p);
					$('.bottomBtn').addClass('dsn');
				}else{
					//移除reminder
					$('.reminder').empty();
					
					
					$.each(data.prtList,function(index,prt){
						var a="";
						if(prt.rptcommit_E.rptcommitind=="V"){
							a='('+ prt.rptcommittime.substring(0,10) +')';
						}
						if(prt.editabled){
							var $li = $('<li class="listItem clearfix" id=' + prt.rptid + '>' +
											'<input class="fl checkbox" type="checkbox" id="zbcheck' + index + '" value="' + prt.rptcommit_E.rptcommitind +'"/>'+
											'<label class="fl zbName" for="zbcheck' + index + '">' + prt.rptname + '</label>' +
											'<div class="fr zbTime">' + prt.rptdate + '</div>' +
											'<a class="subMark fr" href="javascript:return false;">'+ prt.rptcommit_E.name + a +'</a>'+
											'<div class="fr list_Button">' +
												'<a class="preSubmittedBtn cssBtn">' +( a!=""?'预览[已提交]':'')+'</a>' +
												'<a class="preEditBtn cssBtn">预览[编辑]</a>' +
												'<a class="editBtn cssBtn" href="/editzb/' + prt.rptid + '">编辑</a>' +
											'</div>' +
										'</li>');
						}else{
							var $li = $('<li class="listItem clearfix" id=' + prt.rptid + '>' +
											'<input class="fl checkbox" type="checkbox" id="zbcheck' + index + '" value="' + prt.rptcommit_E.rptcommitind +'"/>'+
											'<label class="fl zbName" for="zbcheck' + index + '">' + prt.rptname + '</label>' +
											'<div class="fr zbTime">' + prt.rptdate + '</div>' +
											'<a class="subMark fr" href="javascript:return false;">'+ prt.rptcommit_E.name + a +'</a>'+
											'<div class="fr list_Button">' +
												'<a class="preSubmittedBtn cssBtn">'+(a!=""?'预览':'')+'</a>' +
												// '<a class="unablePre" href ="javascript:return false;"></a>' +
												// '<a class="unableClick" href ="javascript:return false;"></a>' +
											'</div>' +
										'</li>');
						}
						$('#prtList').append($li);
						$('.bottomBtn').removeClass('dsn');
						$("#zbcheckAll").prop("checked", false);
					});
				}
					
			} else {
				console.log(data.retmsg);
			}
		}
	});
}

//周报明细表（提交）详情预览
function previewSubmitExtract(prtid) {
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
	      content: "/prtdc/" + prtid + "?page=true"
	    });
}
//周报明细表（个人编辑）详情预览
function previewEditExtract(prtid) {
	var layerH = $(window).height() * 4/5;
	var windowWidth = $(window).width();
	var layerW = windowWidth * 9/10;
	layerH = layerH > 800 ? 800 : layerH;
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


////////////////////////////////////////设置页面高度//////////////////////////////

$(window).resize(function() {
	layout();
})

function layout() {
	var aheight = $(window).height()-$('#header').height() - 20;
	// var conHeight = aheight-140;
	// console.log($(window).height());
	// console.log(aheight);
	// $(".body").css("min-height", aheight);
	$(".content").css("min-height", aheight);
	$('.body').removeClass('dsn');
}

//////////////////////////////////////勾选下载周报的一些判断方法////////////////////////////

//判断被勾选的周报日期是否一致
function whetherZbdateIsSame($this){
	var zbnewDate = $this.siblings(".zbTime").text();
	if(zbDate==""||zbDate==undefined){
		zbDate = zbnewDate;
	}else if(zbDate===zbnewDate){

	}else{
			$this.prop("checked", false);
			layer.open({
		  		type:0,
		  		title:'提示',
		  		content:'只能选择日期相同的周报!',
			}); 
	}
}

//遍历列表,勾选数量和列表数量相等，自动勾选全选
function eachListAutoAllcheck($item){
	var count1=0;//列表数
	var count2=0;//被选中的周报数
	$item.each(function(index,element){
		count1=index;
		count1++;
		if($(this).children("input").is(':checked')){
			count2++;
		}
	});
	if(count1==count2){
		$("#zbcheckAll").prop("checked", true);
	}
}
//遍历列表，若被勾选数目为0，清空zbDate、arr
function eachListClear($item){
	var count=0;
	$item.each(function(index,element){
		if($(this).children("input").is(':checked')){
			count++;
		}
	});
	if(count==0){
		zbDate="";
		arr = [];
	}
}

//////////////////////////////////////全选下载周报的一些判断方法////////////////////////////

//判断列表中是否有未提交的周报
function checkSubmark($item){
	var flag = true;
	$item.each(function(index,element){
		if($(this).children("input").val()=="I"){
			flag = false;
			layer.open({
			  	type:0,
			  	title:'提示',
			  	content:'列表中含有尚未提交的周报，请提交后再全选下载!',
			});
			return false;
		}
		
	});
	return flag;
}

//判断列表是否只有一个周报
function whetherListHasOnlyOne($item){
	var count=0;
	var flag = true;
	$item.each(function(index,element){
		count=index;
		count++;
	});
	if(count==1){
		
	}else{
		flag = false;
	}
	return flag;
}

//全选时，遍历周报列表判断时间是否一致
function eachListZbdateIsSame($item){
	var $itemDate;
	$item.each(function(index,element){
		if($itemDate==""||$itemDate==undefined){
			$itemDate = $(this).children(".zbTime").text();
			zbDate = $itemDate;
			$(this).children("input").prop("checked","true"); 

		}else if($itemDate !== $(this).children(".zbTime").text()){
			//若不一致，弹框提示，清空form表单数据
			$(".listarr").empty();
			zbDate = "";
			$(".downDate").val(zbDate);
			$("input[type='checkbox']").prop("checked", false);
			layer.open({
			  	type:0,
			  	title:'提示',
			  	content:'请选择相同时间的周报才可以全选!',
			});
			//跳出遍历
			return false;
		}else{
			//若都一致，选中
			$(this).children("input").prop("checked","true"); 
		}
	});
}