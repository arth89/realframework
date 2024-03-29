
/**
 * Module dependencies.
 */
/* author : 이한솔 김상훈 김원석 노원우 */
//git test
var express = require('express')
    ,socketio=require('socket.io')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
    ,util=require('./routes/util')
    ,room=require('./routes/room')
    , config = require('./config');
console.log(config.config);
var app = express();
var RedisStore = require('connect-redis')(express);
var redis=new RedisStore({host:'yog.io',pass:'ekfrrhrl0'});
app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  //app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({store: redis, secret: "team real" })); //이 두줄은 항상 app.router앞에 있어야함
  app.use(function(req, res, next) {
     if(req.session==undefined){
        req.session.loginUser={};
     }
     res.locals.session = req.session
     next();
  });
  app.use(app.router);

  app.use(express.static(path.join(__dirname, 'public')));

});
app.configure('development', function(){
  app.use(express.errorHandler());
});
var server=http.createServer(app).listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
});
var io=socketio.listen(server);
var roomJson={};
function addRoom(roomName){
    if(roomJson[roomName]==undefined){
        roomJson[roomName]={name:roomName,maxUser:4,makeTime:'',userList:{}};
        io.sockets.emit('roomAdded',{roomName:roomName});
    }
}
var player={};
var loginUserList = {};
io.on('connection',function(socket){
    console.log('connection: user connected');
    socket.on('disconnect',function(){
       socket.get('room',function(err,room){
           console.log('connection: user disconnected(room:'+room+')');
           if(room!=null){
               console.log(socket.id);

               console.log(roomJson[room].userList);
               io.sockets.in(room).emit('leaveUser',{socketId:socket.id,user:roomJson[room].userList[socket.id]});
               delete roomJson[room].userList[socket.id];
           }
       });
    });
    socket.on('signIn',function(loginUser){
        var id=loginUser.id;
        console.log('user: set user '+id);
        loginUserList[id] =  loginUser;
        console.log(loginUserList);
    });
    socket.on('makeRoom',function(roomName){
        addRoom(roomName);

    });
    socket.on('joinRoom',function(data){
        var roomName=data.roomName;
        var id=data.id;
        if(roomJson[roomName]==undefined){
            console.log('해당 방 없음');
            //addRoom(roomName);
        }else{
            socket.set('room',roomName);
            socket.join(roomName);
            roomJson[roomName].userList[socket.id]=loginUserList[id];
            console.log('방의 유저'+id);
            console.log(roomJson[roomName].userList);
            io.sockets.in(roomName).emit('joinUser',{socketId:socket.id,user:loginUserList[id]});
        }

    });
    socket.on('leaveRoom',function(data){
        console.log('퇴장');
        console.log('퇴장할 방'+data);
        socket.leave(data);
    });
    //이벤트 스코어
    ////////원석//////////////
    //스코어
    socket.on('scoreClient', function(data){
        console.log('client send data:', data);

        var nowRoom=player[data.room];
        if(nowRoom==undefined){
            player[data.room]={};
        }
        var nowPlayer=player[data.room]['player'+data.name];
        if(nowPlayer==undefined){
            var newPlayer=data;

            player[data.room]['player'+data.name]=newPlayer;
            nowPlayer=newPlayer;
        }else{
            nowPlayer.score=parseInt(nowPlayer.score)+parseInt(data.score);
        }

        player[data.room]['player'+nowPlayer.name]=nowPlayer;
        console.log(player)
        io.sockets.in(data.room).emit('scoreServer', nowPlayer);
    });
    //이벤트
    socket.on('eventClient', function(data){
        console.log('client send data:', data);

        io.sockets.in(data.room).emit('eventServer', data);
    });


    ///채팅
    socket.on('message', function(data){
         if(data.type == 'public')
        {
            io.sockets.in(data.room).emit('message', data);
        }
        else
        {
            //귓속말 처리
            //귓속말 한 사람에게
            data.dir=1;
            console.log('귓말');
            console.log(data);
            io.sockets.sockets[data.name].emit('whisper', data);
            //귓속말 받을 사람에게
            data.dir=0;
            io.sockets.sockets[data.type].emit('whisper', data);
        }
    });
});
app.get('/', routes.index);
app.get('/users', user.list);
app.post('/user/login',function(req,res){

   req.session.loginUser={id:req.body.id};
   req.session.loginId=req.body.id;
   res.send(req.session.loginUser);
});
app.post('/user/getLoginUser',function(req,res){
    res.send(req.session.loginUser);
});
app.get('/roomList',function(req, res){
    res.render('roomList', { title: 'RoomList',roomList:JSON.stringify(roomJson)});
});
app.get('/room/:name',function(req,res){
    //var roomId=req.params.id;
    var roomName=req.params.name;

    res.render('room', { title: 'Room:'+roomName,roomName:roomName});

});
app.post('/room/getInitialUserList',function(req,res){
   var roomName=req.body.roomName;
    if(roomJson[roomName]!=undefined){
        res.send(roomJson[roomName].userList);
    }else{
        res.send({});
    }


});
app.get('/sendMessageTo/:roomName',function(req,res){
    //var roomId=req.params.id;
    var roomName=req.params.name;
    io.sockets.in(roomName).emit('roomMessage','messageTo:'+roomName);
    res.send('sendMessage');
});

