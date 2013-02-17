var timestep_length = 100;
var game_board;

var game_objects = {};
var obj_id = 0;

function generateObjectID(){
	return obj_id++;
}

function GameBoard(width,height){
	this.board = []
	this.location_map = {};
	this.width = width;
	this.height = height;
	for(var i = 0; i < width; i++){
		this.board[i] = [];
		for(var j = 0; j < height; j++){
			this.board[i][j] = [];
		}
	}
}

var PlayerDirection = {
    UP : [0,-1],
    DOWN : [0,1],
    RIGHT : [1,0],
    LEFT : [-1,0]
}

var inputDirection = PlayerDirection.UP; 

GameBoard.prototype.removeObject = function(obj_id){
	var pos = this.location_map[obj_id];
	var index = $.inArray(this.board[pos[0]][pos[1]],obj_id);
	this.board[pos[0]][pos[1]].splice(index,1);
	delete this.location_map[obj_id];
}

GameBoard.prototype.addObject = function(obj_id,x,y){
	this.location_map[obj_id] = [x,y];
	this.board[x][y].push(obj_id);
}

GameBoard.prototype.move = function(obj_id,x,y){
	this.removeObject(obj_id);
	this.addObject(obj_id,x,y);
}

GameBoard.prototype.drawToGrid = function(){
	for(var i = 0; i < this.width; i++){
		for(var j = 0; j < this.height; j++){
			if(this.board[i][j].length > 0){
				var obj = game_objects[this.board[i][j][0]];
				HSVGrid.alterGrid(obj.color[0],obj.color[1],obj.color[2],i,j);
				HSVGrid.drawGridToCanvas();
			}
			else{
				HSVGrid.alterGrid(0,0,0,i,j);
				HSVGrid.drawGridToCanvas();
			}
		}
	}
}

GameBoard.prototype.handleCollisions = function(){
	for(var i = 0; i < this.board.length; i++){
		for(var j = 0; j < this.board[i].length; j++){
			for(var obj_index = 0; obj_index < this.board[i][j].length; obj_index++){
				if(this.board[i][j].length > 1){
					game_objects[this.board[i][j][obj_index]].handleCollision(this.board[i][j]);
				}
			}
		}
	}
}

function GameObject(h,s,v,x,y){
	this.color = [h,s,v];
	this.id = generateObjectID();
	this.pos = [x,y];
	this.old_pos = [x,y];
	game_objects[this.id] = this;
	game_board.addObject(this.id,x,y);

	this.updater = null;
	this.customCollisionHandler = null;
}

GameObject.prototype.handleCollision = function(objects){
	if(this.customCollisionHandler){
		for(var i = 0; i < objects.length; i++){
			if(objects[i] != this.id){
				this.customCollisionHandler(game_objects[objects[i]]);
			}
		}
	}
}

GameObject.prototype.move = function(new_x,new_y){
	this.old_pos = this.pos;
	this.pos = [new_x,new_y];
	game_board.move(this.id,new_x,new_y);
}

GameObject.prototype.undoMove = function(){
	this.pos = this.old_pos;
	game_board.move(this.id,this.old_pos[0],this.old_pos[1]);
}

GameObject.prototype.getPosition = function(board){
	return board.location_map[this.id];
}

jQuery(document).ready(function(){
	$(document).keydown(function(e){
		var key = (e.keyCode ? e.keyCode : e.charCode);
		console.log(key);
		if(key == 37){
			inputDirection = PlayerDirection.LEFT;
		}
		else if(key == 38){
			inputDirection = PlayerDirection.UP;
		}
		else if(key == 39){
			inputDirection = PlayerDirection.RIGHT;
		}
		else if(key == 40){
			inputDirection = PlayerDirection.DOWN;
		}
	});
	$(window).resize(resize);
});

function init() {
	var test_board = "#########\n# #  #  #\n# #     #\n# #     #\n#       #\n######  #\n#    #  #\n#       #\n#########\n";
	resize();
	canvas = document.getElementById("game_canvas");
	HSVGrid.initGrid(canvas,10);
	game_board = new GameBoard(10,10);
	for(var i = 0; i < 10; i++){
		for(var j = 0; j < 10; j++){
			HSVGrid.alterGrid(0,0,0,i,j);
		}
	}
	updateBoardFromString(test_board,0,0);

	var player = new GameObject(0,0.5,1,1,1);
	player.updater = function(){
		var pos = this.getPosition(game_board);
		this.move(pos[0]+inputDirection[0],pos[1]+inputDirection[1]);
	};

	return setInterval(gameTimestep, timestep_length);
}

function resize(){
	var game_area = $("#game_area")[0];
	var new_width = window.innerWidth;
	var new_height = window.innerHeight;

	if(new_width >= new_height){
		new_width = new_height;
	}
	else{
		new_height = new_width;
	}
	if(new_height > 800){
		new_height = 800;
		new_width =  800;
	}
	game_area.style.height = new_height + 'px';
	game_area.style.width = new_width + 'px';
	game_area.style.marginTop = (-new_height / 2) + 'px';
	game_area.style.marginLeft = (-new_height / 2) + 'px';
	canvas = document.getElementById("game_canvas");
	canvas.width = new_width;
	canvas.height = new_height;
	game_area.style.fontSize = (new_width / 800) + 'em';
}

var boardmap = {
	"#" : 1,
	" " : 0
}

function updateBoardFromString(str,x,y){
	var lines = str.split("\n");
	for(var i = 0; i < lines.length; i++){
		var line = lines[i];
		for(var j = 0; j < line.length; j++){
			if(line[j] == "#"){
				var wall = new GameObject(0,0,1,i,j,null);
				wall.customCollisionHandler = function(obj){
					obj.undoMove();
				}
			}
		}
	}
}

function updateObjects(){
	for(var key in game_objects){
		if(game_objects.hasOwnProperty(key)){
			var obj = game_objects[key];
			if(obj.updater){
				obj.updater();
			}
		}
	}
}

function gameTimestep(){
	updateObjects();
	game_board.handleCollisions();
	game_board.drawToGrid();
	// for(var i = 0; i < 10; i++){
	// 	for(var j = 0; j < 10; j++){
	// 		HSVGrid.alterGrid(360* Math.random(),1,game_board[i][j],j,i);
	// 	}
	// }
	HSVGrid.drawGridToCanvas();
}
