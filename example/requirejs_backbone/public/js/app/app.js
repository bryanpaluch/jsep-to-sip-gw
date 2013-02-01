var usersList;
var cstate = 'open';
var socket;
var localVideo;
var localStream;
var remoteVideo;
var status;
var pc;
var initiator;
var started = false;
var currentTarget;
var currentTargetType;
var you;
var hash = null;
var socketReady = false;
var userMediaReady = false;
var isRTCPeerConnection = true;
var mediaConstraints = {'mandatory':{
	'OfferToReceiveAudio': true,
	'OfferToReceiveVideo': false, 
}};

//For now JSEP to SIP only supports voice
var voiceOnly = true;

$(document).ready(function() {
	init();
	webRtcReady();

	socket = io.connect('/');
	socket.on('connect', function() {

		$(":button").removeAttr('disabled');
	});

	socket.on('disconnect', function() {
		$(":button").attr('disabled', 'disabled');
	});

	socket.on('rtc_request', function(req) {
		currentTarget = req.from;
    console.log('Current target is ' + currentTarget); 
    console.log(req);
		if (isRTCPeerConnection)	
			processSignalingMessage(req);
		else
			processSignalingMessage00(req);

	});
	socket.on('rtc_reload', function(data) {
		console.log("New code on site, or bad io socket data, bye bye");
		window.location = data.destination;
	});

	$(":button").live('click', function() {
		var action = $(this).attr('action');
		var target = $($(this).attr('target')).val();
    console.log("clicked call button");
		if (action === 'call') {
			currentTarget = target;
      initiator = true;
	    transitionToWaiting();
			maybeStart();
		}else if (action === 'endChat'){
		  sendMessage({
		  	type: 'bye',
		  });
      onHangup();
    }
    else if( action === 'sendtext'){
      var data = $(target).val();
      console.log(data);
      if(data){
        socket.emit('rtc_chat', data);
        $(target).val('');
        }
    }
	});

});

function webRtcReady() {
	if (socketReady && userMediaReady) {
		console.log(socketReady);
		console.log(userMediaReady);
		console.log('webrtc ready');
	}
}
function init() {
	status = $('#status');
	localVideo = $('#localVideo')[0];
	remoteVideo = $('#remoteVideo')[0];
	getUserMedia();
}
function createPeerConnection() {
	var pc_config = {
		"iceServers": [{
			"url": "stun:stun.l.google.com:19302"
		}]
	};
	try {
		pc = new webkitRTCPeerConnection(pc_config);
		pc.onicecandidate = onIceCandidate;
		console.log("Created webkitRTCPeerConnection with config \"" + JSON.stringify(pc_config) + "\".");
    if(currentTargetType === 'phone'){
      var mediaConstraints = {
	    'has_audio': true,
	    'has_video': true 
     };
    }
	} catch(e) {
		try {
			var stun_server = "";
			if (pc_config.iceServers.length !== 0) {
				stun_server = pc_config.iceServers[0].url.replace('stun:', 'STUN ');
			}
			pc = new webkitPeerConnection00(stun_server, onIceCandidate00);
			isRTCPeerConnection = false;
			console.log("Created webkitPeerConnnection00 with config \"" + stun_server + "\".");
		} catch(e) {
			console.log("Failed to create PeerConnection, exception: " + e.message);
			alert("Cannot create PeerConnection object; Is the 'PeerConnection' flag enabled in about:flags?");
			return;
		}
	}
	pc.onconnecting = onSessionConnecting;
	pc.onopen = onSessionOpened;
	pc.onaddstream = onRemoteStreamAdded;
	pc.onremovestream = onRemoteStreamRemoved;
  pc.onnegotiationneeded = onNegotiationNeeded;
}
function maybeStart() {
	if (!started && localStream) {
		console.log("Creating PeerConnection.");
		createPeerConnection();
		console.log("Adding local stream.");
		pc.addStream(localStream);
		started = true;
		if (initiator) doCall();
	}
}
function doCall() {
	console.log("Sending offer to peer");
	 (isRTCPeerConnection) {
		pc.createOffer(setLocalAndSendMessage, null, mediaConstraints);
	} else {
		var offer = pc.createOffer(mediaConstraints);
		pc.setLocalDescription(pc.SDP_OFFER, offer);
		sendMessage({
			type: 'offer',
			sdp: offer.toSdp()
		});
		pc.startIce();
	}
}

function doAnswer() {
	console.log("Sending answer to peer");
	if (isRTCPeerConnection) {
		pc.createAnswer(setLocalAndSendMessage, null, mediaConstraints);
	} else {
		var offer = pc.remoteDescription;
		var answer = pc.createAnswer(offer.toSdp(), mediaConstraints);
		sendMessage({
			type: 'answer',
			sdp: answer.toSdp()
		});
		pc.startIce();
	}
}

function setLocalAndSendMessage(sessionDescription) {
 //fix to make sdp without video 
  if(voiceOnly){
    console.log('voiceonly call striping video from sdp');
    console.log(sessionDescription);
  sessionDescription.sdp = sessionDescription.sdp.substring(0, sessionDescription.sdp.indexOf('m=video')); 
  }
  pc.setLocalDescription(sessionDescription);
  console.log('local SDP');
  console.log(sessionDescription);
	sendMessage(sessionDescription);
  
}


function sendMessage(message) {
	message.target = currentTarget;
	socket.emit('rtc_request', message);
}

function processSignalingMessage(msg) {

	if (msg.type === 'offer') {
		// Callee creates PeerConnection
		if (!initiator && ! started)  
			maybeStart();
		// We only know JSEP version after createPeerConnection()
		if (isRTCPeerConnection) pc.setRemoteDescription(new RTCSessionDescription(msg));
		else pc.setRemoteDescription(pc.SDP_OFFER, new SessionDescription(msg.sdp));

		doAnswer();
	} else if (msg.type === 'answer' && started) {
    if(msg.voiceOnly)
      voiceOnly = true;
    console.log('voiceOnly');
    console.log('got answer');
		pc.setRemoteDescription(new RTCSessionDescription(msg));
    console.log(pc);
	} else if (msg.type === 'candidate' && started) {
		var candidate = new RTCIceCandidate({
			sdpMLineIndex: msg.label,
			candidate: msg.candidate
		});
		pc.addIceCandidate(candidate);
    console.log(pc);
	} else if (msg.type === 'bye' && started) {
		onRemoteHangup();
	}
}

function processSignalingMessage00(msg) {
  console.log(msg);
	if (msg.type === 'answer' && started) {
		pc.setRemoteDescription(pc.SDP_ANSWER, new SessionDescription(msg.sdp));
	} else if (msg.type === 'candidate' && started) {
		var candidate = new IceCandidate(msg.label, msg.candidate);
		pc.processIceMessage(candidate);
	} else if (msg.type === 'bye' && started) {
		onRemoteHangup();
	}
}

function getUserMedia() {
	try {
		navigator.webkitGetUserMedia({
			audio: true,
			video: true
		},
		onUserMediaSuccess, onUserMediaError);
		console.log("Requested access to local media with new syntax.");
	} catch(e) {
		try {
			navigator.webkitGetUserMedia("video,audio", onUserMediaSuccess, onUserMediaError);
			console.log("Requested access to local media with old syntax.");
		} catch(e) {
			alert("webkitGetUserMedia() failed. Is the MediaStream flag enabled in about:flags?");
			console.log("webkitGetUserMedia failed with exception: " + e.message);
		}
	}
}
function onUserMediaSuccess(stream) {
	console.log("User has granted access to local media.");
	var url = webkitURL.createObjectURL(stream);
	localVideo.style.opacity = 1;
	localVideo.src = url;
	localStream = stream;
  if(!voiceOnly){
   $("#selfarea").show();
   $("#selfarea").animate({opacity:1},600);
  }
	userMediaReady = true;
	webRtcReady();
}
function onUserMediaError(error) {
	console.log("Failed to get access to local media. Error code was " + error.code);
	alert("Failed to get access to local media. Error code was " + error.code + ".");
}
function onNegotiationNeeded(event){
  console.log('negoiation needed');
  console.log(event);
}
function onIceCandidate(event){
	if (event.candidate) {
   // console.log(event);
		sendMessage({type: 'candidate',
								 label: event.candidate.sdpMLineIndex,
								 id: event.candidate.sdpMid,
								 candidate: event.candidate.candidate,
                 });
	} else {
  //  console.log(event);
		sendMessage({type: 'icefinished',
                });
		console.log("End of candidates");
	}
}
function onIceCandidate00(candidate, moreToFollow) {
	if (candidate) {
		sendMessage({
			type: 'candidate',
			label: candidate.label,
			candidate: candidate.toSdp()
		});
	}
	if (!moreToFollow) {
		sendMessage({type: 'icefinished'});
		console.log("End of candidates.");
	}
}
function onSessionConnecting(message) {
	console.log("Session connecting.");
  console.log(message);
}
function onSessionOpened(message) {
  console.log(this);
  console.log(message);
	console.log("Session opened.");
  //Super bad hack for demoing voice call out to pstn...
  if(voiceOnly){
    console.log("voice only transfering to active");
    transitionToActive();
  }
}
function onRemoteStreamAdded(event) {
	console.log("Remote stream added.");
  console.log(event);
	var url = webkitURL.createObjectURL(event.stream);
	remoteVideo.src = url;
	waitForRemoteVideo();
}

function onRemoteStreamRemoved(event) {
	console.log("Remote stream removed.");
}

function onHangup() {
	console.log("Hanging up.");
	started = false; // Stop processing any message
	transitionToDone();
	isRTCPeerConnection = true;
	pc.close();
	pc = null;
}

function onRemoteHangup() {
	console.log('Session terminated.');
  console.log(currentTarget);
	started = false; // Stop processing any message
	transitionToDone();
	pc.close();
	pc = null;
	initiator = 0;
}

function waitForRemoteVideo() {
  console.log('waiting for remote videoing...');
	if (remoteVideo.currentTime > 0 || voiceOnly) {
		transitionToActive();
	} else {
		setTimeout(waitForRemoteVideo, 100);
	}
}
function transitionToActive() {
  if(voiceOnly){
    console.log("changing voice status");
   $("#statusarea").animate({opacity:0},600, function(){
     $("#statusarea").html("<h1>Voice Only Call</h1>");
     $("#statusarea").animate({opacity:1},300);
   });
  }else{
	remoteVideo.style.opacity = 1;
  $("#statusarea").animate({opacity: 0},600, function(){
      $("#statusarea").hide();
      $("#talkarea").show();
      $("#talkarea").animate({opacity:1}, 300);
  });
  }
}

function transitionToWaiting() {
  if(voiceOnly){
   $("#callform").hide();
   $("#statusarea").animate({opacity:0},600, function(){
     $("#statusarea").html("<h3>Calling " + currentTarget + "</h1>");
     $("#statusarea").animate({opacity:1},300);
    });
    voiceOnly = true;
  }else{
	setTimeout(function() {
		remoteVideo.src = ""
	},
	500);
	remoteVideo.style.opacity = 0;
  $("#callform").hide();
  $("#statusarea").animate({opacity: 0},600, function(){
      $("#statusarea").hide();
      $("#statusarea").show();
  });
  }
}

function transitionToDone() {
  $("#statusarea").animate({opacity: 1},600, function(){
     $("#statusarea").html("<h3>type in a phone number to start </h1>");
      $("#callform").show();
      $("#statusarea").show();
  });

	localVideo.style.opacity = 0;
	remoteVideo.style.opacity = 0;
}

