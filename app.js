var express = require('express');
var path = require('path');
var io = require('socket.io');
var router = express.Router();

var app = express();
var server = require('http').Server(app);

var qrCode = require('qrcode-npm');
var uuid = require('node-uuid');

app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

//静态资源目录
app.use(express.static('public'));

//创建socket服务
var socketIO = io(server);
//房间用户名单
var roomInfo = {}

socketIO.on('connection',function(socket){
	//获取请求建立socket链接的url
	//http://localhost:3000/room/room_1,rommId为room_1
	var url = socket.request.headers.referer;
	var roomID = "room";
	var user = '';

	socket.on('join',function(userName){
		user = userName;
		//将用户昵称加入到房间名单中
		if(!roomInfo[roomID]){
			roomInfo[roomID] = [];
		}
		roomInfo[roomID].push(user);
		socket.join(roomID);//加入房间
		//通知房间内人员
		socketIO.to(roomID).emit('sys',user+'进入了房间',roomInfo[roomID]);
		console.log(user + '加入了' + roomID);

	})
	socket.on('leave',function(){
		socket.emit('disconnect');
	})
	socket.on('disconnect', function () {
    	// 从房间名单中移除
    	var index = roomInfo[roomID].indexOf(user);
    	if (index !== -1) {
      		roomInfo[roomID].splice(index, 1);
    	}

    	socket.leave(roomID);    // 退出房间
    	socketIO.to(roomID).emit('sys', user + '退出了房间', roomInfo[roomID]);
    	console.log(user + '退出了' + roomID);
  	});
  	//接收用户消息，发送相应的房间
  	socket.on('message',function(msg){
  		//验证如果用户不在房间则不给发送
  		if(roomInfo[roomID].indexOf(user) === 1){
  			return false;
  		}
  		socketIO.to(roomID).emit('msg','user',msg);
  	});

});

//room page
router.get('/room/:roomID',function(req,res){
	var roomID = req.params.roomID;
	//渲染页面数据（见views/room.hbs)
	res.render('room',{
		roomID:roomID,
		users:roomInfo[roomID]
	});
});

app.use('/',router);

server.listen(3000,function(){
	console.log('server listening on port 3000')
})