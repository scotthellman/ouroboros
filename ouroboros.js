var timestep_length = 100;
var game_board;
var old_board;

var game_objects = {};
var obj_id = 0;

function GameObject(h,s,v,x,y,updater){
	this.color = [h,s,v];
	this.pos = [x,y];
	this.updater = updater;
}

jQuery(document).ready(function(){
	$(document).keydown(function(e){
		var key = (e.keyCode ? e.keyCode : e.charCode);
		if(key == 37){
			if(players[player_id].direction != PlayerDirection.DOWN){
				inputDirection = PlayerDirection.UP;
			}
		}
		else if(key == 38){
			if(players[player_id].direction != PlayerDirection.RIGHT){
				inputDirection = PlayerDirection.LEFT;
			}
		}
		else if(key == 39){
			if(players[player_id].direction != PlayerDirection.UP){
				inputDirection = PlayerDirection.DOWN;
			}
		}
		else if(key == 40){
			if(players[player_id].direction != PlayerDirection.LEFT){
				inputDirection = PlayerDirection.RIGHT;
			}
		}
	});
	$(window).resize(resize);
});

function init() {
	var test_board = "#########\n# #  #  #\n# #     #\n# #     #\n#       #\n######  #\n#    #  #\n#       #\n#########\n";
	resize();
	canvas = document.getElementById("game_canvas");
	HSVGrid.initGrid(canvas,10);
	game_board = [];
	old_board = [];
	for(var i = 0; i < 10; i++){
		game_board[i] = [];
		old_board[i] = [];
		for(var j = 0; j < 10; j++){
			game_board[i][j] = 0;
			old_board[i][j] = 0;
			HSVGrid.alterGrid(0,0,0,i,j);
		}
	}
	updateBoardFromString(test_board,0,0);

	// addObject(new GameObject(0,0.5,1,3,2,function(){this.pos[0]++;}))

	return setInterval(gameTimestep, timestep_length);
}

function addObject(obj){
	game_objects[obj_id] = obj;
	obj_id++;
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
				addObject(new GameObject(0,0,1,i,j,null));
			}
		}
	}
}

function gameTimestep(){
	for(var key in game_objects){
		if(game_objects.hasOwnProperty(key)){
			var obj = game_objects[key];
			HSVGrid.alterGrid(0,0,0,obj.pos[0],obj.pos[1]);
			if(obj.updater){
				obj.updater();
			}
			HSVGrid.alterGrid(obj.color[0],obj.color[1],obj.color[2],obj.pos[0],obj.pos[1]);
		}
	}
	// for(var i = 0; i < 10; i++){
	// 	for(var j = 0; j < 10; j++){
	// 		HSVGrid.alterGrid(360* Math.random(),1,game_board[i][j],j,i);
	// 	}
	// }
	HSVGrid.drawGridToCanvas();
}
