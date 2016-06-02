// Justin Powell
// COS350 Motion Assignment

var SOLID_VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Normal;\n' +
  'uniform mat4 u_MvpMatrix;\n' +
  'uniform mat4 u_NormalMatrix;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  vec3 lightDirection = vec3(0.0, 0.0, 1.0);\n' + // Light direction(World coordinate)
　'  vec4 color = vec4(0.0, 1.0, 1.0, 1.0);\n' +     // Face color
　'  gl_Position = u_MvpMatrix * a_Position;\n' +
  '  vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
  '  float nDotL = max(dot(normal, lightDirection), 0.0);\n' +
  '  v_Color = vec4(color.rgb * nDotL, color.a);\n' +
  '}\n';

// Fragment shader for single color drawing
var SOLID_FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';

var TEXTURE_VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec2 a_TexCoord;\n' +
  'attribute vec4 a_Normal;\n' +
  
  'uniform mat4 u_MvpMatrix;\n' +
  'uniform mat4 u_NormalMatrix;\n' +
  'uniform mat4 u_ModelMatrix;\n' +
  'uniform vec3 u_Color;\n'+
  
  'varying vec2  v_TexCoord;\n' +
  'varying vec3  v_Normal;\n' +
  'varying vec3  v_Position;\n' +
  'varying vec3  v_Color;\n' +
  
  'void main() {\n' +
  '  gl_Position = u_MvpMatrix * a_Position;\n' +
  '  v_Position = vec3(u_ModelMatrix * a_Position);\n' +
  '  v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
  '  v_TexCoord = a_TexCoord;\n' +
  '  v_Color = u_Color;\n' +
  '}\n';

// Fragment shader for texture drawing
var TEXTURE_FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  
  'uniform sampler2D u_Sampler;\n' +
  'uniform vec3 u_AmbientLight;\n' +
  'uniform vec3 u_LightColor;\n' +
  'uniform vec3 u_LightPosition;\n' +
  
  'varying vec2 v_TexCoord;\n' +
  'varying vec3 v_Position;\n' +
  'varying vec3 v_Normal;\n' +
  'varying vec3 v_Color;\n' +
  
  
  'void main() {\n' +
  '  vec4 color = texture2D(u_Sampler, v_TexCoord);\n' +
  
  '  vec3 normal = normalize(v_Normal);\n' +
  
  '  vec3 lightDirection = normalize(u_LightPosition - v_Position);\n' +
  
  '  float nDotL = max(dot(lightDirection, normal), 0.0);\n' +
  
  '  vec3 ambient = u_AmbientLight * color.rgb;\n' +
  
  '  vec3 diffuse = u_LightColor * color.rgb * nDotL;\n' +
  
  '  gl_FragColor = vec4((diffuse + ambient) * v_Color, color.a);\n' +
  '}\n';
  
var canvas;
var gl;

var u_MvpMatrix;	
var u_Sampler;
var u_NormalMatrix;
var u_ModelMatrix;
var u_Color;

var a_Position;
var a_TexCoord;
var a_Normal;

var planeMatrix;

var bodyMatrix;
var bodyMatrix2;

var turretMatrix;
var turretMatrix2;

var gunMatrix;
var gunMatrix2;

var tankMatrix;

var objectList = [];

var viewProjMatrix;
var normalMatrix;

var angle = 0;

var zoom = 20;

var blah;

var request = new XMLHttpRequest();

var CCoords  = {
	x: 0.0,
	y: 0.0,
	z: 0.0
};

function main() {
	canvas = document.getElementById('webgl');
	
	
	if (!canvas) {
		console.log('Failed to retrieve the <canvas> element');
		return;
	}
	
	//Get the GL context
	gl = getWebGLContext(canvas);
	
	if(!gl) {
		console.log('Failed to get the rendering context for WebGL');
		return;
	}
	
	//Initialize shaders
	//var solidProgram = createProgram(gl, SOLID_VSHADER_SOURCE, SOLID_FSHADER_SOURCE);
	//var texProgram = createProgram(gl, TEXTURE_VSHADER_SOURCE, TEXTURE_FSHADER_SOURCE);
	
	if(!initShaders(gl, TEXTURE_VSHADER_SOURCE, TEXTURE_FSHADER_SOURCE)){
		console.log('Failed to initialize shaders.');
		return;
	}
	
	//set clear color
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);

	a_Position = gl.getAttribLocation(gl.program, 'a_Position');
	a_TexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord');
	a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');	
	
	u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
	u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
	u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
	
	var u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');
	var u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition');
	var u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
	u_Color = gl.getUniformLocation(gl.program, 'u_Color');
	
	gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
	gl.uniform3f(u_LightPosition, 4.0, 7.0, 9.0);
	gl.uniform3f(u_AmbientLight, 0.4, 0.4, 0.4);
		
	if (!initTextures(gl)) {
		console.log('Failed to intialize the texture.');
		return;
	}
	
	viewProjMatrix = new Matrix4();
	
	viewProjMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100);
	viewProjMatrix.lookAt(zoom, zoom, zoom,  CCoords.x, CCoords.y, CCoords.z,  0, 1, 0);
	
	document.onkeydown = function(ev) { handleKeys(ev) };
	
	createPlane();
	createTank(0,0);
	createTank(0,1);
	createTank(1,4);
	
	animateBody();
	
	render();
}

var modelMatrix = new Matrix4();
var mvpMatrix = new Matrix4();
var normalMatrix = new Matrix4();


function render() {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	for (var i = 0; i < objectList.length; i++) {
		animateTurret();
		drawObject(objectList[i]);
	}
	
	requestAnimationFrame(render, canvas);
}

function bindings(ob) {
	
	gl.bindBuffer(gl.ARRAY_BUFFER, ob['vertex']);
	gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(a_Position);
		
	gl.bindBuffer(gl.ARRAY_BUFFER, ob['tex']);
	gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(a_TexCoord);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, ob['normal']);
	gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(a_Normal);
		
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ob['index']);
}

function drawObject(object) {
	bindings(object);
	
	if (object['type'] == 'body') {
		if (object['tankNum'] == 0) {
			modelMatrix = bodyMatrix;
		}
		else {
			modelMatrix = bodyMatrix2;
		}
		gl.uniform3f(u_Color, 1.0, 1.0, 1.0);
	}
	else if (object['type'] == 'turret') {
	if (object['tankNum'] == 0) {
			modelMatrix = turretMatrix;
		}
		else {
			modelMatrix = turretMatrix2;
		}
		gl.uniform3f(u_Color, 1.0, 1.0, 1.0);
	}
	else if (object['type'] == 'gun') {
		if (object['tankNum'] == 0) {
			modelMatrix = gunMatrix;
		}
		else {
			modelMatrix = gunMatrix2;
		}
		gl.uniform3f(u_Color, 1.0, 1.0, 1.0);
	}
	else if (object['type'] == 'plane') {
		modelMatrix = planeMatrix;
		gl.uniform3f(u_Color, .6, .3, .0);
	}
	else {
		console.log('Unknown Object type');
		return;
	}
	
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	
	normalMatrix.setInverseOf(modelMatrix);
	normalMatrix.transpose();
	gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

	mvpMatrix.set(viewProjMatrix);
	mvpMatrix.multiply(modelMatrix);
	gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
	
	gl.drawElements(gl.TRIANGLES, object['numInd'], gl.UNSIGNED_BYTE, 0);
}

planeMatrix = new Matrix4();
bodyMatrix = new Matrix4();
turretMatrix = new Matrix4();
gunMatrix = new Matrix4();

bodyMatrix2 = new Matrix4();
turretMatrix2 = new Matrix4();
gunMatrix2 = new Matrix4();

function createTank(version, tankNum) {
	if (version == 0){
		initVertexBuffers(gl, 1, tankNum);
		initVertexBuffers(gl, 2, tankNum);
		initVertexBuffers(gl, 3, tankNum);
	}
	else if(version == 1){
		initVertexBuffers(gl, 4, tankNum);
	}
}

function createPlane() {
	initVertexBuffers(gl, 4);
}

var turretAngle = 0.0;
var angle = 0.0;

function animateTurret() {
	turretAngle = document.getElementById('turretAngle').value;
	aniTur = document.getElementById('aniTur').checked;
	
	turretMatrix.set(bodyMatrix);
	turretMatrix.translate(0, 1, 0);
	turretMatrix.rotate(turretAngle, 0, 1, 0);
	
	if (aniTur) {
		angle = animate(angle);
	}
	turretMatrix2.set(bodyMatrix2);
	turretMatrix2.translate(0, 1, 0);
	turretMatrix2.rotate(angle, 0, 1, 0);
	
	gunMatrix.set(turretMatrix);
	gunMatrix.translate(2, 0, 0);
	
	gunMatrix2.set(turretMatrix2);
	gunMatrix2.translate(2, 0, 0);
}

var multi = 1;

function animateBody() {
	bodyMatrix.set(planeMatrix);
	bodyMatrix.translate(-4, .7, 0);
	
	bodyMatrix2.set(planeMatrix);
	bodyMatrix2.translate(4, .7, 0);
	bodyMatrix2.rotate(180, 0, 1, 0);
}

var ANGLE_STEP = 1.0;
var g_last = Date.now();
function animate(angle) {

	if (angle > 30.0) {
		angle = 30.0;
		ANGLE_STEP *= -1.0;
	}
	else if(angle < -30.0) {
		angle = -30.0;
		ANGLE_STEP *= -1.0;
	}
	var now = Date.now();
	var elapsed = now - g_last;
	g_last = now;
	
	var newAngle = angle + (ANGLE_STEP * elapsed) / 60.0;
	
	return newAngle %= 360;
}

  // Create a cube
  //    v6----- v5
  //   /|      /|
  //  v1------v0|
  //  | |     | |
  //  | |v7---|-|v4
  //  |/      |/
  //  v2------v3
  
function initVertexBuffers(gl, type, tankNum) {

	var plane = new Float32Array([
		10, .1, 10,  -10, .1, 10,  -10,-.1, 10,   10,-.1, 10,   // v0,v1,v2,v3 (front)
		10, .1, 10,   10,-.1, 10,   10,-.1,-10,   10, .1,-10,   // v0,v3,v4,v5 (right)
		10, .1, 10,   10, .1,-10,  -10, .1,-10,  -10, .1, 10,   // v0,v5,v6,v1 (top)
	   -10, .1, 10,  -10, .1,-10,  -10,-.1,-10,  -10,-.1, 10,   // v1,v6,v7,v2 (left)
	   -10,-.1,-10,   10,-.1,-10,   10,-.1, 10,  -10,-.1, 10,   // v7,v4,v3,v2 (bottom)
		10,-.1,-10,  -10,-.1,-10,  -10, .1,-10,   10, .1,-10
	]);
	
	//Turret
	var turretVert = new Float32Array([
		1, .5, 1,  -1, .5, 1,  -1,-.5, 1,   1,-.5, 1,   // v0,v1,v2,v3 (front)
		1, .5, 1,   1,-.5, 1,   1,-.5,-1,   1, .5,-1,   // v0,v3,v4,v5 (right)
		1, .5, 1,   1, .5,-1,  -1, .5,-1,  -1, .5, 1,   // v0,v5,v6,v1 (top)
	   -1, .5, 1,  -1, .5,-1,  -1,-.5,-1,  -1,-.5, 1,   // v1,v6,v7,v2 (left)
	   -1,-.5,-1,   1,-.5,-1,   1,-.5, 1,  -1,-.5, 1,   // v7,v4,v3,v2 (bottom)
		1,-.5,-1,  -1,-.5,-1,  -1, .5,-1,   1, .5,-1
	]);

	//Body
	var bodyVert = new Float32Array([
		2, .5, 1,  -2, .5, 1,  -2,-.5, 1,   2,-.5, 1,   // v0,v1,v2,v3 (front)
		2, .5, 1,   2,-.5, 1,   2,-.5,-1,   2, .5,-1,   // v0,v3,v4,v5 (right)
		2, .5, 1,   2, .5,-1,  -2, .5,-1,  -2, .5, 1,   // v0,v5,v6,v1 (top)
	   -2, .5, 1,  -2, .5,-1,  -2,-.5,-1,  -2,-.5, 1,   // v1,v6,v7,v2 (left)
	   -2,-.5,-1,   2,-.5,-1,   2,-.5, 1,  -2,-.5, 1,   // v7,v4,v3,v2 (bottom)
		2,-.5,-1,  -2,-.5,-1,  -2, .5,-1,   2, .5,-1
	]);
	
	//Gun
	var gunVert = new Float32Array([
		1, .25, .25,  -1, .25, .25,  -1,-.25, .25,   1,-.25, .25,   // v0,v1,v2,v3 (front)
		1, .25, .25,   1,-.25, .25,   1,-.25,-.25,   1, .25,-.25,   // v0,v3,v4,v5 (right)
		1, .25, .25,   1, .25,-.25,  -1, .25,-.25,  -1, .25, .25,   // v0,v5,v6,v1 (top)
	   -1, .25, .25,  -1, .25,-.25,  -1,-.25,-.25,  -1,-.25, .25,   // v1,v6,v7,v2 (left)
	   -1,-.25,-.25,   1,-.25,-.25,   1,-.25, .25,  -1,-.25, .25,   // v7,v4,v3,v2 (bottom)
		1,-.25,-.25,  -1,-.25,-.25,  -1, .25,-.25,   1, .25,-.25
	]);
		
	var normals = new Float32Array([   // Normal
		 0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,     // v0-v1-v2-v3 front
		 1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,     // v0-v3-v4-v5 right
		 0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,     // v0-v5-v6-v1 up
		-1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,     // v1-v6-v7-v2 left
		 0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,     // v7-v4-v3-v2 down
		 0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0      // v4-v7-v6-v5 back
	]);
  
	var texCoords = new Float32Array([   // Texture coordinates
		 1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0,    // v0-v1-v2-v3 front
		 0.0, 1.0,   0.0, 0.0,   1.0, 0.0,   1.0, 1.0,    // v0-v3-v4-v5 right
		 1.0, 0.0,   1.0, 1.0,   0.0, 1.0,   0.0, 0.0,    // v0-v5-v6-v1 up
		 1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0,    // v1-v6-v7-v2 left
		 0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0,    // v7-v4-v3-v2 down
		 0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0     // v4-v7-v6-v5 back
	]);
	
	var indices = new Uint8Array([        // Indices of the vertices
		 0, 1, 2,   0, 2, 3,    // front
		 4, 5, 6,   4, 6, 7,    // right
		 8, 9,10,   8,10,11,    // up
		12,13,14,  12,14,15,    // left
		16,17,18,  16,18,19,    // down
		20,21,22,  20,22,23     // back
	]);
	
	var vertexBuffer = gl.createBuffer();
	var texBuffer    = gl.createBuffer();
	var indexBuffer  = gl.createBuffer();
	var normalBuffer = gl.createBuffer();

	if (!vertexBuffer || !texBuffer || !indexBuffer) {
		return -1;
	}
	
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	
	var object;
	
	// Create a body Object
	if (type == 1){
		gl.bufferData(gl.ARRAY_BUFFER, bodyVert, gl.STATIC_DRAW);
		object = {
			'type': 'body',
			'tankNum': tankNum,
			'vertex': vertexBuffer,
			'tex': texBuffer,
			'index': indexBuffer,
			'normal': normalBuffer,
			'numInd': indices.length,
		};
		
	}
	// Create a turret Object
	else if (type == 2) {
		gl.bufferData(gl.ARRAY_BUFFER, turretVert, gl.STATIC_DRAW);
		object = {
			'type': 'turret',
			'tankNum': tankNum,
			'vertex': vertexBuffer,
			'tex': texBuffer,
			'index': indexBuffer,
			'normal': normalBuffer,
			'numInd': indices.length,
		};
	}
	// Create a gun Object
	else if (type == 3){
		gl.bufferData(gl.ARRAY_BUFFER, gunVert, gl.STATIC_DRAW);
		object = {
			'type': 'gun',
			'tankNum': tankNum,
			'vertex': vertexBuffer,
			'tex': texBuffer,
			'index': indexBuffer,
			'normal': normalBuffer,
			'numInd': indices.length
		};
	}
	
	else if (type == 4){
		modelInfo = loadModel('./mesh.txt');
		indices = modelInfo[0];
		vertices = modelInfo[1];
		normals = modelInfo[2];
		
		gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
		object = {
			'type': 'hetz',
			'vertex': vertexBuffer,
			'tex': texBuffer,
			'index': indexBuffer,
			'normal': normalBuffer,
			'numInd': indices.length
		};
	}
	else {
		gl.bufferData(gl.ARRAY_BUFFER, plane, gl.STATIC_DRAW);
		object = {
			'type': 'plane',
			'vertex': vertexBuffer,
			'tex': texBuffer,
			'index': indexBuffer,
			'normal': normalBuffer,
			'numInd': indices.length
		};
	}
	
	objectList.push(object);	// Add object to object list.
	
	gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
	
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
	
	return indices;
}

function loadModel(modelFile) {
	request.open("GET", modelFile, false);
	request.send(null);
	
	var polyList = [];
	var vertList = [];
	var normList = [];
	
	var fileText = request.responseText.split('\n');
	var numPolys = parseInt(fileText[0]);
	var numVerts = parseInt(fileText[1]);
	
	for (var i = 2; i < numPolys; i++){
		var line = fileText[i];
		line = line.split(' ');
		polyList.push(line[1]);
		polyList.push(line[2]);
		polyList.push(line[3]);
	}
	
	for (var j = 2+numPolys; j < 2+numPolys+numVerts; j++){
		line = fileText[j];
		line = line.split(' ');
		vertList.push(line[0]);
		vertList.push(line[1]);
		vertList.push(line[2]);
	}
	
	for (var k = 2+numPolys+numVerts; k < 2+numPolys+numVerts*2; k++){
		line = fileText[k];
		line = line.split(' ');
		normList.push(line[0]);
		normList.push(line[1]);
		normList.push(line[2]);
	}
	
	var lists = [polyList, vertList, normList];
	return lists;
}

function initTextures(gl) {
    var texture = gl.createTexture();   // Create a texture object
    if (!texture) {
        console.log('Failed to create the texture object');
        return false;
    }
    
    // Get the storage location of u_Sampler
    var u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
    if (!u_Sampler) {
        console.log('Failed to get the storage location of u_Sampler');
        return false;
    }
    
    var image = new Image();  // Create the image object
    if (!image) {
        console.log('Failed to create the image object');
        return false;
    }
    // Register the event handler to be called on loading an image
    image.onload = function(){ loadTexture(gl, texture, u_Sampler, image); };
    // Tell the browser to load an image
    image.src = './camo.png';
    
    return true;
}

function loadTexture(gl, texture, u_Sampler, image) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
    // Enable texture unit0
    gl.activeTexture(gl.TEXTURE0);
    // Bind the texture object to the target
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // Set the texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // Set the texture image
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    // Set the texture unit 0 to the sampler
    gl.uniform1i(u_Sampler, 0);
}