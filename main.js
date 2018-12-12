/** @type {WebGLRenderingContext} */
var GL;

const WEBGL_ID_DEFAULT = "webGL";
const EXPERIMENTAL_WEBGL = "experimental-webgl";

const FRAGMENT_SHADER_ID = "shader-fs";
const VERTEX_SHADER_ID = "shader-vs";

const FRAGMENT_SHADER_TYPE = "x-shader/x-fragment";
const VERTEX_SHADER_TYPE = "x-shader/x-vertex";

let counter_id = 0;

// get Shader 
function getShader(id) {
    let shaderScript = document.getElementById(id);

    let code = "";
    let node = shaderScript.firstChild;
    while(node) {
        if(node.nodeType === 3){
            code += node.textContent;
        }
        node = node.nextSibling;
    }

    let shader;
    if (shaderScript.type == FRAGMENT_SHADER_TYPE){
        shader = GL.createShader(GL.FRAGMENT_SHADER);
    } else if ( shaderScript.type == VERTEX_SHADER_TYPE) {
        shader = GL.createShader(GL.VERTEX_SHADER);
    } else {
        return null;
    }

    GL.shaderSource(shader, code);
    GL.compileShader(shader);

    if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
        return null
    }

    return shader;
}

// class WebGL
function WebGL(id){
    id = id || WEBGL_ID_DEFAULT;
    var canvasGL = document.getElementById(id);
    canvasGL.width = window.innerWidth; //document.width is obsolete
    canvasGL.height = window.innerHeight; //document.height is obsolete
    GL = canvasGL.getContext(EXPERIMENTAL_WEBGL);
    GL.VIEWPORT_WIDTH = canvasGL.width;
    GL.VIEWPORT_HEIGHT = canvasGL.height;

    function initShaders() {
        let fragmentShader = getShader(FRAGMENT_SHADER_ID);
        let vertexShader = getShader(VERTEX_SHADER_ID);

        this.shaderProgram = GL.createProgram();
        GL.attachShader(this.shaderProgram, vertexShader);
        GL.attachShader(this.shaderProgram, fragmentShader);
        GL.linkProgram(this.shaderProgram);


        if ( !GL.getProgramParameter(this.shaderProgram, GL.LINK_STATUS)) {
            alert("Tidak bisa menginisasi Shader");
        }

        GL.useProgram(this.shaderProgram);

        this.shaderProgram.vertexColorAttribute = GL.getAttribLocation(this.shaderProgram, "aVertexColor");
        GL.enableVertexAttribArray(this.shaderProgram.vertexColorAttribute);
        
        this.shaderProgram.vertexPositionAttribute = GL.getAttribLocation(this.shaderProgram, "aVertexPosition");
        GL.enableVertexAttribArray(this.shaderProgram.vertexPositionAttribute);

        this.shaderProgram.vertexNormalAttribute = GL.getAttribLocation(this.shaderProgram, "aVertexNormals");
        GL.enableVertexAttribArray(this.shaderProgram.vertexNormalAttribute);

        this.shaderProgram.textureCoordAttribute = GL.getAttribLocation(this.shaderProgram, "aTextureCoord");
        GL.enableVertexAttribArray(this.shaderProgram.textureCoordAttribute);

        this.shaderProgram.pMatrixUniform = GL.getUniformLocation(this.shaderProgram, "uPMatrix");
        this.shaderProgram.mvMatrixUniform = GL.getUniformLocation(this.shaderProgram, "uMVMatrix");
        this.shaderProgram.nMatrixUniform = GL.getUniformLocation(this.shaderProgram, "uNMatrix");
        this.shaderProgram.samplerUniform = GL.getUniformLocation(this.shaderProgram, "uSampler");
        this.shaderProgram.useLightingUniform = GL.getUniformLocation(this.shaderProgram, "uUseLighting");
        this.shaderProgram.ambientColorUniform = GL.getUniformLocation(this.shaderProgram, "uAmbientColor");
        this.shaderProgram.lightingDirectionUniform = GL.getUniformLocation(this.shaderProgram, "uLightingDirection");
        this.shaderProgram.pointLightingLocationUniform = GL.getUniformLocation(this.shaderProgram, "uPointLightingLocation");
        this.shaderProgram.pointLightingColorUniform = GL.getUniformLocation(this.shaderProgram, "uPointLightingColor");
        this.shaderProgram.alphaUniform = GL.getUniformLocation(this.shaderProgram, "uAlpha");
        this.shaderProgram.shiniUniform = GL.getUniformLocation(this.shaderProgram, "uShininess");
    }
    initShaders = initShaders.bind(this);
    initShaders();
    this.mvMatrix = {
        '1' : mat4.create(),
        '2' : mat4.create(),
        '3' : mat4.create(),
        '4' : mat4.create(),
    }
    
    this.pvMatrix = {
        '1' : mat4.create(),
        '2' : mat4.create(),
        '3' : mat4.create(),
        '4' : mat4.create(),
    }
    this.mvMatrixStack = {
        '1' : [],
        '2' : [],
        '3' : [],
        '4' : [],
    }    

    this.object3dBuffer = [];

    GL.clearColor(0.0, 0.0, 0.0, 1.0);
    GL.enable(GL.DEPTH_TEST);
}

WebGL.prototype.mvPushMatrix = function(idx) {
    let duplicate = mat4.create();

    let mvMat = this.mvMatrix[idx], mvMatStack = this.mvMatrixStack[idx];

    mat4.copy(duplicate, mvMat);
    mvMatStack.push(duplicate);
}

WebGL.prototype.mvPopMatrix = function(idx) {
    this.mvMatrix[idx] = this.mvMatrixStack[idx].pop();
}

WebGL.prototype.setMatrixUniform = function(idx) {
    let normalMatrix = mat3.create();

    let mvMat = this.mvMatrix[idx], pMat = this.pvMatrix[idx];

    mat3.normalFromMat4(normalMatrix, mvMat);

    GL.uniformMatrix4fv(this.shaderProgram.pMatrixUniform, false, pMat);
    GL.uniformMatrix4fv(this.shaderProgram.mvMatrixUniform, false, mvMat);
    GL.uniformMatrix3fv(this.shaderProgram.nMatrixUniform, false, normalMatrix);
}

async function handleLoadedTexture(texture) {
    await GL.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, true);
    await GL.bindTexture(GL.TEXTURE_2D, texture);
    
    await GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, texture.image);
    await GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
    await GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.LINEAR);

    texture.loaded = true;
}

WebGL.prototype.add = function(object3d) {
    let buffer = {}
    if(object3d.type === 'geometry') {
        buffer.id = object3d.id;

        buffer.obj3d = object3d;

        buffer.position = GL.createBuffer();
        GL.bindBuffer(GL.ARRAY_BUFFER, buffer.position);
        GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(object3d.vertices), GL.STATIC_DRAW);
        buffer.position.itemSize = 3;
        buffer.position.numItems = object3d.vertices.length / buffer.position.itemSize;

        buffer.normal = GL.createBuffer();
        GL.bindBuffer(GL.ARRAY_BUFFER, buffer.normal);
        GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(object3d.normals), GL.STATIC_DRAW);
        buffer.normal.itemSize = 3;
        buffer.normal.numItems = object3d.normals.length / buffer.normal.itemSize;

        buffer.indices = GL.createBuffer();
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, buffer.indices);
        GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(object3d.indices), GL.STATIC_DRAW);
        buffer.indices.itemSize = 1;
        buffer.indices.numItems = object3d.indices.length / buffer.indices.itemSize;

        if(object3d.textureSrc !== undefined) {
            buffer.texture = GL.createTexture();
            buffer.texture.loaded = false;
            buffer.texture.image = new Image();
            buffer.texture.image.onload = function () {
                handleLoadedTexture(buffer.texture);
            }
            buffer.texture.image.src = object3d.textureSrc;
        } else {
            buffer.texture = GL.createTexture();
            buffer.texture.loaded = true;
            buffer.texture.image = new Image();
        }

        buffer.textureCoord = GL.createBuffer();
        GL.bindBuffer(GL.ARRAY_BUFFER, buffer.textureCoord);
        GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(object3d.textureCoord), GL.STATIC_DRAW);
        buffer.textureCoord.itemSize = 2;
        buffer.textureCoord.numItems = object3d.textureCoord.length / buffer.textureCoord.itemSize;

        buffer.color = GL.createBuffer();
        GL.bindBuffer(GL.ARRAY_BUFFER, buffer.color);
        GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(object3d.colors), GL.STATIC_DRAW);
        buffer.color.itemSize = 4;
        buffer.color.numItems = object3d.colors.length / buffer.color.itemSize;

        this.object3dBuffer.push(buffer);
    } else {
        GL.uniform1i(this.shaderProgram.useLightingUniform, 1);
        GL.uniform1f(this.shaderProgram.shiniUniform, 5.0);
        buffer.obj3d = object3d;

        this.object3dBuffer.push(buffer);
    }
}

var eventAfterRender = new CustomEvent('after-render');
var eventLightFollow = new CustomEvent('light-follow');

WebGL.prototype.geometryToBuffer = function(o) {
    GL.bindBuffer(GL.ARRAY_BUFFER, o.position);
    GL.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, o.position.itemSize, GL.FLOAT, false, 0, 0);

    GL.bindBuffer(GL.ARRAY_BUFFER, o.color);
    GL.vertexAttribPointer(this.shaderProgram.vertexColorAttribute, o.color.itemSize, GL.FLOAT, false, 0, 0);

    GL.bindBuffer(GL.ARRAY_BUFFER, o.normal);
    GL.vertexAttribPointer(this.shaderProgram.vertexNormalAttribute, o.normal.itemSize, GL.FLOAT, false, 0, 0);

    GL.bindBuffer(GL.ARRAY_BUFFER, o.textureCoord);
    GL.vertexAttribPointer(this.shaderProgram.textureCoordAttribute, o.textureCoord.itemSize, GL.FLOAT, false, 0, 0);

    if(o.textureSrc !== undefined){
        GL.activeTexture(GL.TEXTURE0);
        GL.bindTexture(GL.TEXTURE_2D, o.texture);
        GL.uniform1i(this.shaderProgram.samplerUniform, 0);
    }

    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, o.indices);
}

WebGL.prototype.lightningToBuffer = function(o) {
    if (o.obj3d.type === 'ambient-light') {
        GL.uniform3f(this.shaderProgram.ambientColorUniform, o.obj3d.color.r, o.obj3d.color.g, o.obj3d.color.b);
    } else if (o.obj3d.type === 'point-light') {
        document.dispatchEvent(eventLightFollow);
        GL.uniform3f(this.shaderProgram.pointLightingLocationUniform, o.obj3d.position.x, o.obj3d.position.y, o.obj3d.position.z)
        GL.uniform3f(this.shaderProgram.pointLightingColorUniform, o.obj3d.color.r, o.obj3d.color.g, o.obj3d.color.b);
    }
}

var eventRightClick = new CustomEvent('right-click');

// Color, Light, and other

function Color(hex){
    if(hex.charAt(0) == '0' && hex.charAt(1) === 'x'){
        hex = hex.substr(2);
    }
    let values = hex.split('');
    this.r = parseInt(values[0].toString() + values[1].toString(), 16);
    this.g = parseInt(values[2].toString() + values[3].toString(), 16);
    this.b = parseInt(values[4].toString() + values[5].toString(), 16);
}

function AmbientLight(color, intensity = 0.2) {
    this.type = 'ambient-light';
    this.color = {};
    console.log(color);
    this.color.r = (color.r - 0)/255 * intensity;
    this.color.g = (color.g - 0)/255 * intensity;
    this.color.b = (color.b - 0)/255 * intensity;
}

function PointLight(color, position) {
    this.type = 'point-light';
    this.color = {};
    this.color.r = (color.r - 0)/255;
    this.color.g = (color.g - 0)/255;
    this.color.b = (color.b - 0)/255;
    this.position = position;
}

function multiply(a,b) {
    let c1,c2,c3,c4;
    c1 = a[0]*b[0] + a[4]*b[1] + a[8]*b[2] + a[12]*b[3]
    c2 = a[1]*b[0] + a[5]*b[1] + a[9]*b[2] + a[13]*b[3]
    c3 = a[2]*b[0] + a[6]*b[1] + a[10]*b[2] + a[14]*b[3]
    c4 = a[3]*b[0] + a[7]*b[1] + a[11]*b[2] + a[15]*b[3]
    return [c1,c2,c3,c4]
}

// Base Geometry Class

function Geometry(){
    this.id = btoa(Math.random()).substring(0,12);
    this.matrixWorld = mat4.create();

    this.temporaryMatrixWorld = undefined;

    this.rotation = {
        _x : 0,
        _y : 0,
        _z : 0,
        updateMatrixWorld : function(deg, array) {
            mat4.rotate(this.matrixWorld, this.matrixWorld, glMatrix.toRadian(deg), array);
        }.bind(this)
    }
    Object.defineProperties(this.rotation, {
        x : {
            get : function () {
                return this._x;
            },

            set: function (value) {
                this._x = value;
                this.updateMatrixWorld(this._x, [1, 0, 0]);
            }
        },
        y : {
            get : function () {
                return this._y;
            },

            set: function (value) {
                this._y = value;
                this.updateMatrixWorld(this._y, [0, 1, 0]);
            }
        },
        z : {
            get : function () {
                return this._z;
            },

            set: function (value) {
                this._z = value;
                this.updateMatrixWorld(this._z, [0, 0, 1]);
            }
        },
    });

    this.translate = {
        to : [0, 0, 0],
        updateMatrixWorld : function() {
            mat4.translate(this.matrixWorld, this.matrixWorld, this.translate.to);
        }.bind(this)
    }
    Object.defineProperties(this.translate,{
        mat : {
            get : function () {
                return this.to;
            },
            set : function (value) {
                this.to = value;
                this.updateMatrixWorld();
            },
        },
    });

    this.move = {
        direction : [0, 0, 0],
        vector : function(value) {
            this.direction[0] += value[0];
            this.direction[1] += value[1];
            this.direction[2] += value[2];
            this.updateMatrixWorld();
        },
        updateMatrixWorld : function() {
            mat4.translate(this.matrixWorld, this.matrixWorld, this.move.direction);
        }.bind(this)
    }

}

Geometry.prototype.constructor = Geometry;



var AMORTIZATION = 0.95;
var drag = false;
var old_x, old_y;
var dX = 0, dY = 0;
var THETA = 0, PHI = 0;

var mouseDown = function(e) {
    if(e.which === 1){
        drag = true;
        old_x = e.pageX, old_y = e.pageY;
        e.preventDefault();
        return false;
    } else if (e.which === 3){
        e.preventDefault();
        document.dispatchEvent(eventRightClick);
    }
};

var mouseUp = function(e){
    if(e.which ===  1){
        drag = false;
    }
};

var mouseMove = function(e) {
    if(e.which === 1){
        if (!drag) return false;
        dX = (e.pageX-old_x)*2*Math.PI/GL.VIEWPORT_WIDTH/2,
            dY = (e.pageY-old_y)*2*Math.PI/GL.VIEWPORT_HEIGHT/2;
        THETA+= dX;
        PHI+=dY;
        old_x = e.pageX, old_y = e.pageY;
        e.preventDefault();
    }
};

document.addEventListener("mousedown", mouseDown, false);
document.addEventListener("mouseup", mouseUp, false);
document.addEventListener("mouseout", mouseUp, false);
document.addEventListener("mousemove", mouseMove, false);
window.oncontextmenu = function (){
    return false;     // cancel default menu
}

class CollisionDetector{
    constructor(box, r){
        this.box = box;
        this.r = r;

        this.THRESHOLD = 0.05;
    }

    buildCollider(){
        let point = this.box.position;
        this.BACK = this.planeFromPoint(point[2], point[3], point[6]);
        this.FRONT = this.planeFromPoint(point[1], point[4], point[5]);
        this.RIGHT = this.planeFromPoint(point[1], point[3], point[5]);
        this.LEFT = this.planeFromPoint(point[0], point[2],point[4]);
        this.BOTTOM = this.planeFromPoint(point[1], point[2], point[3]);
        this.TOP = this.planeFromPoint(point[4], point[5], point[6]);
    }

    planeFromPoint(A, B, C) {
        let n = [], temp = [], temp2 = []
        temp = vec3.subtract(temp,B,A)
        temp2= vec3.subtract(temp2,C,B)
        n = vec3.cross(n,temp,temp2)

        let D = 0;
        D = vec3.dot(n.map(x =>-x), A)
        // Equation = n_x X + n_y Y + n_z Z - D = 0
        return n.concat(D)
    }

    distancePointToPlane(planeEq, point) {
        let new_point = point;
        let num = Math.abs(
            planeEq[0]*new_point[0] +
            planeEq[1]*new_point[1] +
            planeEq[2]*new_point[2] + planeEq[3])
        let denum = Math.sqrt(planeEq.slice(0,3).map(x => x*x).reduce((a,b) => a+b, 0))
        return num/denum
    }

    detect(){
        let pos = this.r.position;
        for(let i = 0; i < pos.length; i++){
            if(this.distancePointToPlane(this.TOP, pos[i]) < this.THRESHOLD && dir[1] > 0) {dir[1] *= -1; rotater *= -1; console.log("TOP"); return;}
            if(this.distancePointToPlane(this.TOP, pos[i]) < this.THRESHOLD && dir[1] < 0) {return;}
        }
        for(let i = 0; i < pos.length; i++){
            if(this.distancePointToPlane(this.BOTTOM, pos[i]) < this.THRESHOLD && dir[1] < 0) {dir[1] *= -1; rotater *= -1; console.log("BOTTOM"); return;}
            if(this.distancePointToPlane(this.BOTTOM, pos[i]) < this.THRESHOLD && dir[1] > 0) {return;}
        }
        for(let i = 0; i < pos.length; i++){
            if(this.distancePointToPlane(this.FRONT, pos[i]) < this.THRESHOLD && dir[2] > 0) {dir[2] *= -1; rotater *= -1; console.log("FRONT"); return;}
            if(this.distancePointToPlane(this.FRONT, pos[i]) < this.THRESHOLD && dir[2] < 0) {return;}
        }
        for(let i = 0; i < pos.length; i++){
            if(this.distancePointToPlane(this.BACK, pos[i]) < this.THRESHOLD && dir[2] < 0) {dir[2] *= -1; rotater *= -1; console.log("BACK"); return;}
            if(this.distancePointToPlane(this.BACK, pos[i]) < this.THRESHOLD && dir[2] > 0) {return;}
        }
        for(let i = 0; i < pos.length; i++){
            if(this.distancePointToPlane(this.RIGHT, pos[i]) < this.THRESHOLD && dir[0] > 0) {dir[0] *= -1; rotater *= -1; console.log("RIGHT"); return;}
            if(this.distancePointToPlane(this.RIGHT, pos[i]) < this.THRESHOLD && dir[0] < 0) {return;}
        }
        for(let i = 0; i < pos.length; i++){
            if(this.distancePointToPlane(this.LEFT, pos[i]) < this.THRESHOLD && dir[0] < 0) {dir[0] *= -1; rotater *= -1; console.log("LEFT"); return;}
            if(this.distancePointToPlane(this.LEFT, pos[i]) < this.THRESHOLD && dir[0] < 0) {return;}
        }
    }
}

WebGL.prototype.renderOne = function(sw, sh, ew, eh) {
    GL.scissor(sw, sh, ew, eh)
    GL.viewport(sw, sh, ew, eh);
    GL.clear(GL.COLOR_BUFFER_BIT, GL.DEPTH_BUFFER_BIT);
    // Perspective Camera
    mat4.perspective(this.pvMatrix[1], glMatrix.toRadian(45), GL.VIEWPORT_WIDTH/GL.VIEWPORT_HEIGHT, 0.1, 1000.0)

    mat4.identity(this.mvMatrix[1]);
    mat4.translate(this.mvMatrix[1], this.mvMatrix[1], [0.0, 0.0,-50.0])
    for(let i = 0; i < this.object3dBuffer.length; i++) {
        this.mvPushMatrix(1);

        let o = this.object3dBuffer[i];

        if(o.obj3d.type === 'geometry') {
            var ev = new CustomEvent(o.id);
            document.dispatchEvent(ev);
            // Get matrixWorld from action
            mat4.multiply(this.mvMatrix[1], this.mvMatrix[1], o.obj3d.matrixWorld);

            this.geometryToBuffer(o);

            // Get object world position
            let temp = [];
            for(let i = 0; i < o.obj3d.vertices_.length; i++){
                temp.push(multiply(this.mvMatrix[1], o.obj3d.vertices_[i]));
            }
            o.obj3d.position = JSON.parse(JSON.stringify(temp));

            this.setMatrixUniform(1);

            GL.drawElements(GL.TRIANGLES, o.indices.numItems, GL.UNSIGNED_SHORT, 0);
        } else {
            this.lightningToBuffer(o);
        }

        this.mvPopMatrix(1);

    }

    document.dispatchEvent(eventAfterRender);
}

WebGL.prototype.renderTwo = function(sw, sh, ew, eh) {
    GL.scissor(sw, sh, ew, eh)
    GL.viewport(sw, sh, ew, eh);
    GL.clear(GL.COLOR_BUFFER_BIT, GL.DEPTH_BUFFER_BIT);
    // Perspective Camera
    mat4.perspective(this.pvMatrix[2], glMatrix.toRadian(45), GL.VIEWPORT_WIDTH/GL.VIEWPORT_HEIGHT, 0.1, 1000.0)

    mat4.identity(this.mvMatrix[2]);
    // Mouse Interaction from GLobal varaible
    mat4.translate(this.mvMatrix[2], this.mvMatrix[2], [0.0, 0.0,-50.0])
    // Special Interaction
    document.addEventListener('right-click', function(){
        THETA = 0;
        PHI = 0;
    });
    mat4.rotateY(this.mvMatrix[2], this.mvMatrix[2], THETA);
    mat4.rotateX(this.mvMatrix[2], this.mvMatrix[2], PHI);

    for(let i = 0; i < this.object3dBuffer.length; i++) {
        this.mvPushMatrix(2);

        let o = this.object3dBuffer[i];
        if(o.obj3d.type === 'geometry') {
            // Get matrixWorld from action
            mat4.multiply(this.mvMatrix[2], this.mvMatrix[2], o.obj3d.matrixWorld);
            this.geometryToBuffer(o);

            // Get object world position
            let temp = [];
            for(let i = 0; i < o.obj3d.vertices_.length; i++){
                temp.push(multiply(this.mvMatrix[2], o.obj3d.vertices_[i]));
            }
            o.obj3d.position = JSON.parse(JSON.stringify(temp));

            this.setMatrixUniform(2);
            GL.drawElements(GL.TRIANGLES, o.indices.numItems, GL.UNSIGNED_SHORT, 0);
        } else {
            this.lightningToBuffer(o);
        }
        this.mvPopMatrix(2);
    }
    document.dispatchEvent(eventAfterRender);
}


// Frame 4
var cameraAngle = 0;

WebGL.prototype.renderFour = function(sw, sh, ew, eh) {
    GL.scissor(sw, sh, ew, eh)
    GL.viewport(sw, sh, ew, eh);
    GL.clear(GL.COLOR_BUFFER_BIT, GL.DEPTH_BUFFER_BIT);
    // Perspetive Camera
    mat4.perspective(this.pvMatrix[4], glMatrix.toRadian(45), GL.VIEWPORT_WIDTH/GL.VIEWPORT_HEIGHT, 0.1, 1000.0)

    mat4.identity(this.mvMatrix[4]);
    // Camera Translation
    let cameraMatrix = mat4.create(), viewMatrix = mat4.create();
    mat4.rotateY(cameraMatrix, cameraMatrix, cameraAngle);
    mat4.translate(cameraMatrix, cameraMatrix, [0, 0, 50]);
    
    mat4.invert(viewMatrix,cameraMatrix);
    mat4.multiply(this.pvMatrix[4], this.pvMatrix[4],  viewMatrix);

    for(let i = 0; i < this.object3dBuffer.length; i++) {
        this.mvPushMatrix(4);
        let o = this.object3dBuffer[i];

        if(o.obj3d.type === 'geometry') {
            // Get matrixWorld from action
            mat4.multiply(this.mvMatrix[4], this.mvMatrix[4], o.obj3d.matrixWorld);
            this.geometryToBuffer(o);

            // Get object world position
            let temp = [];
            for(let i = 0; i < o.obj3d.vertices_.length; i++){
                temp.push(multiply(this.mvMatrix[4], o.obj3d.vertices_[i]));
            }
            o.obj3d.position = JSON.parse(JSON.stringify(temp));

            this.setMatrixUniform(4);
            GL.drawElements(GL.TRIANGLES, o.indices.numItems, GL.UNSIGNED_SHORT, 0);
        } else {
            this.lightningToBuffer(o);
        }
        this.mvPopMatrix(4);
    }
    cameraAngle += 0.02;
}

WebGL.prototype.render = function() {
    GL.enable(GL.SCISSOR_TEST);

    let width = GL.VIEWPORT_WIDTH;
    let height = GL.VIEWPORT_HEIGHT;
    this.renderOne(0, 1 * height / 2, width / 2, height / 2);
    this.renderTwo(1 * width / 2, 1 * height / 2, width / 2, height / 2);
    this.renderFour(1 * width / 2, 0, width / 2, height / 2);
}

var rotater = 1;
var dir = [1, 1, 1];