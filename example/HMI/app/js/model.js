/**
 *	
 */

import * as THREE from '../modules/three.module.js';
import {
	GLTFLoader
} from '../modules/GLTFLoader.js'
import {
	OrbitControls
} from '../modules/OrbitControls.js'

let scene, orbit, renderer, camera, canvasHeight, canvasWidth;

// THREE.js
scene = new THREE.Scene();

// link glb model files

const loader = new GLTFLoader();
window.robotData = {
	joints: {
		objects: [],		// populated in loader
		pose: undefined,	// populated in loader
		set: undefined		// populated in loader
	},
}
loader.load('', function (gltf) {

	scene.add(gltf.scene);

	// Load objects
	robotData.scene = gltf.scene

	// these must be defined in the model
	//robotData.joints.objects[0] = scene.getObjectByName('blank')

	scene.traverse(function (object) {
		if (object.isMesh) {
			object.castShadow = true
			object.receiveShadow = true
		}
	});

	/*for (let i = 0; i < robotData.joints.length; i++) {
		robotData.joints.objects[i].castShadow = true
		robotData.joints.objects[i].receiveShadow = true
	}*/

	onWindowResize()

}, undefined, function (error) {
	console.error(error);
})

init();

function init() {

	canvasHeight = $('#robot').height() - 5;
	canvasWidth = $('#robot').width() - 5;

	camera = new THREE.PerspectiveCamera(60, canvasWidth / canvasHeight, 0.1, 1000);
	camera.position.set(2, 2, 3);
	camera.up.set(0, 0, 1)

	renderer = new THREE.WebGLRenderer({antialias: true});
	renderer.setClearColor(0xfcfcfc);
//	renderer.setClearColor(0xf0f0f0);
	renderer.setSize(canvasWidth*2, canvasHeight*2);

	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;

	renderer.domElement.id = 'robotcanvas';
	renderer.domElement.style.width = canvasWidth + 'px';
	renderer.domElement.style.height = canvasHeight + 'px';

	// Update camera and renderer settings if the window is resized
	window.addEventListener('resize', onWindowResize, false);
	
	orbit = new OrbitControls(
		camera,
		renderer.domElement
	);
	orbit.target.set(0, 0, -0.75);

	render()

}

function onWindowResize() {
	canvasHeight = $('#robot').height() - 5;
	canvasWidth = $('#robot').width() - 5;

	camera.aspect = canvasWidth / canvasHeight;
	camera.updateProjectionMatrix();

	renderer.setSize(canvasWidth*2, canvasHeight*2);
	renderer.domElement.style.width = canvasWidth + 'px';
	renderer.domElement.style.height = canvasHeight + 'px';
}

function render() {

	setTimeout(function(){requestAnimationFrame(render);}, 5);

	orbit.update();
	let el = $('#robot')

	// Render and update stats
	if(el.is(":visible")){
		if(el[0].children.length == 0){
			el[0].appendChild(renderer.domElement);
		}
		renderer.render(scene, camera);
	}

}

// expose pose function
robotData.pose = () => {

	if (robotData.joints.set === undefined) {
		// wait for model to finish loading
		return;
	}
	
	//robotData.joints.set[0](recoaterPosition, recoater1Position, recoater2Position, recoater1Referenced, recoater2Referenced, recoater1HomingPosition, recoater2HomingPosition);

};

// Set the color of a all children meshes of an object.
function setMeshColor(object, color) {
	object.traverse(function (child) {
		if (child.isMesh) {
			child.material.color.setHex(color);
		}
	});
}

