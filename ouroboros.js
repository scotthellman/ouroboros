var timestep_length = 100;

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
	resize();
	canvas = document.getElementById("game_canvas");
	HSVGrid.initGrid(canvas,10)


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

function gameTimestep(){
	for(var i = 0; i < 10; i++){
		for(var j = 0; j < 10; j++){
			HSVGrid.alterGrid(360* Math.random(),i/10,j/10,i,j);
		}
	}
	HSVGrid.drawGridToCanvas();
}
