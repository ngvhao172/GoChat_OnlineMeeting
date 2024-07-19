import { resizeVideo, addItem, updateUserList, getCurrentTime, resizeSharing, updateDots, stopDots, showDots, moveDivToPosition, moveDivToPositionWhenSpeaking, filterUsersByName, updateRequestorListUI, removeRequestorUi } from "./index.js";

import hark from "hark";

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
const shareButton = $('#shareButton');


const recordButton = $('#recordButton');
const pauseButton = $('#pauseButton');
const stopButton = $('#stopButton');
const resumeButton = $('#resumeButton');

const searchPeopleInput = $("#searchPeopleInput");

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


// let path = window.location.pathname;

// const roomId = path;

const user = window.serverData.user;
const ws_url = window.serverData.ws_url;
const roomId = window.serverData.roomId;
console.log("User", user)
console.log("roomId", roomId)


// const roomId = path.split("/")[1];

// const roomText = $("#roomId");
$("#roomId").text(roomId);
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
$(document).ready(async function () {
    // $('#liveToast').toast();
    // $('#liveToast2').toast();

    // $('#requestToast').toast("show");

    // await getLocalMedia();
    await addItem("localVideo", "You");

    // addOtherUsersUIDiv();

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

const iceServers = [
    {
        urls: 'stun:stun.l.google.com:19302'
    },
    {
        urls: "stun:stun.relay.metered.ca:80",
    },
    {
        urls: "turn:global.relay.metered.ca:80",
        username: "ad5b1b255ff7868080c67d5a",
        credential: "pq8cUtoQPWmQ2u69",
    },
    {
        urls: "turn:global.relay.metered.ca:80?transport=tcp",
        username: "ad5b1b255ff7868080c67d5a",
        credential: "pq8cUtoQPWmQ2u69",
    },
    {
        urls: "turn:global.relay.metered.ca:443",
        username: "ad5b1b255ff7868080c67d5a",
        credential: "pq8cUtoQPWmQ2u69",
    },
    {
        urls: "turns:global.relay.metered.ca:443?transport=tcp",
        username: "ad5b1b255ff7868080c67d5a",
        credential: "pq8cUtoQPWmQ2u69",
    },
]

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
}

function notifyUserLeft(username, isSharing) {
    const toastBody = $("#toast-body");
    if (isSharing) {
        if (isSharing == true) {
            toastBody.text(username + " stop sharing");
        }
        else {
            toastBody.text(username + " left");
        }
    }
    else {
        toastBody.text(username + " left");
    }
    $('#liveToast').toast("show");
}

function notifyNewRequest(username, userId){
    //update ui request toast
    $("#requestMessage").text(username + " request to join.");
    $("#requestorId").val(userId);
    $('#requestToast').toast("show");
}
function acceptRequest(requestorId){
    ws.send(JSON.stringify({
        action: "acceptRequest",
        roomId: roomId,
        requestorId: requestorId
    }));

    removeRequestorUi(requestorId);
}
function declineRequest(requestorId){
    ws.send(JSON.stringify({
        action: "declineRequest",
        roomId: roomId,
        requestorId: requestorId
    }));

    removeRequestorUi(requestorId);
}

let requestorIds = [];

function updateRequestorsList(requestingUsers){
    const requestorsList = $("#requestorsList");
    requestorsList.empty();
    if(requestingUsers.length>0){
        requestingUsers.forEach(requestor => {
            const div = `
                <div class="container-fluid p-0 requestor-container" id="requestor-${requestor.id}">
                    <div class="row d-flex align-items-center pt-2 pb-2">
                        <div class="col-2 avatar"><img class="user-avatar"
                                src="https://th.bing.com/th/id/OIP.KTSVEqImOpx4gXTshphsnwHaHa?rs=1&pid=ImgDetMain"
                                alt="" srcset=""></div>
                        <div class="col-6 p-0 fs-6 ps-2">${requestor.name}</div>
                        <button class="col-2 p-0 text-primary border-0 bg-transparent text-decoration-underline accept-button" style="font-size: 12px;" data-id="${requestor.id}">Accept</button>
                        <button class="col-2 p-0 text-start text-danger border-0 bg-transparent text-decoration-underline decline-button" style="font-size: 12px;" data-id="${requestor.id}">Decline</button>
                    </div>
                </div>
            `
            requestorsList.append(div);

            requestorIds.push(requestor.id);
        })
         $(".accept-button").on("click", function() {
            const requestorId = $(this).data("id");
            acceptRequest(requestorId);
        });

        $(".decline-button").on("click", function() {
            const requestorId = $(this).data("id");
            declineRequest(requestorId);
        });
    }
    updateRequestorListUI();
}


$("#acceptAllButton").on("click", function (){
    requestorIds.forEach(id => {
        acceptRequest(id);
    })
    requestorIds = [];
})

$("#declineAllButton").on("click", function (){
    requestorIds.forEach(id => {
        declineRequest(id);
    })
    requestorIds = [];
})

function notifyUserJoin(username, isSharing) {
    const toastBody = $("#toast-body2");

    if (isSharing) {
        if (isSharing == true) {
            toastBody.text(username + " is sharing");
        }
        else {
            toastBody.text(username + " join");
        }
    }
    else {
        toastBody.text(username + " join");
    }
    $('#liveToast2').toast("show");
}

const mediasoupClient = require('mediasoup-client')

// const ws = new WebSocket('wss://localhost:3000');

// const ws = new WebSocket('wss://webrtc-onlinemeeting-sfu-mediasoup.onrender.com');
const ws = new WebSocket(ws_url);



let device
let rtpCapabilities
let producerTransport;
let consumerTransport;
let consumerTransports = {};
let consumer;
let consumers = {};
let audioProducer;
let videoProducer;
let sharingProducer;
let harkInstances = {};

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

let sharingParams = { params };

let callbackId;
let isCallbackCalled = false;


// let localStream;

async function getLocalStream() {
    try {
        let audioConstraints = localStorage.getItem("audioConstraints");
        let videoConstraints = localStorage.getItem("videoConstraints");
        console.log(audioConstraints, videoConstraints);
        
        let constraints = { video: true, audio: true };
        if (audioConstraints) {
            constraints.audio = JSON.parse(audioConstraints);
        }
        if (videoConstraints) {
            constraints.video = JSON.parse(videoConstraints);
        }
        if(audioConstraints && videoConstraints){
            const result = await checkDeviceConstraints(audioConstraints, videoConstraints);
            console.log('Audio device exists:', result.audioDeviceExists);
            console.log('Video device exists:', result.videoDeviceExists);
            
            if (!result.audioDeviceExists) {
                constraints.audio = true;
            }
            if (!result.videoDeviceExists) {
                constraints.video = true;
            }
        }
        console.log(constraints);
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        window.localStream = stream;
        localVideo.srcObject = stream;
        
        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];
        
        audioParams = {
            track: audioTrack,
            ...audioParams
        };
        
        videoParams = {
            track: videoTrack,
            ...videoParams
        };
        
        addTrackToVideoElement(audioTrack, "localVideo");

        let videoSettings = videoTrack.getSettings();
        const videoDeviceId = videoSettings.deviceId;

        videoConstraints = { deviceId: { exact: videoDeviceId } };
        localStorage.setItem("videoConstraints", JSON.stringify(videoConstraints))

        let audioSettings = audioTrack.getSettings();
        const audioDeviceId = audioSettings.deviceId;

        audioConstraints = { deviceId: { exact: audioDeviceId } };
        localStorage.setItem("audioConstraints", JSON.stringify(audioConstraints))
        
        console.log("GET LOCAL STREAM");
        
    } catch (error) {
        // alert("DEVICE ALREADY IN USE OR ACCESS DENIED. PROGGRAMS MIGHT BE BUGGED. TRY USING AN AVAILABLE DEVICE")    
        $("#warningToast").toast("show");
        console.error('Error getting local stream:', error);
    }
}


async function getVideoTrackReplace() {
    let videoConstraints = localStorage.getItem("videoConstraints");
    let constraints = { video: true };
    if (videoConstraints) {
        constraints.video = JSON.parse(videoConstraints)
    }

    let stream = await navigator.mediaDevices.getUserMedia(constraints);
    let videoTrack = stream.getVideoTracks()[0];
    return videoTrack;
}


// async function initializeLocalStream() {
//     try {
//         await getLocalStream();
//         console.log("GET LOCAL STREAM");
//     } catch (error) {
//         alert('Error getting local stream:', error)
//         console.error('Error getting local stream:', error);
//     }
// }

ws.onopen = async () => {
    try {
        getLocalStream().then(() => {
            ws.send(JSON.stringify({ action: 'join', roomId: roomId, userId: id, name: username }));
            ws.send(JSON.stringify({ action: 'getRtpCapabilities', roomId: roomId, userId: id }));
        });
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
            updateUserList({ users: data.users, clientId: id, ownerId: data.ownerId });
            if (data.newUser.id != id) {
                notifyUserJoin(data.newUser.name);
            }
            break;
        case 'leave':
            console.log("LEAVE: ", data);
            updateUserList({ users: data.users, idUserLeft: data.userLeftId });

            updateUIVideo(data.userLeftId, data.username);

            notifyUserLeft(data.username, false);

            break;
        case 'getRtpCapabilities':
            rtpCapabilities = data.rtpCapabilities
            await createDevice();
            ws.send(JSON.stringify({ action: 'createProducerTransport', roomId: data.roomId, userId: data.userId }));
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
            // console.log(data.userId == id+"-Sharing")
            // console.log(id+"-Sharing")
            // console.log(data.userId)
            // if(data.userId == id+"-Sharing"){
            //     createSendTransport(data, sharingParams);
            // }
            // else{
            //     createSendTransport(data, videoParams, audioParams);
            // }
            await createSendTransport(data);
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
                console.log(data);
                console.log('Producer created:', data.id);
                callbackId = data.id;;
                isCallbackCalled = false;
            }
            break;

        case 'newProducer':
            {
                console.log('New producer:', data.producerId);
                ws.send(JSON.stringify({ action: 'createConsumerTransport', producerId: data.producerId, roomId: data.roomId, userId: id, producerUserId: data.producerUserId }));
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
            console.log("DATA CONSUMED:", data);
            console.log("ConsumerTransport needed: ", consumerTransports[data.producerUserId]);
            consumer = await consumerTransports[data.producerUserId].consume({
                id: data.id,
                producerId: data.producerId,
                kind: data.kind,
                rtpParameters: data.rtpParameters
            })
            ws.send(JSON.stringify(
                { action: 'consumer-resume', id: consumer.producerId, roomId: data.roomId, userId: id }
            ));
            let producerStatus = data.producerStatus;

            console.log("CONSUMER PRODUCER ID", consumer.producerId);
            if (!Object.values(consumers)[data.producerUserId]) {
                consumers[data.producerUserId] = {};
            }
            if (data.isSharing && data.isSharing == true) {
                consumers[data.producerUserId]["sharing"] = consumer
            }
            else {
                consumers[data.producerUserId][data.kind] = consumer
            }
            // consumers[producerUserId][kind] = consumer

            // destructure and retrieve the video track from the producer
            const { track } = consumer
            console.log("TRACK KIND:", data.kind, "IS SHARING: ", data.isSharing);
            if (data.isSharing && data.isSharing == true) {
                // alert("IS SHARING")
                await addSharingContainer(data.producerUserId + '-Sharing', data.name + " is sharing");
                addTrackToSharingElement(track, data.producerUserId + '-Sharing');
                resizeSharing();
                resizeVideo();

                moveDivToPosition(data.producerUserId, 2);


                notifyUserJoin(data.name, true)
            }
            else {
                await addItem(data.producerUserId, data.name);
                addTrackToVideoElement(track, data.producerUserId);
                if (producerStatus) {
                    if (producerStatus == "off") {
                        if (data.kind == "video") {
                            enabledVideo(false, data.producerUserId);
                        }
                        //audio
                        else if (data.kind == "audio") {
                            enabledMic(false, data.producerUserId);
                        }
                    }
                }
            }
            // Object.values(consumers).forEach(consumer => {
            //     const stream = new MediaStream();
            //     stream.addTrack(consumer.track);


            // });

            // console.log("KIND: " + data.kind + " status: " + producerStatus);

            // console.log('Consumer track details:', consumer.track);
            // console.log('Stream tracks:', remoteVideo.getTracks());

            break;
        case 'producerNotProvided':
            {
                const {kind, producerUserId, producerStatus, name} = data;
                await addItem(producerUserId, name);
                toggleButtonWhenProducerNotFound(kind, null, true, producerUserId);
                
            }

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
        case 'stopSharing':
            const { producerUserId, roomId, username } = data;
            updateSharingVideo(producerUserId + "-Sharing");
            notifyUserLeft(username, true);
            break;
        case 'newRequest':
            //nguoi dung moi
            const {requestingUsers, newUser} = data;
            notifyNewRequest(newUser.name, newUser.id, newUser.avatar);
            updateRequestorsList(requestingUsers);
            break;
        default:
            console.error('Unknown message action:', data.action);

    }
};
const createDevice = async () => {
    try {
        device = new mediasoupClient.Device();

        await device.load({
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
let isSharing = false;
const createSendTransport = async (params) => {
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
    params.iceServers = iceServers;
    producerTransport = device.createSendTransport(params)

    console.log("producerTransport created on client side", producerTransport);

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
                userId: params.userId
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
                userId: params.userId,
                allProduce: allProduce,
                isSharing: isSharing
            }));
            setTimeout(() => {
                if (callbackId && !isCallbackCalled) {
                    callback(callbackId);
                    isCallbackCalled = true;
                    callbackId = null;
                    isSharing = false;
                } else {
                    console.log('Waiting for callbackId...');
                }
            }, 100);
        } catch (error) {
            console.log(error);
            errback(error)
        }
    })
    await connectSendTransport();
    // })
}
const connectSendTransport = async () => {
    // we now call produce() to instruct the producer transport
    // to send media to the Router
    // https://mediasoup.org/documentation/v3/mediasoup-client/api/#transport-produce
    // this action will trigger the 'connect' and 'produce' events above
    // console.log("PARAMS BEFORE GET LOCAL STREAM: ", params);
    // // if (!params.track) {
    // //     await getLocalStream();
    // // }
    // console.log("PARAMS AFTER GET LOCAL STREAM: ", params);
    // if(!params.track)
    // if(!videoParams.track){
    //     alert("THIEU VIDEO PARAMS")
    //     videoParams.track = window.localStream.getVideoTracks()[0];
    // }
    // else{
    //     console.log("VIDEO PARAMS: ", videoParams)
    // }
    // if(!audioParams.track){
    //     alert("THIEU AUDIO PARAMS")
    //     audioParams.track = window.localStream.getAudioTracks()[0];
    // }
    console.log("producerTransport created on client side", producerTransport);
    // console.log("params", params);
    // producer = await producerTransport.produce(params)
    // alert("start");

    // if(params.userId == id+"-Sharing"){
    //     allProduce = false;
    //     sharingProducer = await producerTransport.produce(sharingParams);
    // }
    // else{
    if(videoParams && videoParams.track){
        videoProducer = await producerTransport.produce(videoParams);


        videoProducer.on('trackended', () => {
            console.log('track ended')
    
            // close video track
        })
    
        videoProducer.on('transportclose', () => {
            console.log('transport ended')
    
            // close video track
        })
    }
    else{
        toggleButtonWhenProducerNotFound("video", webcamButton, true, "localVideo");
        webcamButton.attr("disabled", true);

        ws.send(JSON.stringify({
            action: "producerNotProvided",
            kind: "video",
            userId: id,
            name: username,
            roomId: roomId
        }));
    }
    //allProduce = true;
    // alert("Continue");
    if(audioParams && audioParams.track){
        audioProducer = await producerTransport.produce(audioParams, {
            opusStereo: true,
            opusDtx: false,
            opusFec: true,
            opusMaxPlaybackRate: 48000,
            opusBitrate: 64000
        });

        audioProducer.on('trackended', () => {
            console.log('track ended')
    
            // close video track
        })
    
        audioProducer.on('transportclose', () => {
            console.log('transport ended')
    
            // close video track
        })
    }
    else{
        toggleButtonWhenProducerNotFound("audio", micButton, true, "localVideo");
        micButton.attr("disabled", true);
        ws.send(JSON.stringify({
            action: "producerNotProvided",
            kind: "audio",
            userId: id,
            name: username,
            roomId: roomId
        }));
    }
    // allProduce = false;
    // }
    // alert("Consume both AUDIO AND VIDEO");

    console.log("PRODUCE BOTH", audioProducer);

    console.log("AUDIO STATUS")
    if (localStorage.getItem('micEnabled') == "false") {
        await toggleButton("audio", micButton)
        console.log("TOGGLED")
    }
    if (localStorage.getItem('cameraEnabled') == "false") {
        await toggleButton("video", webcamButton)
    }

    
    // if(sharingProducer){
    //     sharingProducer.on('trackended', () => {
    //         console.log('track ended')

    //         // close video track
    //     })
    //     sharingProducer.on('transportclose', () => {
    //         console.log('transport ended')

    //         // close video track
    //     })
    // }


}



// let id = Math.floor(Math.random() * 1000).toString();
// let roomId = "123";

function addTrackToSharingElement(track, id) {
    let remoteVideo = document.getElementById(id);

    if (!remoteVideo.srcObject) {
        remoteVideo.srcObject = new MediaStream();
    }
    //cho nay code cai gi quen r
    // if(id!="localVideo"){
    remoteVideo.srcObject.addTrack(track);

}

function addTrackToVideoElement(track, id) {
    console.log("ADD TRACK TO: ", id);
    // const container = document.getElementById('video-container');
    let remoteVideo = document.getElementById(id);

    if (!remoteVideo) {
        remoteVideo = document.createElement('video');
        remoteVideo.id = id;
        remoteVideo.autoplay = true;
        //   container.appendChild(remoteVideo);
    }

    if (!remoteVideo.srcObject) {
        remoteVideo.srcObject = new MediaStream();
    }
    // //cho nay code cai gi quen r
    // if(id!="localVideo"){
    //     remoteVideo.srcObject.addTrack(track);
    // }
    remoteVideo.srcObject.addTrack(track);
    if (id.includes("-")) {
        return;
    }
    console.log(harkInstances)
    console.log('Added track to MediaStream:', track);
    // console.log('Updated MediaStream for video element with id:', id, remoteVideo.srcObject);
    // console.log('Stream tracks:', remoteVideo.getTracks());
    if (track.kind === 'audio') {
        if (harkInstances[id]) {
            harkInstances[id].stop();
            harkInstances[id] = null;
            delete harkInstances[id];
        }
        let audioStream = new MediaStream();
        audioStream.addTrack(track);
        let options = {
            threshold: -70
        };
        harkInstances[id] = hark(audioStream, options);

        harkInstances[id].on('speaking', () => {
            console.log(`${id} is speaking on track ${track.id}`);
            showDots(id);
            moveDivToPositionWhenSpeaking(id);
        });

        harkInstances[id].on('stopped_speaking', () => {
            console.log(`${id} speech stopped on track ${track.id}`);
            stopDots(id);
        });
        harkInstances[id].on('volume_change', (volume, threshold) => {
            //console.log(`Volume change: ${volume}, Threshold: ${threshold}`);

            updateDots(volume, id);
        });
    }

}




const createRecvTransport = async (params) => {
    // see server's socket.on('consume', sender?, ...)
    // this is a call from Consumer, so sender = false

    // creates a new WebRTC Transport to receive media
    // based on server's consumer transport params
    // https://mediasoup.org/documentation/v3/mediasoup-client/api/#device-createRecvTransport

    if (consumerTransports[params.producerUserId]) {
        consumerTransport = consumerTransports[params.producerUserId];
    }
    else {
        params.iceServers = iceServers;
        consumerTransport = device.createRecvTransport(params)
        console.log("COnsumerTransport created: ", consumerTransport.id);

        consumerTransports[params.producerUserId] = consumerTransport// nen la userid
    }
    connectRecvTransport(params.producerId, params.producerUserId, params.producerStatus);

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
    if (content.trim().length == 0) {
        return;
    }
    if (lastMessageId == user.id) {
        if (content.trim() !== "") {
            const lastYourChatElement = $(".yourchat").last();
            lastYourChatElement.append(`<p>${content}</p>`)

            $("#messageContent").val("");

            // sendMessage("message", content);
            ws.send(JSON.stringify({ action: 'message', content: content, roomId: roomId, userId: user.id }));
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
        ws.send(JSON.stringify({ action: 'message', content: content, roomId: roomId, userId: user.id }));
    }
    lastMessageId = user.id;
    const chatBody = document.getElementById('chatBody');
    chatBody.scrollTop = chatBody.scrollHeight - chatBody.clientHeight;
});
$('#messageContent').keydown(function (event) {
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


webcamButton.on("click", async () => {
    console.log("click")
    await toggleButton("video", webcamButton);
})
micButton.on("click", async () => {
    await toggleButton("audio", micButton);
})

async function startCapture(displayMediaOptions) {
    let captureStream = null;
    try {
        captureStream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);

        const videoTrack = captureStream.getVideoTracks()[0];
        if (sharingParams.track) {
            sharingParams.track = videoTrack
        }
        else {
            sharingParams = {
                track: videoTrack,
                ...sharingParams
            }
        }
    } catch (err) {
        console.error("Error: " + err);
    }
    return captureStream;
}

function updateSharingVideo(id) {

    const divSharingVideo = document.getElementById("divSharing" + id);
    if (divSharingVideo) {
        divSharingVideo.remove();
    }
    const sharingVideo = document.getElementById(id);
    if (sharingVideo) {
        sharingVideo.remove();
    }

    const sharingContainer = document.querySelector('.sharing-container');

    const sharingVideoContainer = document.querySelectorAll('.sharing-video-container');
    const num = sharingVideoContainer.length;
    if (num == 0) {
        sharingContainer.classList.add("d-none");
    }

    resizeSharing();

}
let myShareStream = null;

function stopSharing(id) {
    if (myShareStream) {
        const tracks = myShareStream.getTracks();

        tracks.forEach(track => {
            track.stop();
        });
        updateSharingVideo(id);
        console.log("Screen sharing stopped.");

    } else {
        console.log("No active stream to stop.");
    }
}



shareButton.on("click", async () => {
    if (myShareStream != null) {
        stopSharing(id + "-Sharing");

        ws.send(JSON.stringify({ action: "stopSharing", producerUserId: id, roomId: roomId, username: username }));
        myShareStream = null;

        shareButton.removeClass("bg-primary");
        return;
    }

    myShareStream = await startCapture({ video: true });
    if (!myShareStream) {
        return;
    }
    shareButton.addClass("bg-primary");
    isSharing = true;
    sharingProducer = await producerTransport.produce(sharingParams);


    sharingProducer.on('trackended', () => {


        console.log('track ended')

        // close video track
    })
    sharingProducer.on('transportclose', () => {
        console.log('transport ended')

        // close video track
    })

    await addSharingContainer(id + "-Sharing", username + " is sharing");

    addTrackToSharingElement(myShareStream.getVideoTracks()[0], id + "-Sharing");

    // ws.send(JSON.stringify({ action: 'join', roomId: roomId, userId: id+"-Sharing", name: username +' is sharing' }));
    // ws.send(JSON.stringify({ action: 'getRtpCapabilities', roomId: roomId, userId: id+"-Sharing" }));

    resizeSharing();
    resizeVideo();
    // addTrackToVideoElement(myShareStream, "testshare");


    myShareStream.getVideoTracks()[0].onended = () => {
        // alert('Stream ended');
        updateSharingVideo(id + "-Sharing");
        //gọi đến ws
        ws.send(JSON.stringify({ action: "stopSharing", producerUserId: id, roomId: roomId, username: username }));
        shareButton.removeClass("bg-primary");
    };

    const sharingContainer = document.querySelector('.sharing-container');

    sharingContainer.classList.remove("d-none");

    // await addItem("123","Hao 2");
    // await addItem("1234","Hao 3");
    // await addItem("12345","Hao 3");
    // await addItem("12346","Hao 3");
    // await addItem("12347","Hao 3");

});
async function addSharingContainer(id, name) {
    const itemIdExists = document.getElementById(id);
    if (itemIdExists) {
        return;
    }
    const container = document.querySelector('.sharing-container')
    const item = document.createElement('div');
    item.id = "divSharing" + id;
    item.classList.add('grid-item');
    item.classList.add('sharing-video-container');
    item.style.backgroundColor = "#202124";
    container.appendChild(item);

    const video = document.createElement('video')
    video.id = id
    video.style.objectFit = "contain";
    video.autoplay = true
    video.playsInline = true
    item.appendChild(video)

    const nameDisplay = document.createElement('div');
    nameDisplay.classList.add('name-display');
    nameDisplay.classList.add('me-3');
    nameDisplay.innerText = name;
    item.appendChild(nameDisplay);

    container.classList.remove("d-none");

}


function enabledVideo(bool, userId) {
    // alert("Second");
    // let videoPlayer = remoteStream.getTracks().find(track => track.kind === "video")
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
        micDiv[2].classList.add("d-none");
    }
    else {
        // videoPlayer.enabled = bool;
        // videoPlayer.muted = bool;
        micDiv[0].classList.remove("d-none");
        micDiv[1].classList.remove("d-none");
        micDiv[2].classList.remove("d-none");
    }
}


function toggleButtonWhenProducerNotFound(type, button, status, userId){
    let micDiv = document.getElementsByClassName("mutedMic" + userId);

    let alterDiv = document.getElementById("divAlter" + userId);
    let videoDiv = document.getElementById("divVideo" + userId);

    if (type == "audio") {
        if (status == true) {
            if(button){
                button.addClass("bg-danger");
                $("#micIcon").addClass("bi-mic-mute");
                $("#micIcon").removeClass("bi-mic");
            }

            $(".micActivelocalVideo").addClass("d-none");
            micDiv[0].classList.remove("d-none");
            micDiv[1].classList.remove("d-none");
            micDiv[2].classList.remove("d-none");
        }
        else {
            if(button){
                button.removeClass("bg-danger");
                $("#micIcon").removeClass("bi-mic-mute");
                $("#micIcon").addClass("bi-mic");
            }
            micDiv[0].classList.add("d-none");
            micDiv[1].classList.add("d-none");
            micDiv[2].classList.add("d-none");
        }
    }
    else{
        if (status == true) {
            if(button){
                button.addClass("bg-danger");
                $("#webcamIcon").addClass("bi-camera-video-off");
                $("#webcamIcon").removeClass("bi-camera-video");
            }
            alterDiv.classList.remove("d-none");
            videoDiv.classList.add("d-none");
        }
        else {
            if(button){
                button.removeClass("bg-danger");
                $("#webcamIcon").removeClass("bi-camera-video-off");
                $("#webcamIcon").addClass("bi-camera-video");
            }
            alterDiv.classList.add("d-none");
            videoDiv.classList.remove("d-none");
        }
    }
}

async function toggleButton(type, button) {
    let stream = localVideo.srcObject;
    let track = stream.getTracks().find(track => track.kind === type)
    let micDiv = document.getElementsByClassName("mutedMiclocalVideo");

    let alterDiv = document.getElementById("divAlterlocalVideo");
    let videoDiv = document.getElementById("divVideolocalVideo");


    if (type == "audio") {
        console.log(audioProducer);
        if (audioProducer) {
            const audioState = audioProducer.paused ? 'paused' : 'active';
            if (audioState == 'active') {
                audioProducer.pause();
                track.enabled = false;
                button.addClass("bg-danger");
                $("#micIcon").addClass("bi-mic-mute");
                $("#micIcon").removeClass("bi-mic");

                $(".micActivelocalVideo").addClass("d-none");
                micDiv[0].classList.remove("d-none");
                micDiv[1].classList.remove("d-none");
                micDiv[2].classList.remove("d-none");
                ws.send(JSON.stringify({ action: "muted", producerUserId: id, roomId: roomId }))
            }
            else {
                audioProducer.resume();
                track.enabled = true;
                button.removeClass("bg-danger");
                $("#micIcon").removeClass("bi-mic-mute");
                $("#micIcon").addClass("bi-mic");
                micDiv[0].classList.add("d-none");
                micDiv[1].classList.add("d-none");
                micDiv[2].classList.add("d-none");
                ws.send(JSON.stringify({ action: "unmuted", producerUserId: id, roomId: roomId }))
            }
        }
        else {
            console.log("ERROR: KHONG TIM THAY AUDIOPRODUCER")
        }

    }
    //video
    else {
        // console.log(videoState);
        if (videoProducer) {
            const videoState = videoProducer.paused ? 'paused' : 'active';
            console.log("VIDEO STATE", videoState);

            console.log(videoState == 'active');
            if (videoState == 'active') {
                await videoProducer.pause();
                // track.stop();
                stream.getVideoTracks()[0].stop();
                track.enabled = false;
                button.addClass("bg-danger");
                $("#webcamIcon").addClass("bi-camera-video-off");
                $("#webcamIcon").removeClass("bi-camera-video");
                alterDiv.classList.remove("d-none");
                videoDiv.classList.add("d-none");
                ws.send(JSON.stringify({ action: "offCamera", producerUserId: id, roomId: roomId }))
            }
            else {
                await videoProducer.resume();
                // track.resume();
                // getLocalStream();
                let videoTrackReplace = await getVideoTrackReplace();
                const videoTracks = stream.getVideoTracks();
                if (videoTracks.length > 0) {
                    stream.removeTrack(videoTracks[0]);
                    stream.addTrack(videoTrackReplace);
                } else {
                    console.error('No video tracks found in local video stream.');
                }
                await videoProducer.replaceTrack({ track: videoTrackReplace });
                track.enabled = true;
                button.removeClass("bg-danger");
                $("#webcamIcon").removeClass("bi-camera-video-off");
                $("#webcamIcon").addClass("bi-camera-video");
                alterDiv.classList.add("d-none");
                videoDiv.classList.remove("d-none");
                ws.send(JSON.stringify({ action: "onCamera", producerUserId: id, roomId: roomId }))
            }
        }
        else {
            console.log("ERROR: KHONG TIM THAY VIDEOPRODUCER")
        }
    }
}

let mediaRecorder;
let chunks = [];

async function getScreenStream() {
    return await navigator.mediaDevices.getDisplayMedia({ video: true });
}

async function getAudioStream() {
    return await navigator.mediaDevices.getUserMedia({ audio: true });
}

function getRemoteAudioTracks() {
    return Array.from(consumers)
        .map(consumer => consumer.track)
        .filter(track => track.kind === 'audio');
}


async function createCombinedStream() {
    const screenStream = await getScreenStream();
    const audioStream = await getAudioStream();
    const remoteAudioTracks = getRemoteAudioTracks();

    const combinedStream = new MediaStream();
    screenStream.getTracks().forEach(track => combinedStream.addTrack(track));
    audioStream.getTracks().forEach(track => combinedStream.addTrack(track));
    remoteAudioTracks.forEach(track => combinedStream.addTrack(track));

    return combinedStream;
}

function setupMediaRecorder(combinedStream) {
    mediaRecorder = new MediaRecorder(combinedStream);

    mediaRecorder.ondataavailable = function (event) {
        chunks.push(event.data);
    };

    mediaRecorder.onstart = function () {
        console.log('Recording started');
    };

    mediaRecorder.onstop = function () {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'recording.webm';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        chunks = [];
    };

    mediaRecorder.onpause = function () {
        console.log('Recording paused');
    };

    mediaRecorder.onresume = function () {
        console.log('Recording resumed');
    };
}

async function startRecording() {
    const combinedStream = await createCombinedStream();
    setupMediaRecorder(combinedStream);
    mediaRecorder.start();
    console.log('Recording started');
    //chi show len pause va stop
    showLiOptions(['pauseLi', 'stopLi']);
}

function pauseRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.pause();
        console.log('Recording paused');
    }
}

function resumeRecording() {
    if (mediaRecorder && mediaRecorder.state === 'paused') {
        mediaRecorder.resume();
        console.log('Recording resumed');
    }
}

function stopRecording() {
    if (mediaRecorder && (mediaRecorder.state === 'recording' || mediaRecorder.state === 'paused')) {
        mediaRecorder.stop();
        console.log('Recording stopped');
    }
}

function showLiOptions(ids) {
    console.log($('#optionsDiv li'));
    $('#optionsDiv li').each(function () {
        const liId = $(this).attr('id');
        console.log(liId);
        console.log(ids.includes(liId));
        if (ids.includes(liId)) {
            $(this).removeClass('d-none');
        } else {
            $(this).addClass('d-none');
        }
    });
}

    console.log($('#optionsDiv li'));
    recordButton.on('click', function () {
        startRecording();

    });

    pauseButton.on('click', function () {
        pauseRecording();
        //chi show len resume, stop
        showLiOptions(['resumeLi', 'stopLi']);
    });

    resumeButton.on('click', function () {
        resumeRecording();
        //chi show len pause, stop
        showLiOptions(['pauseLi', 'stopLi']);
    });

    stopButton.on('click', function () {
        stopRecording();
        //chi show len record
        showLiOptions(['recordLi']);
    });

    searchPeopleInput.on("input", function () {
        let filter = searchPeopleInput.val();
        filterUsersByName(filter);
    })
    let videoSrcChange = false;
    let audioSrcChange = false;


    async function checkDeviceConstraints(audioConstraints, videoConstraints) {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();

            const audioInputs = devices.filter(device => device.kind === 'audioinput');
            //const audioOutputs = devices.filter(device => device.kind === 'audiooutput');
            const videoInputs = devices.filter(device => device.kind === 'videoinput');

            populateDropdown('micDropdownMenu', audioInputs, 'micButtonDropdown');
            //populateDropdown('speakerDropdownMenu', audioOutputs, 'speakerButtonDropdown');
            populateDropdown('cameraDropdownMenu', videoInputs, 'cameraButtonDropdown');
            videoConstraints = JSON.parse(videoConstraints);
            audioConstraints = JSON.parse(audioConstraints);
            let audioDeviceExists;
            if(audioConstraints.deviceId && audioConstraints){
                audioDeviceExists = devices.some(device => 
                    device.kind === 'audioinput' && device.deviceId === audioConstraints.deviceId.exact
                );
            }
            else{
                audioDeviceExists = false;
            }
            
            let videoDeviceExists
            if(videoConstraints.deviceId && videoConstraints){
                videoDeviceExists = devices.some(device => 
                device.kind === 'videoinput' && device.deviceId === videoConstraints.deviceId.exact
            )}
            else{
                videoDeviceExists = false;
            }
            
            return { audioDeviceExists, videoDeviceExists };
        } catch (error) {
            console.error("Error checking device constraints:", error);
            return { audioDeviceExists: false, videoDeviceExists: false };
        }
    }
    $("#settingButton").on("click", function () {
        const videoPreview = document.getElementById('videoPreview');
        let audioConstraints = localStorage.getItem("audioConstraints");
        let videoConstraints = localStorage.getItem("videoConstraints");
        let constraints = { video: true, audio: true };
        if (audioConstraints) {
            constraints.audio = JSON.parse(audioConstraints)
        }
        if (videoConstraints) {
            constraints.video = JSON.parse(videoConstraints)
        }
        checkDeviceConstraints(audioConstraints, videoConstraints).then(result => {
            console.log('Audio device exists:', result.audioDeviceExists);
            console.log('Video device exists:', result.videoDeviceExists);
            if(!result.audioDeviceExists){
                constraints.audio =  true;
            }
            if(!result.videoDeviceExists){
                constraints.video =  true;
            }
            console.log(constraints)
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                navigator.mediaDevices.getUserMedia(constraints)
                    .then(async function (stream) {
                        // let stream = localStream.srcObject;
    
                        // window.stream = stream;
                        videoPreview.srcObject = stream;
                        videoPreview.play();
    
                        const videoTrack = stream.getVideoTracks()[0];
                        const audioTrack = stream.getAudioTracks()[0];
    
                        if (videoTrack) {
                            console.log('Video Track Device ID:', videoTrack.label);
    
                            $("#cameraCurrent").text(videoTrack.label);
    
                            let dropdownMenu = document.getElementById("cameraDropdownMenu");
    
                            const items = dropdownMenu.querySelectorAll('.dropdown-item');
                            items.forEach(item => {
                                console.log(item.textContent)
                                if (item.textContent.trim() === videoTrack.label) {
                                    item.classList.add('active');
                                }
                            });
    
                        }
                        if (audioTrack) {
                            console.log('Audio Track Device ID:', audioTrack.label);
    
                            $("#microphoneCurrent").text(audioTrack.label);
    
                            // testMic(audioTrack, "videoPreview")
    
                            let dropdownMenu = document.getElementById("micDropdownMenu");
    
                            const items = dropdownMenu.querySelectorAll('.dropdown-item');
                            items.forEach(item => {
                                if (item.textContent.trim() === audioTrack.label) {
                                    item.classList.add('active');
                                }
                            });
                        }
                    })
                    .catch(function (error) {
                        console.error('Error when accessing devices:', error);
                    });
            } else {
                alert('Sorry, your browser does not support getUserMedia');
            }
        });
    })
    async function changeMediaDevice(type, deviceId) {
        try {
            const videoElement = document.getElementById('videoPreview');
            // if (!window.stream) {
            //     let stream = await getUserMediaWithConstraints(true, true);
            //     window.stream = stream
            //     videoElement.srcObject = stream;
            // }
            let stream = videoElement.srcObject;

            let audioConstraints = null;
            let videoConstraints = null;
            if (type === 'audioinput') {
                audioConstraints = { deviceId: { exact: deviceId } };

                let audioStream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints })

                if(!stream){
                    /*let stream = await getUserMediaWithConstraints(true, true);
                    let videoTrack = stream.getVideoTracks()[0];
                    let videoSettings = videoTrack.getSettings();
                    const videoDeviceId = videoSettings.deviceId;

                    let videoConstraints = { deviceId: { exact: videoDeviceId } };*/
                    videoElement.srcObject = audioStream;
                    //videoElement.srcObject.addTrack(audioStream.getVideoTracks()[0]);
                    //localStorage.setItem("audioConstraints", JSON.stringify(audioConstraints))
                }
                else{
                    const audioTracks = stream.getAudioTracks();
                    console.log(audioTracks)
                    if (audioTracks.length > 0) {
                        stream.removeTrack(audioTracks[0]);
                        stream.addTrack(audioStream.getAudioTracks()[0])
                        //localStorage.setItem("audioConstraints", JSON.stringify(audioConstraints))
                    }
                    else{
                        stream.addTrack(audioStream.getAudioTracks()[0])
                        //localStorage.setItem("audioConstraints", JSON.stringify(audioConstraints))
                    }
                }
                audioSrcChange = true;
            } else if (type === 'videoinput') {
                videoConstraints = { deviceId: { exact: deviceId } };

                console.log(videoConstraints)
                let videoStream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints })
                if(!stream){
                    /*let stream = await getUserMediaWithConstraints(true, true);
                    let videoTrack = stream.getVideoTracks()[0];
                    let videoSettings = videoTrack.getSettings();
                    const videoDeviceId = videoSettings.deviceId;

                    let videoConstraints = { deviceId: { exact: videoDeviceId } };*/
                    videoElement.srcObject = videoStream;
                    //localStorage.setItem("videoConstraints", JSON.stringify(videoConstraints))
                }
                else{
                    const videoTracks = stream.getVideoTracks();
                    if (videoTracks.length > 0) {
                        stream.removeTrack(videoTracks[0]);
                        stream.addTrack(videoStream.getVideoTracks()[0]);
                        console.log(videoStream.getVideoTracks()[0])
                        console.log("REPLACE VIDEO TRACK")
                        //localStorage.setItem("videoConstraints", JSON.stringify(videoConstraints))
                    }
                    else{
                        stream.addTrack(videoStream.getVideoTracks()[0]);
                        console.log(videoStream.getVideoTracks()[0])
                        console.log("REPLACE VIDEO TRACK")  
                        //localStorage.setItem("videoConstraints", JSON.stringify(videoConstraints))
                    }
                }
                videoSrcChange = true;
            }
        } catch (error) {
            console.error('Lỗi khi thay đổi thiết bị media:', error);
        }
    }

    function testMic(track, id) {
        if (harkInstances[id]) {
            delete harkInstances[id];
        }
        let audioStream = new MediaStream();
        audioStream.addTrack(track);
        let options = {
            threshold: -70
        };
        harkInstances[id] = hark(audioStream, options);

        harkInstances[id].on('speaking', () => {
            console.log(`${id} is speaking on track ${track.id}`);
            showDots(id);
            // moveDivToPositionWhenSpeaking(id);
        });

        harkInstances[id].on('stopped_speaking', () => {
            console.log(`${id} speech stopped on track ${track.id}`);
            // stopDots(id);
        });
        harkInstances[id].on('volume_change', (volume, threshold) => {
            // console.log(`Volume change: ${volume}, Threshold: ${threshold}`);

            updateDots(volume, id);
        });
    }
    async function getUserMediaWithConstraints(audioConstraints, videoConstraints) {
        try {
            const constraints = {};
            if (audioConstraints) {
                constraints.audio = audioConstraints;
            }
            if (videoConstraints) {
                constraints.video = videoConstraints;
            }
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            return stream;
        } catch (error) {
            console.error('Lỗi khi lấy media stream:', error);
        }
    }
    async function populateDropdown(dropdownId, devices, buttonId) {
        const dropdownMenu = document.getElementById(dropdownId);
        dropdownMenu.innerHTML = '';

        devices.forEach(device => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.className = 'dropdown-item';
            a.href = '#';
            a.textContent = device.label || `Thiết bị không có tên (${device.deviceId})`;
            a.dataset.deviceId = device.deviceId;

            a.addEventListener('click', async function (event) {
                event.preventDefault();

                const button = document.getElementById(buttonId);
                const buttonLabel = button.querySelector('p');
                buttonLabel.textContent = this.textContent;

                const items = dropdownMenu.querySelectorAll('.dropdown-item');
                items.forEach(item => item.classList.remove('active'));
                this.classList.add('active');

                await changeMediaDevice(devices[0].kind, this.dataset.deviceId);
            });

            li.appendChild(a);
            dropdownMenu.appendChild(li);
        });
    }

    $("#changeSourceButton").on("click", async function () {
        let stream = localVideo.srcObject;
        const videoPreview = document.getElementById("videoPreview");
        let videoPreviewStream = videoPreview.srcObject;
        let videoTrackReplace = videoPreviewStream.getVideoTracks()[0];
        let videoTracks;  
        if(stream){
            videoTracks = stream.getVideoTracks();
        }
        else{
            stream = new MediaStream();
        }
        console.log(videoSrcChange);
        console.log(videoTrackReplace);
        if (videoSrcChange == true) {
            //replace;
            if (videoTracks) {
                stream.removeTrack(videoTracks[0]);
                videoTracks.forEach(track => track.stop());
            } else {
                console.log('No video tracks found in local video stream.');
            }
            stream.addTrack(videoTrackReplace);
            videoParams.track = videoTrackReplace;
            localVideo.srcObject = stream;
            if(videoProducer){
                await videoProducer.replaceTrack({ track: videoTrackReplace });
            }
            else{
                videoProducer = await producerTransport.produce(videoParams);

                videoProducer.on('trackended', () => {
                    console.log('track ended')
            
                    // close video track
                })
            
                videoProducer.on('transportclose', () => {
                    console.log('transport ended')
            
                    // close video track
                }) 

                // $("#divVideolocalVideo").removeClass("d-none");
                // $("#divAlterlocalVideo").addClass("d-none");

                toggleButtonWhenProducerNotFound("video", webcamButton, false, "localVideo");

            }
            
            let track = videoTrackReplace;
            let videoSettings = track.getSettings();
            const videoDeviceId = videoSettings.deviceId;

            let videoConstraints = { deviceId: { exact: videoDeviceId } };
            localStorage.setItem("videoConstraints", JSON.stringify(videoConstraints))
            console.log("CHANGE MEDIA SOURCE")
            console.log(videoConstraints);
            videoPreview.srcObject = null;
            videoSrcChange = false;
        }

        if (audioSrcChange == true) {
            let audioTrackReplace = videoPreviewStream.getAudioTracks()[0];

            let audioTracks = stream.getAudioTracks();
            // if(!stream){
            //     audioTracks = audioTrackReplace;
            // }else{
            //     audioTracks = 
            // }
            

            //replace;
            if (audioTracks.length > 0) {
                audioTracks.forEach(track => {
                    stream.removeTrack(track);
                });
                stream.addTrack(audioTrackReplace);

                await audioProducer.replaceTrack({ track: audioTrackReplace });

                let track = audioTrackReplace;
                const audioSettings = track.getSettings();
                const audioDeviceId = audioSettings.deviceId;

                const audioConstraints = { deviceId: { exact: audioDeviceId } };
                localStorage.setItem("audioConstraints", JSON.stringify(audioConstraints))

                let id = "localVideo";
                if (harkInstances[id]) {
                    console.log("EXISTS HARK INSTANCE")
                    harkInstances[id].stop();
                    harkInstances[id] = null;
                    delete harkInstances[id];
                }
                console.log(harkInstances);
                let audioStream = new MediaStream();
                audioStream.addTrack(stream.getAudioTracks()[0]);
                let options = {
                    threshold: -70
                };
                harkInstances[id] = hark(audioStream, options);

                harkInstances[id].on('speaking', () => {
                    console.log(`${id} is speaking on track ${track.id}`);
                    showDots(id);
                    moveDivToPositionWhenSpeaking(id);
                });

                harkInstances[id].on('stopped_speaking', () => {
                    console.log(`${id} speech stopped on track ${track.id}`);
                    stopDots(id);
                });
                harkInstances[id].on('volume_change', (volume, threshold) => {
                    //console.log(`Volume change: ${volume}, Threshold: ${threshold}`);

                    updateDots(volume, id);
                });
            } else {
                console.error('No video tracks found in local video stream.');
            }

            audioSrcChange = false;
        }




        // const audioSettings = track.getSettings();
        // const deviceId = settings.deviceId;

        // let audioConstraints = { deviceId: { exact: deviceId } };
        // localStorage.setItem("audioConstraints", JSON.stringify(audioConstraints))
        //replace;

        // let stopStream = videoPreview.srcObject;
        // let videoStopTracks = stopStream.getVideoTracks()[0]
        // videoStopTracks.stop();
        // let audioStopTracks = stopStream.getAudioTracks()[0]
        // audioStopTracks.stop();


        videoPreview.srcObject = null;

    });

    $("#changeSourceCloseButton").on("click", function () {
        const videoPreview = document.getElementById("videoPreview");
        // let stream = videoPreview.srcObject;
        // let videoTracks = stream.getVideoTracks()[0]
        // videoTracks.stop();
        // let audioTracks = stream.getAudioTracks()[0]
        // audioTracks.stop();
        videoPreview.srcObject = null;
    })
    let privateMeetingSwitch = document.getElementById('toggleSwitch');
    if(privateMeetingSwitch){
        privateMeetingSwitch.addEventListener('change', function() {
            if (this.checked) {
                console.log('Toggle switch is ON');
                $("#meetingAccessDes").text("This meeting is private");
                ws.send(JSON.stringify({
                    action: "settingsUpdate",
                    private: true,
                    roomId: roomId,
                    userId: id
                }));
            } else {
                $("#meetingAccessDes").text("This meeting is public");

                ws.send(JSON.stringify({
                    action: "settingsUpdate",
                    private: false,
                    roomId: roomId,
                    userId: id
                }));
            }
        });
    }


    $("#acceptButton").on("click", function (){
        const requestorId = $("#requestorId").val();
        console.log("ACCEPT NEW USER");
        acceptRequest(requestorId);
    })

    $("#declineButton").on("click", function (){
        const requestorId = $("#requestorId").val();
        console.log("ACCEPT NEW USER");
        declineRequest(requestorId);
    });

// const privateMeetingSwitch = document.getElementById('toggleSwitch');
// if(privateMeetingSwitch){
//     if(privateMeetingSwitch.checked){
//         $("#meetingAccessDes").text("This meeting is private");
//     }else{
//         $("#meetingAccessDes").text("This meeting is for public");
//     }
// }







