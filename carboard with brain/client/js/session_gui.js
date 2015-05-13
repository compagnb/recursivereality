// Session
// Barbara Compagnoni
// Spring 2015
//
// Based off of the Tutorial on learningthreejs.org
// Water Shader -  @author jbouny / https://github.com/jbouny
// Mirror Shader - @author Slayvin / http://slayvin.net
// Gui - http://code.google.com/p/dat-gui Copyright 2011 Data Arts Team, Google Creative Lab


// variables -----------------------------------------------------------------
var container, stats;
var camera, scene, renderer;
var width = window.innerWidth;
var height = window.innerHeight;

// uniforms? -----------------------------------------------------------------
var parameters = {
    width: 2000,
    height: 2000,
    widthSegments: 250,
    heightSegments: 250,
    depth: 1500,
    param: 4,
    filterparam: 1
}

var waterNormals;

// gui input
 var guiParams = {
    alpha: 1.0,
    time: 0.0,
    distortionScale: 20.0,
    waterSunColor: "#7F7F7F",
    waterColor: "#555555"
}



// functions ------------------------------------------------------------------


detectwebGL(); // detect webGL
guiLoad(); // load gui
init(); // initializes scene
animate(); // adds animation

function detectwebGL(){
    // if webgl is not detected ----------------------------------
    if ( ! Detector.webgl ) {
        Detector.addGetWebGLMessage();
        document.getElementById( 'container' ).innerHTML = "";
    }
}

function guiLoad(){
    window.onload = function(){
        //basic use
        var gui = new dat.GUI({
            load: JSON,
            preset: 'Flow'});



    var waterGui = gui.addFolder('water variables');
        var waterAlpha = waterGui.add(guiParams, 'alpha', 0, 1);
        var waterTime = waterGui.add(guiParams, 'time', -60, 60); // min and max
        var waterDistortion = waterGui.add(guiParams, 'distortionScale', -1000, 1000); // min and max
    waterGui.open();
        var waterSunColor = gui.addColor(guiParams, 'waterSunColor');
        var waterWaterColor = gui.addColor(guiParams, 'waterColor');
    };
}

function init(){

    //create a div and append it to the body tag
    container = document.createElement( 'div');
    document.body.appendChild( container);

    // Renderer Setup -----------------------------------------------------
    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio( window.devicePixelRatio);
    renderer.setSize( width, height );
    container.appendChild(renderer.domElement);
    //---------------------------------------------------------------------

    // Scene Create -------------------------------------------------------
    scene = new THREE.Scene();
    //---------------------------------------------------------------------

    // Camera Setup -------------------------------------------------------
    camera = new THREE.PerspectiveCamera( 55, width / height, 0.5, 3000000);
    camera.position.set (2000, 750, 2000);
    //---------------------------------------------------------------------

    // Controls Setup -----------------------------------------------------
    controls = new THREE.OrbitControls( camera, renderer.domElement);
    controls.userPan = false;
    controls.userPanSpeed = 0.0;
    controls.maxDistance = 5000.0;
    controls.maxPolarAngle = Math.PI * 0.495;
    controls.center.set(0, 500, 0);
    //---------------------------------------------------------------------

    // Light Setup --------------------------------------------------------
    // var light = new THREE.HemisphereLight( 0xFFFFCC, 0x080820, 1);
    // light.position.set ( -1, 1, -1);
    // scene.add(light);

    // Directional Light Setup --------------------------------------------
    var directionalLight = new THREE.DirectionalLight(0xffff55, 1);
    directionalLight.position.set(-600, 300, 600);
    scene.add(directionalLight);

    // Water Setup --------------------------------------------------------
    //load water normals texture and tile it
    waterNormals = new THREE.ImageUtils.loadTexture ('textures/waternormals.jpg');
    waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;

    //create water using shader - passing uniforms ------------------------
    water = new THREE.Water( renderer, camera, scene, {
                    textureWidth: 512,
                    textureHeight: 512,
                    waterNormals: waterNormals,
                    alpha:  1.0,
                    sunDirection: directionalLight.position.clone().normalize(),
                    sunColor: 0xffffff,
                    waterColor: 0x001e0f,
                    distortionScale: 50.0,
                } );

    //create mirror mesh using water shader
    mirrorMesh = new THREE.Mesh(
                    new THREE.PlaneBufferGeometry( parameters.width * 500, parameters.height * 500 ),
                    water.material
                );

                mirrorMesh.add( water );
                mirrorMesh.rotation.x = - Math.PI * 0.5;
                scene.add( mirrorMesh );


    // Load SkyBox --------------------------------------------------------
    loadSkyBox();
}


// ----------------------------------------------------------------------
// SKYBOX
// ----------------------------------------------------------------------
function loadSkyBox() {

    var cubeMap = new THREE.CubeTexture( [] );
    // if we use more then one image...
    // var cubeMap = THREE.ImageUtils.loadTextureCube([
    //   'assets/img/px.jpg',
    //   'assets/img/nx.jpg',
    //   'assets/img/py.jpg',
    //   'assets/img/ny.jpg',
    //   'assets/img/pz.jpg',
    //   'assets/img/nz.jpg'
    // ]);
    cubeMap.format = THREE.RGBFormat;

    // for only one file follow below...
    cubeMap.flipY = false;

    var loader = new THREE.ImageLoader();
    loader.load('textures/skyboxsun25degtest.png', function(image){
        var getSide = function(x, y){
            var size = 1024;

            //create a canvas tag
            var canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;

            var context = canvas.getContext('2d');
            context.drawImage(image, -x * size, -y * size);
            return canvas;
        };

        //map single image to sides of skyBox cube
        cubeMap.images [0] = getSide(2, 1); //px
        cubeMap.images [1] = getSide(0, 1); //nx
        cubeMap.images [2] = getSide(1, 0); //py
        cubeMap.images [3] = getSide(1, 2); //ny
        cubeMap.images [4] = getSide(1, 1); //pz
        cubeMap.images [5] = getSide(3, 1); //nx
        cubeMap.needsUpdate = true;
    });

    // for both one file and multiple files
    var cubeShader = THREE.ShaderLib['cube'];
    cubeShader.uniforms['tCube'].value = cubeMap;

    var skyBoxMaterial = new THREE.ShaderMaterial({
        fragmentShader: cubeShader.fragmentShader,
        vertexShader: cubeShader.vertexShader,
        uniforms: cubeShader.uniforms,
        depthWrite: false,
        side: THREE.BackSide
    });

    var skyBox = new THREE.Mesh(
        new THREE.BoxGeometry(1000000, 1000000, 1000000),
        skyBoxMaterial
        );

    scene.add(skyBox);
}

//-----------------------------------------------------------------------------
// animate function
//-----------------------------------------------------------------------------

function animate(){
    requestAnimationFrame( animate );
    render();
}

//-----------------------------------------------------------------------------
// render function
//-----------------------------------------------------------------------------

function render(){
    //var time = performance.now() * 0.001;
    //water.material.uniforms.time.value += time / 60;
    waterUpdate();
    controls.update();
    water.render();
    renderer.render( scene, camera );
}

//-----------------------------------------------------------------------------
// update water function
//-----------------------------------------------------------------------------
function waterUpdate(){

    water.material.uniforms.alpha.value = guiParams.alpha;
    water.material.uniforms.time.value += guiParams.time / 60;
    water.material.uniforms.distortionScale.value = guiParams.distortionScale;
    water.material.uniforms.sunColor.value.setHex( guiParams.waterSunColor.replace("#", "0x") );
    //console.log(water.material.uniforms.sunColor.value);
    water.material.uniforms.waterColor.value.setHex( guiParams.waterColor.replace("#", "0x") );
    //console.log(water.material.uniforms.waterColor.value);
}

