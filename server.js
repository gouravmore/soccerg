var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);

var players = {};
var star = {
  x: 600,
  y: 300
};
var scores = {
  blue: 0,
  red: 0
};

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
  console.log('a user connected: ', socket.id);
  // create a new player and add it to our players object
  players[socket.id] = {
    rotation: 0,
    x: Math.floor(Math.random() * 700) + 50,
    y: Math.floor(Math.random() * 500) + 50,
    playerId: socket.id,
    team: (Math.floor(Math.random() * 2) == 0) ? 'red' : 'blue'
  };
  // send the players object to the new player
  socket.emit('currentPlayers', players);
  // send the star object to the new player
  socket.emit('starLocation', star);
  // send the current scores
  socket.emit('scoreUpdate', scores);
  // update all other players of the new player
  socket.broadcast.emit('newPlayer', players[socket.id]);

  // when a player disconnects, remove them from our players object
  socket.on('disconnect', function () {
    console.log('user disconnected: ', socket.id);
    delete players[socket.id];
    // emit a message to all players to remove this player
    io.emit('disconnect', socket.id);
  });

  // when a player moves, update the player data
  socket.on('playerMovement', function (movementData) {
    players[socket.id].x = movementData.x;
    players[socket.id].y = movementData.y;
    players[socket.id].rotation = movementData.rotation;
    // emit a message to all players about the player that moved
    socket.broadcast.emit('playerMoved', players[socket.id]);
  });

  socket.on('starCollected', function () {
    // if (players[socket.id].team === 'red') {
    //   scores.red += 10;
    // } else {
    //   scores.blue += 10;
    // }
    if(Math.round(players[socket.id].rotation) > 0){
      if(Math.abs(players[socket.id].y - star.y) <= 5){
        // left
        star.x = players[socket.id].x;
        star.y = players[socket.id].y - 60;
      }
      if(Math.abs(players[socket.id].x - star.x) <= 5){
        // left
        star.x = players[socket.id].x - 60;
        star.y = players[socket.id].y;
      }
    }
    else if (Math.round(players[socket.id].rotation) === 0){
      if(Math.abs(players[socket.id].y - star.y) <= 5){
        // right
        star.x = players[socket.id].x + 60;
        star.y = players[socket.id].y;
      }     
      if(Math.abs(players[socket.id].x - star.x) <= 5){
        // left
        star.x = players[socket.id].x;
        star.y = players[socket.id].y + 60;
      } 
    }else{
      if(Math.abs(players[socket.id].y - star.y) <= 5){
        // right
        star.x = players[socket.id].x;
        star.y = players[socket.id].y - 60;
      } 
      if(Math.abs(players[socket.id].x - star.x) <= 5){
        // left
        star.x = players[socket.id].x + 60;
        star.y = players[socket.id].y;
      }
    }
    
    console.log(players)
    console.log(star)
    io.emit('starLocation', star);
    if( ((star.x <= 180) && ((star.y >= 320) || (star.y <= 410))) || ((star.x >= 1000) && ((star.y <= 410) || (star.y >= 320)))){
      if (players[socket.id].team === 'red' && (star.x >= 180)) {
        scores.red += 10;
      } else {
        scores.blue += 10;
      }
      io.emit('scoreUpdate', scores);
      star.x = 600;
      star.y = 300;
      io.emit('starLocation', star);
    }
    if(star.x <= 180 || star.x >=1000){
      star.x = 600;
      star.y = 300;
      io.emit('starLocation', star);
    }
  });
});

server.listen(process.env.PORT || 5000)
