/**
 * @author compagnb / http://sessions.parsons.edu
 *
 * Work based on :
 * @author Mr&Mrs / http://webgl.no/index.html
 * @author jbouny / https://github.com/jbouny
 * @author Slayvin / http://slayvin.net : Flat mirror for three.js
 * @author Stemkoski / http://www.adelphi.edu/~stemkoski : An implementation of water shader based on the flat mirror
 * @author Jonas Wagner / http://29a.ch/ && http://29a.ch/slides/2012/webglwater/ : Water shader explanations in WebGL
 */

THREE.ShaderLib['water'] = {

	uniforms: { "normalSampler":	{ type: "t", value: null },
				"mirrorSampler":	{ type: "t", value: null },
				"alpha":			{ type: "f", value: 1.0 },
				"time":				{ type: "f", value: 0.0 },
				"distortionScale":	{ type: "f", value: 20.0 },
				"divident": 		{ type: "f", value: 100.0 },
				"amplitude":  		{ type: "f", value: 8.0 },
				"textureMatrix" :	{ type: "m4", value: new THREE.Matrix4() },
				"sunColor":			{ type: "c", value: new THREE.Color( 0x7F7F7F ) },
				"sunDirection":		{ type: "v3", value: new THREE.Vector3( 0.70707, 0.70707, 0 ) },
				"eye":				{ type: "v3", value: new THREE.Vector3( 0, 0, 0 ) },
				"waterColor":		{ type: "c", value: new THREE.Color( 0x555555 ) }
	},

	vertexShader: [
		'uniform mat4 textureMatrix;',
		'uniform float time;',
		'uniform float divident;',
		'uniform float amplitude;',
		'varying vec2 vUv;',
		'varying vec4 mirrorCoord;',
		'varying vec3 worldPosition;',
		'uniform vec3 eye;',
		'varying vec3 height;',
		'void main()',
		'{',
		'	mirrorCoord = modelMatrix * vec4( position, 1.0 );',
		'	worldPosition = mirrorCoord.xyz;',
		'	mirrorCoord = textureMatrix * mirrorCoord;',
		'   vec3 newposition = position;',
		'  vec3 dist = worldPosition-eye;',

		 '	float timex = -2.1*time, timez = -1.6*time;',
			"    float wave = ( ( sin(( timez)+(worldPosition.z/divident))+ sin((timex)+(worldPosition.x/divident)) )+(sin(( timez)+(worldPosition.z/divident))+ sin((timex)+(worldPosition.x/divident)) ) *amplitude);",
		 ' if(dist.x > 4000.0 || dist.z > 4000.0 )newposition.z = newposition.z*0.8;',
		 ' else if(dist.x < -4000.0 || dist.z < -4000.0)newposition.z =newposition.z*0.8;',
		 ' else newposition.z = ((newposition.z )*sin(wave)) +wave;',

		'	gl_Position = projectionMatrix * modelViewMatrix * vec4( newposition, 1.0 );',
		'}'
	].join('\n'),

	fragmentShader: [
		'precision highp float;',

		'uniform sampler2D mirrorSampler;',
		'uniform float alpha;',
		'uniform float time;',
		'uniform float distortionScale;',
		'uniform sampler2D normalSampler;',
		'uniform vec3 sunColor;',
		'uniform vec3 sunDirection;',
		'uniform vec3 eye;',
		'uniform vec3 waterColor;',

		'varying vec4 mirrorCoord;',
		'varying vec3 worldPosition;',

		'vec4 getNoise( vec2 uv )',
		'{',

		'	vec2 uv0 = ( uv / 403.0 )+time*0.05- vec2(time /1112.0, time / 113.0);',
		'	vec2 uv1 = uv / 207.0+vec2( time / 1112.0, time / 8.0 );',
    	'	vec2 uv2 = uv / vec2( 4907.0, 4203.0 ) - vec2( time / 161.0, time / 92.0 );',
		'	vec2 uv3 = uv / vec2( 3091.0, 3427.0 ) - vec2( time / 159.0, time / 80.0 );',

		'	vec4 noise = ( texture2D( normalSampler, uv0 ) ) +',
        '		( texture2D( normalSampler, uv1 ) ) +',
        '		( texture2D( normalSampler, uv2 ) ) +',
		'		( texture2D( normalSampler, uv3 ) );',
		'	return noise * 0.5 - 1.0;',
		'}',

		'void sunLight( const vec3 surfaceNormal, const vec3 eyeDirection, float shiny, float spec, float diffuse, inout vec3 diffuseColor, inout vec3 specularColor )',
		'{',
		'	vec3 reflection = normalize( reflect( -sunDirection, surfaceNormal ) );',
		'	float direction = max( 0.8, dot( eyeDirection, reflection ) );',
		'	specularColor += pow( direction, shiny ) * sunColor * spec;',
		'	diffuseColor += max( dot( sunDirection, surfaceNormal ), 0.0 ) * sunColor * diffuse;',
		'}',

		'void main()',
		'{',
		'	vec4 noise = getNoise( worldPosition.xz );',

	'	vec3  surfaceNormal = normalize( noise.xzy * vec3( 0.55, 0.2, 0.65 ) );',
		'	vec3 diffuseLight = vec3(0.0);',
		'	vec3 specularLight = vec3(0.0);',

		'	vec3 worldToEye = eye-worldPosition;',
		'	vec3 eyeDirection = normalize( worldToEye );',
		'	sunLight( surfaceNormal, eyeDirection, 100.0, 2.0, 0.5, diffuseLight, specularLight );',

		'	float distance = length(worldToEye);',


		'	surfaceNormal = normalize( noise.xzy * vec3( 0.4,0.08, 0.4 ) );',

		'	vec2 distortion = surfaceNormal.xz * ( 0.001 + 0.3 / distance ) * distortionScale;',
		'	vec3 reflectionSample = vec3( texture2D( mirrorSampler, mirrorCoord.xy / mirrorCoord.z + distortion ) );',

		'	surfaceNormal = normalize( noise.xzy * vec3( 2.5, 0.8, 2.5 ) );',

		'	float theta = max( dot( eyeDirection, surfaceNormal ), 0.0 );',
		'	float rf0 = 0.3;',
		'	float reflectance = rf0 + ( 1.0 - rf0 ) * pow( ( 1.0 - theta ), 8.0 );',
		'	vec3 scatter = max( 0.0, dot( surfaceNormal, eyeDirection ) ) * waterColor;',
		 'float angle = distance;',
		 'vec3 albedo;',
		'	if(distance < 200.0)albedo = mix( sunColor*0.7 * diffuseLight *waterColor* 0.95 + scatter*0.005, ( vec3( 0.1 ) + reflectionSample + reflectionSample * specularLight*max(sin(distance+time),0.3) ), reflectance );',
		'	if(distance >= 200.0)albedo = mix( sunColor*0.8 * diffuseLight*waterColor * 0.9 + scatter*0.01, ( vec3( 0.1 ) + reflectionSample + reflectionSample * specularLight ), reflectance );',

			'float limit = 0.13;',
			'if((albedo.x < limit || albedo.y < limit || albedo.z < limit)&& albedo.x < 0.5 ) albedo.x = albedo.x+reflectionSample.x*0.12;',
		'if((albedo.x < limit || albedo.y < limit || albedo.z < limit)&& albedo.y < 0.5  ) albedo.y = albedo.y+reflectionSample.y*0.12;',
		'if((albedo.x < limit || albedo.y < limit || albedo.z < limit)&& albedo.z < 0.5  ) albedo.z = albedo.z+reflectionSample.z*0.12;',


					'limit = 0.15;',
			'if((albedo.x < limit || albedo.y < limit || albedo.z < limit)&& albedo.x < 0.45 ) albedo.x = albedo.x+reflectionSample.x*0.1;',
		'if((albedo.x < limit || albedo.y < limit || albedo.z < limit)&& albedo.y < 0.45  ) albedo.y = albedo.y+reflectionSample.y*0.1;',
		'if((albedo.x < limit || albedo.y < limit || albedo.z < limit)&& albedo.z < 0.45  ) albedo.z = albedo.z+reflectionSample.z*0.1;',

							'limit = 0.17;',
			'if((albedo.x < limit || albedo.y < limit || albedo.z < limit)&& albedo.x < 0.4 ) albedo.x = albedo.x+reflectionSample.x*0.05;',
		'if((albedo.x < limit || albedo.y < limit || albedo.z < limit)&& albedo.y < 0.4  ) albedo.y = albedo.y+reflectionSample.y*0.05;',
		'if((albedo.x < limit || albedo.y < limit || albedo.z < limit)&& albedo.z < 0.4  ) albedo.z = albedo.z+reflectionSample.z*0.05;',


							'limit = 0.19;',
			'if((albedo.x < limit || albedo.y < limit || albedo.z < limit)&& albedo.x < 0.35 ) albedo.x = albedo.x+reflectionSample.x*0.02;',
		'if((albedo.x < limit || albedo.y < limit || albedo.z < limit)&& albedo.y < 0.35  ) albedo.y = albedo.y+reflectionSample.y*0.02;',
		'if((albedo.x < limit || albedo.y < limit || albedo.z < limit)&& albedo.z < 0.35  ) albedo.z = albedo.z+reflectionSample.z*0.02;',


	//	'float limit = 0.1;',


	//'if(albedo.x < limit || albedo.y < limit || albedo.z < limit){ albedo.x += reflectionSample.x-0.05;albedo.y+=reflectionSample.y-0.05;albedo.z+=reflectionSample.z-0.05;} ',
		//' limit = 0.130;',
	//	'albedo*=0.9;',
	//	'if(albedo.x < limit || albedo.y < limit || albedo.z < limit){ albedo.x += reflectionSample.x-0.05;albedo.y+=reflectionSample.y-0.05;albedo.z+=reflectionSample.z-0.05;} ',

		//' limit = 0.130;',
		//	'if((albedo.x < limit || albedo.y < limit || albedo.z < limit) && distance >= 1300.0 )discard;',

		//		'if((albedo.x < limit || albedo.y < limit || albedo.z < limit) && distance >= 500.0 )discard;',

	/*'   if(distance >= 500.0)gl_FragColor = vec4( albedo, 0.70 );',
		'	else if(distance < 500.0)gl_FragColor = vec4( albedo, 0.68 );',
			'	else if(distance < 495.0)gl_FragColor = vec4( albedo, 0.63 );',
				'	else if(distance < 485.0)gl_FragColor = vec4( albedo, 0.58 );',
						'else	if(distance < 475.0)gl_FragColor = vec4( albedo, 0.55 );',
					 		'else if(distance < 460.0)gl_FragColor = vec4( albedo, 0.50 );',
							'	else if(distance < 450.0)gl_FragColor = vec4( albedo, 0.45 );',
								'	else if(distance < 440.0)gl_FragColor = vec4( albedo, 0.40 );',
									'	else if(distance < 430.0)gl_FragColor = vec4( albedo, 0.35 );',
										'	else if(distance < 420.0)gl_FragColor = vec4( albedo, 0.20 );',
											'	else if(distance < 400.0)gl_FragColor = vec4( albedo, 0.10);',
												'	else if(distance < 350.0)gl_FragColor = vec4( albedo, 0.06);',
														'	else if(distance < 300.0)gl_FragColor = vec4( albedo, 0.001);',*/

				'gl_FragColor = vec4( albedo, 1.0);',

		'}'
	].join('\n')

};

THREE.Water = function ( renderer, camera, scene, options ) {

	THREE.Object3D.call( this );
	this.name = 'water_' + this.id;

	function optionalParameter ( value, defaultValue ) {
		return value !== undefined ? value : defaultValue;
	};

	options = options || {};

	this.matrixNeedsUpdate = true;

	var width = optionalParameter( options.textureWidth, 512*4 );
	var height = optionalParameter( options.textureHeight, 512*4 );
	this.clipBias = optionalParameter( options.clipBias, 0.0 );
	this.alpha = optionalParameter( options.alpha, 1.0 );
	this.time = optionalParameter( options.time, 0.0 );
	this.normalSampler = optionalParameter( options.waterNormals, null );
	this.sunDirection = optionalParameter( options.sunDirection, new THREE.Vector3( 0.50707, 0.70707, -0.3 ) );
	this.sunColor = new THREE.Color( optionalParameter( options.sunColor, 0xffffff ) );
	this.waterColor = new THREE.Color( optionalParameter( options.waterColor, 0x070161 ) );
	this.eye = optionalParameter( options.eye, new THREE.Vector3( 0, 0, 0 ) );
	this.distortionScale = optionalParameter( options.distortionScale, 20.0 );

	this.renderer = renderer;
	this.scene = scene;
	this.mirrorPlane = new THREE.Plane();
	this.normal = new THREE.Vector3( 0, 0, 1 );
	this.mirrorWorldPosition = new THREE.Vector3();
	this.cameraWorldPosition = new THREE.Vector3();
	this.rotationMatrix = new THREE.Matrix4();
	this.lookAtPosition = new THREE.Vector3( 0, 0, -1 );
	this.clipPlane = new THREE.Vector4();

	if ( camera instanceof THREE.PerspectiveCamera )
		this.camera = camera;
	else
	{
		this.camera = new THREE.PerspectiveCamera();
		console.log(this.name + ': camera is not a Perspective Camera!')
	}

	this.textureMatrix = new THREE.Matrix4();

	this.mirrorCamera = this.camera.clone();

	this.texture = new THREE.WebGLRenderTarget( width, height );
	this.tempTexture = new THREE.WebGLRenderTarget( width, height );

	var mirrorShader = THREE.ShaderLib[ "water" ];
	var mirrorUniforms = THREE.UniformsUtils.clone( mirrorShader.uniforms );

	this.material = new THREE.ShaderMaterial( {
		fragmentShader: mirrorShader.fragmentShader,
		vertexShader: mirrorShader.vertexShader,
		uniforms: mirrorUniforms,
		transparent: true
	} );

	this.material.uniforms.mirrorSampler.value = this.texture;
	this.material.uniforms.textureMatrix.value = this.textureMatrix;
	this.material.uniforms.alpha.value = this.alpha;
	this.material.uniforms.time.value = this.time;
	this.material.uniforms.normalSampler.value = this.normalSampler;
	this.material.uniforms.sunColor.value = this.sunColor;
	this.material.uniforms.waterColor.value = this.waterColor;
	this.material.uniforms.sunDirection.value = this.sunDirection;
	this.material.uniforms.distortionScale.value = this.distortionScale;

	this.material.uniforms.eye.value = this.eye;

	if ( !THREE.Math.isPowerOfTwo(width) || !THREE.Math.isPowerOfTwo(height) )
	{
		this.texture.generateMipmaps = false;
		this.tempTexture.generateMipmaps = false;
	}

	this.updateTextureMatrix();
	this.render();
};

THREE.Water.prototype = Object.create( THREE.Mirror.prototype );


THREE.Water.prototype.updateTextureMatrix = function () {

	function sign(x) { return x ? x < 0 ? -1 : 1 : 0; }

	this.updateMatrixWorld();
	this.camera.updateMatrixWorld();

	this.mirrorWorldPosition.setFromMatrixPosition( this.matrixWorld );
	this.cameraWorldPosition.setFromMatrixPosition( this.camera.matrixWorld );

	this.rotationMatrix.extractRotation( this.matrixWorld );

	this.normal.set( 0, 0, 1 );
	this.normal.applyMatrix4( this.rotationMatrix );

	var view = this.mirrorWorldPosition.clone().sub( this.cameraWorldPosition );
	view.reflect( this.normal ).negate();
	view.add( this.mirrorWorldPosition );

	this.rotationMatrix.extractRotation( this.camera.matrixWorld );

	this.lookAtPosition.set(0, 0, -1);
	this.lookAtPosition.applyMatrix4( this.rotationMatrix );
	this.lookAtPosition.add( this.cameraWorldPosition );

	var target = this.mirrorWorldPosition.clone().sub( this.lookAtPosition );
	target.reflect( this.normal ).negate();
	target.add( this.mirrorWorldPosition );

	this.up.set(0, -1, 0);
	this.up.applyMatrix4( this.rotationMatrix );
	this.up.reflect( this.normal ).negate();

	this.mirrorCamera.position.copy( view );
	this.mirrorCamera.up = this.up;
	this.mirrorCamera.lookAt( target );
	this.mirrorCamera.aspect = this.camera.aspect;

	this.mirrorCamera.updateProjectionMatrix();
	this.mirrorCamera.updateMatrixWorld();
	this.mirrorCamera.matrixWorldInverse.getInverse(this.mirrorCamera.matrixWorld);

	// Update the texture matrix
	this.textureMatrix.set( 0.5, 0.0, 0.0, 0.5,
							0.0, 0.5, 0.0, 0.5,
							0.0, 0.0, 0.5, 0.5,
							0.0, 0.0, 0.0, 1.0 );
	this.textureMatrix.multiply(this.mirrorCamera.projectionMatrix);
	this.textureMatrix.multiply(this.mirrorCamera.matrixWorldInverse);

	// Now update projection matrix with new clip plane, implementing code from: http://www.terathon.com/code/oblique.html
	// Paper explaining this technique: http://www.terathon.com/lengyel/Lengyel-Oblique.pdf
	this.mirrorPlane.setFromNormalAndCoplanarPoint( this.normal, this.mirrorWorldPosition );
	this.mirrorPlane.applyMatrix4(this.mirrorCamera.matrixWorldInverse);

	this.clipPlane.set(this.mirrorPlane.normal.x, this.mirrorPlane.normal.y, this.mirrorPlane.normal.z, this.mirrorPlane.constant );

	var q = new THREE.Vector4();
	var projectionMatrix = this.mirrorCamera.projectionMatrix;

	q.x = (sign(this.clipPlane.x) + projectionMatrix.elements[8]) / projectionMatrix.elements[0];
	q.y = (sign(this.clipPlane.y) + projectionMatrix.elements[9]) / projectionMatrix.elements[5];
	q.z = -1.0;
	q.w = (1.0 + projectionMatrix.elements[10]) / projectionMatrix.elements[14];

	// Calculate the scaled plane vector
	var c = new THREE.Vector4();
	c = this.clipPlane.multiplyScalar( 2.0 / this.clipPlane.dot(q) );

	// Replacing the third row of the projection matrix
	projectionMatrix.elements[2] = c.x;
	projectionMatrix.elements[6] = c.y;
	projectionMatrix.elements[10] = c.z + 1.0 - this.clipBias;
	projectionMatrix.elements[14] = c.w;

	var worldCoordinates = new THREE.Vector3();
	worldCoordinates.setFromMatrixPosition( this.camera.matrixWorld );
	this.eye = worldCoordinates;
	this.material.uniforms.eye.value = this.eye;
};
