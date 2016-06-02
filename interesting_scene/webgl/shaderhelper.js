
/////////////////////////////////////////////////////////
// shader helper functions


// Returns the contents of a text file
function getSourceSync(url) {
    var req = new XMLHttpRequest ();
    req.open("GET", url, false);
    req.send(null);
    return (req.status === 200) ? req.responseText : null;
};

// Returns an object contained in a file .json
function loadJSONSync(url) {
    return JSON.parse(getSourceSync(url));
};

function createShaderSync(gl, type, path) {
    var src = getSourceSync(path);
    if(!src) {
        alert('Could not get ' + path);
        return null;
    }
    
    var shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    
    if (! gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert (gl.getShaderInfoLog(shader));
        return null;
    }
    
    return shader;
}

function initShadersSync(gl, pathVertexShader, pathFragmentShader) {
    var vertexShader   = getSourceSync(pathVertexShader);
    if(!vertexShader) return false;
    var fragmentShader = getSourceSync(pathFragmentShader);
    if(!fragmentShader) return false
        
    var program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) {
        console.log('Failed to create shader program');
        return false;
    }
    
    gl.useProgram(program);
    gl.program = program;
    
    return true;
}

function initShadersSharedSync(gl, pathVertFragShader) {
    var shader = getSourceSync(pathVertFragShader);
    if(!shader) return false;
    
    var uniformVars = '';
    var attributeVars = '';
    var varyingVars = '';
    var constVars = '';
    
    var vertexShader   = '';
    var fragmentShader = '';
    
    var lines  = shader.split('\n');  // Break up into lines and store them as array
    lines.push(null); // Append null
    var index = 0;    // Initialize index of line
    var mode  = 0;    // 0: vars, 1: vertex shader, 2: fragment shader
    var line;
    while((line = lines[index++]) != null) {
        if(line.search('/////') == 0) {
            mode++;
            if(mode == 3) {
                alert('Shader file not properly formatted (too many mode changes)');
                return false;
            }
            continue;
        }
        switch(mode) {
        case 0:
            line = line.trim();
            if(line == '') continue;
            
            if(line.search('attribute ') == 0) {
                attributeVars += line + '\n';
                continue;
            }
            if(line.search('uniform ') == 0) {
                uniformVars += line + '\n';
                continue;
            }
            if(line.search('varying ') == 0) {
                varyingVars += line + '\n';
                continue;
            }
            if(line.search('const ') == 0) {
                constVars += line + '\n';
                continue;
            }
            if(line.search('//') == 0) {
                continue;
            }
            
            alert('Unhandled: ' + line);
            return false;
            
        case 1:
            vertexShader += line + '\n';
            continue;
            
        case 2:
            fragmentShader += line + '\n';
            continue;
            
        }
    }
    
    var precision = '#ifdef GL_ES\nprecision mediump float;\n#endif\n';
    
    vertexShader   = precision + attributeVars + uniformVars + varyingVars + constVars + vertexShader;
    fragmentShader = precision + uniformVars + varyingVars + constVars + fragmentShader;
    
    if(false) {
        console.log('Vertex Shader:');
        console.log(vertexShader);
        console.log('\n\n');
        console.log('Fragment Shader:');
        console.log(fragmentShader);
        console.log('\n\n');
    }
    
    //alert(vertexShader);
    //alert(fragmentShader);
    
    var program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) {
        console.log('Failed to create shader program');
        return false;
    }
    
    gl.useProgram(program);
    gl.program = program;
    
    return true;
}

