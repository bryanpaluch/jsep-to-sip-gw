var restify = require('restify');
var client = restify.createJsonClient({
  version:'*',
  url: 'http://127.0.0.1:8080'
});

var uuid;
var offer = { sdp: 'v=0\r\no=- 839409453 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE audio video\r\nm=audio 1 RTP/SAVPF 103 104 0 8 106 105 13 126\r\nc=IN IP4 0.0.0.0\r\na=rtcp:1 IN IP4 0.0.0.0\r\na=ice-ufrag:GqQEifcFH5sdEvKT\r\na=ice-pwd:7Hx3lRAWkOa1D0X/vAcpDqBj\r\na=ice-options:google-ice\r\na=sendrecv\r\na=mid:audio\r\na=rtcp-mux\r\na=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:t0bLMI1IEYQALzm7zij9chPSOwl6FVhaZk84eIim\r\na=rtpmap:103 ISAC/16000\r\na=rtpmap:104 ISAC/32000\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:8 PCMA/8000\r\na=rtpmap:106 CN/32000\r\na=rtpmap:105 CN/16000\r\na=rtpmap:13 CN/8000\r\na=rtpmap:126 telephone-event/8000\r\na=ssrc:1624926073 cname:OEedQfzKFuU41MBc\r\na=ssrc:1624926073 mslabel:B1UY8FECjwVjvxdkJU5e3e3xmKyAO2twSKcm\r\na=ssrc:1624926073 label:B1UY8FECjwVjvxdkJU5e3e3xmKyAO2twSKcm00\r\nm=video 1 RTP/SAVPF 100 101 102\r\nc=IN IP4 0.0.0.0\r\na=rtcp:1 IN IP4 0.0.0.0\r\na=ice-ufrag:GqQEifcFH5sdEvKT\r\na=ice-pwd:7Hx3lRAWkOa1D0X/vAcpDqBj\r\na=ice-options:google-ice\r\na=sendrecv\r\na=mid:video\r\na=rtcp-mux\r\na=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:t0bLMI1IEYQALzm7zij9chPSOwl6FVhaZk84eIim\r\na=rtpmap:100 VP8/90000\r\na=rtpmap:101 red/90000\r\na=rtpmap:102 ulpfec/90000\r\na=ssrc:1026230016 cname:OEedQfzKFuU41MBc\r\na=ssrc:1026230016 mslabel:B1UY8FECjwVjvxdkJU5e3e3xmKyAO2twSKcm\r\na=ssrc:1026230016 label:B1UY8FECjwVjvxdkJU5e3e3xmKyAO2twSKcm10\r\n',
    type: 'offer'}

var candidate1 = { type: 'candidate',
      label: 0,
      id: 'audio',
      candidate: 'a=candidate:663557210 1 udp 2113937151 10.253.24.153 1099 typ host generation 0\r\n',
      }


describe('service: session', function() {
  describe('200 check for create session', function(){
    it('should get a 200 response with uuid', function () {
      client.post('/session',{callbackUrl: 'http://127.0.0.1:3000/someid'}, function(err, req, res, data){
        if (err) {
          throw new Error(err);
        }
        else {
          if (data.code != 200 && data.uuid) {
            throw new Error('invalid response from POST /session');
          }
          uuid = data.uuid;
          done();
        }
      });
    });
  });
  describe('200 response check for add sdp', function(){
    it('should get a 200 response', function(){
      client.put('/session/' + uuid, offer,function(err, req, res, data){
        if(err) {
          throw new Error(err);
        }
        else {
          if (data.code !=200){
            throw new Error('invalid reponse from Post /session/:uuid');
          }
          done();
        }

      });
    });
  });
});


