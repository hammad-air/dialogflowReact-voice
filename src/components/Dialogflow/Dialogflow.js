import React, { Component } from 'react';
import { gapi } from 'gapi-script';
import '../../assets/css/Dialogflow.css';
import Cookies from 'js-cookie';

//Se definen opciones de grabación
var gumStream;
var rec; 
var input;

//Definen opciones del audio (formato y hz)
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext;
var audioRateHZ;
var audioBase64;

//API-KEYS GOOGLE Y DIALOGFLOW
const CLIENT_ID_OAuth2 = '884495017123-l2r6kgp6mv5uaqe4maoqr25vhdiilkqn.apps.googleusercontent.com';
const API_KEY_DIALOGFLOW = 'AIzaSyCGj3h06LJhBVsc2Ku3bPqOhoZZ2fHtvGE';


function blobToDataURL(blob, callback) {
  var a = new FileReader();
  a.readAsDataURL(blob);
  a.onload = function(e) {callback(e.target.result);}
}

function authenticateGoogleOAuth2() {
  return gapi.auth2.getAuthInstance()
      .signIn({scope: "https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/dialogflow"})
      .then(function() { console.log("Sign-in OAuth2 successful"); loadClientDialogflow();},
            function(err) { console.error("Error signing in", err); });
}

function loadClientDialogflow() {
  gapi.client.setApiKey(API_KEY_DIALOGFLOW);
  return gapi.client.load("https://content.googleapis.com/discovery/v1/apis/dialogflow/v2beta1/rest")
      .then(function() { console.log("GAPI Dialogflow client loaded for API"); sendDialogFlowAudio();},
            function(err) { console.error("Error loading GAPI client for API", err); });
}

function sendDialogFlowAudio() {
  return gapi.client.dialogflow.projects.agent.sessions.detectIntent({
    "session": "projects/sac-vog-cecebh/agent/sessions/123456",
    "resource": {
      "queryInput": {
        "audioConfig": {
          "languageCode": "es-ES",
          "audioEncoding": "AUDIO_ENCODING_LINEAR_16",
          "sampleRateHertz": audioRateHZ
        }
      },
      "outputAudioConfig": {
        "audioEncoding": "OUTPUT_AUDIO_ENCODING_MP3"
      },
      "inputAudio": audioBase64
    }
  }).then(function(response) {
    var respuestaAudio = document.getElementById("respuestaAudio");
    respuestaAudio.controls = true;
    respuestaAudio.src = 'data:audio/mp3;base64,'+response.result.outputAudio;
    respuestaAudio.play();
  },
  function(err) { console.error("Execute error", err); });
}

function onStart(){
  //Reproducimos sonido
  var audio = document.getElementById("startSpeak");
  audio.play();
  var constraints = { audio: true, video:false }
  navigator.mediaDevices.getUserMedia(constraints).then(function(stream){
    console.log("getUserMedia() success, stream created, initializing Recorder.js ...");
    audioContext = new AudioContext();
    audioRateHZ = audioContext.sampleRate;
    gumStream = stream;
    input = audioContext.createMediaStreamSource(stream);
    rec = new window.Recorder(input,{numChannels:1});
    rec.record();
    console.log("Recording started");
  }).catch(function(err) {
    console.log(err);
  });

}

function onStop(){
  if (typeof rec !== 'undefined') {
    rec.stop();
    gumStream.getAudioTracks()[0].stop();
    rec.exportWAV(createDownloadLink);
  }
}

function createDownloadLink(blob) {
  blobToDataURL(blob, function(res){
      audioBase64 = res.replace(/^data:.+?base64,/, "");
      //Antes de enviarlo verificamos si esta autenticado por Google OAuth2
      if (typeof Cookies.get('G_AUTHUSER_H') !== 'undefined') {
        loadClientDialogflow();
      }else{
        authenticateGoogleOAuth2();
      }
      
  });
}

gapi.load("client:auth2", function() {
    gapi.auth2.init({client_id: CLIENT_ID_OAuth2});
});

const Dialogflow = () => {
    return (
        <div className="App">
        <img onMouseDown={onStart} onMouseUp={onStop} className="microphopne" alt='micro' src='./microphone.png'></img>
        <audio style={{display:"none"}} src="./google_now_voice.mp3" id="startSpeak"></audio>
            <audio style={{display:"none"}} id="respuestaAudio"></audio>
        </div>
    )
}
export default Dialogflow;