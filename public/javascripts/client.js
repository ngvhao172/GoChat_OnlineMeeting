import { resizeVideo, addItem, updateUserList, getCurrentTime } from "./index.js";

// const { resizeVideo, addItem, updateUserList, getCurrentTime } = require("./index.js");

// let localStream = null;
// let remoteStream = null;
// let peerConnection = null;
let lastMessageId = null;


// HTML elements
const sendButton = document.getElementById('sendButton');
const webcamButton = $('#webcamButton');
const micButton = $('#micButton');
const hangupButton = $('#hangupButton');

// const servers = {
//     iceServers: [
//         {
//             urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
//         },
//         {
//             urls: "stun:stun.relay.metered.ca:80",
//         },
//         {
//             urls: "turn:global.relay.metered.ca:80",
//             username: "ad5b1b255ff7868080c67d5a",
//             credential: "pq8cUtoQPWmQ2u69",
//         },
//         {
//             urls: "turn:global.relay.metered.ca:80?transport=tcp",
//             username: "ad5b1b255ff7868080c67d5a",
//             credential: "pq8cUtoQPWmQ2u69",
//         },
//         {
//             urls: "turn:global.relay.metered.ca:443",
//             username: "ad5b1b255ff7868080c67d5a",
//             credential: "pq8cUtoQPWmQ2u69",
//         },
//         {
//             urls: "turns:global.relay.metered.ca:443?transport=tcp",
//             username: "ad5b1b255ff7868080c67d5a",
//             credential: "pq8cUtoQPWmQ2u69",
//         },
//     ],
// };


let path = window.location.pathname;

// const roomId = path;

const user = window.serverData;
console.log(user)


const roomId = path;

// const roomText = $("#roomId");
$("#roomId").text(roomId.split("/")[1]);
// let time = window.time;
const username = user.fullName
const id = user.id

// addItem("localUser", username, id);

// updateLocalUser();

// function updateLocalUser() {
//     const localUsername = document.getElementsByClassName("name-display");
//     console.log(localUsername);
//     localUsername[0].innerHTML = username
//     localUsername[1].innerHTML = username
// }

// var localStream;
// var remoteStream
// const toastNofifierExample = document.getElementById('liveToast')
$(document).ready( async function() {
    $('#liveToast').toast();
    $('#liveToast2').toast();

    // await getLocalMedia();
    await addItem("localVideo", username);
});


// async function getLocalMedia() {
//     let localUser = document.getElementById('localUser');
//     if(!localUser){
//         addItem("localUser", username, id);
//     }
//     localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
//     localUser.srcObject = localStream;
// }

// let localUser = document.getElementById('localUser');



function updateUIVideo(userLeftId, username) {
    console.log(userLeftId);
    const userVideo = document.getElementById('divVideo' + userLeftId);
    if (userVideo) {
        userVideo.remove();
    }

    const divAlternative = document.getElementById('divAlter' + userLeftId);
    if (divAlternative) {
        divAlternative.remove();
    }

    resizeVideo();
    notifyUserLeft(username);
}

function notifyUserLeft(username) {
    const toastBody = $("#toast-body");
    toastBody.text(username + " left");
    $('#liveToast').toast("show");
}


function notifyUserJoin(username) {
    const toastBody = $("#toast-body2");
    toastBody.text(username + " joined");
    $('#liveToast2').toast("show");
}

const mediasoupClient = require('mediasoup-client')

// const ws = new WebSocket('ws://localhost:3000');

// const ws = new WebSocket('wss://webrtc-onlinemeeting-sfu-mediasoup.onrender.com');
const ws = new WebSocket('wss://videochatapp.online');

let device
let rtpCapabilities
let producerTransport;
let consumerTransport;
let consumerTransports = {};
let consumer;
let consumers = {};
let audioProducer;
let videoProducer;

let params = {
    // mediasoup params
    // encodings: [
    //     {
    //         rid: 'r0',
    //         maxBitrate: 100000,
    //         scalabilityMode: 'S1T3',
    //     },
    //     {
    //         rid: 'r1',
    //         maxBitrate: 300000,
    //         scalabilityMode: 'S1T3',
    //     },
    //     {
    //         rid: 'r2',
    //         maxBitrate: 900000,
    //         scalabilityMode: 'S1T3',
    //     },
    // ],
    encodings: [
        {
            rid: 'r0',
            maxBitrate: 50000,
            scalabilityMode: 'S1T3',
        },
        {
            rid: 'r1',
            maxBitrate: 150000,
            scalabilityMode: 'S1T3',
        },
        {
            rid: 'r2',
            maxBitrate: 300000,
            scalabilityMode: 'S1T3',
        },
    ],
    
    // https://mediasoup.org/documentation/v3/mediasoup-client/api/#ProducerCodecOptions
    codecOptions: {
        videoGoogleStartBitrate: 500
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

// getLocalStream().then(() => {
//     console.log("GET LOCAL STREAM");
//     ws.onopen = async () => {
//         ws.send(JSON.stringify({ action: 'join', roomId: roomId, userId: id, name: username }));
//         ws.send(JSON.stringify({ action: 'getRtpCapabilities', roomId: roomId, userId: id }));
//         console.log("ws on open");
//     };
// });


async function initializeLocalStream() {
    try {
        await getLocalStream();
        console.log("GET LOCAL STREAM");
    } catch (error) {
        alert('Error getting local stream:', error)
        console.error('Error getting local stream:', error);
    }
}

initializeLocalStream();

ws.onopen = async () => {
    try {
        ws.send(JSON.stringify({ action: 'join', roomId: roomId, userId: id, name: username }));
        ws.send(JSON.stringify({ action: 'getRtpCapabilities', roomId: roomId, userId: id }));
        console.log("ws on open");
    } catch (error) {
        console.error('Error during WebSocket onopen:', error);
    }
};



ws.onmessage = async (event) => {
    const data = JSON.parse(event.data);
    console.log("Data send to client", data);
    switch (data.action) {
    
        case 'user-list':
            updateUserList(data.users, id);
            if (data.newUser.id != id) {
                notifyUserJoin(data.newUser.name);
            }
            break;
        case 'leave':
            console.log("LEAVE: ", data);
            updateUserList(data.users);

            updateUIVideo(data.userLeftId, data.username);

            break;
        case 'getRtpCapabilities':
            rtpCapabilities = data.rtpCapabilities
            await createDevice();
            ws.send(JSON.stringify({ action: 'createProducerTransport', roomId: roomId, userId: id }));
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
                ws.send(JSON.stringify({ action: 'createConsumerTransport', producerId: data.producerId, roomId: roomId, userId: id, producerUserId: data.producerUserId  }));
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
            let producerStatus = data.producerStatus;

            console.log("CONSUMER PRODUCER ID", consumer.producerId);
            if(!consumers[data.producerUserId]){
                consumers[data.producerUserId] = {};
            }
            consumers[data.producerUserId][data.kind] = consumer
            // consumers[producerUserId][kind] = consumer

            // destructure and retrieve the video track from the producer
            const { track } = consumer
            await addItem(data.producerUserId, data.name);
            addTrackToVideoElement(track, data.producerUserId);
            if(producerStatus){
                if(producerStatus == "off"){
                    if(data.kind == "video"){
                        enabledVideo(false, data.producerUserId);
                    }
                    //audio
                    else if (data.kind == "audio"){
                        enabledMic(false, data.producerUserId);
                    }
                }
            }

            console.log("KIND: " + data.kind + " status: " + producerStatus);

            // Log track details
            console.log('Consumer track details:', consumer.track);
            // console.log('Stream tracks:', remoteVideo.getTracks());


            // the server consumer started with media paused
            // so we need to inform the server to resume
            ws.send(JSON.stringify(
                { action: 'consumer-resume', id: consumer.producerId, roomId: roomId, userId: id }
            ));
            break;
        case 'onCamera':
            console.log("ONCAMERA: ", data);
            enabledVideo(true, data.producerUserId);
            break;
        case 'offCamera':
            console.log("OFFCAMERA: ", data);
            enabledVideo(false, data.producerUserId);
            break;
        case 'muted':
            enabledMic(false, data.producerUserId);
            break;
        case 'unmuted':
            enabledMic(true, data.producerUserId);
            break;
        case 'message':
            console.log("MESSAGE: ", data);
            displayMessage(data.from, data.content, data.userId);
            lastMessageId = data.userId;
            break;
        default:
            console.error('Unknown message type:', data.type);

    }
};
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
                userId: id
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
                userId: id,
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

// let id = Math.floor(Math.random() * 1000).toString();
// let roomId = "123";


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
    connectRecvTransport(params.producerId, params.producerUserId, params.producerStatus);

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
                userId: id,
                producerUserId: params.producerUserId,
            }));

            // Tell the transport that parameters were transmitted.
            callback()
        } catch (error) {
            // Tell the transport that something was wrong
            errback(error)
        }
    })
}

const connectRecvTransport = async (producerId, producerUserId, producerStatus) => {

    ws.send(JSON.stringify({
        action: 'consume',
        producerUserId: producerUserId,
        producerId: producerId,
        rtpCapabilities: device.rtpCapabilities,
        roomId: roomId,
        userId: id,
        producerStatus: producerStatus
    }));
}


sendButton.addEventListener('click', function () {
    const content = $("#messageContent").val();
    if (lastMessageId == user.id) {
        if (content.trim() !== "") {
            const lastYourChatElement = $(".yourchat").last();
            lastYourChatElement.append(`<p>${content}</p>`)

            $("#messageContent").val("");

            // sendMessage("message", content);
            ws.send(JSON.stringify({action: 'message', content: content, roomId: roomId, userId: user.id}));
        }
    }
    else {
        const messageHTML = `
                    <div class="chat-message mt-2">
                        <div class="chat-author d-flex">
                            <div class="fw-bold">You &ensp; </div>
                            <div class="timer text-grey">${getCurrentTime()}</div>
                        </div>
                        <div class="chat-content yourchat">
                            <p>${content}</p>
                        </div>
                    </div>
                `;

        $("#chatContainer .chat-body").append(messageHTML);

        $("#messageContent").val("");

        // sendMessage("message", content);
        ws.send(JSON.stringify({action: 'message', content: content, roomId: roomId, userId: user.id}));
    }
    lastMessageId = user.id;
    const chatBody = document.getElementById('chatBody');
    chatBody.scrollTop = chatBody.scrollHeight - chatBody.clientHeight;
});
$('#messageContent').keydown(function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        sendButton.click();
    }
});

function displayMessage(from, content, userId) {
    if (lastMessageId == userId) {
        const lastUserChatElement = $(`.${userId}chat`).last();
        lastUserChatElement.append(`<p>${content}</p>`)
    }
    else {
        const messageHTML = `
                <div class="chat-message mt-2">
                    <div class="chat-author d-flex">
                        <div class="fw-bold">${from} &ensp; </div>
                        <div class="timer text-grey">${getCurrentTime()}</div>
                    </div>
                    <div class="chat-content ${userId}chat">
                        <p>${content}</p>
                    </div>
                </div>
            `;

        $("#chatContainer .chat-body").append(messageHTML);
    }
    const chatBody = document.getElementById('chatBody');
    chatBody.scrollTop = chatBody.scrollHeight - chatBody.clientHeight;
}

hangupButton.on("click", () => {
    console.log("click");

    // sendMessage('leave');
    // endCall();
    window.location.href = "/";
})

let isOnCamera = true;

webcamButton.on("click", () => {
    console.log("click")
    toggleButton("video", webcamButton);
})
micButton.on("click", () => {
    toggleButton("audio", micButton);
})

function enabledVideo(bool, userId) {
    // alert("Second");
    // let videoPlayer = remoteStream.getTracks().find(track => track.kind === "video")
    console.log(userId);
    let alterDiv = document.getElementById("divAlter" + userId);
    let videoDiv = document.getElementById("divVideo" + userId);
    if (bool) {
        alterDiv.classList.add("d-none");
        videoDiv.classList.remove("d-none");
    }
    else {
        alterDiv.classList.remove("d-none");
        videoDiv.classList.add("d-none");
    }
}

function enabledMic(bool, userId) {
    // console.log(remoteStream);
    // let videoPlayer = remoteStream.getTracks().find(track => track.kind === "audio")

    // remoteStream.getTracks().forEach(track => {
    //     console.log('Found audio track:', track.kind);
    // });
    // console.log(videoPlayer);
    // let alterDiv = document.getElementById("div"+userId);
    // let videoDiv = document.getElementById("remoteUser"+userId);
    let micDiv = document.getElementsByClassName("mutedMic" + userId);
    if (bool) {
        // videoPlayer.enabled = bool;
        // videoPlayer.muted = bool;
        micDiv[0].classList.add("d-none");
        micDiv[1].classList.add("d-none");
    }
    else {
        // videoPlayer.enabled = bool;
        // videoPlayer.muted = bool;
        micDiv[0].classList.remove("d-none");
        micDiv[1].classList.remove("d-none");
    }
}


function toggleButton(type, button) {
    let stream  = localVideo.captureStream();
    let track  = stream.getTracks().find(track => track.kind === type)
    let micDiv = document.getElementsByClassName("mutedMiclocalVideo");

    let alterDiv = document.getElementById("divAlterlocalVideo");
    let videoDiv = document.getElementById("divVideolocalVideo");

    if(type == "audio"){
        const audioState = audioProducer.paused ? 'paused' : 'active';
        if(audioState == 'active'){
            audioProducer.pause();
            track.enabled = false;
            button.addClass("bg-danger");
            micDiv[0].classList.remove("d-none");
            micDiv[1].classList.remove("d-none");
            ws.send(JSON.stringify({action: "muted", producerUserId: id, roomId: roomId}))
        }
        else{
            audioProducer.resume();
            track.enabled = true;
            button.removeClass("bg-danger");
            micDiv[0].classList.add("d-none");
            micDiv[1].classList.add("d-none");
            ws.send(JSON.stringify({action: "unmuted", producerUserId: id, roomId: roomId}))
        }
    }
    //video
    else{
        const videoState = videoProducer.paused ? 'paused' : 'active';
        console.log(videoState);
        if(videoState == 'active'){
            videoProducer.pause();
            track.enabled = false;
            button.addClass("bg-danger");
            alterDiv.classList.remove("d-none");
            videoDiv.classList.add("d-none");
            ws.send(JSON.stringify({action: "offCamera", producerUserId: id, roomId: roomId}))
        }
        else{
            videoProducer.resume();
            track.enabled = true;
            button.removeClass("bg-danger");
            alterDiv.classList.add("d-none");
            videoDiv.classList.remove("d-none");
            ws.send(JSON.stringify({action: "onCamera", producerUserId: id, roomId: roomId}))
        }
    }
    // if(isOnCamera){
    //     // ws.send(JSON.stringify({actiom: "offCamera", producerId: id, roomId: roomId}))
    //     videoProducer.pause();
    //     isOnCamera = false;
    // }
    // else{
    //     ws.send(JSON.stringify({actiom: "onCamera", producerId: id, roomId: roomId}))
    //     videoProducer.resume();
    //     isOnCamera = true;
    // }
    // let track  = localStream.getTracks().find(track => track.kind === type)
    // let alterDiv = document.getElementById("divAlterLocalUser");
    // let videoDiv = document.getElementById("divVideolocalUser");
    // let micDiv = document.getElementsByClassName("mutedMicLocalUser");
    // if (track.enabled) {
    //     track.enabled = false;
    //     button.addClass("bg-danger");
    //     if (type === "video") {
    //         sendMessage('offCamera')
    //         // localUser.pause();
    //         alterDiv.classList.remove("d-none");

    //         videoDiv.classList.add("d-none");
    //     }
    //     else if (type === "audio") {
    //         sendMessage('muted');
    //         // track.muted = true;
    //         console.log(track);
    //         micDiv[0].classList.remove("d-none");
    //         micDiv[1].classList.remove("d-none");
    //     }
    // }
    // else {
    //     track.enabled = true;
    //     button.removeClass("bg-danger");

    //     if (type === "video") {
    //         sendMessage('onCamera')
    //         // localUser.play();
    //         alterDiv.classList.add("d-none");
    //         videoDiv.classList.remove("d-none");
    //     }
    //     else if (type === "audio") {
    //         // track.muted = false;
    //         console.log(track);
    //         sendMessage('unmuted');
    //         micDiv[0].classList.add("d-none");
    //         micDiv[1].classList.add("d-none");
    //     }
    // }

}



