module.exports = {
	development: {
    //sip gateway that supports PeerConnection SDP 
    //Asterisks server with patches
		outboundproxy: '10.255.132.180:5060',
    //sip domain of your sip gateway
    domain: 'cabletownlabs.com',
    //ip and host of the machine the this is running on
    localHost: '10.255.132.197:5060',
    //your organizations name
    org: 'CableTownLabs'
	},
	test: {

	},
	production: {

	}
}

