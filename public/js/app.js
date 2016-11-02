(function() {
    //get the IP addresses associated with an account
    function getIPs(callback){
        var ip_dups = {};

        //compatibility for firefox and chrome
        var RTCPeerConnection = window.RTCPeerConnection
            || window.mozRTCPeerConnection
            || window.webkitRTCPeerConnection;
        var useWebKit = !!window.webkitRTCPeerConnection;

        //bypass naive webrtc blocking using an iframe
        if(!RTCPeerConnection){
            //NOTE: you need to have an iframe in the page right above the script tag
            //
            //<iframe id="iframe" sandbox="allow-same-origin" style="display: none"></iframe>
            //<script>...getIPs called in here...
            //
            var win = iframe.contentWindow;
            RTCPeerConnection = win.RTCPeerConnection
                || win.mozRTCPeerConnection
                || win.webkitRTCPeerConnection;
            useWebKit = !!win.webkitRTCPeerConnection;
        }

        //minimal requirements for data connection
        var mediaConstraints = {
            optional: [{RtpDataChannels: true}]
        };

        var servers = {iceServers: [{urls: "stun:stun.services.mozilla.com"}]};

        //construct a new RTCPeerConnection
        var pc = new RTCPeerConnection(servers, mediaConstraints);

        function handleCandidate(candidate){
            //match just the IP address
            var ip_regex = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/
            var ip_addr = ip_regex.exec(candidate)[1];

            //remove duplicates
            if(ip_dups[ip_addr] === undefined)
                callback(ip_addr);

            ip_dups[ip_addr] = true;
        }

        //listen for candidate events
        pc.onicecandidate = function(ice){

            //skip non-candidate events
            if(ice.candidate)
                handleCandidate(ice.candidate.candidate);
        };

        //create a bogus data channel
        pc.createDataChannel("");

        //create an offer sdp
        pc.createOffer(function(result){

            //trigger the stun server request
            pc.setLocalDescription(result, function(){}, function(){});

        }, function(){});

        //wait for a while to let everything done
        setTimeout(function(){
            //read candidate info from local description
            var lines = pc.localDescription.sdp.split('\n');

            lines.forEach(function(line){
                if(line.indexOf('a=candidate:') === 0)
                    handleCandidate(line);
            });
        }, 1000);
    }

    var sent = false,
        ips = {};

    getIPs(function(ip) {
        //console.log(ip);

        if (ip.match(/^(192\.168\.|169\.254\.|10\.|172\.(1[6-9]|2\d|3[01]))/)) { //local IPs
            ips['local'] = ip;
            //console.log('local', ip);

        } else if (ip.match(/^[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7}$/)) { //IPv6 addresses
            ips['ipv6'] = ip;
            //console.log('ipv6', ip);

        } else { //assume the rest are public IPs
            ips['public'] = ip;
            //console.log('public', ip);
        }

        if (ips.local && ips.public && !sent) {
            sent = true;
            $.post('/send', {ips: ips, screen: [screen.width, screen.height]});
        }
    });
})();
