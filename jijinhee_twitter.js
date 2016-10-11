

// ___________________ telegram bot ___________________
var USER = '560xxxxx';	// 텔레그램에서 알림을 보낼 사용자의 아이디나, 채널명
var token = '200000000:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';	// 텔레그램 API 토큰

var TelegramBot = require('node-telegram-bot-api');
var bot = new TelegramBot(token, {polling: false});



// ___________________ twitter api ___________________
var TwitterPackage = require('twitter');

var secret = {
	consumer_key: 'AAAAAAAAAAAAAAAAAAAAAAAAA',
	consumer_secret: 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
	access_token_key: 'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC',
	access_token_secret: 'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD'
};

var Twitter = new TwitterPackage(secret);


function push_channel(text) {
	
	var opt = {
	  disable_web_page_preview: true,
	  parse_mode: "HTML"  
	};

	bot.sendMessage(USER, text, opt);			
	console.log(text);
}

// ___________________ twitter stream ___________________

// 20개의 트윗이 30초 내에 발생했다면 알림을 주도록 설정
var threshold_count = 20;
var threshold_time = 30;

var list = [];
var last_twitter_time = 0;

// 트위터 API 로 '지진' 에 관한글을 모니터링 합니다.
var stream = Twitter.stream('statuses/filter', {track: '지진'});
stream.on('data', function(event) {

	// 지진관련 트윗이 아닌 것들을 가려 내기 위해서 몇가지 조건으로 체크합니다.
	if (event.text.indexOf('RT') != -1) {
		return;
	}
	
	if (event.text.indexOf('http') != -1) {
		return;
	}

	if (20 < event.text.length) {
		return;
	}

	// 한 사람이 도배하는 것을 걸러내기 위해서 체크합니다.
	for (var i=0; i < list.length; i++) {
		if (list[i].user == event.user.screen_name) {
			return;
		}
	}
	
	var data = {
		"time":		new Date().getTime(),
		"created":	event.created_at,
		"user":		event.user.screen_name,
		"text":		event.text,
	};
	
	list.push(data);
	
	var tt  = "\n" + event.created_at + "  -  @" + event.user.screen_name + " : " + event.text + "\n\n";
	console.log(tt);
	// console.log(event);
	
	if (threshold_count <= list.length)
	{
		var last = list[list.length-1];
		var first = list[0];
		var elapsed = (last.time - first.time) / 1000;	// 최종 threshold_count 개의 트윗의 경과 시간
		console.log("elapsed : " + elapsed);
		
		if (elapsed <= threshold_time)
		{
			var elapsed_ing = (last.time - last_twitter_time) / 1000;	// 
						
			if (last_twitter_time == 0 || (3600 < elapsed_ing)) {
				// 처음 알림 상황이거나, 이전 알림 발생 후 1시간 이후에 다시 
				console.log("--------------------------------");
				console.log("twitter earthquake");
				console.log("--------------------------------");

				var text = "트위터 지진 관련 " + list.length + " 개의 트윗 + (" + elapsed + "초)";
				
				for (var i=0; i < list.length; i++) {
					var l = list[i];
					var t = l.text.split("\n")[0];
					text += "\n" + t;
				}

				push_channel(text);
			} else {
				console.log("twitter ing..")
			}
			last_twitter_time = new Date().getTime();
		}
		
		list.splice(0,1);	// 최종 threshold_count 개수 만큼 유지하기 위해
	} else {
		console.log("list.length : " + list.length);
	}
});
 
stream.on('error', function(error) {
	console.log("twitter error : ");
});


