
var canvas = document.getElementById('gl-canvas');
var gl;
var shader = null;

var bufferBody   = null;
var bufferHips   = null;
var bufferLegL   = null;
var bufferLegR   = null;
var bufferArmL   = null;
var bufferArmR   = null;
var bufferHandL  = null;
var bufferHandR  = null;
var bufferHammer = null;
var bufferHead   = null;
var bufferHair   = null;
var bufferCape   = null;

var VMatrix;
var PMatrix;

var mouse = {
    down: false,
    x: 0,
    y: 0,
    ox: 0,
    oy: 0,
    button: 0
};


var shader_error = false;               // set to true whenever shader error occurs


function main() {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    gl = WebGLUtils.setupWebGL( canvas );
    if(!gl) {
        alert( "WebGL isn't available" );
        return;
    }
    
    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // Set viewport
    gl.viewport( 0, 0, canvas.width, canvas.height );
    // Enable depth testing
    gl.enable(gl.DEPTH_TEST);
    
    // Load shaders and initialize attribute buffers
    if(!initShadersSharedSync(gl, 'blinn-phong.shader')) {
        console.log('Failed to init shaders');
        return;
    }
    shader = {
        a_Position:         getShaderAttrib( 'a_Position'),
        a_Normal:           getShaderAttrib( 'a_Normal'),
        a_TexCoord:         getShaderAttrib( 'a_TexCoord'),
        u_Color:            getShaderUniform('u_Color'),            // vec3
        u_SpecColor:        getShaderUniform('u_SpecColor'),        // vec3
        u_SpecExp:          getShaderUniform('u_SpecExp'),          // float
        u_Texture:          getShaderUniform('u_Texture'),          // float
        u_Sampler:          getShaderUniform('u_Sampler'),          // sampler2D
        u_LightColor:       getShaderUniform('u_LightColor'),       // vec3
        u_LightDirection:   getShaderUniform('u_LightDirection'),   // vec3
        u_LightAmbient:     getShaderUniform('u_LightAmbient'),     // float
        u_MMatrix:          getShaderUniform('u_MMatrix'),          // mat4
        u_VMatrix:          getShaderUniform('u_VMatrix'),          // mat4
        u_PMatrix:          getShaderUniform('u_PMatrix'),          // mat4
        u_NMatrix:          getShaderUniform('u_NMatrix'),          // mat4
    };
    if(shader_error) return;
    
    // Set the light attributes
    var lightDirection = new Vector3([4.0, -3.0, 0.5]);
    lightDirection.normalize();     // Normalize
    gl.uniform3f(shader.u_LightColor,   1.0, 1.0, 1.0);
    gl.uniform1f(shader.u_LightAmbient, 0.2);
    gl.uniform3fv(shader.u_LightDirection, lightDirection.elements);

    // Calculate the view projection matrix
    VMatrix = new Matrix4();
    PMatrix = new Matrix4();
    PMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100);
    VMatrix.setLookAt(10,0,0,  0,0,0,  0,0,1);
    gl.uniformMatrix4fv(shader.u_VMatrix, false, VMatrix.elements);
    gl.uniformMatrix4fv(shader.u_PMatrix, false, PMatrix.elements);
    
    bufferBody   = loadPLY('model/chest.ply');
    bufferHair   = loadPLY('model/hair.ply', 0.991, 0.820, 0.211);
    bufferHead   = loadPLY('model/head.ply');
    bufferHammer = loadPLY('model/hammer.ply', 0.2, 0.2, 0.2);
    bufferHips   = loadPLY('model/hips.ply');
    bufferLegL   = loadPLY('model/leg-left.ply');
    bufferLegR   = loadPLY('model/leg-right.ply');
    bufferArmL   = loadPLY('model/arm-left.ply');
    bufferArmR   = loadPLY('model/arm-right.ply');
    bufferHandL  = loadPLY('model/hand-left.ply');
    bufferHandR  = loadPLY('model/hand-right.ply');
    bufferCape   = loadPLY('model/cape.ply', 0.427, 0.008, 0.0);
    
    if(!bufferBody || !bufferHair || !bufferHead || !bufferHammer || !bufferHips  || !bufferCape)  return;
    if(!bufferLegL || !bufferLegR || !bufferArmL || !bufferArmR   || !bufferHandL || !bufferHandR) return;
    
    // Set texture
    if(!initTexture('texture/thor_texture.jpg', gl.TEXTURE0, shader.u_Sampler, function() { render(); })) {
        console.log('Failed to initialize the texture.');
        return;
    }
}

var object_animation = get_animator(5.0);
var view_rotz = get_animator(20.0, 30.0);
var render_prevmx = 0;
var render_prevmy = 0;
function render() {
    handle_resize();
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    var animation   = document.getElementById('object_action').value;
    var show_body   = document.getElementById('object_body').checked;
    var show_head   = document.getElementById('object_head').checked;
    var show_hair   = document.getElementById('object_hair').checked;
    var show_cape   = document.getElementById('object_cape').checked;
    var show_hips   = document.getElementById('object_hips').checked;
    var show_legs   = document.getElementById('object_legs').checked;
    var show_arms   = document.getElementById('object_arms').checked;
    var show_hands  = document.getElementById('object_hands').checked;
    var show_hammer = document.getElementById('object_hammer').checked;
    var view_dist   = document.getElementById('view_dist').value / 100.0;
    var view_rot    = document.getElementById('view_rot').checked;
    
    var angle = object_animation.get_value();
    
    view_rotz.update(view_rot);
    if(mouse.down) {
        view_rotz.value += (render_prevmx - mouse.x);
    }
    render_prevmx = mouse.x;
    render_prevmy = mouse.y;
    
    var view_x = 10*view_dist*Math.cos(view_rotz.value * 3.14 / 180);
    var view_y = 10*view_dist*Math.sin(view_rotz.value * 3.14 / 180);
    var view_z = 0*view_dist;
    VMatrix.setLookAt(view_x, view_y, view_z,  0,0,0,  0,0,1);
    gl.uniformMatrix4fv(shader.u_VMatrix, false, VMatrix.elements);
    
    // create all matrices, initially identity
    var mmat_body   = new Matrix4();
    var mmat_cape   = new Matrix4();
    var mmat_hips   = new Matrix4();
    var mmat_head   = new Matrix4();
    var mmat_hair   = new Matrix4();
    var mmat_legl   = new Matrix4();
    var mmat_legr   = new Matrix4();
    var mmat_arml   = new Matrix4();
    var mmat_armr   = new Matrix4();
    var mmat_handl  = new Matrix4();
    var mmat_handr  = new Matrix4();
    var mmat_hammer = new Matrix4();
    
    
    // --------------------------------------------------------------------------
    //
    // insert hierarchical transformation code here!!
    // 
    // Matrix4 object functions that may be useful:
    //      rotate(angle, x,y,z);       Right-multiplies a rotates matrix, about direction (x,y,z) by angle degrees
    //      translate(x,y,z);           Right-multiplies a translation matrix, translates by (x,y,z)
    //      set(mmat);                  Sets matrix to have same entries as mmat
    //      setRotate(angle, x,y,z);    Sets matrix to be a rotation matrix
    //      setTranslate(x,y,z);        Sets matrix to be a translation matrix
    //
    // Usage example:
    //      mmat2.set(mmat1).rotate(45, 0,1,0).translate(1,2,3);
    //
    //      The line above does the following (in math):
    //          mmat2 = mmat1 * R_{45,0,1,0} * T_{1,2,3}
    //
    // --------------------------------------------------------------------------
    mmat_cape.set(mmat_body).translate(0,0,.65);
    
    
    // draw first object
    if(show_body)   drawModel(bufferBody,   mmat_body);
    if(show_cape)   drawModel(bufferCape,   mmat_cape);
    if(show_hips)   drawModel(bufferHips,   mmat_hips);
    if(show_legs)   drawModel(bufferLegL,   mmat_legl);
    if(show_legs)   drawModel(bufferLegR,   mmat_legr);
    if(show_head)   drawModel(bufferHead,   mmat_head);
    if(show_hair)   drawModel(bufferHair,   mmat_hair);
    if(show_arms)   drawModel(bufferArmL,   mmat_arml);
    if(show_arms)   drawModel(bufferArmR,   mmat_armr);
    if(show_hands)  drawModel(bufferHandL,  mmat_handl);
    if(show_hands)  drawModel(bufferHandR,  mmat_handr);
    if(show_hammer) drawModel(bufferHammer, mmat_hammer);
    
    
    requestAnimationFrame(render, canvas)
}

function add_ui_fields() {
    var options = document.getElementById("options");
    
    var html = '';
    html += '<table>';
    
    html += create_ui_header('object');
    html += create_ui_dropdown('object_action', 'action', ['standing','identity','exploded','walking'], 'standing');
    html += create_ui_checkbox('object_body', 'body', true);
    html += create_ui_checkbox('object_head', 'head', true);
    html += create_ui_checkbox('object_hair', 'hair', true);
    html += create_ui_checkbox('object_cape', 'cape', true);
    html += create_ui_checkbox('object_hips', 'hips', true);
    html += create_ui_checkbox('object_legs', 'legs', true);
    html += create_ui_checkbox('object_arms', 'arms', true);
    html += create_ui_checkbox('object_hands', 'hands', true);
    html += create_ui_checkbox('object_hammer', 'Mj&ouml;lnir', true);
    html += create_ui_space();
    
    html += create_ui_header('view');
    html += create_ui_checkbox('view_rot', 'rotate', false);
    html += create_ui_range('view_dist', 'distance', 1, 200, 100);
    html += create_ui_space();
    
    html += '</table>';
    
    
    options.innerHTML = html;
}


// http://codepen.io/Astralized/pen/xanrB
function hook_mouse() {
    // add mouse wheel handling (dolly in/out)
    canvas.onmousewheel = function(e) {
        var wheel = e.wheelDelta / 120;//n or -n
        document.getElementById('view_dist').value -= wheel * 5;
        e.preventDefault();
    };
    
    canvas.onmousemove = function(e) {
        mouse.ox = mouse.x;
        mouse.oy = mouse.y;
        mouse.x  = e.pageX - canvas.offsetLeft,
        mouse.y  = e.pageY - canvas.offsetTop;
        e.preventDefault();
    };

    canvas.onmousedown = function(e) {
        mouse.button = e.which;
        mouse.down   = true;
        mouse.ox = mouse.x;
        mouse.oy = mouse.y;
        e.preventDefault();
    };

    canvas.oncontextmenu = function(e) {
        e.preventDefault();
    };

    canvas.onmouseup = function(e) {
        mouse.down = false;
        e.preventDefault();
    };
}

add_ui_fields();
hook_mouse();
window.onload = function() {
    main();
}


function initTexture(urlTexture, gltexture, u_Sampler, callback) {
    var texture = gl.createTexture();   // Create a texture object
    if (!texture) {
        console.log('Failed to create the texture object');
        return false;
    }
    
    var image = new Image();  // Create the image object
    if (!image) {
        console.log('Failed to create the image object');
        return false;
    }
    
    // Register the event handler to be called on loading an image
    image.onload = function(){
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
        // Enable texture unit0
        gl.activeTexture(gltexture);
        // Bind the texture object to the target
        gl.bindTexture(gl.TEXTURE_2D, texture);
        // Set the texture parameters
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        // Set the texture image
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
        // Set the texture unit 0 to the sampler
        gl.uniform1i(u_Sampler, 0);
        
        callback();
    };
    
    // Tell the browser to load an image
    image.src = urlTexture
    
    return true;
}


var prev_width = -1;
var prev_height = -1;
function handle_resize() {
    var w = canvas.offsetWidth;
    var h = canvas.offsetHeight;
    if(w == prev_width && h == prev_height) return;
    prev_width  = w;
    prev_height = h;
    
    canvas.width = w;
    canvas.height = h;
    gl.viewport(0, 0, w, h);
    PMatrix.setPerspective(30, w / h, 1, 100);
    gl.uniformMatrix4fv(shader.u_PMatrix, false, PMatrix.elements);
}

function getShaderUniform(uname) {
    var u = gl.getUniformLocation(gl.program, uname);
    if(u == -1) {
        console.log('Failed to get uniform location for ' + uname);
        shader_error = true;
    } else {
        //console.log('Found ' + uname);
    }
    return u;
}
function getShaderAttrib(aname) {
    var a = gl.getAttribLocation(gl.program, aname);
    if(a == -1) {
        console.log('Failed to get attribute location for ' + aname);
        shader_error = true;
    } else {
        //console.log('Found ' + aname);
    }
    return a;
}

function get_default(val, def) { return typeof val  !== 'undefined' ? val  : def; }

function get_animator(speed, value) {
    return {
        previous: Date.now(),
        enabled: true,
        value: get_default(value, 0.0),
        speed: speed,
        update: function(enabled) {
            if(typeof enabled !== 'undefined') this.enabled = enabled;
            
            var now = Date.now();
            var elapsed = now - this.previous;
            this.previous = now;
            if(this.enabled) {
                // Calculate the elapsed time
                this.value = this.value + (this.speed * elapsed) / 1000.0;
            }
            return this.value;
        },
        get_value: function(enabled) {
            this.update(enabled);
            return this.value;
        }
    };
}



