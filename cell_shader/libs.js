
var LIBS={

  get_json: function(url, func) {
    //create the request
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", url, true);
    xmlHttp.onreadystatechange = function() {
      if (xmlHttp.readyState == 4 && xmlHttp.status==200) {
        //the file is loaded. Parse it as JSON and lauch func
        func(JSON.parse(xmlHttp.responseText));
      }
    };
    //send the request
    xmlHttp.send();
  },

  degToRad: function(angle){
    return(angle*Math.PI/180);
  },

  get_projection: function(angle, a, zMin, zMax) {
    var tan=Math.tan(LIBS.degToRad(0.5*angle)),
        A=-(zMax+zMin)/(zMax-zMin),
          B=(-2*zMax*zMin)/(zMax-zMin);

    return [
      0.5/tan, 0 ,   0, 0,
      0, 0.5*a/tan,  0, 0,
      0, 0,         A, -1,
      0, 0,         B, 0
    ];
  },

  get_I4: function() {
    return [1,0,0,0,
            0,1,0,0,
            0,0,1,0,
            0,0,0,1];
  },

  set_I4: function(m) {
    m[0]=1, m[1]=0, m[2]=0, m[3]=0,
      m[4]=0, m[5]=1, m[6]=0, m[7]=0,
        m[8]=0, m[9]=0, m[10]=1, m[11]=0,
          m[12]=0, m[13]=0, m[14]=0, m[15]=1;
  },

  rotateX: function(m, angle) {
    var c=Math.cos(angle);
    var s=Math.sin(angle);
    var mv1=m[1], mv5=m[5], mv9=m[9];
    m[1]=m[1]*c-m[2]*s;
    m[5]=m[5]*c-m[6]*s;
    m[9]=m[9]*c-m[10]*s;

    m[2]=m[2]*c+mv1*s;
    m[6]=m[6]*c+mv5*s;
    m[10]=m[10]*c+mv9*s;
  },

  rotateY: function(m, angle) {
    var c=Math.cos(angle);
    var s=Math.sin(angle);
    var mv0=m[0], mv4=m[4], mv8=m[8];
    m[0]=c*m[0]+s*m[2];
    m[4]=c*m[4]+s*m[6];
    m[8]=c*m[8]+s*m[10];

    m[2]=c*m[2]-s*mv0;
    m[6]=c*m[6]-s*mv4;
    m[10]=c*m[10]-s*mv8;
  },

  rotateZ: function(m, angle) {
    var c=Math.cos(angle);
    var s=Math.sin(angle);
    var mv0=m[0], mv4=m[4], mv8=m[8];
    m[0]=c*m[0]-s*m[1];
    m[4]=c*m[4]-s*m[5];
    m[8]=c*m[8]-s*m[9];

    m[1]=c*m[1]+s*mv0;
    m[5]=c*m[5]+s*mv4;
    m[9]=c*m[9]+s*mv8;
  },

  translateZ: function(m, t){
    m[14]+=t;
  },

  translateY: function(m, t){
    m[13]+=t;
  },
	
	hexToRgb: function(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 
		[		parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : null;
}

};



//******     MESH OBJECTS     *********
function MeshObj( mesh, shaders ,aspect, gl){

  this.GL = gl;
  this.mesh = mesh;
	this.color = [0.1, 0.6, 0,12];
  this.shader = shaders[0];
  this.cellShader = shaders[1];
  this.visible = true;
  //cell is initially true in this app
  this.cell = true;
  this.model = LIBS.get_I4();
  this.view = LIBS.get_I4();
  this.projection = LIBS.get_projection(40, aspect, 1, 100);

  //initial translation
  LIBS.translateZ(this.view, -25);
  LIBS.translateY(this.view, -4);

  //init the shader vars
  this._Pmatrix = this.GL.getUniformLocation(this.shader, "Pmatrix");
  this._Vmatrix = this.GL.getUniformLocation(this.shader, "Vmatrix");
  this._Mmatrix = this.GL.getUniformLocation(this.shader, "Mmatrix");

  this._position = this.GL.getAttribLocation(this.shader, "position");
  this._normal = this.GL.getAttribLocation(this.shader, "normal");
  this._color = this.GL.getUniformLocation(this.shader, "color");

  this.GL.enableVertexAttribArray(this._position);
  this.GL.enableVertexAttribArray(this._normal);
  

  //REPEAT
  this._Pmatrix2 = this.GL.getUniformLocation(this.cellShader, "Pmatrix");
  this._Vmatrix2 = this.GL.getUniformLocation(this.cellShader, "Vmatrix");
  this._Mmatrix2 = this.GL.getUniformLocation(this.cellShader, "Mmatrix");

  this._position2 = this.GL.getAttribLocation(this.cellShader, "position");
  this._normal2 = this.GL.getAttribLocation(this.cellShader, "normal");
  
  

  this.GL.enableVertexAttribArray(this._position2);
  this.GL.enableVertexAttribArray(this._normal2);


  this.render = function(){

    this.GL.enable(this.GL.CULL_FACE);
    
    if(vars.cell){
      //CELL DRAWING PART
      this.GL.useProgram(this.cellShader);
      this.GL.cullFace(this.GL.FRONT);
      
      this.GL.uniformMatrix4fv(this._Pmatrix2, false, this.projection);
      this.GL.uniformMatrix4fv(this._Vmatrix2, false, this.view);
      this.GL.uniformMatrix4fv(this._Mmatrix2, false, this.model);

      this.GL.bindBuffer(this.GL.ARRAY_BUFFER, mesh.verts);
      this.GL.vertexAttribPointer(this._position2, 3, this.GL.FLOAT, false,4*(3+3+2),0);
      this.GL.vertexAttribPointer(this._normal2, 3, this.GL.FLOAT, false,4*(3+3+2),3*4);

      this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, this.mesh.indices);
      this.GL.drawElements(this.GL.TRIANGLES, this.mesh.NumVerts, this.GL.UNSIGNED_INT, 0);
    }
    
    //draw part
    this.GL.useProgram(this.shader);
    this.GL.cullFace(this.GL.BACK);

    this.GL.uniformMatrix4fv(this._Pmatrix, false, this.projection);
    this.GL.uniformMatrix4fv(this._Vmatrix, false, this.view);
    this.GL.uniformMatrix4fv(this._Mmatrix, false, this.model);
		this.GL.uniform3f(this._color, this.color[0], this.color[1], this.color[2]);

    this.GL.bindBuffer(this.GL.ARRAY_BUFFER, mesh.verts);
    this.GL.vertexAttribPointer(this._position, 3, this.GL.FLOAT, false,4*(3+3+2),0);
    this.GL.vertexAttribPointer(this._normal, 3, this.GL.FLOAT, false,4*(3+3+2),3*4);

    this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, mesh.indices);
    this.GL.drawElements(this.GL.TRIANGLES, mesh.NumVerts, this.GL.UNSIGNED_INT, 0);
  };

  this.update = function(){

  };

  this.addShader = function(auxShader){
    this.cellShader = auxShader;
  };

  this.rotate = function(vect){
    LIBS.set_I4(this.model);
    LIBS.rotateY( this.model, vect[1] );
    LIBS.rotateX( this.model, vect[0] );
    LIBS.rotateZ( this.model, vect[2] );
  };

  this.move = function(vect){
    LIBS.translateY(model, vect[1]);
    LIBS.translateZ(model, vect[2]);
  };

  this.setAspect = function(a){
    this.projection = LIBS.get_projection(40, a, 1, 100);
  }

  this.setVisible = function(bool) {
    this.visible = bool;
  };
	
	this.setColor = function(newColor) {
		newColor = LIBS.hexToRgb(newColor);
		this.color[0] = newColor[0] / 255.0;
		this.color[1] = newColor[1] / 255.0;
		this.color[2] = newColor[2] / 255.0;
	};

}



//**********      SHADERS     ****************
  var shader_vertex_source="\n\
  attribute vec3 position;\n\
  attribute vec3 normal;\n\
  uniform mat4 Pmatrix;\n\
  uniform mat4 Vmatrix;\n\
  uniform mat4 Mmatrix;\n\
  varying vec3 vNormal;\n\
  varying vec3 vView;\n\
  \n\
  void main(void) {\n\
    gl_Position = Pmatrix*Vmatrix*Mmatrix*vec4(position, 1.);\n\
    vNormal=vec3(Mmatrix*vec4(normal, 0.));\n\
    vView=vec3(Vmatrix*Mmatrix*vec4(position, 1.));\n\
  }";

  var shader_fragment_source="\n\
  precision mediump float;\n\
  varying vec3 vNormal;\n\
  varying vec3 vView;\n\
  const vec3 source_ambient_color=vec3(1.,1.,1.);\n\
  const vec3 source_diffuse_color=vec3(1.,2.,4.);\n\
  const vec3 source_specular_color=vec3(1.,1.,1.);\n\
  const vec3 source_direction=vec3(0.,0.,1.);\n\
  \n\
  const vec3 mat_ambient_color=vec3(0.3,0.3,0.3);\n\
  const vec3 mat_diffuse_color=vec3(1.,1.,1.);\n\
  const vec3 mat_specular_color=vec3(1.,1.,1.);\n\
  const float mat_shininess=10.;\n\
	uniform vec3 color;\n\
  \n\
  \n\
  \n\
  void main(void) {\n\
    vec3 I_ambient=source_ambient_color*mat_ambient_color;\n\
    vec3 I_diffuse=source_diffuse_color*mat_diffuse_color*max(0., dot(vNormal, source_direction));\n\
    vec3 R=reflect(source_direction, vNormal);\n\
    \n\
    vec3 MyColor = color;\n\
    \n\
    float Idiff = max(0., dot(vNormal, source_direction));\n\
    if(Idiff < 0.4)\n\
        Idiff = 0.3;\n\
    else if (Idiff > 0.8)\n\
        Idiff = 0.9;\n\
    else\n\
      Idiff = 0.6;\n\
    \n\
    gl_FragColor = vec4(Idiff*MyColor, 1.0);\n\
  }";
  
  var shader_vertex_cell="\n\
  attribute vec3 position;\n\
  attribute vec2 uv;\n\
  attribute vec3 normal;\n\
  uniform mat4 Pmatrix;\n\
  uniform mat4 Vmatrix;\n\
  uniform mat4 Mmatrix;\n\
  varying vec3 vNormal;\n\
  varying vec3 vView;\n\
  \n\
  void main(void) {\n\
  vec3 pos = position + 0.05*normal;\n\
  gl_Position = Pmatrix*Vmatrix*Mmatrix*vec4(pos, 1.);\n\
  vNormal=vec3(Mmatrix*vec4(normal, 0.));\n\
  vView=vec3(Vmatrix*Mmatrix*vec4(position, 1.));\n\
  }";

  var shader_fragment_cell="\n\
  precision mediump float;\n\
  varying vec3 vNormal;\n\
  varying vec3 vView;\n\
  const vec3 source_ambient_color=vec3(1.,1.,1.);\n\
  const vec3 source_diffuse_color=vec3(1.,2.,4.);\n\
  const vec3 source_specular_color=vec3(1.,1.,1.);\n\
  const vec3 source_direction=vec3(0.,0.,1.);\n\
  \n\
  const vec3 mat_ambient_color=vec3(0.3,0.3,0.3);\n\
  const vec3 mat_diffuse_color=vec3(1.,1.,1.);\n\
  const vec3 mat_specular_color=vec3(1.,1.,1.);\n\
  const float mat_shininess=10.;\n\
  \n\
  \n\
  \n\
  void main(void) {\n\
    vec3 color = vec3(0.0,0.0,0.0);\n\
    gl_FragColor = vec4(color, 1.);\n\
  }";