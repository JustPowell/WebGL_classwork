
function loadPLY(urlPLY, r, g, b, sr, sg, sb, se) {
    // defaults for r,g,b are 1.0
    r  = typeof r  !== 'undefined' ? r  : 1.0;
    g  = typeof g  !== 'undefined' ? g  : 1.0;
    b  = typeof b  !== 'undefined' ? b  : 1.0;
    sr = typeof sr !== 'undefined' ? sr : 1.0;
    sg = typeof sg !== 'undefined' ? sg : 1.0;
    sb = typeof sb !== 'undefined' ? sb : 1.0;
    se = typeof se !== 'undefined' ? se : 50.0;
    
    var coords    = new Array(0);
    var norms     = new Array(0);
    var texcoords = new Array(0);
    var indices   = new Array(0);
    
    var ply = getSourceSync(urlPLY).split('\n');
    if(ply[0] != 'ply' || ply[1] != 'format ascii 1.0') {
        console.log(urlPLY + ' not in expected format');
        return null;
    }
    var i = 2;
    var vcount = 0, fcount = 0;
    var has_pos = false, has_norm = false, has_st = false;
    var has_idx = false;
    while(i < ply.length) {
        var line = ply[i];
        if(line.substr(0,8) == 'comment ') {
            // ignore comments
        } else if(line.substr(0,'element vertex '.length) == 'element vertex ') {
            vcount = parseInt(line.substr('element vertex '.length));
        } else if(line == 'property float x' || line == 'property float y' || line == 'property float z') {
            has_pos = true;
        } else if(line == 'property float nx' || line == 'property float ny' || line == 'property float nz') {
            has_norm = true;
        } else if(line == 'property float s' || line == 'property float t') {
            has_st = true;
        } else if(line.substr(0,'element face '.length) == 'element face ') {
            fcount = parseInt(line.substr('element face '.length));
        } else if(line == 'property list uchar uint vertex_indices') {
            has_idx = true;
        } else if(line == 'end_header') {
            i++;
            break;
        }
        i++;
    }
    if(!has_pos || !has_norm || !has_idx) {
        console.log(urlPLY + ' not in expected format (pos, norm, st, idx)');
        return null;
    }
    for(var i_v = 0; i_v < vcount; i_v++, i++) {
        var line = ply[i];
        var parts = line.split(' ');
        coords.push(parseFloat(parts[0]));
        coords.push(parseFloat(parts[1]));
        coords.push(parseFloat(parts[2]));
        norms.push(parseFloat(parts[3]));
        norms.push(parseFloat(parts[4]));
        norms.push(parseFloat(parts[5]));
        if(has_st) {
            texcoords.push(parseFloat(parts[6]));
            texcoords.push(parseFloat(parts[7]));
        } else {
            texcoords.push(0.0);
            texcoords.push(0.0);
        }
    }
    for(var i_f = 0; i_f < fcount; i_f++, i++) {
        var line = ply[i];
        var parts = line.split(' ');
        if(parts[0] == '3') {
            indices.push(parseInt(parts[1]));
            indices.push(parseInt(parts[2]));
            indices.push(parseInt(parts[3]));
        } else if(parts[0] == '4') {
            indices.push(parseInt(parts[1]));
            indices.push(parseInt(parts[2]));
            indices.push(parseInt(parts[3]));
            
            indices.push(parseInt(parts[1]));
            indices.push(parseInt(parts[3]));
            indices.push(parseInt(parts[4]));
        } else {
            console.log(urlPLY + ' contains other than triangle and quad (' + parts[0] + ')');
            return null;
        }
    }
    
    coords    = new Float32Array(coords);
    norms     = new Float32Array(norms);
    texcoords = new Float32Array(texcoords);
    indices   = new Uint16Array(indices);
    
    var model = {
        color:          [r,g,b],
        speccolor:      [sr,sg,sb],
        specexp:        se,
        vertexBuffer:   gl.createBuffer(),
        normalBuffer:   gl.createBuffer(),
        texcoordBuffer: gl.createBuffer(),
        indexBuffer:    gl.createBuffer(),
        facecount:      indices.length,
        texture:        has_st ? 1.0 : 0.0,
    };
    
    // Write date into the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, coords, gl.STATIC_DRAW);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, norms, gl.STATIC_DRAW);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, model.texcoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texcoords, gl.STATIC_DRAW);
    
    // Write the indices to the buffer object
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    
    return model;
}

function drawModel(model, mmat) {
    var nmat = new Matrix4();
    nmat.setInverseOf(mmat);
    nmat.transpose();

    gl.uniformMatrix4fv(shader.u_MMatrix, false, mmat.elements);
    gl.uniformMatrix4fv(shader.u_NMatrix, false, nmat.elements);
    
    gl.uniform3f(shader.u_Color, model.color[0], model.color[1], model.color[2]);
    gl.uniform3f(shader.u_SpecColor, model.speccolor[0], model.speccolor[1], model.speccolor[2]);
    gl.uniform1f(shader.u_SpecExp, model.specexp);
    gl.uniform1f(shader.u_Texture, model.texture);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
    gl.vertexAttribPointer(shader.a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(shader.a_Position);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, model.texcoordBuffer);
    gl.vertexAttribPointer(shader.a_TexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(shader.a_TexCoord);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
    gl.vertexAttribPointer(shader.a_Normal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(shader.a_Normal);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
    gl.drawElements(gl.TRIANGLES, model.facecount, gl.UNSIGNED_SHORT, 0);
}
