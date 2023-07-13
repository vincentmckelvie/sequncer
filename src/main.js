import * as THREE from './build/three.module.js';

import { GUI } from './scripts/jsm/libs/lil-gui.module.min.js';


const arr = [];
let tmpArr = [];
const mouse = {
	down:false,
	x:0,
	y:0,
	first:false,
	pointer:new THREE.Vector2(),
	downPosition:new THREE.Vector2(),
	dragging:false,

}
let time = 0;
let synth;
let strokeIndex = 0;
let inited = false;
const c = document.createElement("canvas");
c.style.position="fixed";

c.width = window.innerWidth;
c.height = window.innerHeight;
const ctx = c.getContext("2d");

const synthNotes = [
	"C1", "D1", "E1", "G1", "A1", "B1", 
	"C2", "D2", "E2", "G2", "A2", "B2", 
	"C3", "D3", "E3", "G3", "A3", "B3",
	"C4", "D4", "E4", "G4", "A4", "B4", 
	"C5", "D5", "E5", "G5", "A5", "B5", 
];

Tone.Transport.start();
Tone.Transport.bpm.value = 120;

document.getElementById("overlay").addEventListener("click", init);

const scene = new THREE.Scene();
scene.background = new THREE.Color( 0xffffff );
//scene.fog = new THREE.Fog( 0xa0a0a0, 10, 50 );

let width = window.innerWidth;
let height = window.innerHeight;
let camera = new THREE.OrthographicCamera( width / - 2, width / 2, height / -2, height /  2, 0, 1000 );

camera.position.x = width/2;
camera.position.y = height/2;

const geo = new THREE.BoxGeometry(1, window.innerHeight, 1, 1,1,1);
const mat = new THREE.MeshBasicMaterial({color:0xff0000})
const line = new THREE.Mesh(geo,mat);
const holder = new THREE.Object3D();

holder.frustumCulled = false;

scene.add(line, holder);

const renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.shadowMap.enabled = true;
renderer.useLegacyLights = false;
renderer.domElement.style.position = "fixed";

document.body.appendChild( renderer.domElement );
document.body.appendChild( c );

const raycaster = new THREE.Raycaster();
let selectedStroke = null;

const synthObj = {			
	vibratoAmount: 0.5,
	vibratoRate: 5,
	portamento: 0.3,
	harmonicity: 1.005,
	volume: 5,
	distortion:0,
	filter:0,
	phaser:0,
	crusher:0,
	feedback:0,
	voice0: {
		oscillator: {
			type: "sawtooth"
		},
		filter: {
			Q: 1,
			type: "lowpass",
			rolloff: -24
		},
		envelope: {
			attack: 0.01,
			decay: 0.25,
			sustain: 0.4,
			release: 1.2
		},
		filterEnvelope: {
			attack: 0.001,
			decay: 0.05,
			sustain: 0.3,
			release: 2,
			baseFrequency: 100,
			octaves: 4
		}
	},
	voice1: {
		oscillator: {
			type: "sawtooth"
		},
		filter: {
			Q: 2,
			type: "bandpass",
			rolloff: -12
		},
		envelope: {
			attack: 0.25,
			decay: 4,
			sustain: 0.1,
			release: 0.8
		},
		filterEnvelope: {
			attack: 0.05,
			decay: 0.05,
			sustain: 0.7,
			release: 2,
			baseFrequency: 5000,
			octaves: -1.5
		}
	}
}
	
	

//const synthJson = parseSynthObject(synthObj);
const panel = new GUI( { width: 310 } );

const settings = {
	"preset 1":preset1,
	"preset 2":preset2,
	"preset 3":preset3,
	"clear trigs":clearTrigs,
	"vibratoAmount": 0.5,
	"vibratoRate": 5,
	"portamento": 0.3,
	"harmonicity": 1.005,
	"volume": 5,
	"distortion":0,
	"filter":0,
	"phaser":0,
	"crusher":0,
	"feedback":0,
	
	"oscillator0":"sawtooth",
	"filterQ0": 1,
	"filterType0": "lowpass",
	"filterRolloff0": "-24",
	"envelopeAttack0": 0.01,
	"envelopeDecay0": 0.25,
	"envelopeSustain0": 0.4,
	"envelopeRelease0": 1.2,
	"filterEnvelopeAttack0": 0.001,
	"filterEnvelopeDecay0": 0.05,
	"filterEnvelopeSustain0": 0.3,
	"filterEnvelopeRelease0": 2,
	"filterEnvelopeBaseFrequency0": 100,
	"filterEnvelopeOctaves0": 4,
	
	"oscillator1":"sawtooth",
	"filterQ1": 2,
	"filterType1": "lowpass",
	"filterRolloff1": "-12",
	"envelopeAttack1": 0.01,
	"envelopeDecay1": 0.25,
	"envelopeSustain1": 0.4,
	"envelopeRelease1": 1.2,
	"filterEnvelopeAttack1": 0.001,
	"filterEnvelopeDecay1": 0.05,
	"filterEnvelopeSustain1": 0.3,
	"filterEnvelopeRelease1": 2,
	"filterEnvelopeBaseFrequency1": 500,
	"filterEnvelopeOctaves1": -1.5
	
}
	
//}).toDestination();


const folder1 = panel.addFolder( 'presets' );
const folder2 = panel.addFolder( 'synth' );
const folder3 = panel.addFolder( 'voice0' );
const folder4 = panel.addFolder( 'voice1' );

folder1.add( settings, 'preset 1' );
folder1.add( settings, 'preset 2' );
folder1.add( settings, 'preset 3' );
folder1.add( settings, 'clear trigs' );

folder2.add( settings, 'vibratoAmount', 0.0, 1.0, 0.01 ).listen().onChange( function ( val ) {

	if(selectedStroke == null){
		for(let i = 0; i<arr.length; i++){
			if(!arr[i].custom)
				arr[i].synth.vibratoAmount.value = val;
		}
		synthObj.vibratoAmount = val;
	}else{
		selectedStroke.synth.vibratoAmount.value = val;	
		selectedStroke.custom = true;
	}
});

folder2.add( settings, 'vibratoRate', 0.0, 100.0, 0.01 ).listen().onChange( function ( val ) {
	if(selectedStroke == null){
		for(let i = 0; i<arr.length; i++){
			if(!arr[i].custom)
				arr[i].synth.vibratoRate.value = val;
		}
		synthObj.vibratoRate = val;
	}else{
		selectedStroke.synth.vibratoRate.value = val;	
		selectedStroke.custom = true;
	}
});
folder2.add( settings, 'portamento', 0.0, 2.0, 0.01 ).listen().onChange( function ( val ) {
	if(selectedStroke == null){
		for(let i = 0; i<arr.length; i++){
			if(!arr[i].custom)
				arr[i].synth.portamento = val;
		}
		synthObj.portamento = val;
	}else{
		selectedStroke.synth.portamento = val;	
		selectedStroke.custom = true;
	}
});
folder2.add( settings, 'harmonicity', 0.0, 2.0, 0.01 ).listen().onChange( function ( val ) {
	if(selectedStroke == null){
		for(let i = 0; i<arr.length; i++){
			if(!arr[i].custom)
				arr[i].synth.harmonicity.value = val;
		}
		synthObj.harmonicity = val;
	}else{
		selectedStroke.synth.harmonicity.value = val;
		selectedStroke.custom = true;	
	}
});
folder2.add( settings, 'volume', -40.0, 20.0, 0.01 ).listen().onChange( function ( val ) {
	if(selectedStroke == null){
		for(let i = 0; i<arr.length; i++){
			if(!arr[i].custom)
				arr[i].synth.volume.value = val;
		}
		synthObj.volume = val;
	}else{
		selectedStroke.synth.volume.value = val;	
		selectedStroke.custom = true;
	}
	
});
folder2.add( settings, 'distortion', 0.0, 1.0, 0.01 ).listen().onChange( function ( val ) {
	if(selectedStroke == null){
		for(let i = 0; i<arr.length; i++){
			if(!arr[i].custom)
				arr[i].distortion.wet.value = val;
		}
		synthObj.distortion = val;
	}else{
		selectedStroke.distortion.wet.value = val;	
		selectedStroke.custom = true;
	}
	
});
folder2.add( settings, 'filter', 0.0, 1.0, 0.01 ).listen().onChange( function ( val ) {
	if(selectedStroke == null){
		for(let i = 0; i<arr.length; i++){
			if(!arr[i].custom)
				arr[i].filter.wet.value = val;
		}
		synthObj.filter = val;
	}else{
		selectedStroke.filter.wet.value = val;	
		selectedStroke.custom = true;
	}
	
});
folder2.add( settings, 'phaser', 0.0, 1.0, 0.01 ).listen().onChange( function ( val ) {
	if(selectedStroke == null){
		for(let i = 0; i<arr.length; i++){
			if(!arr[i].custom)
				arr[i].phaser.wet.value = val;
		}
		synthObj.phaser = val;
	}else{
		selectedStroke.phaser.wet.value = val;	
		selectedStroke.custom = true;
	}
	
});
folder2.add( settings, 'crusher', 0.0, 1.0, 0.01 ).listen().onChange( function ( val ) {
	if(selectedStroke == null){
		for(let i = 0; i<arr.length; i++){
			if(!arr[i].custom)
				arr[i].crusher.wet.value = val;
		}
		synthObj.crusher = val;
	}else{
		selectedStroke.crusher.wet.value = val;	
		selectedStroke.custom = true;
	}
	
});
folder2.add( settings, 'feedback', 0.0, 1.0, 0.01 ).listen().onChange( function ( val ) {
	if(selectedStroke == null){
		for(let i = 0; i<arr.length; i++){
			if(!arr[i].custom)
				arr[i].feedback.wet.value = val;
		}
		synthObj.crusher = val;
	}else{
		selectedStroke.feedback.wet.value = val;	
		selectedStroke.custom = true;
	}
	
});
/*
sine, square, triangle, or sawtooth.

*/

folder3.add(settings, 'oscillator0', { sawtooth: 'sawtooth', square:'square', sine: 'sine', triangle: 'triangle' } ).listen().onChange(function (val){
		
		if(selectedStroke == null){
			for(let i = 0; i<arr.length; i++){
				if(!arr[i].custom)
					arr[i].synth.voice0.oscillator.type = val;
			}
			synthObj.voice0.oscillator.type = val;
		}else{
			selectedStroke.synth.voice0.oscillator.type = val;
			selectedStroke.custom = true;
		}


});
folder4.add(settings, 'oscillator1', { sawtooth: 'sawtooth', square:'square', sine: 'sine', triangle: 'triangle' } ).listen().onChange(function (val){
		if(selectedStroke == null){
			for(let i = 0; i<arr.length; i++){
				if(!arr[i].custom)
					arr[i].synth.voice1.oscillator.type = val;
			}
			synthObj.voice1.oscillator.type = val;
		}else{
			selectedStroke.synth.voice1.oscillator.type = val;
			selectedStroke.custom = true;
		}

});


folder3.add(settings, 'filterQ0', 0, 64, 1 ).listen().onChange( function ( val ) {
		
		if(selectedStroke == null){

			for(let i = 0; i<arr.length; i++){
				if(!arr[i].custom)
					arr[i].synth.voice0.filter.Q.value = parseInt(val);
			}
			synthObj.voice0.filter.Q = parseInt(val);
		}else{
			selectedStroke.synth.voice0.filter.Q.value = parseInt(val);
			selectedStroke.custom = true;
		}


});
folder4.add(settings, 'filterQ1', 0, 64, 1 ).listen().onChange( function (val){
		
		if(selectedStroke == null){
			for(let i = 0; i<arr.length; i++){
				if(!arr[i].custom)
					arr[i].synth.voice1.filter.Q.value = parseInt(val);
			}
			synthObj.voice1.filter.Q = parseInt(val);
		}else{
			selectedStroke.synth.voice1.filter.Q.value = parseInt(val);
			selectedStroke.custom = true;
		}


});

folder3.add(settings, 'filterRolloff0', { "-12": '-12', "-24":'-24', "-48": '-48', "-96": '-96' } ).listen().onChange( function ( val ) {
		
		if(selectedStroke == null){

			for(let i = 0; i<arr.length; i++){
				if(!arr[i].custom)
					arr[i].synth.voice0.filter.rolloff = parseInt(val);
			}
			synthObj.voice0.filter.rolloff = parseInt(val);
		}else{
			selectedStroke.synth.voice0.filter.rolloff = parseInt(val);
			selectedStroke.custom = true;
		}


});
folder4.add(settings, 'filterRolloff1', { "-12": '-12', "-24":'-24', "-48": '-48', "-96": '-96' } ).listen().onChange( function (val){
		
		if(selectedStroke == null){
			for(let i = 0; i<arr.length; i++){
				if(!arr[i].custom)
					arr[i].synth.voice1.filter.rolloff = parseInt(val);
			}
			synthObj.voice1.filter.rolloff = parseInt(val);
		}else{
			selectedStroke.synth.voice1.filter.rolloff = parseInt(val);
			selectedStroke.custom = true;
		}


});


folder3.add(settings, 'envelopeAttack0', 0, 20, .001 ).listen().onChange( function ( val ) {
		
		if(selectedStroke == null){

			for(let i = 0; i<arr.length; i++){
				if(!arr[i].custom)
					arr[i].synth.voice0.envelope.attack = val;
			}
			synthObj.voice0.envelope.attack = val;
		}else{
			selectedStroke.synth.voice0.envelope.attack = val;
			selectedStroke.custom = true;
		}


});
folder4.add(settings, 'envelopeAttack1', 0, 20, .001).listen().onChange( function (val){
		
		if(selectedStroke == null){
			for(let i = 0; i<arr.length; i++){
				if(!arr[i].custom)
					arr[i].synth.voice1.envelope.attack = val;
			}
			synthObj.voice1.envelope.attack = val;
		}else{
			selectedStroke.synth.voice1.envelope.attack = val;
			selectedStroke.custom = true;
		}


});

folder3.add(settings, 'envelopeDecay0', 0, 20, .001 ).listen().onChange( function ( val ) {
		
		if(selectedStroke == null){

			for(let i = 0; i<arr.length; i++){
				if(!arr[i].custom)
					arr[i].synth.voice0.envelope.decay = val;
			}
			synthObj.voice0.envelope.decay = val;
		}else{
			selectedStroke.synth.voice0.envelope.decay = val;
			selectedStroke.custom = true;
		}


});
folder4.add(settings, 'envelopeDecay1', 0, 20, .001).listen().onChange( function (val){
		
		if(selectedStroke == null){
			for(let i = 0; i<arr.length; i++){
				if(!arr[i].custom)
					arr[i].synth.voice1.envelope.decay = val;
			}
			synthObj.voice1.envelope.decay = val;
		}else{
			selectedStroke.synth.voice1.envelope.decay = val;
			selectedStroke.custom = true;
		}


});

folder3.add(settings, 'envelopeSustain0', 0, 1, .001 ).listen().onChange( function ( val ) {
		
		if(selectedStroke == null){

			for(let i = 0; i<arr.length; i++){
				if(!arr[i].custom)
					arr[i].synth.voice0.envelope.sustain = val;
			}
			synthObj.voice0.envelope.sustain = val;
		}else{
			selectedStroke.synth.voice0.envelope.sustain = val;
			selectedStroke.custom = true;
		}


});
folder4.add(settings, 'envelopeSustain1', 0, 1, .001).listen().onChange( function (val){
		
		if(selectedStroke == null){
			for(let i = 0; i<arr.length; i++){
				if(!arr[i].custom)
					arr[i].synth.voice1.envelope.sustain = val;
			}
			synthObj.voice1.envelope.sustain = val;
		}else{
			selectedStroke.synth.voice1.envelope.sustain = val;
			selectedStroke.custom = true;
		}


});

folder3.add(settings, 'envelopeRelease0', 0, 20, .001 ).listen().onChange( function ( val ) {
		
		if(selectedStroke == null){
			
			for(let i = 0; i<arr.length; i++){
				if(!arr[i].custom)
					arr[i].synth.voice0.envelope.release = val;
			}
			synthObj.voice0.envelope.release = val;
		}else{
			selectedStroke.synth.voice0.envelope.release = val;
			selectedStroke.custom = true;
		}


});
folder4.add(settings, 'envelopeRelease1', 0, 20, .001).listen().onChange( function (val){
		
		if(selectedStroke == null){
			for(let i = 0; i<arr.length; i++){
				if(!arr[i].custom)
					arr[i].synth.voice1.envelope.release = val;
			}
			synthObj.voice1.envelope.release = val;
		}else{
			selectedStroke.synth.voice1.envelope.release = val;
			selectedStroke.custom = true;
		}


});

folder3.add(settings, 'filterEnvelopeAttack0', 0, 10, .001 ).listen().onChange( function ( val ) {
		
		if(selectedStroke == null){
			
			for(let i = 0; i<arr.length; i++){
				if(!arr[i].custom)
					arr[i].synth.voice0.filterEnvelope.attack = val;
			}
			synthObj.voice0.filterEnvelope.attack = val;
		}else{
			selectedStroke.synth.voice0.filterEnvelope.attack = val;
			selectedStroke.custom = true;
		}


});
folder4.add(settings, 'filterEnvelopeAttack1', 0, 10, .001).listen().onChange( function (val){
		
		if(selectedStroke == null){
			for(let i = 0; i<arr.length; i++){
				if(!arr[i].custom)
					arr[i].synth.voice1.filterEnvelope.attack = val;
			}
			synthObj.voice1.filterEnvelope.attack = val;
		}else{
			selectedStroke.synth.voice1.filterEnvelope.attack = val;
			selectedStroke.custom = true;
		}


});

folder3.add(settings, 'filterEnvelopeDecay0', 0, 20, .001 ).listen().onChange( function ( val ) {
		
		if(selectedStroke == null){
			
			for(let i = 0; i<arr.length; i++){
				if(!arr[i].custom)
					arr[i].synth.voice0.filterEnvelope.decay = val;
			}
			synthObj.voice0.filterEnvelope.decay = val;
		}else{
			selectedStroke.synth.voice0.filterEnvelope.decay = val;
			selectedStroke.custom = true;
		}


});
folder4.add(settings, 'filterEnvelopeDecay1', 0, 20, .001).listen().onChange( function (val){
		
		if(selectedStroke == null){
			for(let i = 0; i<arr.length; i++){
				if(!arr[i].custom)
					arr[i].synth.voice1.filterEnvelope.decay = val;
			}
			synthObj.voice1.filterEnvelope.decay = val;
		}else{
			selectedStroke.synth.voice1.filterEnvelope.decay = val;
			selectedStroke.custom = true;
		}


});

folder3.add(settings, 'filterEnvelopeSustain0', 0, 1, .001 ).listen().onChange( function ( val ) {
		
		if(selectedStroke == null){
			
			for(let i = 0; i<arr.length; i++){
				if(!arr[i].custom)
					arr[i].synth.voice0.filterEnvelope.sustain = val;
			}
			synthObj.voice0.filterEnvelope.sustain = val;
		}else{
			selectedStroke.synth.voice0.filterEnvelope.sustain = val;
			selectedStroke.custom = true;
		}


});
folder4.add(settings, 'filterEnvelopeSustain1', 0, 1, .001).listen().onChange( function (val){
		
		if(selectedStroke == null){
			for(let i = 0; i<arr.length; i++){
				if(!arr[i].custom)
					arr[i].synth.voice1.filterEnvelope.sustain = val;
			}
			synthObj.voice1.filterEnvelope.sustain = val;
		}else{
			selectedStroke.synth.voice1.filterEnvelope.sustain = val;
			selectedStroke.custom = true;
		}


});

folder3.add(settings, 'filterEnvelopeBaseFrequency0', 0, 1000, 1 ).listen().onChange( function ( val ) {
		
		if(selectedStroke == null){
			
			for(let i = 0; i<arr.length; i++){
				if(!arr[i].custom)
					arr[i].synth.voice0.filterEnvelope.baseFrequency = val;
			}
			synthObj.voice0.filterEnvelope.baseFrequency = val;
		}else{
			selectedStroke.synth.voice0.filterEnvelope.baseFrequency = val;
			selectedStroke.custom = true;
		}


});
folder4.add(settings, 'filterEnvelopeBaseFrequency1', 0, 1000, 1).listen().onChange( function (val){
		
		if(selectedStroke == null){
			for(let i = 0; i<arr.length; i++){
				if(!arr[i].custom)
					arr[i].synth.voice1.filterEnvelope.baseFrequency = val;
			}
			synthObj.voice1.filterEnvelope.baseFrequency = val;
		}else{
			selectedStroke.synth.voice1.filterEnvelope.baseFrequency = val;
			selectedStroke.custom = true;
		}


});

folder3.add(settings, 'filterEnvelopeOctaves0', -20, 20, 1 ).listen().onChange( function ( val ) {
		
		if(selectedStroke == null){
			
			for(let i = 0; i<arr.length; i++){
				if(!arr[i].custom)
					arr[i].synth.voice0.filterEnvelope.octaves = val;
			}
			synthObj.voice0.filterEnvelope.octaves = val;
		}else{
			selectedStroke.synth.voice0.filterEnvelope.octaves = val;
			selectedStroke.custom = true;
		}


});
folder4.add(settings, 'filterEnvelopeOctaves1', -20, 20, 1).listen().onChange( function (val){
		
		if(selectedStroke == null){
			for(let i = 0; i<arr.length; i++){
				if(!arr[i].custom)
					arr[i].synth.voice1.filterEnvelope.octaves = val;
			}
			synthObj.voice1.filterEnvelope.octaves = val;
		}else{
			selectedStroke.synth.voice1.filterEnvelope.octaves = val;
			selectedStroke.custom = true;
		}


});

/*
The type of the filter. Types: "lowpass", "highpass", "bandpass", "lowshelf", "highshelf", "notch", "allpass", or "peaking".
*/

folder3.add(settings, 'filterType0', { lowpass: 'lowpass', bandpass: 'bandpass', lowshelf: 'lowshelf', highshelf:"highshelf", notch:"notch", allpass:"allpass", peaking:"peaking"  } ).listen().onChange(function (val){
		
		if(selectedStroke == null){
			for(let i = 0; i<arr.length; i++){
				if(!arr[i].custom)
					arr[i].synth.voice0.filter.type = val;
			}
			synthObj.voice0.oscillator.type = val;
		}else{
			selectedStroke.synth.voice0.filter.type = val;
			selectedStroke.custom = true;
		}


});

folder4.add(settings, 'filterType1', { lowpass: 'lowpass', bandpass: 'bandpass', lowshelf: 'lowshelf', highshelf:"highshelf", notch:"notch", allpass:"allpass", peaking:"peaking"  } ).listen().onChange(function (val){
		
		if(selectedStroke == null){
			for(let i = 0; i<arr.length; i++){
				if(!arr[i].custom)
					arr[i].synth.voice1.filter.type = val;
			}
			synthObj.voice0.oscillator.type = val;
		}else{
			selectedStroke.synth.voice1.filter.type = val;
			selectedStroke.custom = true;
		}


});

function clearTrigs(){
	for(let i = 0; i<arr.length; i++){
		arr[i].custom = false;
		// arr[i].synth.vibratoAmount.value = synthObj.vibratoAmount;
		// arr[i].synth.vibratoRate.value = synthObj.vibratoRate;
		// arr[i].synth.harmonicity.value = synthObj.harmonicity;
		// arr[i].synth.volume.value = synthObj.volume;
		//if(arr)

	}
}

function preset1(){
	
}
function preset2(){
	
}
function preset3(){
	
}



// 	const folder2 = panel.addFolder( 'Activation/Deactivation' );
// 	const folder3 = panel.addFolder( 'Pausing/Stepping' );
// 	const folder4 = panel.addFolder( 'Crossfading' );
// 	const folder5 = panel.addFolder( 'Blend Weights' );
// 	const folder6 = panel.addFolder( 'General Speed' );

// 	settings = {
// 		'show model': true,
// 		'show skeleton': false,
// 		'deactivate all': deactivateAllActions,
// 		'activate all': activateAllActions,
// 		'pause/continue': pauseContinue,
// 		'make single step': toSingleStepMode,
// 		'modify step size': 0.05,
// 		'from walk to idle': function () {

// 			prepareCrossFade( walkAction, idleAction, 1.0 );

// 		},
// 		'from idle to walk': function () {

// 			prepareCrossFade( idleAction, walkAction, 0.5 );

// 		},
// 		'from walk to run': function () {

// 			prepareCrossFade( walkAction, runAction, 2.5 );

// 		},
// 		'from run to walk': function () {

// 			prepareCrossFade( runAction, walkAction, 5.0 );

// 		},
// 		'use default duration': true,
// 		'set custom duration': 3.5,
// 		'modify idle weight': 0.0,
// 		'modify walk weight': 1.0,
// 		'modify run weight': 0.0,
// 		'modify time scale': 1.0
// 	};

// 	folder1.add( settings, 'show model' ).onChange( showModel );
// 	folder1.add( settings, 'show skeleton' ).onChange( showSkeleton );
// 	folder2.add( se



function init() {

	document.getElementById("overlay").style.display = "none";

	c.addEventListener( 'mousemove', onMouseMove );
	c.addEventListener( 'mousedown', onMouseDown );
	c.addEventListener( 'mousemove', onMouseMove );
	document.addEventListener( 'mouseup', onMouseUp );

	update();
	inited = true;
	// setTimeout(function(){
	// 	inited = true;
	// },200)
}

function update(){
	
	requestAnimationFrame( update );

	const sp = Tone.Transport.position.split(":");
	const curr = parseFloat( sp[2] );
	
	const currTm = parseFloat( sp[1] );

	const sig = Tone.Transport._timeSignature;

	time = ((currTm + (curr / sig)  ) / sig) * width;
	line.position.x = time;
	line.position.y = height/2;
	
	for(let i = 0; i<arr.length; i++ ){
		arr[i].update({time:time});
	}

	renderer.render( scene, camera );
	
	
}

function onMouseMove(e){

	mouse.x = e.clientX;	
	mouse.y = e.clientY;

	mouse.pointer.x = ( e.clientX / width ) * 2 - 1;
	mouse.pointer.y = - ( e.clientY / height ) * 2 + 1;
	
	raycaster.setFromCamera( mouse.pointer, camera );
	const intersects = raycaster.intersectObjects( holder.children, false );
	
	if ( intersects.length > 0 ) {
		document.body.style.cursor = "pointer";
	}else{
		document.body.style.cursor = "default";
	}

	if(mouse.down){

		ctx.beginPath();

		tmpArr.push({x:mouse.x, y:mouse.y})
		
		for(let i = 0; i<tmpArr.length; i++ ){
				
			if(i==0){
				ctx.moveTo(tmpArr[i].x, tmpArr[i].y);
			}else{
				ctx.lineTo(tmpArr[i].x, tmpArr[i].y);
			}

		}

		ctx.lineWidth = 20;
		ctx.stroke();

	}
}

function onMouseDown(e){

	mouse.pointer.x = ( e.clientX / width ) * 2 - 1;
	mouse.pointer.y = - ( e.clientY / height ) * 2 + 1;
	
	raycaster.setFromCamera( mouse.pointer, camera );
	const intersects = raycaster.intersectObjects( holder.children, false );
	
	if ( intersects.length > 0 ) {

		killSelectedStroke();
		
		selectedStroke = arr[ intersects[ 0 ].object.strokeIndex ];

		intersects[ 0 ].object.material.emissive.setHex(0xff0000);
		
		return false;
	}

	mouse.down = true;
	mouse.first = true;

	mouse.downPosition.set(e.clientX, e.clientY);	
	tmpArr.push({x:e.clientX, y:e.clientY})
	
	killSelectedStroke();
}

function killSelectedStroke(){
	holder.traverse(function(obj){
		if(obj.isMesh){
			obj.material.emissive.setHex( 0x000000 );
		}
	})
	selectedStroke = null;
}


function onMouseUp(e){

	if(inited && mouse.down && tmpArr.length > 2){
		arr.push(new MouseInteraction({stroke:tmpArr, index:strokeIndex}))
		killSelectedStroke();
	}
	
	mouse.down = false;
	mouse.first = false;
	
	tmpArr = [];
	
	strokeIndex++;

	ctx.clearRect(0, 0, width, height);
	
	//mouse.first = false;
}

class MouseInteraction{
	
	constructor(OBJ){
		const self = this;
		this.stroke = OBJ.stroke;
		this.index = OBJ.index;
		this.normalized = [];

		this.initedSynth = false;
		this.killedSynth = false;
		
		const points = [];

		for(let i = 0; i<this.stroke.length; i++){
			this.normalized.push({x:this.stroke[i].x/width, x:this.stroke[i].y/height})
			points.push( new THREE.Vector3( this.stroke[i].x, this.stroke[i].y, 0 ) )
		}

		const spline = new THREE.CatmullRomCurve3(points);
		const geo = new THREE.TubeGeometry( spline, 70, 10, 10, false );
		const geoRO = new THREE.TubeGeometry( spline, 70, 20, 10, false );
		
		this.mat = new THREE.MeshStandardMaterial({color:0x000000, side:THREE.DoubleSide})
		this.mesh = new THREE.Mesh(geo,this.mat);
		
		this.rollover = new THREE.Mesh(geoRO,this.mat);
		this.rollover.visible = false;
		
		//console.log(this.mesh)
		
	
		this.selected = false;
		this.single = false;
		this.custom = false;

		const start = new THREE.Vector2(this.stroke[0].x, this.stroke[0].y);
		const end = new THREE.Vector2(this.stroke[this.stroke.length-1].x, this.stroke[this.stroke.length-1].y);
		const dist = start.distanceTo(end);

		const box = new THREE.Box3();
		this.mesh.geometry.computeBoundingBox();
		box.copy( this.mesh.geometry.boundingBox ).applyMatrix4( this.mesh.matrixWorld );
		
		const hh = Math.abs(box.max.y - box.min.y);
		const ww = Math.abs(box.max.x - box.min.x);
		
		let sze = hh > ww ? ww : hh;
		if(sze < 20)sze = 20;
		if(sze > 100) sze = 100;
		this.shapeSize = ww;

		this.centerPoint = new THREE.Vector2();

		if(dist < 20){

			this.centerPoint = new THREE.Vector2( (box.max.x + box.min.x)/2, (box.max.y + box.min.y)/2);
			
			const avgDist = self.avgDist(this.stroke, this.centerPoint, sze);
			
			const avgDistCheck = self.avgDistCheck(this.stroke, this.centerPoint, avgDist, sze); 
			
			this.type = "line";

			if(avgDistCheck > .1){
				const pointsSquare = []
				const len = 40;
				for(let i = 0; i<len; i++){
					
					const side = len/4;
					
					let x = 0;
					let y = 0;

					const per = (i%side) / side;

					let lineStart = new THREE.Vector2()
					let lineEnd = new THREE.Vector2()
					let fnl = new THREE.Vector2();

					const div = 2.5;
					
					if(i<side){
						
						lineStart.x = this.centerPoint.x-(sze/div);
						lineEnd.x = this.centerPoint.x+(sze/div);

						lineStart.y = this.centerPoint.y-(sze/div);
						lineEnd.y = this.centerPoint.y-(sze/div);
						fnl.lerpVectors(lineStart, lineEnd, per);
						
						pointsSquare.push(new THREE.Vector3(fnl.x, fnl.y, 0));

					}else if(i>=side && i<side+side){

						lineStart.x = this.centerPoint.x+(sze/div);
						lineEnd.x = this.centerPoint.x+(sze/div);

						lineStart.y = this.centerPoint.y-(sze/div);
						lineEnd.y = this.centerPoint.y+(sze/div);
						fnl.lerpVectors(lineStart, lineEnd, per);
						
						pointsSquare.push(new THREE.Vector3(fnl.x, fnl.y, 0));

					}else if(i>=side+side && i<side+side+side){

						lineStart.x = this.centerPoint.x+(sze/div);
						lineEnd.x = this.centerPoint.x-(sze/div);

						lineStart.y = this.centerPoint.y+(sze/div);
						lineEnd.y = this.centerPoint.y+(sze/div);
						fnl.lerpVectors(lineStart, lineEnd, per);
						
						pointsSquare.push(new THREE.Vector3(fnl.x, fnl.y, 0));

					}else{

						lineStart.x = this.centerPoint.x-(sze/div);
						lineEnd.x = this.centerPoint.x-(sze/div);

						lineStart.y = this.centerPoint.y+(sze/div);
						lineEnd.y = this.centerPoint.y-(sze/div);
						fnl.lerpVectors(lineStart, lineEnd, per);
						
						pointsSquare.push(new THREE.Vector3(fnl.x, fnl.y, 0));

					}

					
				}
				
				const splineSquare = new THREE.CatmullRomCurve3(pointsSquare);

				const geoSquare = new THREE.TubeGeometry( splineSquare, 70, 10, 10, true );
				const geoSquareRO = new THREE.TubeGeometry( splineSquare, 70, 20, 10, true );
				
				this.mesh = new THREE.Mesh(geoSquare, this.mat);
				this.rollover = new THREE.Mesh(geoSquareRO, this.mat);
				this.type = "square";
				
			}else{

				const pointsCircle = []
				const len = 20;
				for(let i = 0; i<len; i++){
					const x = this.centerPoint.x+(Math.sin( ( i / (len-1) )*(Math.PI*2) ) * (sze/2));
					const y = this.centerPoint.y+(Math.cos( ( i / (len-1) )*(Math.PI*2) ) * (sze/2));
					pointsCircle.push(new THREE.Vector3(x,y,0));
				}
					
				const splineCircle = new THREE.CatmullRomCurve3(pointsCircle);

				const geoCircle = new THREE.TubeGeometry( splineCircle, 70, 10, 10, true );
				const geoCircleRO = new THREE.TubeGeometry( splineCircle, 70, 20, 10, true );
				
				this.mesh = new THREE.Mesh(geoCircle, this.mat);
				this.rollover = new THREE.Mesh(geoCircleRO, this.mat);
				this.type = "circle";
				
			}

		}

		this.mesh.strokeIndex = this.index;
		this.rollover.strokeIndex = this.index;

		this.mesh.position.z = this.rollover.position.z = -100;
		
		this.mesh.frustumCulled = false;
		this.rollover.frustumCulled = false;

		holder.add(this.mesh, this.rollover);


		//synth.triggerAttackRelease("C2", "8n");

		/*
		"linear"
		"exponential"
		"sine"
		"cosine"
		"bounce"
		"ripple"
		"step"
		*/
		/*
		sine, square, triangle, or sawtooth.
		sine4, triangle8
		osc.partialCount = 3
		*/

		/*
		The type of the filter. Types: "lowpass", "highpass", "bandpass", "lowshelf", "highshelf", "notch", "allpass", or "peaking".
		*/
		switch(this.type){
			case "square":
			case "circle":
					this.synth = new Tone.MembraneSynth({
						pitchDecay: 0.02,
						octaves: 6,
						oscillator: {
							type: "square4"
						},
						envelope: {
							attack: 0.01,
							decay: 0.2,
							sustain: 0
						},
						filter: {
							Q: 1,
							type: "lowpass",
							rolloff: -24
						},
					}).toDestination();	
				break;
			default:
				this.synth = new Tone.DuoSynth(synthObj);//();
				break;
		}
			
		

		this.filter = new Tone.AutoFilter(.001).start();
        this.filter.wet.value = synthObj.filter;
        // distortion:0,
		// filter:0,
		// wha:0,
		// crusher:0,
		// feedback:0,;
        
        this.distortion = new Tone.Distortion(4.5);
        
        this.distortion.wet.value = synthObj.distortion;
        
        this.crusher = new Tone.BitCrusher(4);
        this.crusher.wet.value = synthObj.crusher;
        
        this.phaser = new Tone.AutoWah(100, 5, -20);
        
        this.phaser.wet.value = synthObj.phaser;
        this.feedback = new Tone.FeedbackDelay("8n", 0.35);
        this.feedback.wet.value = synthObj.feedback;

        this.compressor = new Tone.Compressor(-30, 3).toDestination();
        
        this.synth.chain(this.distortion, this.crusher, this.phaser, this.filter, this.feedback, this.compressor);


		//console.log(this.synth);
		//this.synth = new Tone.MembraneSynth().toDestination();

		// this.synth = new Tone.MembraneSynth({
		// 	pitchDecay: 0.02,
		// 	octaves: 6,
		// 	oscillator: {
		// 		type: "square4"
		// 	},
		// 	envelope: {
		// 		attack: 0.01,
		// 		decay: 0.2,
		// 		sustain: 0
		// 	},
		// 	filter: {
		// 		Q: 1,
		// 		type: "lowpass",
		// 		rolloff: -24
		// 	},
		// }).toDestination();//connect(drumCompress);

		//console.log(this.synth)

		

	}

	avgDist(arr, center, hh){
		let dist = 0;
		for( let i = 0; i<arr.length; i++){
			dist += new THREE.Vector2(arr[i].x, arr[i].y).distanceTo( new THREE.Vector2(center.x, center.y)) / (hh/2) ;
		}
		dist/=arr.length;
		return dist;
	}

	avgDistCheck(arr, center, avgDist, hh){
		let dist = 0;
		for( let i = 0; i<arr.length; i++){
			let d = new THREE.Vector2(arr[i].x, arr[i].y).distanceTo( new THREE.Vector2(center.x, center.y) )/(hh/2);
			dist += Math.abs(avgDist-d);
		}
		dist/=arr.length;
		return dist;

	}


	// avgPoint(arr){

	// 	let x = 0;
	// 	let y = 0;
	// 	for( let i = 0; i<arr.length; i++){
	// 		x+=arr[i].x;
	// 		y+=arr[i].y;
	// 	}

	// 	x/=arr.length;
	// 	y/=arr.length;

	// 	return {x:x, y:y};
	// }

	
	update(OBJ){
		this.mesh.position.z = this.rollover.position.z = -100;
		switch(this.type){
			case"circle":
			case"square":
				this.updateShape(OBJ)
				break;
			default:
				this.updateLine(OBJ);
				break;
		}
		

		
	}


	updateShape(OBJ){

		const ac = this.isTrigger(OBJ);
		
		if(!ac){
		
			this.rollover.visible = false;
			this.mesh.visible = true;

			this.initedSynth = false;

		}else{

			this.rollover.visible = true;
			this.mesh.visible = false;
			if(!this.initedSynth){

				this.synth.triggerAttackRelease(ac.note, "8n");
				this.initedSynth = true;

			}
			
		}

	}
	
	updateLine(OBJ){
		
		const ac = this.getInBetween(OBJ);
		
		
		if(!ac){
			
			this.rollover.visible = false;
			this.mesh.visible = true;

			if(!this.killedSynth){
				this.synth.triggerRelease();
				this.killedSynth = true;
			}

			this.initedSynth = false;

		}else{

			this.rollover.visible = true;
			this.mesh.visible = false;
			if(!this.initedSynth){
				this.synth.triggerAttack(ac.note);
				this.initedSynth = true;
			}else{
				if(!this.single)
					this.synth.setNote(ac.note);
			}
			this.killedSynth = false;
		}

	}

	clamp(input, min, max) {
		return input < min ? min : input > max ? max : input;
	}

	map(current, in_min, in_max, out_min, out_max) {
        const mapped = ((current - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
        return this.clamp(mapped, out_min, out_max);
    }
    
    lerp( a, b, alpha ) {
			return (a + alpha * ( b - a ));
	}

	isTrigger(OBJ){


		if(OBJ.time >= this.centerPoint.x-(this.shapeSize/2) &&  OBJ.time < this.centerPoint.x + (this.shapeSize/2) ){
			
			const y = this.centerPoint.y;
			const note = synthNotes[Math.round((1-(y/c.height)) * (synthNotes.length - 1))];
			
			return {note:note}

		}	
		return false;

	}

	getInBetween(OBJ){
		
		for(let i = 0; i<this.stroke.length-1; i++){
			if(this.stroke[i+1].x > this.stroke[i].x){
				
				if(OBJ.time >= this.stroke[i].x &&  OBJ.time < this.stroke[i+1].x){
					
					const distFirst = Math.abs(OBJ.time - this.stroke[i].x);
					const distSecond = Math.abs(this.stroke[i].x - this.stroke[i+1].x);
					const fac = this.map(distFirst, 0, distSecond, 0, 1);

					const y = this.lerp(this.stroke[i].y,this.stroke[i+1].y, fac) 
					const note = synthNotes[Math.round((1-(y/c.height)) * (synthNotes.length - 1))];
					
					return {note:note}

				}	

			}else{
				
				if(OBJ.time < this.stroke[i].x &&  OBJ.time >= this.stroke[i+1].x){

					const distFirst = Math.abs(OBJ.time - this.stroke[i+1].x);
					const distSecond = Math.abs(this.stroke[i].x - this.stroke[i+1].x);
					const fac = this.map(distFirst, 0, distSecond, 0, 1);

					const y = this.lerp(this.stroke[i+1].y,this.stroke[i].y, fac) 
					const note = synthNotes[Math.round((1-(y/c.height)) * (synthNotes.length - 1))];
					
					return {note:note}
				}

			}
			
		}
		return false;
		
	}

	


	
}



