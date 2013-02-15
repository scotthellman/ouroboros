var timestep_length = 100;
var game_board;

jQuery(document).ready(function(){
	$(document).mousemove(function(e){
	    var offset = [$(this).width()/2,$(this).height()/2];
		var relX = e.pageX - offset[0];
		var relY = e.pageY - offset[1];

		mouse_angle = angle;
	});
	$(window).resize(resize);
});


function init() {
	var test_board = "#####\n# # #\n#   #\n#   #\n#####";
	resize();
	canvas = document.getElementById("game_canvas");
	HSVGrid.initGrid(canvas,10);
	game_board = [];
	for(var i = 0; i < 10; i++){
		game_board[i] = []
		for(var j = 0; j < 10; j++){
			game_board[i][j] = 0;
		}
	}
	updateBoardFromString(game_board,test_board,0,2);

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

function updateBoardFromString(board,str,x,y){
	var lines = str.split("\n");
	for(var i = 0; i < lines.length; i++){
		var line = lines[i];
		for(var j = 0; j < line.length; j++){
			var character = line[j];
			board[i+x][j+y] = boardmap[character];
		}
	}
}

function gameTimestep(){
	for(var i = 0; i < 10; i++){
		for(var j = 0; j < 10; j++){
			HSVGrid.alterGrid(360* Math.random(),1,game_board[i][j],i,j);
		}
	}
	HSVGrid.drawGridToCanvas();
}
