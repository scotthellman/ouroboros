game = function(){
	var PlayerDirection = {
		UP : [0,-1],
		DOWN : [0,1],
		RIGHT : [1,0],
		LEFT : [-1,0]
	}

	var inputDirection = PlayerDirection.DOWN; 

	jQuery(document).ready(function(){
		$(document).keydown(function(e){
			var key = (e.keyCode ? e.keyCode : e.charCode);
			if(key == 37){
				if(inputDirection != PlayerDirection.RIGHT){
					inputDirection = PlayerDirection.LEFT;
				}
			}
			else if(key == 38){
				if(inputDirection != PlayerDirection.DOWN){
					inputDirection = PlayerDirection.UP;
				}
			}
			else if(key == 39){
				if(inputDirection != PlayerDirection.LEFT){
					inputDirection = PlayerDirection.RIGHT;
				}
			}
			else if(key == 40){
				if(inputDirection != PlayerDirection.UP){
					inputDirection = PlayerDirection.DOWN;
				}
			}
		});
		$(window).resize(resize);
	});


	var tail_lifetime = 50;
	var timestep_length = 50;
	var game_board;

	var game_objects = {};
	var obj_id = 0;

	var valid_spawns = [];


	var player_spawn;


	function generateObjectID(){
		return obj_id++;
	}

	BoardCreator = function(){
		function collidesWithRooms(x,y,size,rooms){
			var padding = 5;
			for(var i = 0; i < rooms.length; i++){
				var x_dist = Math.abs(x-rooms[i][0]) - padding;
				if(x_dist < size || x_dist < rooms[i][2]){
					return true;
				}
				var y_dist = Math.abs(y-rooms[i][1]) - padding;
				if(y_dist < size || y_dist < rooms[i][2]){
					return true;
				}
			}
			return false;
		}

		function getEnergyReducingMovement(room,rooms){
			var delta = [0,0];
			var x = room[0];
			var y = room[1];
			for(var j = 0; j < rooms.length; j++){
				if(x == rooms[j][0] && y == rooms[j][1]){
					//hit ourselves
					continue;
				}
				var diff_x = rooms[j][0] - x;
				var diff_y = rooms[j][1] - y;
				var magnitude = Math.sqrt(diff_x*diff_x + diff_y*diff_y);
				var direction = Math.atan2(diff_y,diff_x);

				var dx = (20/magnitude) * Math.cos(direction);
				var dy = (20/magnitude) * Math.sin(direction);
				delta[0] -= dx;
				delta[1] -= dy;
			}
			return delta;
		}

		function dilate(sketch){
			var new_sketch = [];
			for(var i = 0; i < sketch.length; i++){
				new_sketch[i] = [];
				for(var j = 0; j < sketch[i].length; j++){
					new_sketch[i][j] = sketch[i][j];
				}
			}
			for(var i = 0; i < sketch.length; i++){
				for(var j = 0; j < sketch[i].length; j++){
					var new_value = sketch[i][j];
					for(var k = Math.max(0,i-1); k < Math.min(sketch.length-1,i+2); k++){
						for(var h = Math.max(0,j-1); h < Math.min(sketch[0].length-1,j+2); h++){
							if(sketch[k][h] == 0){
								new_value = 0;
								break;
							}
						}
						if(new_value == 0){
							break;
						}
					}
					new_sketch[i][j] = new_value;
				}
			}
			return new_sketch;
		}

		function minimizeEnergy(rooms){
			var temperature = 0.75;
			for(var i = 0; i < 20; i++){
				var deltas = [];
				for(var j = 0; j < rooms.length; j++){
					deltas.push(getEnergyReducingMovement(rooms[j],rooms));
				}
				for(var j = 0; j < rooms.length; j++){
					var noise = 10*(0.5-Math.random())*Math.pow(temperature,i);
					var old_x = rooms[j][0];
					var old_y = rooms[j][1];
					var new_x = old_x + Math.pow(temperature,i) * (deltas[j][0] + noise);
					var new_y = old_y + Math.pow(temperature,i) * (deltas[j][1] + noise);
					//TODO fix hardcoding of board size
					rooms[j][0] = Math.min(100-rooms[j][2]-1,Math.max(1,Math.floor(new_x)));
					rooms[j][1] = Math.min(100-rooms[j][2]-1,Math.max(1,Math.floor(new_y)));
				}
			}
		}

		function generateInitialRooms(width,height,roomcount){
			var rooms = [];
			var valid_xs = [];
			var valid_ys = [];
			for(var i = 5; i < width-5; i++){
				valid_xs.push(i);
			}
			for(var i = 5; i < height-5; i++){
				valid_ys.push(i);
			}

			for(var i = 0; i < roomcount; i++){
				while(rooms.length == i){
					var x = valid_xs[Math.floor(Math.random()*valid_xs.length)];
					var y = valid_ys[Math.floor(Math.random()*valid_ys.length)];
					var size = Math.min(width-x-1,height-y-1,Math.floor(width/12+Math.random()*width/10));
					rooms.push([x,y,size]);
					valid_xs.splice(x,size);
					valid_ys.splice(y,size);
				}
			}
			return rooms;
		}

		function createRandomFullConnection(node_count){
			var adj_matrix = [];
			for(var i = 0; i < node_count; i++){
				adj_matrix[i] = [];
				for(var j = 0; j < node_count; j++){
					adj_matrix[i][j] = 0;
				}
			}

			var count = 0;
			while(!isGraphConnected(adj_matrix)){
				count++;
				var x_index = Math.floor(Math.random()*node_count);
				var possible = [];
				for(var i = 0; i < adj_matrix.length; i++){
					if(x_index != i && adj_matrix[x_index][i] == 0){
						possible.push(i);
					}
				}
				var y_index = possible[Math.floor(Math.random() * possible.length)]; 
				adj_matrix[x_index][y_index] = 1;
				adj_matrix[y_index][x_index] = 1;
				if(count > adj_matrix.length * adj_matrix.length){
					break;
				}
			}
			return adj_matrix;
		}

		function addEdgeToSketch(board_sketch,start_room,end_room){
			var start_x = Math.floor(start_room[0] + start_room[2]/2);
			var end_x = Math.floor(end_room[0] + end_room[2]/2);
			var start_y = Math.floor(start_room[1] + start_room[2]/2);
			var end_y = Math.floor(end_room[1] + end_room[2]/2);
			var shift_x = (start_x - end_x)/Math.abs(start_x - end_x);
			var shift_y = (start_y - end_y)/Math.abs(start_y - end_y);
			if(isNaN(shift_x)){
				shift_x = 0;
			}
			if(isNaN(shift_y)){
				shift_y = 0;
			}
			var jaunted = 0;
			//max to force one iteration, for drawing straight up
			for(var k = 0; k < Math.max(1,Math.abs(start_x - end_x)); k++){
				board_sketch[start_x - k*shift_x][start_y - jaunted * shift_y] = 0;
				if(shift_x == 0 || jaunted == 0 && k >= Math.abs(start_x - end_x)/2){
					for(;jaunted <= Math.abs(start_y - end_y); jaunted++){
						board_sketch[start_x - k*shift_x][start_y - jaunted * shift_y] = 0;
					}
					jaunted--;
				}
			}
		}

		function createGameBoardFromSketch(board_sketch){
			var width = board_sketch.length;
			var height = board_sketch[0].length;
			var new_board = new GameBoard(width,height);
			for(var i = 0; i < width; i++){
				for(var j = 0; j < width; j++){
					if(i == 0 || j == 0 || i == width-1 || j == height-1 || board_sketch[i][j]==1){
						var wall = new GameObject(0,0,1,i,j,null);
						wall.customCollisionHandler = function(obj){
							obj.undoMove();
						}
						new_board.addObject(wall.id,i,j);
					}
					else{
						valid_spawns.push([i,j]);
					}
				}
			}
			return new_board;
		}

		function generateRandomBoard(width,height){
			var rooms = generateInitialRooms(width,height,10);

			minimizeEnergy(rooms);

			player_spawn = [rooms[0][0],rooms[0][1]];
			adj_matrix = createRandomFullConnection(rooms.length);

			//and construct
			var board_sketch = [];
			for(var i = 0; i < width; i++){
				board_sketch[i] = [];
				for(var j = 0; j < height; j++){
					board_sketch[i][j] = 1;
				}
			}

			//add rooms
			for(var i = 0; i < rooms.length; i++){
				var x = rooms[i][0];
				var y = rooms[i][1];
				var size = rooms[i][2];
				for(var j = 0; j < size; j++){
					for(var k = 0; k < size; k++){
						board_sketch[x+j][y+k] = 0;
					}
				}
			}

			//add edges
			for(var i = 0; i < adj_matrix.length; i++){
				for(var j = i; j < adj_matrix.length; j++){
					if(adj_matrix[i][j]){
						addEdgeToSketch(board_sketch,rooms[i],rooms[j]);
					}
				}
			}

			board_sketch = dilate(board_sketch);
			var new_board = createGameBoardFromSketch(board_sketch);
			return new_board;
		}

		function isGraphConnected(adj_matrix){
			var visited = [];
			for(var i = 0; i < adj_matrix.length; i++){
				visited[i] = false;
			}
			var stack = [0];
			var count = 0;
			visited[0] = true;
			while(stack.length > 0){
				count++;
				if(count > adj_matrix.length + 5){
					return true;
				}
				var current = stack.pop();
				var adjacent = adj_matrix[current];
				for(var i = 0; i < adjacent.length; i++){
					if(adjacent[i]){
						if(!visited[i]){
							stack.push(i);
							visited[i] = true;
						}
					}
				}
			}
			for(var i = 0; i < visited.length; i++){
				if(!visited[i]){
					return false;
				}
			}
			return true;
		}

		return {
			generateRandomBoard : generateRandomBoard
		}
	}();

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

	GameBoard.prototype.removeObject = function(obj_id){
		var pos = this.location_map[obj_id];
		var index = $.inArray(obj_id,this.board[pos[0]][pos[1]]);
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
					if(this.board[i][j][0]==undefined){
						console.log('sigh');
					}
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

	GameBoard.prototype.isPermeable = function(x,y){
		if(x < 0 || y < 0) return false;
		if(x >= this.board.length || y >= this.board[0].length) return false;
		for(var i = 0; i < this.board[x][y].length; i++){
			if(game_objects[this.board[x][y][i]].permeable != true){
				return false;
			}
		}
		return true;
	}

	function GameObject(h,s,v,x,y){
		this.color = [h,s,v];
		this.id = generateObjectID();
		this.pos = [x,y];
		this.old_pos = [x,y];
		game_objects[this.id] = this;

		this.updater = function(){};
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


	function spawnTrail(pos){
		var lightwall = new GameObject(0,1,0.7,pos[0],pos[1]);
		lightwall.elapsed = 0;
		lightwall.constricts = true;
		lightwall.previous_tail = null;
		lightwall.updater = function(){
			lightwall.elapsed += 1;
			if(tail_lifetime - lightwall.elapsed <= 0){
				var colliders = game_board.board[this.pos[0]][this.pos[1]];
				//clean up cached intersections
				for(var i = 0; i < colliders.length; i++){
					if(colliders[i].hasOwnProperty('intersection')){
						colliders[i]['intersection'] = undefined;
					}
				}
				game_board.removeObject(lightwall.id);
				delete game_objects[lightwall.id];
			}
		}
		lightwall.getBend = function(){
			//needs to be at least 2 back
			var count = 0;
			if(this.cached_bend == undefined){
				var current = this;
				while(current != null){
					count++;
					if(current.direction[0] != this.direction[0] || current.direction[1] != this.direction[1]){
						//found our turn
						break;
					}
					//check for another intersection
					if(current.intersection != undefined){
						this.cached_bend = current.intersection;
						return;
					}
					current = current.previous_tail;
				}
				//check for 3 because an immediate turn happens 3 back
				if(count <= 3 || current.direction == this.direction || current == null){
					this.cached_bend = null;
				}
				else{
					this.cached_bend = current.direction;
				}
			}
			return this.cached_bend;
		}
		lightwall.customCollisionHandler = function(obj){
			// return;
			if(obj.constricts){
				//folow trail backwards, floodfill in the direction of the first turn
				//but we only want to do this with the one that's farther along
				if(obj.hasOwnProperty('elapsed')){
					if(obj.elapsed < this.elapsed){
						return;
					}
					if(obj.direction[0] == 0 && this.direction[0] == 0){
						return;
					}
					if(obj.direction[1] == 0 && this.direction[1] == 0){
						return;
					}
				}
				//floodfill
				var current = this.getBend();
				if(current == null){
					return;
				}
				this.intersection = obj.direction;
				var position = [this.pos[0]-this.direction[0] - current[0],
				this.pos[1]-this.direction[1] - current[1]];
				var fill = floodfill(game_board,position);

				for(var i = 0; i < fill.length; i++){
					var damage_field = new GameObject(0,0.5,0.5,fill[i][0],fill[i][1]);
					damage_field.lifetime = 1;
					damage_field.updater = function(){
						if(this.lifetime == 0){
							game_board.removeObject(this.id);
							delete game_objects[this.id];
						}
						else{
							this.lifetime--;
						}
					}
					damage_field.customCollisionHandler = function(obj){
						if(obj.hasOwnProperty('health')){
							obj.health--;
						}
					}
					game_board.addObject(damage_field.id,damage_field.pos[0],damage_field.pos[1]);
				}
			}
		}
		game_board.addObject(lightwall.id,pos[0],pos[1]);
		return lightwall;
	}

	function floodfill(board,start){
		//TODO breaks on the edge probably, doesn't matter right now because the edge is always wall
		var positions = [start];
		var fill = [];
		var seen = {};
		while(positions.length > 0){
			var to_fill = positions.pop(); 
			fill.push(to_fill);
			seen[to_fill] = true;
			for(key in PlayerDirection){
				if(PlayerDirection.hasOwnProperty(key)){
					var direction = PlayerDirection[key];
					var candidate = [to_fill[0] + direction[0], to_fill[1] + direction[1]];
					if(seen[candidate] == true){
						continue
					}
					seen[candidate] = true;
					if(!board.isPermeable(candidate[0],candidate[1])){
						continue
					}
					positions.push(candidate);
				}
			}
			//sanity check in case we're filling in a bad spot
			//yes this is a hacky fix
			if(fill.length > Math.min(100,tail_lifetime*tail_lifetime)){
				return;
			}
		}
		return fill;
	}

	function init() {
		resize();
		canvas = document.getElementById("game_canvas");
		HSVGrid.initGrid(canvas,100);
		game_board = BoardCreator.generateRandomBoard(100,100);

		var player = new GameObject(0,0.5,1,player_spawn[0],player_spawn[1]);
		player.previous_tail = null;
		player.player_controlled = true;
		player.updater = function(){
			var pos = this.getPosition(game_board);
			var dontspawn = false;
			if(pos[0] == this.old_pos[0] && pos[1] == this.old_pos[1]){
				dontspawn = true;
			}
			this.move(pos[0]+inputDirection[0],pos[1]+inputDirection[1]);
			if(dontspawn) return;
			var tail = spawnTrail(this.old_pos,this.tail_length);
			tail.direction = [inputDirection[0],inputDirection[1]];
			tail.previous_tail = this.previous_tail;
			this.previous_tail = tail;
		};
		game_board.addObject(player.id,player.pos[0],player.pos[1]);

		createEnemy(player_spawn[0]+4,player_spawn[1]+4);

		return setInterval(gameTimestep, timestep_length);
	}

	function createEnemy(x,y){
		var enemy = new GameObject(120,1,1,x,y);
		enemy.health = 5;
		enemy.permeable = true;

		//damage field
		var fields = [];
		for(var i = -2; i < 3; i++){
			for(var j = -2; j < 3; j++){
				if((i != 0 || j != 0) && game_board.isPermeable(x+i,y+j)){
					var field = new GameObject(120,0.5,0.5,x+i,y+j);
					field.permeable = true;
					field.updater = function(){
					}
					field.customCollisionHandler = function(obj){
						if(obj.player_controlled){
							tail_lifetime--;
						}
					}
					game_board.addObject(field.id,field.pos[0],field.pos[1]);
					fields.push(field);
				}
			}
		}

		enemy.direction = PlayerDirection.UP;

		enemy.updater = function(){
			this.color[2] = this.health/5;
			if(this.health <= 0){
				for(var i = 0; i < fields.length; i++){
					game_board.removeObject(fields[i].id);
					delete game_objects[fields[i].id];
				}
				game_board.removeObject(this.id);
				delete game_objects[this.id];
				tail_lifetime += 5;
				var next = valid_spawns[Math.floor(Math.random()*valid_spawns.length)];
				createEnemy(next[0],next[1]);
				next = valid_spawns[Math.floor(Math.random()*valid_spawns.length)];
				createEnemy(next[0],next[1]);
			}
			else{
				var next = [this.pos[0] + this.direction[0],this.pos[1] + this.direction[1]];
				if(game_board.isPermeable(next[0] + this.direction[0],next[1] + this.direction[1]) && Math.random() > 0.05){
					game_board.move(this.id,next[0],next[1]);
					this.pos = next;
					for(var i = 0; i < fields.length; i++){
						game_board.removeObject(fields[i].id);
						delete game_objects[fields[i].id];
					}
					fields = [];
					for(var i = -2; i < 3; i++){
						for(var j = -2; j < 3; j++){
							if((i != 0 || j != 0) && game_board.isPermeable(this.pos[0]+i,this.pos[1]+j)){
								var field = new GameObject(120,0.5,0.5,this.pos[0]+i,this.pos[1]+j);
								field.permeable = true;
								field.updater = function(){
								}
								field.customCollisionHandler = function(obj){
									if(obj.player_controlled){
										tail_lifetime--;
									}
								}
								game_board.addObject(field.id,field.pos[0],field.pos[1]);
								fields.push(field);
							}
						}
					}
				}
				else{
					var choices = ["UP","DOWN","LEFT","RIGHT"];
					this.direction = PlayerDirection[choices[Math.floor(Math.random()*4)]];
				}
			}

			enemy.customCollisionHandler = function(obj){
			}
		}

		game_board.addObject(enemy.id,x,y);
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

	return {
		init : init
	}
}();