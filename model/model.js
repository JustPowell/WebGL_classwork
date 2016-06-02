var SOLID_VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Normal;\n' +
  'uniform mat4 u_MvpMatrix;\n' +
  'uniform mat4 u_NormalMatrix;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  vec3 lightDirection = vec3(0.0, 1.0, 0.0);\n' + // Light direction(World coordinate)
　'  vec4 color = vec4(1.0, 1.0, 1.0, 1.0);\n' +     // Face color
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
  
  
var objectList = [];

var modelMatrix = new Matrix4();
var mvpMatrix = new Matrix4();
var normalMatrix = new Matrix4();
var bodyMatrix = new Matrix4();

var a_Position;
var a_Normal;
var u_MvpMatrix;
var u_NormalMatrix;

var viewProjMatrix;

var request = new XMLHttpRequest();

var gl;
var canvas;
  
function main() {
  // Retrieve <canvas> element
    canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
	gl = getWebGLContext(canvas);
		if (!gl) {
		console.log('Failed to get the rendering context for WebGL');
		return;
	}

  // Initialize shaders
	if(!initShaders(gl, SOLID_VSHADER_SOURCE, SOLID_FSHADER_SOURCE)){
		console.log('Failed to initialize shaders.');
		return;
	}
  
	a_Position = gl.getAttribLocation(gl.program, 'a_Position');
	a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
	u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
	u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  
	viewProjMatrix = new Matrix4();
	
	viewProjMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100);
	viewProjMatrix.lookAt(10.0, 10.0, 10.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0);
	
	//modelMatrix.translate(0,2,0);
	modelMatrix.rotate(-90, 1, 0, 0);
	
	gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
  
    initVertexBuffers(gl, 0);
	initVertexBuffers(gl, 1);
	initVertexBuffers(gl, 2);
	
    render();
  
    
}
 
function initVertexBuffers(gl, type) {
	
	var vertexBuffer = gl.createBuffer();
	var indexBuffer  = gl.createBuffer();
	var normalBuffer = gl.createBuffer();

	if (!vertexBuffer || !indexBuffer || !normalBuffer) {
		return -1;
	}
	
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	
	var object;
	
	// Create a body Object
	var indices = [];
	var vertices = [];
	var normals = [];
	
	if (type == 0){
		modelInfo = loadModel('./tank.txt');
		indices = modelInfo[0];
		vertices = modelInfo[1];
		normals = modelInfo[2];
		
		//console.log(vertices);
		
		gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
		object = {
			'type': 'hetz',
			'vertex': vertexBuffer,
			'index': indexBuffer,
			'normal': normalBuffer,
			'numInd': indices.length
		};
	}
	else if (type == 1){
		modelInfo = loadModel('./mesh2.txt');
		indices = modelInfo[0];
		vertices = modelInfo[1];
		normals = modelInfo[2];
		
		gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
		object = {
			'type': 'alien',
			'vertex': vertexBuffer,
			'index': indexBuffer,
			'normal': normalBuffer,
			'numInd': indices.length
		};
	}
	else if (type == 2){
		modelInfo = loadModel('./mesh3.txt');
		indices = modelInfo[0];
		vertices = modelInfo[1];
		normals = modelInfo[2];
		
		gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
		object = {
			'type': 'box',
			'vertex': vertexBuffer,
			'index': indexBuffer,
			'normal': normalBuffer,
			'numInd': indices.length
		};
	}
	
	objectList.push(object);	// Add object to object list.
	
	gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
	
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
	
	return indices;
}

function render() {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	object = document.getElementById('options').value;
	
	//console.log(object);
	
	if(object == 'tank'){
		drawObject(objectList[0]);
	}
	else if(object == 'alien'){
		drawObject(objectList[1]);
	}
	else if(object == 'box'){
		drawObject(objectList[2]);
	}
	//for (var i = 0; i < objectList.length; i++) {
		//drawObject(objectList[i]);
	//}
	
	requestAnimationFrame(render, canvas);
}

function drawObject(object) {
	bindings(object);
	
	//modelMatrix.translate(0,2,0);
	//modelMatrix = bodyMatrix;
	
	modelMatrix.rotate(-.1, 0, 0, 1);
	
	normalMatrix.setInverseOf(modelMatrix);
	normalMatrix.transpose();
	gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

	mvpMatrix.set(viewProjMatrix);
	mvpMatrix.multiply(modelMatrix);
	gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
	
	gl.drawElements(gl.TRIANGLES, object['numInd'], gl.UNSIGNED_SHORT, 0);
}

function bindings(ob) {
	gl.bindBuffer(gl.ARRAY_BUFFER, ob['vertex']);
	gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(a_Position);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, ob['normal']);
	gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(a_Normal);
		
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ob['index']);
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
	
	for (var i = 2; i < numPolys+2; i++){
		var line = fileText[i];
		line = line.split(' ');
		
		for (var l = 1; l < parseInt(line[0])+1; l++){
			polyList.push(parseInt(line[l]));
		}
	}

	for (var j = 2+numPolys; j < 2+numPolys+numVerts; j++){
		line = fileText[j];
		line = line.split(' ');
		
		vertList.push(parseFloat(line[0]));
		vertList.push(parseFloat(line[1]));
		vertList.push(parseFloat(line[2]));
	}
	
	for (var k = 2+numPolys+numVerts; k < 2+numPolys+numVerts*2; k++){
		line = fileText[k];
		line = line.split(' ');
		normList.push(parseFloat(line[0]));
		normList.push(parseFloat(line[1]));
		normList.push(parseFloat(line[2]));
	}
	//console.log(polyList.length);
	console.log(vertList);
	//console.log(normList);
	var lists = [new Uint16Array(polyList), new Float32Array(vertList), new Float32Array(normList)];
	return lists;
}
