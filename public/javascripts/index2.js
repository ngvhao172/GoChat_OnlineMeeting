const mediasoupClient = require('mediasoup-client')

const ws = new WebSocket('ws://localhost:3000');

let device
let rtpCapabilities
let producerTransport;
let consumerTransport;
let consumerTransports = {};
let consumer;
let consumers = {};

let params = {
    // mediasoup params
    encodings: [
        {
            rid: 'r0',
            maxBitrate: 100000,
            scalabilityMode: 'S1T3',
        },
        {
            rid: 'r1',
            maxBitrate: 300000,
            scalabilityMode: 'S1T3',
        },
        {
            rid: 'r2',
            maxBitrate: 900000,
            scalabilityMode: 'S1T3',
        },
    ],
    // https://mediasoup.org/documentation/v3/mediasoup-client/api/#ProducerCodecOptions
    codecOptions: {
        videoGoogleStartBitrate: 1000
    }
}

let audioParams;
let videoParams = { params };

let callbackId;
let isCallbackCalled = false;

const getLocalStream = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = stream
    const videoTrack = stream.getVideoTracks()[0];
    const audioTrack = stream.getAudioTracks()[0];
    audioParams = {
        track: audioTrack,
        ...audioParams
    }
    videoParams = {
        track: videoTrack,
        ...videoParams
    }
}

getLocalStream();

const createDevice = async () => {
    try {
        device = new mediasoupClient.Device();

        // https://mediasoup.org/documentation/v3/mediasoup-client/api/#device-load
        // Loads the device with RTP capabilities of the Router (server side)
        await device.load({
            // see getRtpCapabilities() below
            routerRtpCapabilities: rtpCapabilities
        })

        console.log('RTP Capabilities', device.rtpCapabilities)

    } catch (error) {
        console.log(error)
        if (error.name === 'UnsupportedError')
            console.warn('browser not supported')
    }
}

let allProduce = false;
const createSendTransport = (params) => {
    // see server's socket.on('createWebRtcTransport', sender?, ...)
    // this is a call from Producer, so sender = true
    // ws.send('createWebRtcTransport', { sender: true }, ({ params }) => {
    // The server sends back params needed 
    // to create Send Transport on the client side
    if (params.error) {
        console.log(params.error)
        return
    }

    console.log("Params on create send transport", params)

    // creates a new WebRTC Transport to send media
    // based on the server's producer transport params
    // https://mediasoup.org/documentation/v3/mediasoup-client/api/#TransportOptions
    producerTransport = device.createSendTransport(params)

    console.log("producerTransport created on client side", producerTransport);


    connectSendTransport();

    // https://mediasoup.org/documentation/v3/communication-between-client-and-server/#producing-media
    // this event is raised when a first call to transport.produce() is made
    // see connectSendTransport() below
    producerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
        console.log("DTLS", dtlsParameters);
        try {
            // Signal local DTLS parameters to the server side transport
            // see server's socket.on('transport-connect', ...)
            console.log("connect producer transport?", dtlsParameters);
            ws.send(JSON.stringify({
                action: "connectProducerTransport",
                dtlsParameters: dtlsParameters,
                roomId: roomId,
                userId: idRandom
            }))

            // Tell the transport that parameters were transmitted.
            callback()

        } catch (error) {
            errback(error)
        }
    })

    producerTransport.on('produce', async (parameters, callback, errback) => {
        console.log(parameters)

        try {
            // tell the server to create a Producer
            // with the following parameters and produce
            // and expect back a server side producer id
            // see server's socket.on('transport-produce', ...)
            ws.send(JSON.stringify({
                action: 'produce',
                kind: parameters.kind,
                rtpParameters: parameters.rtpParameters,
                appData: parameters.appData,
                roomId: roomId,
                userId: idRandom,
                allProduce: allProduce
            }));
            // Let's assume the server included the created producer id in the response
            // data object.
            // const { id } = data;
            // console.log(id);

            // // Tell the transport that parameters were transmitted and provide it with the
            // // server side producer's id.
            // callback({ id });
            // }), ({ id }) => {
            //     // Tell the transport that parameters were transmitted and provide it with the
            //     // server side producer's id.
            //     console.log("GET CALL BACK", id);
            //     alert("123")
            //     callback({ id })
            // })
            setTimeout(() => {
                if (callbackId && !isCallbackCalled) {
                    callback(callbackId);
                    isCallbackCalled = true;
                    callbackId = null;
                } else {
                    console.log('Waiting for callbackId...');
                }
            }, 100);
        } catch (error) {
            console.log(error);
            errback(error)
        }
    })
    // })
}
const connectSendTransport = async () => {
    // we now call produce() to instruct the producer transport
    // to send media to the Router
    // https://mediasoup.org/documentation/v3/mediasoup-client/api/#transport-produce
    // this action will trigger the 'connect' and 'produce' events above
    if (!params.track) {
        await getLocalStream();
    }
    console.log("producerTransport created on client side", producerTransport);
    console.log("params", params);
    // producer = await producerTransport.produce(params)
    // alert("start");
    videoProducer = await producerTransport.produce(videoParams);
    allProduce = true;
    // alert("Continue");
    audioProducer = await producerTransport.produce(audioParams);
    // alert("Consume both AUDIO AND VIDEO");


    videoProducer.on('trackended', () => {
        console.log('track ended')

        // close video track
    })

    videoProducer.on('transportclose', () => {
        console.log('transport ended')

        // close video track
    })

    audioProducer.on('trackended', () => {
        console.log('track ended')

        // close video track
    })

    audioProducer.on('transportclose', () => {
        console.log('transport ended')

        // close video track
    })

   
}

let idRandom = Math.floor(Math.random() * 1000).toString();
let roomId = "123";

ws.onopen = async () => {
    // await getLocalStream();
    // console.log("params on producer transport", params);
    //nên gửi request join trước
    //ws.send(JSON.stringify({ action: 'getRtpCapabilities' }));
    ws.send(JSON.stringify({ action: 'join', roomId: roomId, userId: idRandom, name: "Nguyen Van Hao, " + idRandom }));
    ws.send(JSON.stringify({ action: 'getRtpCapabilities', roomId: roomId, userId: idRandom }));
    console.log("ws on open");
};


ws.onmessage = async (event) => {
    const data = JSON.parse(event.data);
    console.log("Data send to client", data);
    switch (data.action) {
    
        case 'user-list':
            console.log("get user list");
            break;
        case 'getRtpCapabilities':
            rtpCapabilities = data.rtpCapabilities
            await createDevice();
            ws.send(JSON.stringify({ action: 'createProducerTransport', roomId: roomId, userId: idRandom }));
            break;
        case 'producerTransportCreated':
            console.log(data.id);
            // producerTransport = device.createSendTransport(data);
            // producerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
            //     console.log(dtlsParameters);
            //     try {
            //         ws.send('connectProducerTransport', { dtlsParameters });
            //         callback();
            //     } catch (error) {
            //         errback(error);
            //     }
            // });
            createSendTransport(data);
            break;

        case 'producerTransportConnected':
            // connectSendTransport();
            // localStream.getTracks().forEach(track => {
            //     producerTransport.addTrack(track, localStream);
            // });
            // producerTransport.on('produce', async (parameters, callback, errback) => {
            //     console.log(parameters)

            //     try {
            //         await ws.send('produce', {
            //             kind: parameters.kind,
            //             rtpParameters: parameters.rtpParameters,
            //             appData: parameters.appData,
            //         }, ({ id }) => {
            //             // Tell the transport that parameters were transmitted and provide it with the
            //             // server side producer's id.
            //             callback({ id })
            //         })
            //     } catch (error) {
            //         errback(error)
            //     }
            // })
            // connectSendTransport();
            /*const offer = await producerTransport.createOffer();
            await producerTransport.setLocalDescription(offer);
            ws.send(JSON.stringify({ action: 'produce', kind: 'video', rtpParameters: offer.sdp }));*/
            break;

        case 'produced':
            {
                console.log('Producer created:', data.id);
                callbackId = data.id;
                isCallbackCalled = false;
            }
            break;

        case 'newProducer':
            {
                console.log('New producer:', data.producerId);
                ws.send(JSON.stringify({ action: 'createConsumerTransport', producerId: data.producerId, roomId: roomId, userId: idRandom, producerUserId: data.producerUserId  }));
            }
            break;

        case 'consumerTransportCreated':
            // {
            //     const transport = createWebRtcTransport(data);
            //     consumerTransports[data.id] = transport;
            //     const offer = await transport.createOffer();
            //     await transport.setLocalDescription(offer);
            //     ws.send(JSON.stringify({ action: 'connectConsumerTransport', dtlsParameters: transport.localDescription, producerId: data.producerId }));
            // }
            createRecvTransport(data);
            break;

        case 'consumerTransportConnected':
            // {
            //     const producerId = data.producerId;
            //     const rtpCapabilities = await getRtpCapabilities();
            //     ws.send(JSON.stringify({ action: 'consume', producerId, rtpCapabilities }));
            // }
            // connectRecvTransport();
            break;

        case 'consumed':

            console.log("ConsumerTransport needed: ", consumerTransports[data.producerUserId]);
            consumer = await consumerTransports[data.producerUserId].consume({
                id: data.id,
                producerId: data.producerId,
                kind: data.kind,
                rtpParameters: data.rtpParameters
            })
            console.log("CONSUMER PRODUCER ID", consumer.producerId);
            if(!consumers[data.producerUserId]){
                consumers[data.producerUserId] = {};
            }
            consumers[data.producerUserId][data.kind] = consumer
            // consumers[producerUserId][kind] = consumer

            // destructure and retrieve the video track from the producer
            const { track } = consumer
            // const container = document.getElementById('video-container');

            // let remoteVideo = document.createElement('video');

            // // Thiết lập thuộc tính cho video
            // remoteVideo.id = data.id;
            // remoteVideo.autoplay = true;


            // // let remoteVideo = createVideoElement(data.id);

            // remoteVideo.srcObject = new MediaStream([track])

            // console.log('Video source object set:', remoteVideo.srcObject);

            // console.log(remoteVideo.srcObject)

            // container.appendChild(remoteVideo);
            addTrackToVideoElement(track, data.producerUserId);

            // Log track details
            console.log('Consumer track details:', consumer.track);
            // console.log('Stream tracks:', remoteVideo.getTracks());


            // the server consumer started with media paused
            // so we need to inform the server to resume
            ws.send(JSON.stringify(
                { action: 'consumer-resume', id: consumer.producerId, roomId: roomId, userId: idRandom }
            ));
            break;
    }
};
function addTrackToVideoElement(track, id) {
    const container = document.getElementById('video-container');
    let remoteVideo = document.getElementById(id);
  
    if (!remoteVideo) {
      // Tạo mới video element nếu chưa có
      remoteVideo = document.createElement('video');
      remoteVideo.id = id;
      remoteVideo.autoplay = true;
      container.appendChild(remoteVideo);
    }
  
    if (!remoteVideo.srcObject) {
      remoteVideo.srcObject = new MediaStream();
    }
  
    remoteVideo.srcObject.addTrack(track);
    console.log('Added track to MediaStream:', track);
    console.log('Updated MediaStream for video element with id:', id, remoteVideo.srcObject);
    // console.log('Stream tracks:', remoteVideo.getTracks());

  }


const createRecvTransport = async (params) => {
    // see server's socket.on('consume', sender?, ...)
    // this is a call from Consumer, so sender = false

    // creates a new WebRTC Transport to receive media
    // based on server's consumer transport params
    // https://mediasoup.org/documentation/v3/mediasoup-client/api/#device-createRecvTransport
    
    if(consumerTransports[params.producerUserId]){
        consumerTransport = consumerTransports[params.producerUserId];
    }
    else{
        consumerTransport = device.createRecvTransport(params)
        console.log("COnsumerTransport created: ", consumerTransport.id);

        consumerTransports[params.producerUserId] = consumerTransport// nen la userid
    }
    connectRecvTransport(params.producerId, params.producerUserId);

    // https://mediasoup.org/documentation/v3/communication-between-client-and-server/#producing-media
    // this event is raised when a first call to transport.produce() is made
    // see connectRecvTransport() below
    consumerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
        try {
            // Signal local DTLS parameters to the server side transport
            // see server's socket.on('transport-recv-connect', ...)
            ws.send(JSON.stringify({
                action: 'connectConsumerTransport',
                dtlsParameters,
                producerId: params.producerId,
                roomId: roomId,
                userId: idRandom,
                producerUserId: params.producerUserId
            }));

            // Tell the transport that parameters were transmitted.
            callback()
        } catch (error) {
            // Tell the transport that something was wrong
            errback(error)
        }
    })
}

const connectRecvTransport = async (producerId, producerUserId) => {

    ws.send(JSON.stringify({
        action: 'consume',
        producerUserId: producerUserId,
        producerId: producerId,
        rtpCapabilities: device.rtpCapabilities,
        roomId: roomId,
        userId: idRandom
    }));
}
