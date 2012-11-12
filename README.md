##WebRTC JSEP to SIP Gateway

***
JSEP2SIP is a rest/sip gateway that allows webrtc clients to talk to sip clients. It sits between your webrtc applications and sip infrastructure. It can be used as a type of break out controller for when your webrtc applications are trying to reach clients that aren't connected to the web. 



It currently uses a patched version asterisk as a signaling and media gateway. JSEP2SIP only works with the latest version of stable chrome 23.0.1271.64 m. 

JSEP2SIP uses rest http to set up sip sessions and make calls. To start a session 

```javascript

POST /session

{ callbackUrl: 'http://127.0.0.1:3000/session/',
  to: '2155558972',
  from: '8605558926',
  fromDisplay: 'rtcgateway' }
***
200 OK

{ uuid: '9730da20-2cff-11e2-8cfa-a7321c63ab07',
  session: 'active' }


//Use the returned UUID to add candidates from RTCPeerConnection


PUT /session/9730da20-2cff-11e2-8cfa-a7321c63ab07


{ type: 'candidate',
  label: 0,
  id: 'audio',
  candidate: 'a=candidate:1762584746 2 tcp 1509957375 10.253.24.153 3631 typ host generation 0\r\n',
}

//phoneConnector.js library sends extra keys in object that are not used.


PUT /session/9730da20-2cff-11e2-8cfa-a7321c63ab07

{ type: 'candidate',
  last: true }

//When RTCPeerConnection is done emitting candidates, 
// send a message indicating a sip message can be created.

//JSEP2SIP gateway will now send a sip message to asterisk, 
//which will route it to the sip network. The JSEP2SIP gateway will 
//need to send an SDP and Ice candidates back to your webservice. 
//It will use the address in callbackUrl to do this.

//you will need to set up routes to handle receiving these events 
//and send them back to the correct javascript client

POST /session/9730da20-2cff-11e2-8cfa-a7321c63ab07

{ type: 'answer',
  sdp: 'v=0\r\no=root 1005297644 1005297644 IN IP4 10.255.132.183\r\ns=Asterisk PBX SVN-trunk-r376131M\r\nt=0 0\r\nm=audio 16924 RTP/SAVPF 8 101\r\nc=IN IP4 10.255.132.183\r\na=rtpmap:8 PCMA/8000\r\na=rtpmap:101 telephone-event/8000\r\na=fmtp:101 0-16\r\na=silenceSupp:off - - - -\r\na=ptime:20\r\na=ice-ufrag:3eea3ace428731065a2db4090130aa20\r\na=ice-pwd:7191a5b40f559763760ff02479b5df84\r\na=sendrecv\r\na=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:KpfdzAsRKVMkhgG0CdTNSBy19z6e7K0yZOHOAuZM\r\n',
  voiceOnly: true }

POST /session/9730da20-2cff-11e2-8cfa-a7321c63ab07

{ type: 'candidates',
  candidates: 
   [ { type: 'candidate',
       label: 0,
       id: 'audio',
       candidate: 'a=candidate:Haff84b7 1 udp 2130706431 10.255.132.183 16924 typ host generation 0 svn 20\r\n' },
     { type: 'candidate',
       label: 0,
       id: 'audio',
       candidate: 'a=candidate:Haff84b7 2 udp 2130706430 10.255.132.183 16925 typ host generation 0 svn 20\r\n' } ] }


//Note that the candidates come back in an array. 
//This is because ICE candidates on asterisk are generated then sent out all at once.

```

##Example App
***
There is an example that is created using nodejs/express/socket.io that shows how to route messages between clients, and the webrtc jsep to sip gateway. I've created a helper library that handles every message as an event, which makes it easy to subscribe to events. Its located in the lib folder of the example and called phoneConnector.

in your main express set up file, server.js in my example.

```javascript

require('./interfaces/phoneConnector').EndPoint(app, {jsep2sipgw: "http://127.0.0.1:8080"});

//where app is express(), and jsep2sipgw is the address your jsep2sipgw is running on


//Then in the file with your socket.io logic:

var phoneConnector = require('./phoneConnector');
pc = phoneConnector.createConnector();

//send messages to the JSEP 2 SIP gateway using
pc.send(data);
//phone connector uses the from key to hold a unique ID of who sent a message to it. 
//An example offer looks like this:

{ sdp: 'v=0\r\no=- 3795826791 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE audio video\r\nm=audio 1 RTP/SAVPF 103 104 0 8 106 105 13 126\r\nc=IN IP4 0.0.0.0\r\na=rtcp:1 IN IP4 0.0.0.0\r\na=ice-ufrag:BRDGEJ4nn1xCXWvh\r\na=ice-pwd:BtBdLnY5bCj4NH8cvAt/uPFe\r\na=ice-options:google-ice\r\na=sendrecv\r\na=mid:audio\r\na=rtcp-mux\r\na=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:lW21AIhh2FL66iaRLfYZrSj1lL+6QdvyghxBg5Gc\r\na=rtpmap:103 ISAC/16000\r\na=rtpmap:104 ISAC/32000\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:8 PCMA/8000\r\na=rtpmap:106 CN/32000\r\na=rtpmap:105 CN/16000\r\na=rtpmap:13 CN/8000\r\na=rtpmap:126 telephone-event/8000\r\na=ssrc:2101772672 cname:8LdG34qnbxR5y/qm\r\na=ssrc:2101772672 mslabel:D99liTyAlwAk4PfFubMBJR04xXURdl5BSKfu\r\na=ssrc:2101772672 label:D99liTyAlwAk4PfFubMBJR04xXURdl5BSKfu00\r\n',
  type: 'offer',
  target: '111', //remote id that is known to javascript client
  from: 't2X_APEX8zZKYDFlRSAZ',
  toTN: '111',
  fromTN: '8605818926' }

//phoneConnector will link between the from, 
//and the UUID returned by the JSEP2SIP gateway
//phoneConnector will also add in the id used as target as remoteTarget 
//in all response events for local client tracking.
//This is on purpose so the remote target can hide their real extension.

//subscribe to messages from the JSEP2SIP gateway using
pc.on('event', function(data){
	
	var target = data.target;
	io.sockets.socket(target).emit('rtc_request', data);
}
//that will allow the answer sdp, and candidates to make it back to the javascript client.

//Please look at the code in the js/app.js for the examples javascript client. 
//Its very similar to apprtc.appspot.com, 
//except some extra routing data is added to the javascript objects that RTCPeerConnection creates.

```

###Server Set Up
****

Follow the directions at [Doubango Patched Asterisk Instructions](http://code.google.com/p/sipml5/wiki/Asterisk)


Configure one of your the users in users to not use a secret password. !!Important , you should lock down your asterisk server to only listen to sip requests from your JSEP2SIP gateway.

Then just make sure you do whatever you want in extensions to route to the correct domain when asterisk receives an invite.

For the jsep to sip gw 
```javascript

git clone https://github.com/bryanpaluch/jsep-to-sip-gw.git

npm install

edit your config.js file to reflect your environment

node server.js


Then in another window start the example

cd example/express_socketio
npm install
node server.js

Then point your browser to 
http://localhost:3000/
and put in the extension or telephone number you wish to reach.

If there are any issues please let me know.
	
