'use strict';

let gl;                         // The webgl context.
let surface;                    // A surface model
let shProgram;                  // A shader program
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.
const { PI, sin, cos } = Math
const timestamp = Date.now();
let lightSurf;
let pointOfScaling = [1.0, 1.0]

function deg2rad(angle) {
    return angle * Math.PI / 180;
}


// Constructor
function Model(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();
    this.iNormalBuffer = gl.createBuffer();
    this.iTextureBuffer = gl.createBuffer();
    this.count = 0;

    this.BufferData = function (vertices) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);

        this.count = vertices.length / 3;
    }

    this.NormalBufferData = function (vertices) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);

        this.count = vertices.length / 3;
    }

    this.TextureBufferData = function (vertices) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTextureBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);

    }

    this.Draw = function () {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.vertexAttribPointer(shProgram.iAttribNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribNormal);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTextureBuffer);
        gl.vertexAttribPointer(shProgram.iAttribTexture, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribTexture);

        gl.drawArrays(gl.TRIANGLES, 0, this.count);
    }
}


// Constructor
function ShaderProgram(name, program) {

    this.name = name;
    this.prog = program;

    // Location of the attribute variable in the shader program.
    this.iAttribVertex = -1;
    // Location of the uniform specifying a color for the primitive.
    this.iColor = -1;
    // Location of the uniform matrix representing the combined transformation.
    this.iModelViewProjectionMatrix = -1;

    this.Use = function () {
        gl.useProgram(this.prog);
    }
}


/* Draws a colored cube, along with a set of coordinate axes.
 * (Note that the use of the above drawPrimitive function is not an efficient
 * way to draw with WebGL.  Here, the geometry is so simple that it doesn't matter.)
 */
function draw() {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    /* Set the values of the projection transformation */
    let projection = m4.perspective(Math.PI / 8, 1, 8, 12);

    /* Get the view matrix from the SimpleRotator object.*/
    let modelView = spaceball.getViewMatrix();

    let rotateToPointZero = m4.axisRotation([0.707, 0.707, 0], 0.7);
    let translateToPointZero = m4.translation(0, 0, -10);

    let matAccum0 = m4.multiply(rotateToPointZero, modelView);
    let matAccum1 = m4.multiply(translateToPointZero, matAccum0);

    /* Multiply the projection matrix times the modelview matrix to give the
       combined transformation matrix, and send that to the shader program. */
    let modelViewProjection = m4.multiply(projection, matAccum1);

    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);

    let normalMatrix = m4.identity();
    m4.inverse(modelView, normalMatrix);
    m4.transpose(normalMatrix, normalMatrix);

    gl.uniformMatrix4fv(shProgram.iNormalMatrix, false, normalMatrix);

    /* Draw the six faces of a cube, with different colors. */
    gl.uniform4fv(shProgram.iColor, [0.1, 1, 0.5, 1]);
    gl.uniform1f(shProgram.iTime, (Date.now() - timestamp) * 0.001);
    gl.uniform2fv(shProgram.iPointOfScaling, [map(pointOfScaling[0], 0, Math.PI * 12, 0, 1), map(pointOfScaling[1], 0, Math.PI * 2, 0, 1)]);
    gl.uniform3fv(shProgram.iPointPosition, cloverKnot(pointOfScaling[0], pointOfScaling[1], 2, 0.5));
    gl.uniform1f(shProgram.iScalingNumber, parseFloat(document.getElementById('scale').value));

    surface.Draw();
    gl.uniform1i(shProgram.iTranslateLight, true);
    lightSurf.Draw();
    gl.uniform1i(shProgram.iTranslateLight, false);
}

function getAnimationFrame() {
    draw()
    window.requestAnimationFrame(getAnimationFrame)
}

function map(value, a, b, c, d) {
    value = (value - a) / (b - a);
    return c + value * (d - c);
}

function cloverKnotVerts(U_NUM_STEPS, V_NUM_STEPS, R, a) {
    let vertices = []
    let normals = []
    let textures = []
    const U_MAX = 12 * PI
    const V_MAX = 2 * PI
    const U_STEP = U_MAX / U_NUM_STEPS
    const V_STEP = V_MAX / V_NUM_STEPS
    for (let u = 0; u < U_MAX; u += U_STEP) {
        for (let v = 0; v < V_MAX; v += V_STEP) {
            vertices.push(...cloverKnot(u, v, R, a))
            normals.push(...normalAnalytic(u, v, R, a))
            textures.push(map(u, 0, U_MAX, 0, 1), map(v, 0, V_MAX, 0, 1))
            vertices.push(...cloverKnot(u + U_STEP, v, R, a))
            normals.push(...normalAnalytic(u + U_STEP, v, R, a))
            textures.push(map(u + U_STEP, 0, U_MAX, 0, 1), map(v, 0, V_MAX, 0, 1))
            vertices.push(...cloverKnot(u, v + V_STEP, R, a))
            normals.push(...normalAnalytic(u, v + V_STEP, R, a))
            textures.push(map(u, 0, U_MAX, 0, 1), map(v + V_STEP, 0, V_MAX, 0, 1))
            vertices.push(...cloverKnot(u, v + V_STEP, R, a))
            normals.push(...normalAnalytic(u, v + V_STEP, R, a))
            textures.push(map(u, 0, U_MAX, 0, 1), map(v + V_STEP, 0, V_MAX, 0, 1))
            vertices.push(...cloverKnot(u + U_STEP, v, R, a))
            normals.push(...normalAnalytic(u + U_STEP, v, R, a))
            textures.push(map(u + U_STEP, 0, U_MAX, 0, 1), map(v, 0, V_MAX, 0, 1))
            vertices.push(...cloverKnot(u + U_STEP, v + V_STEP, R, a))
            normals.push(...normalAnalytic(u + U_STEP, v + V_STEP, R, a))
            textures.push(map(u + U_STEP, 0, U_MAX, 0, 1), map(v + V_STEP, 0, V_MAX, 0, 1))
        }
    }
    return [vertices, normals, textures];
}

function cloverKnot(u, v, R, a) {
    const m = 0.25;
    let x = (R + a * cos(u / 2)) * cos(u / 3) + a * cos(u / 3) * cos(v - PI);
    let y = (R + a * cos(u / 2)) * sin(u / 3) + a * sin(u / 3) * cos(v - PI);
    let z = a + sin(u / 2) + a * sin(v - PI);
    return [m * x, m * y, m * z];
}

const e = 0.0001;
function normalAnalytic(u, v, R, a) {
    let u1 = cloverKnot(u, v, R, a),
        u2 = cloverKnot(u + e, v, R, a),
        v1 = cloverKnot(u, v, R, a),
        v2 = cloverKnot(u, v + e, R, a);
    const dU = [], dV = []
    for (let i = 0; i < 3; i++) {
        dU.push((u1[i] - u2[i]) / e)
        dV.push((v1[i] - v2[i]) / e)
    }
    const n = m4.normalize(m4.cross(dU, dV))
    return n
}

function CreateSphereData() {
    let vertexList = [];
    let normalList = [];

    let u = 0,
        t = 0;
    while (u < Math.PI * 2) {
        while (t < Math.PI) {
            let v = getSphereVertex(u, t);
            let w = getSphereVertex(u + 0.1, t);
            let wv = getSphereVertex(u, t + 0.1);
            let ww = getSphereVertex(u + 0.1, t + 0.1);
            vertexList.push(v.x, v.y, v.z);
            normalList.push(v.x, v.y, v.z);
            vertexList.push(w.x, w.y, w.z);
            normalList.push(w.x, w.y, w.z);
            vertexList.push(wv.x, wv.y, wv.z);
            normalList.push(wv.x, wv.y, wv.z);
            vertexList.push(wv.x, wv.y, wv.z);
            normalList.push(wv.x, wv.y, wv.z);
            vertexList.push(w.x, w.y, w.z);
            normalList.push(w.x, w.y, w.z);
            vertexList.push(ww.x, ww.y, ww.z);
            normalList.push(ww.x, ww.y, ww.z);
            t += 0.1;
        }
        t = 0;
        u += 0.1;
    }
    return [vertexList, normalList]
}
const r = 0.05;
function getSphereVertex(long, lat) {
    return {
        x: r * Math.cos(long) * Math.sin(lat),
        y: r * Math.sin(long) * Math.sin(lat),
        z: r * Math.cos(lat)
    }
}


/* Initialize the WebGL context. Called from init() */
function initGL() {
    let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);

    shProgram = new ShaderProgram('Basic', prog);
    shProgram.Use();

    shProgram.iAttribVertex = gl.getAttribLocation(prog, "vertex");
    shProgram.iAttribNormal = gl.getAttribLocation(prog, "normal");
    shProgram.iAttribTexture = gl.getAttribLocation(prog, "texture");
    shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    shProgram.iNormalMatrix = gl.getUniformLocation(prog, "NormalMatrix");
    shProgram.iColor = gl.getUniformLocation(prog, "color");
    shProgram.iTime = gl.getUniformLocation(prog, "t");
    shProgram.iTranslateLight = gl.getUniformLocation(prog, "translateLight");
    shProgram.iTMU = gl.getUniformLocation(prog, 'tmu');
    shProgram.iPointOfScaling = gl.getUniformLocation(prog, 'pointOfScaling');
    shProgram.iPointPosition = gl.getUniformLocation(prog, 'pointPos');
    shProgram.iScalingNumber = gl.getUniformLocation(prog, 'scalingNumber');

    surface = new Model('Surface');
    lightSurf = new Model('Surface');
    let bufferDataCK = cloverKnotVerts(100, 100, 2, 0.5)
    surface.BufferData(bufferDataCK[0]);
    surface.NormalBufferData(bufferDataCK[1]);
    surface.TextureBufferData(bufferDataCK[2]);
    let bufferDataLS = CreateSphereData();
    lightSurf.BufferData(bufferDataLS[0])
    lightSurf.NormalBufferData(bufferDataLS[1])
    lightSurf.TextureBufferData(bufferDataLS[1])

    gl.enable(gl.DEPTH_TEST);
}


/* Creates a program for use in the WebGL context gl, and returns the
 * identifier for that program.  If an error occurs while compiling or
 * linking the program, an exception of type Error is thrown.  The error
 * string contains the compilation or linking error.  If no error occurs,
 * the program identifier is the return value of the function.
 * The second and third parameters are strings that contain the
 * source code for the vertex shader and for the fragment shader.
 */
function createProgram(gl, vShader, fShader) {
    let vsh = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vsh, vShader);
    gl.compileShader(vsh);
    if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in vertex shader:  " + gl.getShaderInfoLog(vsh));
    }
    let fsh = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fsh, fShader);
    gl.compileShader(fsh);
    if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in fragment shader:  " + gl.getShaderInfoLog(fsh));
    }
    let prog = gl.createProgram();
    gl.attachShader(prog, vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw new Error("Link error in program:  " + gl.getProgramInfoLog(prog));
    }
    return prog;
}


/**
 * initialization function that will be called when the page has loaded
 */
function init() {
    let canvas;
    try {
        canvas = document.getElementById("webglcanvas");
        gl = canvas.getContext("webgl");
        if (!gl) {
            throw "Browser does not support WebGL";
        }
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }
    try {
        initGL();  // initialize the WebGL graphics context
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context: " + e + "</p>";
        return;
    }

    spaceball = new TrackballRotator(canvas, draw, 0);

    LoadTexture()
    getAnimationFrame()
}

function LoadTexture() {
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const image = new Image();
    image.crossOrigin = 'anonymus';
    image.src = "https://raw.githubusercontent.com/EldarHasanov/TextureForRGR/texture/Ice_Texture.jpg";
    image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            image
        );
        draw()
    }
}
window.onkeydown = (e) => {
    // console.log(e.keyCode)
    if (e.keyCode == 87) { //w
        pointOfScaling[0] = Math.min(pointOfScaling[0] + 0.1, Math.PI * 12);
    }
    else if (e.keyCode == 65) { //a
        pointOfScaling[1] = Math.max(pointOfScaling[1] - 0.1, 0);
    }
    else if (e.keyCode == 83) { //s
        pointOfScaling[0] = Math.max(pointOfScaling[0] - 0.1, 0);
    }
    else if (e.keyCode == 68) { //d
        pointOfScaling[1] = Math.min(pointOfScaling[1] + 0.1, Math.PI * 2);
    }
    draw();
}