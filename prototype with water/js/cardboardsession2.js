// Session
// Barbara Compagnoni
// Spring 2015
// Recursive Reality
//
// Based off of the Tutorial on learningthreejs.org
// Water Shader -  @author jbouny / https://github.com/jbouny
// Mirror Shader - @author Slayvin / http://slayvin.net
// Gui - http://code.google.com/p/dat-gui Copyright 2011 Data Arts Team, Google Creative Lab

// variables ----------------------------------------------
var camera, scene, renderer;
var effect, controls;
var element, container;

var clock = new THREE.Clock();
var start = Date.now();
var worldCoordinates = new THREE.Vector3()

var light;
var water;
var width = window.innerWidth;
var height = window.innerHeight;

var AudioContext = window.AudioContext || window.webkitAudioContext;


// uniforms? -------------------------------------------
var parameters = {
  width: 512,
  height: 512,
  widthSegments: 250,
  heightSegments: 250,
  depth: 1500,
  param: 4,
  filterparam: 1
}

var waterNormals;

// gui input
var guiParams = {
  // water gui elements
  alpha: 1.0,
  time: 2.0,
  distortionScale: 50.0,
  waterSunColor: "#7F7F7F",
  waterColor: "#070161",
  divident: 100,
  amplitude: 0.8,
}

//brain data

var brainData = {
  eSense: {
    attention: 0,
    meditation: 0
  },
  eegPower: {
    delta: 0,
    theta: 0,
    lowAlpha: 0,
    highAlpha: 0,
    lowBeta: 0,
    highBeta: 0,
    lowGamma: 0,
    highGamma: 0
  }
  // ,
  // poorSignalLevel: 0,
  // blinkStrength: 0
  // }
};

// functions -----------------------------------------------------
detectwebGL(); // detect webGL
// socketio(); //socket io
guiLoad(); // load gui
init(); // initializes scene
animate(); // adds animation

// detect if browser has webGL -----------------------------------
function detectwebGL(){
    // if webgl is not detected ----------------------------------
    if ( ! Detector.webgl ) {
        Detector.addGetWebGLMessage();
        document.getElementById( 'container' ).innerHTML = "";
    }
}

// setup socket io to pass brain data ----------------------------
function socketio(){
  socket = io.connect();

  socket.on('connect', function (data) {
    console.log("web socket connected");
  });

  socket.on('mindEvent', function (datatest) {
    brainData = datatest
  });

  //console.log('data', brainData.eSense);
}

// load gui interface --------------------------------------------
function guiLoad(){
    window.onload = function(){
        //basic use
        var gui = new dat.GUI({
            load: JSON,
            preset: 'Flow'});

        var waterGui = gui.addFolder('water variables');
        var waterAlpha = waterGui.add(guiParams, 'alpha', 0, 1);
        var waterTime = waterGui.add(guiParams, 'time', -60, 60); // min and max
        var waterDistortion = waterGui.add(guiParams, 'distortionScale', -40000, 40000); // min and max

        var waterSunColor = gui.addColor(guiParams, 'waterSunColor');
        var waterWaterColor = gui.addColor(guiParams, 'waterColor');

        var waterDivident = waterGui.add(guiParams, 'divident', 0, 1000);
        var waterAmplitude = waterGui.add(guiParams, 'amplitude', 0, 1000);

        var segmentsX = waterGui.add(guiParams, 'segmentsX', 0, 1);
        var segmentsY = waterGui.add(guiParams, 'segmentsX', 0, 1);

        waterGui.open();
    };
}

// initialize scene and elements ----------------------------------
function init() {
  // creates a domain element and appends it to a tag called example
  renderer = new THREE.WebGLRenderer();
  element = renderer.domElement;
  container = document.getElementById('example');
  container.appendChild(element);

  // stats for testing purposes -----------------------------------
  stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.top = '0px';
  container.appendChild( stats.domElement );

  // initializing stereo effect -----------------------------------
  effect = new THREE.StereoEffect(renderer);

  // initializing scene -------------------------------------------
  scene = new THREE.Scene();

  // initializing sound -------------------------------------------
  // var context = new AudioContext();
  // var oceanSound = new Sound( context );
  //   oceanSound.load( './audio/oceanSounds' );
  //   oceanSound.setLoop( true );
  //   oceanSound.setVolume( 1.5 );
  //   oceanSound.play();

  // initialize camera --------------------------------------------
  camera = new THREE.PerspectiveCamera(90, 1, 0.5, 3000000);
  camera.position.set (100, 10, 0);
  scene.add(camera);
  // metrics from non carboard version
  // camera = new THREE.PerspectiveCamera( 105, width / height, 0.5, 3000000);
  // camera.position.set (2000, 250, 0);
  // scene.add(camera);

  // initialize controls ------------------------------------------
  controls = new THREE.OrbitControls(camera, element);
  controls.rotateUp(Math.PI / 4);
  controls.target.set(
    camera.position.x + 0.1,
    camera.position.y,
    camera.position.z
  );
  controls.noZoom = true;
  controls.noPan = true;

  // add listener for device orientation ---------------------------
  window.addEventListener('deviceorientation', setOrientationControls, true);

  // initialize scene lights ---------------------------------------
  // light = new THREE.HemisphereLight(0x777777, 0x000000, 0.6);
  // scene.add(light);

  // Light Setup --------------------------------------------------------
  light = new THREE.HemisphereLight( 0xFFFFCC, 0x9696f0, 1);
  light.position.set ( -1, 1, -1);
  scene.add(light);

  // Directional Light Setup --------------------------------------------
  var directionalLight = new THREE.DirectionalLight(0x195faf, 1);
  directionalLight.position.set(-600, 300, 600);
  // scene.add(directionalLight);

  // 2nd Directional Light Setup ----------------------------------------
  directionalLight2 = new THREE.DirectionalLight( 0xffff55, 1 );
  directionalLight2.position.set( -1, 0.6, -1 ).normalize();
  // scene.add( directionalLight2 );

  // loadTileFloor();
  loadFlatWater();
  loadSkyBox();

  window.addEventListener('resize', resize, false);
  setTimeout(resize, 1);
}

function setOrientationControls(e) {
  if (!e.alpha) {
    return;
  }

  controls = new THREE.DeviceOrientationControls(camera, true);
  controls.connect();
  controls.update();

  element.addEventListener('click', fullscreen, false);

  window.removeEventListener('deviceorientation', setOrientationControls, true);
}

function loadTileFloor(){
  var texture = THREE.ImageUtils.loadTexture('textures/patterns/checker.png');
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat = new THREE.Vector2(50, 50);
    texture.anisotropy = renderer.getMaxAnisotropy();

  var material = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    specular: 0xffffff,
    shininess: 20,
    shading: THREE.FlatShading,
    map: texture
  });

  var geometry = new THREE.PlaneGeometry(1000, 1000);

  var mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  scene.add(mesh);
}

function loadFlatWater(){
  // waterNormals = new THREE.ImageUtils.loadTexture( 'textures/waternormals.jpg' );
  // waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;
  //new texture load
  waterNormals = new THREE.ImageUtils.loadTexture( 'textures/waternormals.jpg' );
    waterNormals.wrapS = THREE.RepeatWrapping;
    waterNormals.wrapT = THREE.RepeatWrapping;
    waterNormals.repeat = new THREE.Vector2(512, 512);
    waterNormals.anisotropy = renderer.getMaxAnisotropy();

  water = new THREE.Water( renderer, camera, scene, {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals: waterNormals,
    alpha:   1.0,
    sunDirection: light.position.clone().normalize(),
    sunColor: 0xffffff,
    waterColor: 0x001e0f,
    distortionScale: 20000.0,
    } );

  mirrorMesh = new THREE.Mesh(
    new THREE.PlaneBufferGeometry( parameters.width * 500, parameters.height * 500 ),
    water.material
  );

  mirrorMesh.add( water );
  mirrorMesh.rotation.x = - Math.PI * 0.5;
  scene.add( mirrorMesh );
}

function loadSkyBox(){
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
  loader.load('textures/patterns/cardboard_skyboxsun25degtest.png', function(image){
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
    new THREE.BoxGeometry(1000000, 1000000, 1000000), skyBoxMaterial);

  scene.add(skyBox);
}

function resize() {
  var width = container.offsetWidth;
  var height = container.offsetHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  effect.setSize(width, height);
}

function update(dt) {
  resize();

  camera.updateProjectionMatrix();

  controls.update(dt);
}

function render(dt) {
  waterUpdate();
  water.material.uniforms.time.value += 1.0 / 60.0;
  water.render();
  effect.render(scene, camera);
}

function animate(t) {
  requestAnimationFrame(animate);

  update(clock.getDelta());
  render(clock.getDelta());
}

function fullscreen() {
  if (container.requestFullscreen) {
    container.requestFullscreen();
  } else if (container.msRequestFullscreen) {
    container.msRequestFullscreen();
  } else if (container.mozRequestFullScreen) {
    container.mozRequestFullScreen();
  } else if (container.webkitRequestFullscreen) {
    container.webkitRequestFullscreen();
  }
}

function waterUpdate(){

    water.material.uniforms.alpha.value = guiParams.alpha;
    water.material.uniforms.time.value += guiParams.time / 60;
    water.material.uniforms.distortionScale.value = guiParams.distortionScale;
    water.material.uniforms.sunColor.value.setHex( guiParams.waterSunColor.replace("#", "0x") );
    //console.log(water.material.uniforms.sunColor.value);
    water.material.uniforms.waterColor.value.setHex( guiParams.waterColor.replace("#", "0x") );
    //console.log(water.material.uniforms.waterColor.value);
    water.material.uniforms.divident.value = guiParams.divident;
    water.material.uniforms.amplitude.value = guiParams.amplitude;
}

