var sdpParser = require('../lib/sdpParser');


var testSDP = 'v=0\r\no=- 1879334135 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE audio video\r\nm=audio 1 RTP/SAVPF 103 104 0 8 106 105 13 126\r\nc=IN IP4 0.0.0.0\r\na=rtcp:1 IN IP4 0.0.0.0\r\na=ice-ufrag:V+osJnZQxvEMSW1B\r\na=ice-pwd:Q8guGkKMW3G2+MjNsmkbU+w2\r\na=ice-options:google-ice\r\na=sendrecv\r\na=mid:audio\r\na=rtcp-mux\r\na=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:Hntc9DkXvBqCuEmBfoUnWDDfmqAL43SqbKn/bOPw\r\na=rtpmap:103 ISAC/16000\r\na=rtpmap:104 ISAC/32000\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:8 PCMA/8000\r\na=rtpmap:106 CN/32000\r\na=rtpmap:105 CN/16000\r\na=rtpmap:13 CN/8000\r\na=rtpmap:126 telephone-event/8000\r\na=ssrc:903143368 cname:tkoTYpJgh7HHMiem\r\na=ssrc:903143368 mslabel:9Vf069ZILGF5Ncc0yLA63ivaPlukqoA08rpp\r\na=ssrc:903143368 label:9Vf069ZILGF5Ncc0yLA63ivaPlukqoA08rpp00\r\nm=video 1 RTP/SAVPF 100 101 102\r\nc=IN IP4 0.0.0.0\r\na=rtcp:1 IN IP4 0.0.0.0\r\na=ice-ufrag:V+osJnZQxvEMSW1B\r\na=ice-pwd:Q8guGkKMW3G2+MjNsmkbU+w2\r\na=ice-options:google-ice\r\na=sendrecv\r\na=mid:video\r\na=rtcp-mux\r\na=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:Hntc9DkXvBqCuEmBfoUnWDDfmqAL43SqbKn/bOPw\r\na=rtpmap:100 VP8/90000\r\na=rtpmap:101 red/90000\r\na=rtpmap:102 ulpfec/90000\r\na=ssrc:3893068735 cname:tkoTYpJgh7HHMiem\r\na=ssrc:3893068735 mslabel:9Vf069ZILGF5Ncc0yLA63ivaPlukqoA08rpp\r\na=ssrc:3893068735 label:9Vf069ZILGF5Ncc0yLA63ivaPlukqoA08rpp10\r\n'

console.log('starting test');
var sdp = new sdpParser(testSDP);
console.log("JSON VERSION");
console.log(sdp.toJson());

console.log("String VERSION");
console.log(sdp.toString());
