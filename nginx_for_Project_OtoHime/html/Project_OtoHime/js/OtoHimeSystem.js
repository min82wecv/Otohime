$(document).ready(function(){
	const ap = musicGenius.init();
	musicGenius.systemBootOn(ap);
	// musicGenius.removeMusic(ap);
})

var musicGenius = {

	URL_API:'http://music.163.com/song/media/outer/url?id=',

	COVER_SIZE:'?param=200x200',

	MP3:'.mp3',

	// 启动函数
	systemBootOn:function(ap){
		InitLive2D();
	    $("#main_body").Tdrag();
	    musicGenius.playMusic(ap);
	    //开局就监听看板娘
		musicGenius.Hover();
		musicGenius.buttonControl(ap);
	},
	// 构造函数
	/*
		默认添加了三首纯音乐，可以通过看板娘进行切换
	*/
	init:function(){
		var ap = new APlayer({
			container:document.getElementById("APlayer"),
			autoplay:true,
			theme:'#FADFA3',
			//maxHeight:不要添加，不然列表显示/隐藏不会有transition: all .5s ease
			lrcType:1,
			audio:defaultAudios
		});
		return ap;
	},

	// 点歌函数
	playMusic:function(ap){
		$("#playMusic").click(function(){
			let musicName = $("#musicName").val();
			if(musicName=='')
			{
				showMessage("您点的歌如人生一样，空空如也呢~带上歌名歌手一起搜索吧~",5000);
			}
			else
			{
				$.ajax({
					data:{
						s:$("#musicName").val(),
						type:1,
						limit:1
					},
					dataType:'json',
					type:'GET',
					url:"http://localhost/getMusic/", //如果要别人也访问，要写成IP，不可以localhost
									  //否则看板娘会加载不出，点歌也无效。
					success:function (data) 
					{
						/*				提取
							url         ====>       [index].id,
							name        ====>       [index].name,
							artist      ====>       [index].artists[index].name,
							cover       ====>       [index].album.blurPicUrl
						*/
						//写成数组的形式因为最初是批量返回符合的歌曲
						var urls = [];var names = [];var artists = [];var covers = [];var lrcs = [];var audios = [];
						for (var i = 0 ; i < data.result.songs.length ; i++)
						{
							urls[i] = musicGenius.URL_API+data.result.songs[i].id+musicGenius.MP3;
							names[i] = data.result.songs[i].name;
							covers[i] = data.result.songs[i].album.blurPicUrl+musicGenius.COVER_SIZE;
							for (var j = 0 ; j < data.result.songs[i].artists.length  ; j++)
							{
								artists[i] = data.result.songs[i].artists[j].name;
							}
							//为了提取Lyric而再次发起ajax请求
							$.ajax
							({
								data:{id:data.result.songs[i].id},
								dataType:'json',
								type:'GET',
								url:'http://localhost/getLyric/',
								async:true,//如果是批量返回异步必须是false，不然for循环永远是最后一次结果
								success:function(res){
									lrcs[i] = res.lyric;				
								}
							})
							// 封装audio对象进audios数组
							// 属性：name , url , artist , cover , lrc
							audios[i] = 
							{
								name : names[i],
								url : urls[i],
								artist : artists[i],
								cover : covers[i],
								lrc : lrcs[i]
							}
						}
						/*
						  清除之前所有歌曲,再添加新歌曲，不然ap.toggle()会有bug【连续调用2次】
						  修复了开发包底层的'ap.list.clear()'BUG
						*/
						// ap.list.clear();现在改为添加歌曲，而不是搜索出符合的歌
						ap.list.add(audios);
						ap.play();
						//防止在看板娘停止播放按钮显示的状态下点歌后，歌曲在播放，按钮任然是glyphicon-play
						if($(".changeable").hasClass("glyphicon-play"))	
						{
							$(".changeable").removeClass("glyphicon-play");
						}
						$(".changeable").addClass("glyphicon-pause");			
		            }
				});						
			}
				
		})
	},
	/*看板娘播放按钮&暂停的切换以及Aplayer的按钮&暂停*/
	buttonControl:function(ap){
		//将未播放状态的stop按钮变为正在播放的按钮
		$(".changeable").removeClass("glyphicon-stop");
		$(".changeable").addClass("glyphicon-pause");
		//ap的播放与暂停的切换
		$(".aplayer-button").click(function(){
			//看板娘的图标与ap的图标一致
			if(ap.audio.paused)
			{
				if($(".changeable").hasClass("glyphicon-play"))
				{
					$(".changeable").removeClass("glyphicon-play");
				}
		 		$(".changeable").addClass("glyphicon-pause");
		 	}
		 	else
		 	{
		 		if($(".changeable").hasClass("glyphicon-pause"))
		 		{
		 			$(".changeable").removeClass("glyphicon-pause");
		 		}
		 		$(".changeable").addClass("glyphicon-play");
		 	}
		})
		//看板娘播放与暂停的切换
		$("#play_controller").click(function(){
			//看板娘的图标与ap的图标一致
			if(ap.audio.paused)
			{
				if($(".changeable").hasClass("glyphicon-play"))
				{
					$(".changeable").removeClass("glyphicon-play");
				}
		 		$(".changeable").addClass("glyphicon-pause");
		 	}
		 	else
		 	{
		 		if($(".changeable").hasClass("glyphicon-pause"))
		 		{
		 			$(".changeable").removeClass("glyphicon-pause");
		 		}
		 		$(".changeable").addClass("glyphicon-play");
		 	}
		 	ap.toggle();
		 });
		//上一首与下一首
		$("#back_controller").click(function(){
			ap.skipBack();
		});
		$("#forward_controller").click(function(){
			ap.skipForward();
		});
		//音量的调节
		$("#volume_up").click(function(){
			ap.volume(ap.volume()+0.1,true);
		});
		$("#volume_down").click(function(){
			ap.volume(ap.volume()-0.1,true);
		});
		$("#volume_off").click(function(){
			ap.volume(0,true);
		});
		//音乐搜索的浮现
		$("#music_inlet").click(function(){
			$("#search_group").fadeIn();
		})
		$("#musicName").click(function(){
			showMessage("据说带上歌名歌手一起搜索效率会高哦~",5000);
		})
	},
	Hover:function(){
		$("#main_body").hover
		(
			function()
			{
				$("#music_controller_right_group").fadeIn();
				$("#music_controller_group").fadeIn();
			},
			function()
			{
				$("#music_controller_right_group").fadeOut();
				$("#music_controller_group").fadeOut();
				//鼠标离开的同事也让音乐搜索消失
				$("#search_group").fadeOut();
			}
		);
	},
	// removeMusic:function(ap){
	// 	$(".removeMusic").on("click",function(){
	// 		let index = $(this).prevAll()[1].innerText;
	// 		//下标从0开始。显示是从1开始
	// 		ap.list.remove(index-1);
	// 	})
	// }
}

var defaultAudios = 
[
	{
		name:'A Tiny Love',
		artist:'梶浦由記',
		url:musicGenius.URL_API+'26491718'+musicGenius.MP3,
		cover:'http://p1.music.126.net/eiOJodIOugVqdk4-wBRcmA==/2394736325356374.jpg'+musicGenius.COVER_SIZE,
		lrc:'[00:00.00]纯音乐，请说出你的故事'
	},
	{
		name:'流れる涙は決意と共に',
		artist:'橋本由香利',
		url:musicGenius.URL_API+'574924068'+musicGenius.MP3,
		cover:'http://p1.music.126.net/95ziIb67FzXVUurlx4X-3A==/109951163378427142.jpg'+musicGenius.COVER_SIZE,
		lrc:'[00:00.00]纯音乐，请说出你的故事'
	},
	{
		name:'Astral Requiem',
		artist:'山下直人',
		url:musicGenius.URL_API+'28815583'+musicGenius.MP3,
		cover:'http://p2.music.126.net/KdBR3RRuHzFRCx_X_0eP2g==/3294136838291294.jpg'+musicGenius.COVER_SIZE,
		lrc:'[00:00.00]纯音乐，请说出你的故事'
	}			
]

