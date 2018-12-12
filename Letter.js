
function Letter(depth, width, height, color = new Color("0x156289")) {
    Geometry.call(this);

    this.type = 'geometry';
    var w = width || 3;
    var h = height || 6;
    var d = depth || 1;

    this.vertices = [
        //depan
        -5.0, 5.0, 1.0, //0
        -5.0, -5.0, 1.0, //1
        -3.5, -5.0, 1.0, //2
        -3.5, -5.0, 1.0, //2
        -3.5, 5.0, 1.0, //3
        -5.0, 5.0, 1.0, //0

        -5.0, 5.0, 1.0, //0
        -3.5, 5.0, 1.0, //3
        5.0, -5.0, 1.0, //4
        5.0, -5.0, 1.0, //4
        3.5, -5.0, 1.0, //5
        -5.0, 5.0, 1.0, //0

        5.0, -5.0, 1.0, //4
        5.0, 5.0, 1.0, //6
        3.5, 5.0, 1.0, //7
        3.5, 5.0, 1.0, //
        5.0, -5.0, 1.0,
        3.5, -5.0, 1.0,

        //belakang
        -5.0, 5.0, 0.0,
        -5.0, -5.0, 0.0,
        -3.5, -5.0, 0.0,
        -3.5, -5.0, 0.0,
        -3.5, 5.0, 0.0,
        -5.0, 5.0, 0.0,

        -5.0, 5.0, 0.0,
        -3.5, 5.0, 0.0,
        5.0, -5.0, 0.0,
        5.0, -5.0, 0.0,
        3.5, -5.0, 0.0,
        -5.0, 5.0, 0.0,

        5.0, -5.0, 0.0,
        5.0, 5.0, 0.0,
        3.5, 5.0, 0.0,
        3.5, 5.0, 0.0,
        5.0, -5.0, 0.0,
        3.5, -5.0, 0.0,

        //kiri
        -5.0, 5.0, 1.0,
        -5.0, -5.0, 1.0,
        -5.0, -5.0, 0.0,
        -5.0, 5.0, 0.0,
        -5.0, 5.0, 1.0,
        -5.0, -5.0, 0.0,

        //kanan
        5.0, 5.0, 1.0,
        5.0, -5.0, 1.0,
        5.0, -5.0, 0.0,
        5.0, -5.0, 0.0,
        5.0, 5.0, 0.0,
        5.0, 5.0, 1.0,

        //atas
        -5.0, 5.0, 1.0, //0
        -3.5, 5.0, 1.0, //3
        -5.0, 5.0, 0.0, //8
        -5.0, 5.0, 0.0, //8
        -3.5, 5.0, 0.0, //11
        -3.5, 5.0, 1.0, //3

        5.0, 5.0, 1.0, //6
        3.5, 5.0, 1.0, //7
        5.0, 5.0, 0.0, //14
        5.0, 5.0, 0.0, //14
        3.5, 5.0, 0.0, //15
        3.5, 5.0, 1.0, //7

        -5.0, 5.0, 1.0, //0
        -5.0, 5.0, 0.0, //8
        3.5, -5.0, 1.0, //5
        3.5, -5.0, 1.0, //5
        3.5, -5.0, 0.0, //13
        -5.0, 5.0, 0.0, //8

        //bawah
        -5.0, -5.0, 1.0, //1
        -3.5, -5.0, 1.0, //2
        -5.0, -5.0, 0.0, //9
        -5.0, -5.0, 0.0, //9
        -3.5, -5.0, 0.0, //10
        -3.5, -5.0, 1.0, //2

        5.0, -5.0, 1.0, //4
        3.5, -5.0, 1.0, //5
        5.0, -5.0, 0.0, //12
        5.0, -5.0, 0.0, //12
        3.5, -5.0, 0.0, //13
        3.5, -5.0, 1.0, //5

        -3.5, 5.0, 1.0, //3
        -3.5, 5.0, 0.0, //11
        5.0, -5.0, 1.0, //4
        5.0, -5.0, 1.0, //4
        5.0, -5.0, 0.0, //12
        -3.5, 5.0, 0.0 //11
    ];

    this.indices = [
        0,1,2,2,3,0,
        0,3,4,4,5,0,
        4,6,7,7,4,5,
        8,9,10,10,11,8,
        8,11,12,12,13,8,
        12,14,15,15,12,13,
        0,1,9,8,0,9,
        6,4,12,12,14,6,
        0,3,8,8,11,3,
        6,7,14,14,15,7,
        0,8,5,5,13,8,
        1,2,9,9,10,2,
        4,5,12,12,13,5,
        3,11,4,4,12,11
    ];
    this.position = [];

    for(let i=0;i<this.vertices.length / 3; ++i){
        this.position.push([this.vertices[i*3],this.vertices[i*3+1],this.vertices[i*3+2],1.0]);
    }

    this.vertices_ = Object.assign([], this.position);
    this.normals = [];
    this.textureCoord = [];
    for(let i = 0; i < this.vertices.length / 3; i++){
        this.textureCoord.push(0.0, 0.0);
    }
    for(let i = 0; i < this.vertices.length / 6; i++){
        this.normals.push(0.0, 0.0, 1.0);
    }
    for(let i = 0; i < this.vertices.length / 6; i++){
        this.normals.push(0.0, 1.0, 0.0);
    }
    this.colors = []
    for(let i = 0; i < this.vertices.length / 3; i++){
        this.colors.push(color.r / 255, color.g / 255, color.b/ 255, 1.0);
    }

    this.textureSrc = undefined; //'Crate.jpg';
}

Letter.prototype.constructor = Letter;

Letter.prototype.render = function() {
    this.temporaryMatrixWorld = Object.assign({}, this.matrixWorld);
    document.addEventListener(this.id, this.action.bind(this));
}

Letter.prototype.findCenter = function() {
    let center = [0, 0, 0];
    for(let i = 0; i < this.position.length / 2; i++){
        center[0] += this.position[i][0];
        center[1] += this.position[i][1];
        center[2] += this.position[i][2];
    }
    center[0] /= this.position.length / 2;
    center[1] /= this.position.length / 2;
    center[2] /= this.position.length / 2;
    return center;
}

Letter.prototype.action = function() {

}