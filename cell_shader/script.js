var guiVars = function(){
	this.cell = true;
	this.color = "#008207"; // CSS string
};

var vars = null;
var gui = null;
var drake = null;
var spinner = null;

var main=function(){
	
	//get the spinner
	spinner = document.getElementById("spinn1");
	
	/*========================= DAT.GUI ========================= */
	vars = new guiVars();
	gui = new dat.GUI();
	gui.add( vars, 'cell' );
	gui.addColor( vars, 'color' );
	
	var CANVAS=document.getElementById("your_canvas");
	CANVAS.width=window.innerWidth;
	CANVAS.height=window.innerHeight;

	window.onresize = function() {
    	CANVAS.width=window.innerWidth;
		CANVAS.height=window.innerHeight;
		if(drake){
			drake.setAspect(CANVAS.width/CANVAS.height)
		}
	}	

	/*========================= CAPTURE MOUSE EVENTS ========================= */

	var AMORTIZATION=0.95;
	var drag=false;
	var old_x, old_y;
	var dX=0, dY=0;

	var mouseDown=function(e){
		drag=true;
		old_x=e.pageX, old_y=e.pageY;
		e.preventDefault();
		return false;
	};

	var mouseUp=function(e){
		drag=false;
	};

	var mouseMove=function(e){
		if (!drag) return false;
		dX=(e.pageX-old_x)*Math.PI/CANVAS.width,
		dY=(e.pageY-old_y)*Math.PI/CANVAS.height;
		THETA+=dX;
		PHI+=dY;
		old_x=e.pageX, old_y=e.pageY;
		e.preventDefault();
	};

	CANVAS.addEventListener("mousedown", mouseDown, false);
	CANVAS.addEventListener("mouseup", mouseUp, false);
	CANVAS.addEventListener("mouseout", mouseUp, false);
	CANVAS.addEventListener("mousemove", mouseMove, false);

	/*========================= GET WEBGL CONTEXT ========================= */
	var GL;
	try{
		GL = CANVAS.getContext("experimental-webgl", {antialias: true});
		var EXT = GL.getExtension("OES_element_index_uint") ||
		GL.getExtension("MOZ_OES_element_index_uint") ||
		GL.getExtension("WEBKIT_OES_element_index_uint");
	}catch (e){
		alert("WebGL Compatibility Fail") ;
		return false;
	}




	var get_shader=function(source, type, typeString) {
		var shader = GL.createShader(type);
		GL.shaderSource(shader, source);
		GL.compileShader(shader);
		if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
			alert("ERROR IN "+typeString+ " SHADER : " + GL.getShaderInfoLog(shader));
			return false;
		}
		return shader;
	};

	var shader_vertex=get_shader(shader_vertex_source, GL.VERTEX_SHADER, "VERTEX");
	var shader_fragment=get_shader(shader_fragment_source, GL.FRAGMENT_SHADER, "FRAGMENT");
  
	var cell_vertex=get_shader(shader_vertex_cell, GL.VERTEX_SHADER, "CELLVERTEX");
	var cell_fragment=get_shader(shader_fragment_cell, GL.FRAGMENT_SHADER, "CELLFRAGMENT");

	var SHADER_PROGRAM=GL.createProgram();
	GL.attachShader(SHADER_PROGRAM, shader_vertex);
	GL.attachShader(SHADER_PROGRAM, shader_fragment);
  
	GL.linkProgram(SHADER_PROGRAM);
  
	var CELL_PROGRAM=GL.createProgram();
	GL.attachShader(CELL_PROGRAM, cell_vertex);
	GL.attachShader(CELL_PROGRAM, cell_fragment);

	GL.linkProgram(CELL_PROGRAM);

  

	/*========================= THE DRAGON ========================= */

	var mesh = { verts: false, indices:false, NumVerts:0 };
	LIBS.get_json("ressources/dragon.json", function(dragon){

		//get the verts
		mesh.verts = GL.createBuffer ();
		GL.bindBuffer(GL.ARRAY_BUFFER, mesh.verts);
		GL.bufferData(GL.ARRAY_BUFFER,
			new Float32Array(dragon.vertices),
			GL.STATIC_DRAW);

		// get the indices
		mesh.indices =GL.createBuffer ();
		GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, mesh.indices);
		GL.bufferData(GL.ELEMENT_ARRAY_BUFFER,
			new Uint32Array(dragon.indices),
			GL.STATIC_DRAW);

		mesh.NumVerts = dragon.indices.length;

		//***      CREATING THE OBJECT    *******
		var a = CANVAS.width/CANVAS.height;
		var s = [SHADER_PROGRAM, CELL_PROGRAM];
		drake = new MeshObj( mesh, s, a , GL);

		//****     FADE THE SPINNER   ******
		spinner.style.display = "none";
		render(0);

	});

	//***************     CREATING THE OBJECTS    ************
	/*var a = CANVAS.width/CANVAS.height;
	var s = [SHADER_PROGRAM, CELL_PROGRAM];
	var drake = new MeshObj( mesh, s, a , GL);*/

	var THETA=0,
		PHI=0;
	

	/*========================= DRAWING ========================= */
	GL.enable(GL.DEPTH_TEST);
	GL.depthFunc(GL.LEQUAL);
	GL.clearColor(0.0, 0.0, 0.0, 0.0);
	GL.clearDepth(1.0);

	var time_old=0;

	var render = function(time) {

		var dt=time-time_old;
		if (!drag) {
			dX*=AMORTIZATION, dY*=AMORTIZATION;
			THETA+=dX, PHI+=dY;
		}

		time_old=time;
		GL.depthFunc(GL.LEQUAL);
		
		GL.viewport(0.0, 0.0, CANVAS.width, CANVAS.height);
		GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
		
		drake.rotate([PHI, THETA, 0]);
		drake.setColor(vars.color);
		drake.render();

		GL.flush();
		window.requestAnimationFrame(render);
	};
};
