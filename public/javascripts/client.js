import {
  resizeVideo,
  addItem,
  getCurrentTime,
  resizeSharing,
  updateDots,
  stopDots,
  showDots,
  moveDivToPosition,
  moveDivToPositionWhenSpeaking,
  filterUsersByName,
  updateRequestorListUI,
  removeRequestorUi,
  moveDivToPositionGlobal,
} from "./index.js";

import hark from "hark";

// const { resizeVideo, addItem, updateUserList, getCurrentTime } = require("./index.js");

// let localStream = null;
// let remoteStream = null;
// let peerConnection = null;
let lastMessageId = null;

// HTML elements
const sendButton = document.getElementById("sendButton");
const webcamButton = $("#webcamButton");
const micButton = $("#micButton");
const hangupButton = $("#hangupButton");
const shareButton = $("#shareButton");

const shareButtonOnMobile = $("#shareButtonOnMobile");

const recordButton = $("#recordButton");
const pauseButton = $("#pauseButton");
const stopButton = $("#stopButton");
const resumeButton = $("#resumeButton");

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
const token = window.serverData.token;
//console.log("User", user)
//console.log("roomId", roomId)

// const roomId = path.split("/")[1];

// const roomText = $("#roomId");
$("#roomId").text(roomId);
// let time = window.time;
const username = user.fullName;
const id = user.id;

let recordingUsersOnClient = [];

$(document).ready(async function () {
  await addItem("localVideo", "You", user.avatar);

  // addOtherUsersUIDiv();
});

const transcriptSwitch = document.getElementById("toggleSwitchTranscription");

const recognition = new (window.SpeechRecognition ||
  window.webkitSpeechRecognition)();
recognition.lang = "vi-VN";
recognition.continuous = true;
recognition.interimResults = true;

recognition.onresult = function (event) {
  let interimTranscript = "";
  let finalTranscript = "";
  for (let i = event.resultIndex; i < event.results.length; i++) {
    const result = event.results[i];
    if (!result.isFinal) {
      interimTranscript += result[0].transcript + " ";
      //console.log(interimTranscript);
      //$('.transcripts-localVideo').text(interimTranscript);
      if (transcriptSwitch.checked) {
        showTranscript("localVideo", interimTranscript);
      }
      ws.send(
        JSON.stringify({
          action: "sendTranscript",
          userId: id,
          userEmail: user.userEmail,
          roomId: roomId,
          transcript: interimTranscript,
        })
      );
      // setTimeout(() => {
      //   $('.transcripts-localVideo').text('');
      // }, 5000);
    } else {
      finalTranscript += result[0].transcript + " ";
    }
  }
};

recognition.onerror = function (event) {
  console.error("Speech recognition error:", event.error);
  console.log(transcriptSwitch.checked);
  try {
    let isMicEnabled = localStorage.getItem("micEnabled");
    if (isMicEnabled == "true") {
      recognition.stop();
      recognition.start();
    }
  } catch (error) {
    console.log(error);
  }
};

recognition.onend = function () {
  console.log("Speech recognition service has stopped.");
};

const transcriptLanguage = document.getElementById("transcriptLanguage");

// transcriptLanguage.onchange = async function () {};

let timeoutMap = {};

function showTranscript(userId, transcript) {
  if (timeoutMap[userId]) {
    clearTimeout(timeoutMap[userId]);
  }

  $(`.transcripts-${userId}`).text(transcript);

  timeoutMap[userId] = setTimeout(() => {
    $(`.transcripts-${userId}`).text("");
  }, 5000);
}

const iceServers = [
  {
    urls: "stun:stun.l.google.com:19302",
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
];

function updateUIVideo(userLeftId) {
  console.log(userLeftId);
  const userVideo = document.getElementById("divVideo" + userLeftId);
  if (userVideo) {
    userVideo.remove();
  }

  const divAlternative = document.getElementById("divAlter" + userLeftId);
  if (divAlternative) {
    divAlternative.remove();
  }

  resizeVideo();
}

function notifyUserLeft(username, isSharing) {
  console.log(username);
  const toastBody = $("#toast-body");
  if (isSharing) {
    if (isSharing == true) {
      toastBody.text(username + " stop sharing");
    } else {
      toastBody.text(username + " left");
    }
  } else {
    toastBody.text(username + " left");
  }
  $("#liveToast").toast("show");
}

function notifyNewRequest(username, email) {
  //update ui request toast
  $("#requestMessage").text(username + " request to join.");
  $("#requestorId").val(email);
  $("#requestToast").toast("show");
}
function acceptRequest(email) {
  ws.send(
    JSON.stringify({
      action: "acceptRequest",
      roomId: roomId,
      email: email,
      id: id,
      userEmail: user.userEmail,
    })
  );
  removeRequestorUi(email);
}
function declineRequest(email) {
  ws.send(
    JSON.stringify({
      action: "declineRequest",
      roomId: roomId,
      email: email,
      id: id,
      userEmail: user.userEmail,
    })
  );

  removeRequestorUi(email);
}

function removeUserFromMeeting(userId, isBlock) {
  console.log(userId, isBlock);
  if (!userId || !userId.trim()) {
    return;
  } else {
    ws.send(
      JSON.stringify({
        action: "removeUserFromMeeting",
        userId: id,
        roomId: roomId,
        userRemoveId: userId,
        isBlock: isBlock,
        userEmail: user.userEmail,
      })
    );
  }
}

$("#removeUserButton").on("click", function () {
  let removeUserId = $("#removeUserId").val();
  if (!removeUserId || !removeUserId.trim()) {
    return;
  } else {
    let blockOption = $("#blockUserInput");
    console.log(blockOption);
    removeUserFromMeeting(removeUserId, blockOption.prop("checked"));
  }
});

function muteUser(userId) {
  ws.send(
    JSON.stringify({
      action: "muteUser",
      userId: id,
      roomId: roomId,
      mutedUserId: userId,
      userEmail: user.userEmail,
    })
  );
}

function updateUserList({
  users,
  clientId,
  clientEmail,
  idUserLeft,
  ownerEmail,
}) {
  $("#contributors-number").text(users.length);
  $("#contributors-text-show").text(users.length);
  const userListContainer = $("#userslist");
  if (idUserLeft) {
    let userLeft = document.getElementById(`contributor-${idUserLeft}`);
    if (userLeft) {
      userLeft.remove();
      return;
    }
  }
  users.forEach((user) => {
    let existedUser = document.getElementById(`contributor-${user.id}`);

    if (!existedUser) {
      const userDiv = `
                <div class="row d-flex align-items-center pt-2 pb-2 contributor-showing" data-name="${
                  user.name
                }" id="contributor-${user.id}">
                    <div class="col-2 avatar"><img class="user-avatar" src="${
                      user.avatar ? user.avatar : "/images/GoLogoNBg.png"
                    }" alt="" srcset=""></div>
                    <div class="col-6 p-0 fs-6 ps-2"><span>${user.name}${
        user.id === clientId ? " (You) " : ""
      } ${
        user.email === ownerEmail
          ? "<span class='fw-bold fs-6'>(Host)</span>"
          : ""
      }</span></div>
                    <div class="col-2 text-center d-none mutedMic${
                      user.id === clientId ? "localVideo" : user.id
                    }"><i class="bi bi-mic-mute"></i></div>
                    <div class="col-2 text-center d-none micActive${
                      user.id === clientId ? "localVideo" : user.id
                    }">
                        <div class="mic-container muted-mic text-white fs-5 rounded-circle d-flex align-items-center justify-content-center">
                            <div class="dot rounded-pill"></div>
                            <div class="dot rounded-pill"></div>
                            <div class="dot rounded-pill"></div>
                        </div>
                    </div>
                    ${
                      clientEmail == ownerEmail && user.id != clientId
                        ? `<div class="ms-auto text-center col-2 p-0 dropstart">
                        <button class="buttonOptions" id="dropdownMenuButton${user.id}" data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="bi bi-three-dots-vertical fs-5"></i>
                        </button>
                        <ul class="dropdown-menu" aria-labelledby="dropdownMenuButton${user.id}" style="min-width:max-content; max-width:max-content">
                            <li><a class="dropdown-item mute-button" id="mutedButton${user.id}" data-id=${user.id}>Mute</a></li>
                            <li><a class="dropdown-item remove-button" data-id=${user.id} data-bs-toggle="modal" data-bs-target="#blockUserModal">Remove</a></li>
                        </ul>
                    </div>`
                        : ""
                    }
                </div>
            `;
      userListContainer.append(userDiv);
      if (user.id == clientId) {
        moveDivToPositionGlobal(`contributor-${user.id}`, 0);
      }
    }
  });
  $(".mute-button").on("click", function () {
    const targetId = $(this).data("id");
    muteUser(targetId);
  });

  $(".remove-button").on("click", function () {
    const targetId = $(this).data("id");
    $("#removeUserId").val(targetId);
  });
}

let requestorIds = [];

function updateRequestorsList(requestingUsers) {
  const requestorsList = $("#requestorsList");
  requestorsList.empty();
  if (requestingUsers.length > 0) {
    requestingUsers.forEach((requestor) => {
      const div = `
                <div class="container-fluid p-0 requestor-container" id="requestor-${
                  requestor.email
                }">
                    <div class="row d-flex align-items-center pt-2 pb-2">
                        <div class="col-2 avatar"><img class="user-avatar"
                                src="${
                                  requestor.avatar
                                    ? requestor.avatar
                                    : "/images/GoLogoNBg.png"
                                }"
                                alt="" srcset=""></div>
                        <div class="col-6 p-0 fs-6 ps-2">${requestor.name}</div>
                        <button class="col-2 p-0 text-primary border-0 bg-transparent text-decoration-underline accept-button" style="font-size: 12px;" data-id="${
                          requestor.email
                        }">Accept</button>
                        <button class="col-2 p-0 text-start text-danger border-0 bg-transparent text-decoration-underline decline-button" style="font-size: 12px;" data-id="${
                          requestor.email
                        }">Decline</button>
                    </div>
                </div>
            `;
      requestorsList.append(div);

      requestorIds.push(requestor.email);
    });
    $(".accept-button").on("click", function () {
      const requestorId = $(this).data("id");
      acceptRequest(requestorId);
    });

    $(".decline-button").on("click", function () {
      const requestorId = $(this).data("id");
      declineRequest(requestorId);
    });
  }
  updateRequestorListUI();
}

$("#acceptAllButton").on("click", function () {
  requestorIds.forEach((id) => {
    acceptRequest(id);
  });
  requestorIds = [];
});

$("#declineAllButton").on("click", function () {
  requestorIds.forEach((id) => {
    declineRequest(id);
  });
  requestorIds = [];
});

function notifyUserJoin(username, isSharing) {
  const toastBody = $("#toast-body2");

  if (isSharing) {
    if (isSharing == true) {
      toastBody.text(username + " is sharing");
    } else {
      toastBody.text(username + " join");
    }
  } else {
    toastBody.text(username + " join");
  }
  $("#liveToast2").toast("show");
}

const mediasoupClient = require("mediasoup-client");

let device;
let rtpCapabilities;
let producerTransport;
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
      rid: "r0",
      maxBitrate: 50000,
      scalabilityMode: "S1T3",
    },
    {
      rid: "r1",
      maxBitrate: 150000,
      scalabilityMode: "S1T3",
    },
    {
      rid: "r2",
      maxBitrate: 300000,
      scalabilityMode: "S1T3",
    },
  ],

  // https://mediasoup.org/documentation/v3/mediasoup-client/api/#ProducerCodecOptions
  codecOptions: {
    videoGoogleStartBitrate: 500,
  },
};

let audioParams;
let videoParams = { params };

let sharingParams = { params };

let callbackId;
let isCallbackCalled = false;

let isReconnect = false;

async function getLocalStream() {
  try {
    if (isReconnect == true) {
      return;
    }

    let audioConstraints = localStorage.getItem("audioConstraints");
    let videoConstraints = localStorage.getItem("videoConstraints");

    let audioStreamPromise = navigator.mediaDevices.getUserMedia({
      audio: audioConstraints ? JSON.parse(audioConstraints) : true,
    });
    let videoStreamPromise = navigator.mediaDevices.getUserMedia({
      video: videoConstraints
        ? JSON.parse(videoConstraints)
        : { width: 640, height: 480 },
    });

    let audioStream = null;
    let videoStream = null;

    try {
      audioStream = await audioStreamPromise;
    } catch (error) {
      console.warn("Audio permission denied or other issue:", error);
      $("#warningToastText").text(
        "ERROR GETTING AUDIO: " + error + ", PROGRAM MIGHT BE BUGGED."
      );
      $("#warningToast").toast("show");
    }

    try {
      videoStream = await videoStreamPromise;
    } catch (error) {
      console.warn("Video permission denied or other issue:", error);
      $("#warningToastText").text(
        "ERROR GETTING VIDEO: " + error + ", PROGRAM MIGHT BE BUGGED."
      );
      $("#warningToast").toast("show");
    }

    // Create a combined stream if both streams are available
    const combinedStream = new MediaStream();
    if (audioStream) {
      audioStream
        .getAudioTracks()
        .forEach((track) => combinedStream.addTrack(track));
    }
    if (videoStream) {
      videoStream
        .getVideoTracks()
        .forEach((track) => combinedStream.addTrack(track));
    }

    window.localStream = combinedStream;
    localVideo.srcObject = combinedStream;

    const videoTrack = videoStream ? videoStream.getVideoTracks()[0] : null;
    const audioTrack = audioStream ? audioStream.getAudioTracks()[0] : null;

    audioParams = {
      track: audioTrack,
      ...audioParams,
    };

    videoParams = {
      track: videoTrack,
      ...videoParams,
    };

    if (videoTrack) {
      await addTrackToVideoElement(videoTrack, "localVideo");
      let videoSettings = videoTrack.getSettings();
      const videoDeviceId = videoSettings.deviceId;
      videoConstraints = { deviceId: { exact: videoDeviceId } };
      localStorage.setItem(
        "videoConstraints",
        JSON.stringify(videoConstraints)
      );
      await setupWebRTCAndCanvas();
    }

    if (audioTrack) {
      addTrackToVideoElement(audioTrack, "localVideo");
      let audioSettings = audioTrack.getSettings();
      const audioDeviceId = audioSettings.deviceId;
      audioConstraints = { deviceId: { exact: audioDeviceId } };
      localStorage.setItem(
        "audioConstraints",
        JSON.stringify(audioConstraints)
      );
    }

    console.log("GET LOCAL STREAM");
  } catch (error) {
    // Handle errors
    $("#warningToastText").text(
      "ERROR GETTING LOCAL STREAM: " + error + ", PROGRAM MIGHT BE BUGGED."
    );
    $("#warningToast").toast("show");
    console.error("Error getting local stream:", error);
  }
}

async function getVideoTrackReplace() {
  let videoConstraints = localStorage.getItem("videoConstraints");
  let constraints = { video: true };
  if (videoConstraints) {
    constraints.video = JSON.parse(videoConstraints);
  }

  let stream = await navigator.mediaDevices.getUserMedia(constraints);
  let videoTrack = stream.getVideoTracks()[0];
  return videoTrack;
}

// async function getVideoCanvasTrackReplace() {
//   let videoConstraints = localStorage.getItem("videoConstraints");
//   let constraints = { video: true };
//   if (videoConstraints) {
//     constraints.video = JSON.parse(videoConstraints);
//   }

//   let stream = await navigator.mediaDevices.getUserMedia(constraints);
//   let videoTrack = stream.getVideoTracks()[0];
//   return videoTrack;
// }

async function getAudioTrackReplace() {
  let audioConstraints = localStorage.getItem("audioConstraints");
  let constraints = { audio: true };
  if (audioConstraints) {
    constraints.audio = JSON.parse(audioConstraints);
  }

  let stream = await navigator.mediaDevices.getUserMedia(constraints);
  let audioTrack = stream.getAudioTracks()[0];
  return audioTrack;
}

let ws;
startCall();

async function startCall() {
  ws = new WebSocket(`${ws_url}?token=${encodeURIComponent(token)}`);
  ws.onopen = async () => {
    try {
      getLocalStream().then(() => {
        ws.send(
          JSON.stringify({
            action: "join",
            roomId: roomId,
            userId: id,
            name: username,
            avatar: user.avatar,
            userEmail: user.userEmail,
          })
        );
        ws.send(
          JSON.stringify({
            action: "getRtpCapabilities",
            roomId: roomId,
            userId: id,
            userEmail: user.userEmail,
          })
        );

        $(".loadingdata-layout").addClass("d-none");
        // const setCanvasSize = () => {
        //   canvas.width = video.videoWidth;
        //   canvas.height = video.videoHeight;
        //   backgroundCanvas.width = video.videoWidth;
        //   backgroundCanvas.height = video.videoHeight;
        //   videoCanvas.width = video.videoWidth;
        //   videoCanvas.height = video.videoHeight;
        //   blurCanvas.width = video.videoWidth;
        //   blurCanvas.height = video.videoHeight;
        // };
      });
      console.log("ws on open");
    } catch (error) {
      console.error("Error during WebSocket onopen:", error);
    }
  };

  ws.onmessage = async (event) => {
    const data = JSON.parse(event.data);
    console.log("Data send to client", data);
    switch (data.action) {
      case "user-list":
        updateUserList({
          users: data.users,
          clientId: id,
          ownerEmail: data.ownerEmail,
          clientEmail: user.userEmail,
        });
        if (data.newUser.id != id) {
          notifyUserJoin(data.newUser.name);
        }
        $(".reconnecting-layout").addClass("d-none");
        break;
      case "leave":
        console.log("LEAVE: ", data);
        updateUserList({ users: data.users, idUserLeft: data.userLeftId });

        updateUIVideo(data.userLeftId, data.username);

        notifyUserLeft(data.username, false);

        break;
      case "getRtpCapabilities":
        rtpCapabilities = data.rtpCapabilities;
        await createDevice();
        ws.send(
          JSON.stringify({
            action: "createProducerTransport",
            roomId: data.roomId,
            userId: data.userId,
            userEmail: user.userEmail,
          })
        );
        break;
      case "producerTransportCreated":
        console.log(data.id);
        await createSendTransport(data);
        break;

      case "producerTransportConnected":
        break;

      case "produced":
        {
          console.log(data);
          console.log("Producer created:", data.id);
          callbackId = data.id;
          isCallbackCalled = false;
        }
        break;

      case "newProducer":
        {
          console.log("New producer:", data.producerId);
          ws.send(
            JSON.stringify({
              action: "createConsumerTransport",
              producerId: data.producerId,
              roomId: data.roomId,
              userId: id,
              producerUserId: data.producerUserId,
              userEmail: user.userEmail,
            })
          );
        }
        break;

      case "consumerTransportCreated":
        createRecvTransport(data);
        break;

      case "consumerTransportConnected":
        break;

      case "consumed":
        console.log("DATA CONSUMED:", data);
        console.log(
          "ConsumerTransport needed: ",
          consumerTransports[data.producerUserId]
        );
        consumer = await consumerTransports[data.producerUserId].consume({
          id: data.id,
          producerId: data.producerId,
          kind: data.kind,
          rtpParameters: data.rtpParameters,
        });
        ws.send(
          JSON.stringify({
            action: "consumer-resume",
            id: consumer.producerId,
            roomId: data.roomId,
            userId: id,
            userEmail: user.userEmail,
          })
        );
        let producerStatus = data.producerStatus;

        console.log("CONSUMER PRODUCER ID", consumer.producerId);
        if (!Object.values(consumers)[data.producerUserId]) {
          consumers[data.producerUserId] = {};
        }
        if (data.isSharing && data.isSharing == true) {
          consumers[data.producerUserId]["sharing"] = consumer;
        } else {
          consumers[data.producerUserId][data.kind] = consumer;
        }
        // consumers[producerUserId][kind] = consumer

        // destructure and retrieve the video track from the producer
        const { track } = consumer;
        console.log("TRACK KIND:", data.kind, "IS SHARING: ", data.isSharing);
        if (data.isSharing && data.isSharing == true) {
          // alert("IS SHARING")
          await addSharingContainer(
            data.producerUserId + "-Sharing",
            data.name + " is sharing"
          );
          addTrackToSharingElement(track, data.producerUserId + "-Sharing");
          resizeSharing();
          resizeVideo();

          moveDivToPosition(data.producerUserId, 2);

          notifyUserJoin(data.name, true);
        } else {
          await addItem(data.producerUserId, data.name, data.avatar);
          console.log("ADDTRACK TO REMOTE STREAM", track);
          addTrackToVideoElement(track, data.producerUserId);
          console.log(producerStatus);
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
      case "producerNotProvided":
        {
          const { kind, producerUserId, producerStatus, name, avatar } = data;
          if (kind == "audio") {
            const muteButton = $(`#mutedButton${data.producerUserId}`);
            if (muteButton) {
              muteButton.addClass("d-none");
            }
          }
          await addItem(producerUserId, name, avatar);
          toggleButtonWhenProducerNotFound(kind, null, true, producerUserId);
        }

        break;
      case "onCamera":
        console.log("ONCAMERA: ", data);
        enabledVideo(true, data.producerUserId);
        break;
      case "offCamera":
        console.log("OFFCAMERA: ", data);
        enabledVideo(false, data.producerUserId);
        break;
      case "muted":
        {
          const muteButton = $(`#mutedButton${data.producerUserId}`);
          if (muteButton) {
            muteButton.addClass("d-none");
          }
          enabledMic(false, data.producerUserId);
        }
        break;
      case "unmuted":
        const muteButton = $(`#mutedButton${data.producerUserId}`);
        if (muteButton) {
          muteButton.removeClass("d-none");
        }
        enabledMic(true, data.producerUserId);
        break;
      case "message":
        console.log("MESSAGE: ", data);
        displayMessage(data.from, data.content, data.userId);
        lastMessageId = data.userId;
        $("#new-message").removeClass("d-none");
        break;
      case "stopSharing":
        const { producerUserId, roomId, username } = data;
        updateSharingVideo(producerUserId + "-Sharing");
        notifyUserLeft(username, true);
        break;
      case "newRequest":
        //nguoi dung moi
        const { requestingUsers, newUser } = data;
        notifyNewRequest(newUser.name, newUser.email, newUser.avatar);
        updateRequestorsList(requestingUsers);
        break;
      case "beingMuted":
        if (audioProducer) {
          if (!audioProducer.paused) {
            toggleButton("audio", micButton);
          }
        }
        break;
      case "actionNotPermitted":
        {
          const { message } = data;
          $("#warningToastText").text(message);
          $("#warningToast").toast("show");
        }
        break;
      case "recording": {
        const { recordingUsers } = data;
        // recordingUsers.push({ userId, name });
        recordingUsersOnClient = recordingUsers;
        showRecordingUsers(recordingUsers);
        break;
      }
      case "stopRecording": {
        const { recordingUsers } = data;
        recordingUsersOnClient = recordingUsers;
        showRecordingUsers(recordingUsers);
        break;
      }
      case "receiveTranscript": {
        const { userId, transcript } = data;
        if (transcriptSwitch.checked) {
          showTranscript(userId, transcript);
        }
        break;
      }
      default:
        console.error("Unknown message action:", data.action);
    }
  };

  ws.onclose = function (event) {
    console.log("WebSocket connection closed:", event);
    console.log("Code:", event.code);
    console.log("Reason:", event.reason);

    if (event.code == 1008) {
      $("#removeToast").toast("show");
      let seconds = 3;
      const interval = setInterval(function () {
        $("#secondRemovingText").text(seconds.toString());
        seconds--;
        if (seconds < 0) {
          clearInterval(interval);
          $("#removeToast").toast("hide");
        }
      }, 1000);

      setTimeout(() => {
        window.location.href = "/" + roomId;
      }, 3000);
    }
    if (event.code == 1006) {
      //try to reconnect
      $(".reconnecting-layout").removeClass("d-none");
      console.log("Reconnecting...");
      //ws = new WebSocket(`${ws_url}?token=${encodeURIComponent(token)}`);
      isReconnect = true;
      consumerTransports = {};
      consumers = {};
      startCall();
      //
    }
    //alert(`WebSocket connection closed: ${event.reason}`);
  };
}

const createDevice = async () => {
  try {
    device = new mediasoupClient.Device();

    await device.load({
      routerRtpCapabilities: rtpCapabilities,
    });

    console.log("RTP Capabilities", device.rtpCapabilities);
  } catch (error) {
    console.log(error);
    if (error.name === "UnsupportedError")
      console.warn("browser not supported");
  }
};

let allProduce = false;
let isSharing = false;
const createSendTransport = async (params) => {
  // see server's socket.on('createWebRtcTransport', sender?, ...)
  // this is a call from Producer, so sender = true
  // ws.send('createWebRtcTransport', { sender: true }, ({ params }) => {
  // The server sends back params needed
  // to create Send Transport on the client side
  if (params.error) {
    console.log(params.error);
    return;
  }

  console.log("Params on create send transport", params);

  // creates a new WebRTC Transport to send media
  // based on the server's producer transport params
  // https://mediasoup.org/documentation/v3/mediasoup-client/api/#TransportOptions
  params.iceServers = iceServers;
  producerTransport = device.createSendTransport(params);

  console.log("producerTransport created on client side", producerTransport);

  // https://mediasoup.org/documentation/v3/communication-between-client-and-server/#producing-media
  // this event is raised when a first call to transport.produce() is made
  // see connectSendTransport() below
  producerTransport.on(
    "connect",
    async ({ dtlsParameters }, callback, errback) => {
      console.log("DTLS", dtlsParameters);
      try {
        // Signal local DTLS parameters to the server side transport
        // see server's socket.on('transport-connect', ...)
        //let ws = wss[params.userId];
        console.log("connect producer transport?", dtlsParameters);
        ws.send(
          JSON.stringify({
            action: "connectProducerTransport",
            dtlsParameters: dtlsParameters,
            roomId: roomId,
            userId: params.userId,
            userEmail: user.userEmail,
          })
        );

        // Tell the transport that parameters were transmitted.
        callback();
      } catch (error) {
        errback(error);
      }
    }
  );

  producerTransport.on("produce", async (parameters, callback, errback) => {
    console.log(parameters);

    try {
      // tell the server to create a Producer
      // with the following parameters and produce
      // and expect back a server side producer id
      // see server's socket.on('transport-produce', ...)
      //let ws = wss[params.userId];
      ws.send(
        JSON.stringify({
          action: "produce",
          kind: parameters.kind,
          rtpParameters: parameters.rtpParameters,
          appData: parameters.appData,
          roomId: roomId,
          userId: params.userId,
          allProduce: allProduce,
          isSharing: isSharing,
          userEmail: user.userEmail,
        })
      );
      const intervalId = setInterval(() => {
        if (callbackId && !isCallbackCalled) {
          callback(callbackId);
          isCallbackCalled = true;
          callbackId = null;
          isSharing = false;
          clearInterval(intervalId);
        } else {
          console.log("Waiting for callbackId...");
        }
      }, 50);
    } catch (error) {
      console.log(error);
      errback(error);
    }
  });
  await connectSendTransport();
  // })
};
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
  // let stream = await navigator.mediaDevices.getUserMedia({
  //   video: true,
  //   audio: true,
  // });
  // let videoTrack = stream.getVideoTracks()[0];
  // let audioTrack = stream.getAudioTracks()[0];

  // let audioParams = {
  //   track: audioTrack,
  // };
  // let videoParams = { params };

  // videoParams = {
  //   track: videoTrack,
  //   ...videoParams,
  // };

  const canvas = document.getElementById("outputCanvas");
  const streamFromCanvas = canvas.captureStream(30);
  const video = document.getElementById("localVideo");
  //localVideo.stream = streamFromCanvas;
  if (!streamFromCanvas || !streamFromCanvas.getVideoTracks().length) {
    console.error("Failed to capture stream from canvas.");
    return;
  }
  const videoTrack = streamFromCanvas.getVideoTracks()[0];
  videoParams.track = videoTrack;
  console.log(videoParams);

  if (videoParams && videoParams.track && video.srcObject.getVideoTracks()[0]) {
    videoProducer = await producerTransport.produce(videoParams);

    videoProducer.on("trackended", () => {
      console.log("track ended");

      // close video track
    });

    videoProducer.on("transportclose", () => {
      console.log("transport ended");

      // close video track
    });
  } else {
    toggleButtonWhenProducerNotFound("video", webcamButton, true, "localVideo");
    webcamButton.attr("disabled", true);

    ws.send(
      JSON.stringify({
        action: "producerNotProvided",
        kind: "video",
        userId: id,
        name: username,
        roomId: roomId,
        userEmail: user.userEmail,
      })
    );
  }
  //allProduce = true;
  // alert("Continue");
  console.log("AUDIO PARAMS:");
  console.log(audioParams);
  console.log(audioParams && audioParams.track);
  if (audioParams && audioParams.track) {
    audioProducer = await producerTransport.produce(audioParams, {
      opusStereo: true,
      opusDtx: false,
      opusFec: true,
      opusMaxPlaybackRate: 48000,
      opusBitrate: 64000,
    });

    audioProducer.on("trackended", () => {
      console.log("track ended");

      // close video track
    });

    audioProducer.on("transportclose", () => {
      console.log("transport ended");

      // close video track
    });
  } else {
    toggleButtonWhenProducerNotFound("audio", micButton, true, "localVideo");
    micButton.attr("disabled", true);
    ws.send(
      JSON.stringify({
        action: "producerNotProvided",
        kind: "audio",
        userId: id,
        name: username,
        roomId: roomId,
        userEmail: user.userEmail,
      })
    );
  }
  // allProduce = false;
  // }
  // alert("Consume both AUDIO AND VIDEO");

  console.log("PRODUCE BOTH", audioProducer);

  console.log("AUDIO STATUS");
  if (localStorage.getItem("micEnabled") == "false") {
    await toggleButton("audio", micButton);
    console.log("TOGGLED");
  } else {
    try {
      recognition.start();
    } catch (error) {
      console.log(error);
    }
  }
  if (localStorage.getItem("cameraEnabled") == "false") {
    await toggleButton("video", webcamButton);
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
};

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

async function addTrackToVideoElement(track, id) {
  console.log("ADD TRACK TO: ", id);
  // const container = document.getElementById('video-container');
  let remoteVideo = document.getElementById(id);

  if (!remoteVideo) {
    remoteVideo = document.createElement("video");
    remoteVideo.id = id;
    remoteVideo.autoplay = true;
    //   container.appendChild(remoteVideo);
  }

  if (remoteVideo.srcObject) {
    if (track.kind == "video") {
      let videoTracks = remoteVideo.srcObject.getVideoTracks();
      if (videoTracks.length > 0) {
        let videoTrack = videoTracks[0];
        remoteVideo.srcObject.removeTrack(videoTrack);
      }
    } else if (track.kind == "audio") {
      let audioTracks = remoteVideo.srcObject.getAudioTracks();
      if (audioTracks.length > 0) {
        let audioTrack = audioTracks[0];
        remoteVideo.srcObject.removeTrack(audioTrack);
      }
    }

    await remoteVideo.srcObject.addTrack(track);
  } else {
    let newStream = new MediaStream();
    newStream.addTrack(track);
    remoteVideo.srcObject = newStream;
  }

  if (id.includes("Sharing")) {
    return;
  }
  console.log(harkInstances);
  console.log("Added track to MediaStream:", track);
  // console.log('Updated MediaStream for video element with id:', id, remoteVideo.srcObject);
  // console.log('Stream tracks:', remoteVideo.getTracks());
  if (track.kind === "audio") {
    if (harkInstances[id]) {
      harkInstances[id].stop();
      harkInstances[id] = null;
      delete harkInstances[id];
    }
    let audioStream = new MediaStream();
    audioStream.addTrack(track);
    let options = {
      threshold: -70,
    };
    harkInstances[id] = hark(audioStream, options);

    harkInstances[id].on("speaking", () => {
      //console.log(`${id} is speaking on track ${track.id}`);
      showDots(id);
      if (id == "localVideo") {
        showDots("outputCanvas");
      }
      moveDivToPositionWhenSpeaking(id);
    });

    harkInstances[id].on("stopped_speaking", () => {
      //console.log(`${id} speech stopped on track ${track.id}`);
      stopDots(id);
      if (id == "localVideo") {
        stopDots("outputCanvas");
      }
    });
    harkInstances[id].on("volume_change", (volume, threshold) => {
      //console.log(`Volume change: ${volume}, Threshold: ${threshold}`);

      updateDots(volume, id);
      if (id == "localVideo") {
        updateDots("outputCanvas");
      }
    });
  }
}

const createRecvTransport = async (params) => {
  console.log("PARAMS VALUE:", params);
  // see server's socket.on('consume', sender?, ...)
  // this is a call from Consumer, so sender = false

  // creates a new WebRTC Transport to receive media
  // based on server's consumer transport params
  // https://mediasoup.org/documentation/v3/mediasoup-client/api/#device-createRecvTransport
  let consumerTransport;
  if (consumerTransports[params.producerUserId]) {
    consumerTransport = consumerTransports[params.producerUserId];
  } else {
    params.iceServers = iceServers;
    consumerTransport = device.createRecvTransport(params);
    console.log("COnsumerTransport created: ", consumerTransport.id);

    consumerTransports[params.producerUserId] = consumerTransport;

    consumerTransport.on(
      "connect",
      async ({ dtlsParameters }, callback, errback) => {
        try {
          // Signal local DTLS parameters to the server side transport
          // see server's socket.on('transport-recv-connect', ...)
          //ws = wss[params.producerUserId];
          ws.send(
            JSON.stringify({
              action: "connectConsumerTransport",
              dtlsParameters,
              producerId: params.producerId,
              roomId: roomId,
              userId: id,
              producerUserId: params.producerUserId,
              userEmail: user.userEmail,
            })
          );

          callback();
        } catch (error) {
          // Tell the transport that something was wrong
          errback(error);
        }
      }
    );
  }

  // consumerTransport.on('connect', async () => {
  //     connectRecvTransport(params.producerId, params.producerUserId);
  // });

  connectRecvTransport(
    params.producerId,
    params.producerUserId,
    params.producerStatus
  );
};

const connectRecvTransport = async (
  producerId,
  producerUserId,
  producerStatus
) => {
  ws.send(
    JSON.stringify({
      action: "consume",
      producerUserId: producerUserId,
      producerId: producerId,
      rtpCapabilities: device.rtpCapabilities,
      roomId: roomId,
      producerStatus: producerStatus,
      userId: id,
      userEmail: user.userEmail,
    })
  );
};

sendButton.addEventListener("click", function () {
  const content = $("#messageContent").val();
  if (content.trim().length == 0) {
    return;
  }
  if (lastMessageId == user.id) {
    if (content.trim() !== "") {
      const lastYourChatElement = $(".yourchat").last();
      lastYourChatElement.append(`<p>${content}</p>`);

      $("#messageContent").val("");

      // sendMessage("message", content);
      ws.send(
        JSON.stringify({
          action: "message",
          content: content,
          roomId: roomId,
          userId: user.id,
          userEmail: user.userEmail,
        })
      );
    }
  } else {
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
    ws.send(
      JSON.stringify({
        action: "message",
        content: content,
        roomId: roomId,
        userId: user.id,
        userEmail: user.userEmail,
      })
    );
  }
  lastMessageId = user.id;
  const chatBody = document.getElementById("chatBody");
  chatBody.scrollTop = chatBody.scrollHeight - chatBody.clientHeight;
});
$("#messageContent").keydown(function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    sendButton.click();
  }
});

function displayMessage(from, content, userId) {
  if (lastMessageId == userId) {
    const lastUserChatElement = $(`.${userId}chat`).last();
    lastUserChatElement.append(`<p>${content}</p>`);
  } else {
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
  const chatBody = document.getElementById("chatBody");
  chatBody.scrollTop = chatBody.scrollHeight - chatBody.clientHeight;
}

hangupButton.on("click", () => {
  console.log("click");

  // sendMessage('leave');
  // endCall();
  window.location.href = "/";
});

webcamButton.on("click", async () => {
  console.log("click");
  await toggleButton("video", webcamButton);
});
micButton.on("click", async () => {
  await toggleButton("audio", micButton);
});

async function startCapture(displayMediaOptions) {
  let captureStream = null;
  try {
    captureStream = await navigator.mediaDevices.getDisplayMedia(
      displayMediaOptions
    );

    const videoTrack = captureStream.getVideoTracks()[0];
    if (sharingParams.track) {
      sharingParams.track = videoTrack;
    } else {
      sharingParams = {
        track: videoTrack,
        ...sharingParams,
      };
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

  const sharingContainer = document.querySelector(".sharing-container");

  const sharingVideoContainer = document.querySelectorAll(
    ".sharing-video-container"
  );
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

    tracks.forEach((track) => {
      track.stop();
    });
    updateSharingVideo(id);
    console.log("Screen sharing stopped.");
  } else {
    console.log("No active stream to stop.");
  }
}

async function sharingVideo() {
  if (myShareStream != null) {
    stopSharing(id + "-Sharing");

    ws.send(
      JSON.stringify({
        action: "stopSharing",
        producerUserId: id,
        roomId: roomId,
        username: username,
        userEmail: user.userEmail,
      })
    );
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

  sharingProducer.on("trackended", () => {
    console.log("track ended");

    // close video track
  });
  sharingProducer.on("transportclose", () => {
    console.log("transport ended");

    // close video track
  });

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
    ws.send(
      JSON.stringify({
        action: "stopSharing",
        producerUserId: id,
        roomId: roomId,
        username: username,
        userEmail: user.userEmail,
      })
    );
    shareButton.removeClass("bg-primary");
  };

  const sharingContainer = document.querySelector(".sharing-container");

  sharingContainer.classList.remove("d-none");
}

shareButton.on("click", async () => {
  await sharingVideo();
});

shareButtonOnMobile.on("click", async () => {
  await sharingVideo();
});
async function addSharingContainer(id, name) {
  const itemIdExists = document.getElementById(id);
  if (itemIdExists) {
    return;
  }
  const container = document.querySelector(".sharing-container");
  const item = document.createElement("div");
  item.id = "divSharing" + id;
  item.classList.add("grid-item");
  item.classList.add("sharing-video-container");
  item.style.backgroundColor = "#202124";
  container.appendChild(item);

  const video = document.createElement("video");
  video.id = id;
  video.style.objectFit = "contain";
  video.autoplay = true;
  video.playsInline = true;
  item.appendChild(video);

  const nameDisplay = document.createElement("div");
  nameDisplay.classList.add("name-display");
  nameDisplay.classList.add("me-3");
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
  } else {
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
  } else {
    // videoPlayer.enabled = bool;
    // videoPlayer.muted = bool;
    micDiv[0].classList.remove("d-none");
    micDiv[1].classList.remove("d-none");
    micDiv[2].classList.remove("d-none");
  }
}

function toggleButtonWhenProducerNotFound(type, button, status, userId) {
  let micDiv = document.getElementsByClassName("mutedMic" + userId);

  let alterDiv = document.getElementById("divAlter" + userId);
  let videoDiv = document.getElementById("divVideo" + userId);

  if (type == "audio") {
    if (status == true) {
      if (button) {
        button.addClass("bg-danger");
        $("#micIcon").addClass("bi-mic-mute");
        $("#micIcon").removeClass("bi-mic");
      }

      $(".micActivelocalVideo").addClass("d-none");
      micDiv[0].classList.remove("d-none");
      micDiv[1].classList.remove("d-none");
      micDiv[2].classList.remove("d-none");
    } else {
      if (button) {
        button.removeClass("bg-danger");
        $("#micIcon").removeClass("bi-mic-mute");
        $("#micIcon").addClass("bi-mic");
      }
      micDiv[0].classList.add("d-none");
      micDiv[1].classList.add("d-none");
      micDiv[2].classList.add("d-none");
    }
  } else {
    if (status == true) {
      if (button) {
        button.addClass("bg-danger");
        $("#webcamIcon").addClass("bi-camera-video-off");
        $("#webcamIcon").removeClass("bi-camera-video");
      }
      alterDiv.classList.remove("d-none");
      videoDiv.classList.add("d-none");
    } else {
      if (button) {
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
  let track = stream.getTracks().find((track) => track.kind === type);
  let micDiv = document.getElementsByClassName("mutedMiclocalVideo");

  let alterDiv = document.getElementById("divAlterlocalVideo");
  let videoDiv = document.getElementById("divVideolocalVideo");

  if (type == "audio") {
    console.log(audioProducer);
    if (audioProducer) {
      const audioState = audioProducer.paused ? "paused" : "active";
      if (audioState == "active") {
        audioProducer.pause();
        stream.getAudioTracks()[0].stop();
        track.enabled = false;
        button.addClass("bg-danger");
        $("#micIcon").addClass("bi-mic-mute");
        $("#micIcon").removeClass("bi-mic");

        $(".micActivelocalVideo").addClass("d-none");
        micDiv[0].classList.remove("d-none");
        micDiv[1].classList.remove("d-none");
        micDiv[2].classList.remove("d-none");
        ws.send(
          JSON.stringify({
            action: "muted",
            producerUserId: id,
            roomId: roomId,
            userEmail: user.userEmail,
          })
        );
        try {
          recognition.abort();
        } catch (error) {
          console.log(error);
        }
        localStorage.setItem("micEnabled", false);
      } else {
        let audioTrackReplace = await getAudioTrackReplace();
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length > 0) {
          stream.removeTrack(audioTracks[0]);
          stream.addTrack(audioTrackReplace);
        } else {
          console.error("No video tracks found in local video stream.");
        }
        await audioProducer.replaceTrack({ track: audioTrackReplace });
        audioProducer.resume();
        ws.send(
          JSON.stringify({
            action: "unmuted",
            producerUserId: id,
            roomId: roomId,
            userEmail: user.userEmail,
          })
        );
        let harkid = "localVideo";
        if (harkInstances[harkid]) {
          console.log("EXISTS HARK INSTANCE");
          harkInstances[harkid].stop();
          harkInstances[harkid] = null;
          delete harkInstances[harkid];
        }
        console.log(harkInstances);
        let audioStream = new MediaStream();
        audioStream.addTrack(stream.getAudioTracks()[0]);
        let options = {
          threshold: -70,
        };
        harkInstances[harkid] = hark(audioStream, options);

        harkInstances[harkid].on("speaking", () => {
          //console.log(`${harkid} is speaking on track ${track.id}`);
          showDots(harkid);
          if (harkid == "localVideo") {
            showDots("outputCanvas");
          }
          moveDivToPositionWhenSpeaking(harkid);
        });

        harkInstances[harkid].on("stopped_speaking", () => {
          //console.log(`${harkid} speech stopped on track ${track.id}`);
          stopDots(harkid);
          if (harkid == "localVideo") {
            stopDots("outputCanvas");
          }
        });
        harkInstances[harkid].on("volume_change", (volume, threshold) => {
          //console.log(`Volume change: ${volume}, Threshold: ${threshold}`);

          updateDots(volume, harkid);
          if (harkid == "localVideo") {
            updateDots(volume, "outputCanvas");
          }
        });
        track.enabled = true;
        button.removeClass("bg-danger");
        $("#micIcon").removeClass("bi-mic-mute");
        $("#micIcon").addClass("bi-mic");
        micDiv[0].classList.add("d-none");
        micDiv[1].classList.add("d-none");
        micDiv[2].classList.add("d-none");

        try {
          recognition.start();
        } catch (error) {
          console.log(error);
        }
        localStorage.setItem("micEnabled", true);
      }
    } else {
      console.log("ERROR: KHONG TIM THAY AUDIOPRODUCER");
    }
  }
  //video
  else {
    // console.log(videoState);
    if (videoProducer) {
      const videoState = videoProducer.paused ? "paused" : "active";
      console.log("VIDEO STATE", videoState);

      console.log(videoState == "active");
      if (videoState == "active") {
        await videoProducer.pause();
        // track.stop();
        stream.getVideoTracks()[0].stop();
        track.enabled = false;
        button.addClass("bg-danger");
        $("#webcamIcon").addClass("bi-camera-video-off");
        $("#webcamIcon").removeClass("bi-camera-video");
        alterDiv.classList.remove("d-none");
        videoDiv.classList.add("d-none");
        ws.send(
          JSON.stringify({
            action: "offCamera",
            producerUserId: id,
            roomId: roomId,
            userEmail: user.userEmail,
          })
        );

        localStorage.setItem("cameraEnabled", false);
      } else {
        // track.resume();
        // getLocalStream();
        let videoTrackReplace = await getVideoTrackReplace();
        const videoTracks = stream.getVideoTracks();
        if (videoTracks.length > 0) {
          stream.removeTrack(videoTracks[0]);
          stream.addTrack(videoTrackReplace);
        } else {
          console.error("No video tracks found in local video stream.");
        }

        const canvas = document.getElementById("outputCanvas");
        const streamFromCanvas = canvas.captureStream();
        //localVideo.stream = streamFromCanvas;
        if (!streamFromCanvas || !streamFromCanvas.getVideoTracks().length) {
          console.error("Failed to capture stream from canvas.");
          return;
        }
        const videoTrack = streamFromCanvas.getVideoTracks()[0];

        await videoProducer.replaceTrack({ track: videoTrack });
        await videoProducer.resume();
        track.enabled = true;
        button.removeClass("bg-danger");
        $("#webcamIcon").removeClass("bi-camera-video-off");
        $("#webcamIcon").addClass("bi-camera-video");
        alterDiv.classList.add("d-none");
        videoDiv.classList.remove("d-none");
        ws.send(
          JSON.stringify({
            action: "onCamera",
            producerUserId: id,
            roomId: roomId,
            userEmail: user.userEmail,
          })
        );

        localStorage.setItem("cameraEnabled", true);
      }
    } else {
      console.log("ERROR: KHONG TIM THAY VIDEOPRODUCER");
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

async function getRemoteAudioTracks() {
  return Array.from(consumers)
    .map((consumer) => consumer.track)
    .filter((track) => track.kind === "audio");
}

async function createCombinedStream() {
  const combinedStream = new MediaStream();

  try {
    const screenStream = await getScreenStream();
    screenStream.getTracks().forEach((track) => combinedStream.addTrack(track));
  } catch (error) {
    console.error("Failed to get screen stream:", error);
    throw error;
  }

  try {
    const remoteAudioTracks = await getRemoteAudioTracks();
    remoteAudioTracks.forEach((track) => combinedStream.addTrack(track));
  } catch (error) {
    console.error("Failed to get remote audio tracks:", error);
  }

  try {
    const audioStream = await getAudioStream();
    audioStream.getTracks().forEach((track) => combinedStream.addTrack(track));
  } catch (error) {
    console.warn("Failed to get audio stream:", error);
  }

  return combinedStream;
}

function setupMediaRecorder(combinedStream) {
  mediaRecorder = new MediaRecorder(combinedStream);

  mediaRecorder.ondataavailable = function (event) {
    chunks.push(event.data);
  };

  mediaRecorder.onstart = function () {
    console.log("Recording started");
  };

  mediaRecorder.onstop = function () {
    const blob = new Blob(chunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = "recording.webm";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    chunks = [];
  };

  mediaRecorder.onpause = function () {
    console.log("Recording paused");
  };

  mediaRecorder.onresume = function () {
    console.log("Recording resumed");
  };
}

async function startRecording() {
  const combinedStream = await createCombinedStream();
  setupMediaRecorder(combinedStream);
  mediaRecorder.start();
  console.log("Recording started");
  //chi show len pause va stop
  showLiOptions(["pauseLi", "stopLi"]);

  ws.send(
    JSON.stringify({
      action: "recording",
      userEmail: user.userEmail,
      userId: id,
      roomId: roomId,
    })
  );
  recordingUsersOnClient.unshift({ userId: user.id, name: "You" });
  showRecordingUsers(recordingUsersOnClient);
}

function pauseRecording() {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.pause();
    console.log("Recording paused");
    ws.send(
      JSON.stringify({
        action: "stopRecording",
        userEmail: user.userEmail,
        userId: id,
        roomId: roomId,
      })
    );
    recordingUsersOnClient = recordingUsersOnClient.filter(
      (user) => user.userId != id
    );
    showRecordingUsers(recordingUsersOnClient);
  }
}

function resumeRecording() {
  if (mediaRecorder && mediaRecorder.state === "paused") {
    mediaRecorder.resume();
    console.log("Recording resumed");
    ws.send(
      JSON.stringify({
        action: "recording",
        userEmail: user.userEmail,
        userId: id,
        roomId: roomId,
      })
    );
    recordingUsersOnClient.unshift({ userId: user.id, name: "You" });
    showRecordingUsers(recordingUsersOnClient);
  }
}

function stopRecording() {
  if (
    mediaRecorder &&
    (mediaRecorder.state === "recording" || mediaRecorder.state === "paused")
  ) {
    mediaRecorder.stop();
    console.log("Recording stopped");
  }
}

function showLiOptions(ids) {
  console.log($("#optionsDiv li"));
  $("#optionsDiv li")
    .slice(1)
    .each(function () {
      const liId = $(this).attr("id");
      //console.log(liId);
      //console.log(ids.includes(liId));
      if (ids.includes(liId)) {
        $(this).removeClass("d-none");
      } else {
        $(this).addClass("d-none");
      }
    });
}

console.log($("#optionsDiv li"));
recordButton.on("click", function () {
  startRecording();
});

pauseButton.on("click", function () {
  pauseRecording();
  //chi show len resume, stop
  showLiOptions(["resumeLi", "stopLi"]);
});

resumeButton.on("click", function () {
  resumeRecording();
  //chi show len pause, stop
  showLiOptions(["pauseLi", "stopLi"]);
});

stopButton.on("click", function () {
  stopRecording();
  //chi show len record
  showLiOptions(["recordLi"]);

  ws.send(
    JSON.stringify({
      action: "stopRecording",
      userEmail: user.userEmail,
      userId: id,
      roomId: roomId,
    })
  );
  recordingUsersOnClient = recordingUsersOnClient.filter(
    (user) => user.userId != id
  );
  showRecordingUsers(recordingUsersOnClient);
});

searchPeopleInput.on("input", function () {
  let filter = searchPeopleInput.val();
  filterUsersByName(filter);
});
let videoSrcChange = false;
let audioSrcChange = false;

async function checkDeviceConstraints(audioConstraints, videoConstraints) {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();

    const audioInputs = devices.filter(
      (device) => device.kind === "audioinput"
    );
    //const audioOutputs = devices.filter(device => device.kind === 'audiooutput');
    const videoInputs = devices.filter(
      (device) => device.kind === "videoinput"
    );

    populateDropdown("micDropdownMenu", audioInputs, "micButtonDropdown");
    //populateDropdown('speakerDropdownMenu', audioOutputs, 'speakerButtonDropdown');
    populateDropdown("cameraDropdownMenu", videoInputs, "cameraButtonDropdown");
    videoConstraints = JSON.parse(videoConstraints);
    audioConstraints = JSON.parse(audioConstraints);
    let audioDeviceExists;
    if (audioConstraints.deviceId && audioConstraints) {
      audioDeviceExists = devices.some(
        (device) =>
          device.kind === "audioinput" &&
          device.deviceId === audioConstraints.deviceId.exact
      );
    } else {
      audioDeviceExists = false;
    }

    let videoDeviceExists;
    if (videoConstraints.deviceId && videoConstraints) {
      videoDeviceExists = devices.some(
        (device) =>
          device.kind === "videoinput" &&
          device.deviceId === videoConstraints.deviceId.exact
      );
    } else {
      videoDeviceExists = false;
    }

    return { audioDeviceExists, videoDeviceExists };
  } catch (error) {
    console.error("Error checking device constraints:", error);
    return { audioDeviceExists: false, videoDeviceExists: false };
  }
}
let lastTranscriptStatus = false;

$("#settingButton").on("click", function () {
  transcriptSwitch.checked = lastTranscriptStatus;

  const videoPreview = document.getElementById("videoPreview");
  videoPreview.muted = true;
  let audioConstraints = localStorage.getItem("audioConstraints");
  let videoConstraints = localStorage.getItem("videoConstraints");
  let constraints = { video: true, audio: true };
  if (audioConstraints) {
    constraints.audio = JSON.parse(audioConstraints);
  }
  if (videoConstraints) {
    constraints.video = JSON.parse(videoConstraints);
  }
  checkDeviceConstraints(audioConstraints, videoConstraints)
    .then(async (result) => {
      console.log("Audio device exists:", result.audioDeviceExists);
      console.log("Video device exists:", result.videoDeviceExists);
      if (!result.audioDeviceExists) {
        constraints.audio = true;
      }
      if (!result.videoDeviceExists) {
        constraints.video = true;
      }
      console.log(constraints);
      // if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      //     navigator.mediaDevices.getUserMedia(constraints)
      //         .then(async function (stream) {
      //             // let stream = localStream.srcObject;

      //             // window.stream = stream;
      //             videoPreview.srcObject = stream;
      //             videoPreview.play();

      //             const videoTrack = stream.getVideoTracks()[0];
      //             const audioTrack = stream.getAudioTracks()[0];

      //             if (videoTrack) {
      //                 console.log('Video Track Device ID:', videoTrack.label);

      //                 $("#cameraCurrent").text(videoTrack.label);

      //                 let dropdownMenu = document.getElementById("cameraDropdownMenu");

      //                 const items = dropdownMenu.querySelectorAll('.dropdown-item');
      //                 items.forEach(item => {
      //                     console.log(item.textContent)
      //                     if (item.textContent.trim() === videoTrack.label) {
      //                         item.classList.add('active');
      //                     }
      //                 });

      //             }
      //             if (audioTrack) {
      //                 console.log('Audio Track Device ID:', audioTrack.label);

      //                 $("#microphoneCurrent").text(audioTrack.label);

      //                 // testMic(audioTrack, "videoPreview")

      //                 let dropdownMenu = document.getElementById("micDropdownMenu");

      //                 const items = dropdownMenu.querySelectorAll('.dropdown-item');
      //                 items.forEach(item => {
      //                     if (item.textContent.trim() === audioTrack.label) {
      //                         item.classList.add('active');
      //                     }
      //                 });
      //             }
      //         })
      //         .catch(function (error) {
      //             console.error('Error when accessing devices:', error);
      //         });
      // } else {
      //     alert('Sorry, your browser does not support getUserMedia');
      // }
      let audioStreamPromise = navigator.mediaDevices.getUserMedia({
        audio: audioConstraints ? JSON.parse(audioConstraints) : true,
      });
      let videoStreamPromise = navigator.mediaDevices.getUserMedia({
        video: videoConstraints ? JSON.parse(videoConstraints) : true,
      });

      let audioStream = null;
      let videoStream = null;

      try {
        audioStream = await audioStreamPromise;
      } catch (error) {
        //disableButton("audio", micButton);
        console.warn("Audio permission denied or other issue:", error);
      }
      try {
        videoStream = await videoStreamPromise;
      } catch (error) {
        //disableButton("video", webcamButton);
        console.warn("Video permission denied or other issue:", error);
      }

      // Create a combined stream if both streams are available
      const combinedStream = new MediaStream();
      if (audioStream) {
        audioStream
          .getAudioTracks()
          .forEach((track) => combinedStream.addTrack(track));
      }
      if (videoStream) {
        videoStream
          .getVideoTracks()
          .forEach((track) => combinedStream.addTrack(track));
      }
      window.stream = combinedStream;
      videoPreview.srcObject = combinedStream;
      videoPreview.play();
      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];

      if (videoTrack) {
        console.log("Video Track Device ID:", videoTrack.label);

        $("#cameraCurrent").text(videoTrack.label);

        let dropdownMenu = document.getElementById("cameraDropdownMenu");

        const items = dropdownMenu.querySelectorAll(".dropdown-item");
        items.forEach((item) => {
          console.log(item.textContent);
          if (item.textContent.trim() === videoTrack.label) {
            item.classList.add("active");
          }
        });
      }
      if (audioTrack) {
        console.log("Audio Track Device ID:", audioTrack.label);

        $("#microphoneCurrent").text(audioTrack.label);

        let dropdownMenu = document.getElementById("micDropdownMenu");

        const items = dropdownMenu.querySelectorAll(".dropdown-item");
        items.forEach((item) => {
          if (item.textContent.trim() === audioTrack.label) {
            item.classList.add("active");
          }
        });
      }
    })
    .catch(function (error) {
      console.error("Error when accessing devices:", error);
      //constraints = {video: true, audio: true};
    });
});
async function changeMediaDevice(type, deviceId) {
  try {
    const videoElement = document.getElementById("videoPreview");
    // if (!window.stream) {
    //     let stream = await getUserMediaWithConstraints(true, true);
    //     window.stream = stream
    //     videoElement.srcObject = stream;
    // }
    let stream = videoElement.srcObject;

    let audioConstraints = null;
    let videoConstraints = null;
    if (type === "audioinput") {
      audioConstraints = { deviceId: { exact: deviceId } };

      let audioStream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
      });

      if (!stream) {
        /*let stream = await getUserMediaWithConstraints(true, true);
                    let videoTrack = stream.getVideoTracks()[0];
                    let videoSettings = videoTrack.getSettings();
                    const videoDeviceId = videoSettings.deviceId;

                    let videoConstraints = { deviceId: { exact: videoDeviceId } };*/
        videoElement.srcObject = audioStream;
        //videoElement.srcObject.addTrack(audioStream.getVideoTracks()[0]);
        //localStorage.setItem("audioConstraints", JSON.stringify(audioConstraints))
      } else {
        const audioTracks = stream.getAudioTracks();
        console.log(audioTracks);
        if (audioTracks.length > 0) {
          stream.removeTrack(audioTracks[0]);
          stream.addTrack(audioStream.getAudioTracks()[0]);
          //localStorage.setItem("audioConstraints", JSON.stringify(audioConstraints))
        } else {
          stream.addTrack(audioStream.getAudioTracks()[0]);
          //localStorage.setItem("audioConstraints", JSON.stringify(audioConstraints))
        }
      }
      audioSrcChange = true;
    } else if (type === "videoinput") {
      videoConstraints = { deviceId: { exact: deviceId } };

      console.log(videoConstraints);
      let videoStream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
      });
      if (!stream) {
        /*let stream = await getUserMediaWithConstraints(true, true);
                    let videoTrack = stream.getVideoTracks()[0];
                    let videoSettings = videoTrack.getSettings();
                    const videoDeviceId = videoSettings.deviceId;

                    let videoConstraints = { deviceId: { exact: videoDeviceId } };*/
        videoElement.srcObject = videoStream;
        //localStorage.setItem("videoConstraints", JSON.stringify(videoConstraints))
      } else {
        const videoTracks = stream.getVideoTracks();
        if (videoTracks.length > 0) {
          stream.removeTrack(videoTracks[0]);
          stream.addTrack(videoStream.getVideoTracks()[0]);
          console.log(videoStream.getVideoTracks()[0]);
          console.log("REPLACE VIDEO TRACK");
          //localStorage.setItem("videoConstraints", JSON.stringify(videoConstraints))
        } else {
          stream.addTrack(videoStream.getVideoTracks()[0]);
          console.log(videoStream.getVideoTracks()[0]);
          console.log("REPLACE VIDEO TRACK");
          //localStorage.setItem("videoConstraints", JSON.stringify(videoConstraints))
        }
        videoTracks[0].stop();
      }
      videoSrcChange = true;
    }
  } catch (error) {
    console.error("Lỗi khi thay đổi thiết bị media:", error);
  }
}
async function populateDropdown(dropdownId, devices, buttonId) {
  const dropdownMenu = document.getElementById(dropdownId);
  dropdownMenu.innerHTML = "";

  devices.forEach((device) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.className = "dropdown-item";
    a.href = "#";
    a.textContent =
      device.label || `Thiết bị không có tên (${device.deviceId})`;
    a.dataset.deviceId = device.deviceId;

    a.addEventListener("click", async function (event) {
      event.preventDefault();

      const button = document.getElementById(buttonId);
      const buttonLabel = button.querySelector("p");
      buttonLabel.textContent = this.textContent;

      const items = dropdownMenu.querySelectorAll(".dropdown-item");
      items.forEach((item) => item.classList.remove("active"));
      this.classList.add("active");

      await changeMediaDevice(devices[0].kind, this.dataset.deviceId);
    });

    li.appendChild(a);
    dropdownMenu.appendChild(li);
  });
}
$("#changeSourceButton").on("click", async function () {
  try {
    try {
      if (transcriptSwitch.checked) {
        recognition.stop();
        lastTranscriptStatus = true;
      } else {
        lastTranscriptStatus = false;
      }
      recognition.lang = transcriptLanguage.value;
    } catch (error) {
      console.log(error);
    }

    if (videoSrcChange == false && audioSrcChange == false) {
      stopBothPreviewStream();
      return;
    }
    let stream = localVideo.srcObject;
    const videoPreview = document.getElementById("videoPreview");
    let videoPreviewStream = videoPreview.srcObject;
    let videoTrackReplace = videoPreviewStream.getVideoTracks()[0];
    let videoTracks;

    let audioTrackReplace = videoPreviewStream.getAudioTracks()[0];
    let audioTracks;
    if (stream) {
      videoTracks = stream.getVideoTracks();
      audioTracks = stream.getAudioTracks();
    } else {
      stream = new MediaStream();
    }
    console.log(videoSrcChange);
    console.log(videoTrackReplace);
    if (videoSrcChange == true) {
      //replace;
      if (videoTracks) {
        stream.removeTrack(videoTracks[0]);
        //
      } else {
        console.log("No video tracks found in local video stream.");
      }
      videoTracks[0].stop();
      if (audioSrcChange == false) {
        audioTrackReplace.stop();
      }
      stream.addTrack(videoTrackReplace);
      //videoParams.track = videoTrackReplace;
      localVideo.srcObject = stream;

      console.log(localVideo.srcObject);

      const canvas = document.getElementById("outputCanvas");
      const streamFromCanvas = canvas.captureStream();
      //localVideo.stream = streamFromCanvas;
      if (!streamFromCanvas || !streamFromCanvas.getVideoTracks().length) {
        console.error("Failed to capture stream from canvas.");
        return;
      }
      const videoTrack = streamFromCanvas.getVideoTracks()[0];
      videoParams.track = videoTrack;

      if (videoProducer) {
        await videoProducer.replaceTrack({ track: videoTrack });
        const videoState = videoProducer.paused ? "paused" : "active";
        console.log(videoState);
        if (videoState == "paused") {
          videoTrackReplace.stop();
        }
        const audioState = audioProducer.paused ? "paused" : "active";
        console.log(audioState);
        if (audioState == "paused") {
          audioTrackReplace.stop();
        }
      } else {
        videoProducer = await producerTransport.produce(videoParams);

        videoProducer.on("trackended", () => {
          console.log("track ended");

          // close video track
        });

        videoProducer.on("transportclose", () => {
          console.log("transport ended");

          // close video track
        });

        // $("#divVideolocalVideo").removeClass("d-none");
        // $("#divAlterlocalVideo").addClass("d-none");

        toggleButtonWhenProducerNotFound(
          "video",
          webcamButton,
          false,
          "localVideo"
        );
      }

      let track = videoTrackReplace;
      let videoSettings = track.getSettings();
      const videoDeviceId = videoSettings.deviceId;

      let videoConstraints = { deviceId: { exact: videoDeviceId } };
      localStorage.setItem(
        "videoConstraints",
        JSON.stringify(videoConstraints)
      );
      console.log("CHANGE MEDIA SOURCE");
      console.log(videoConstraints);
      videoSrcChange = false;
    }
    if (audioSrcChange == true) {
      //replace;
      if (audioTracks.length > 0) {
        stream.removeTrack(audioTracks[0]);
        audioTracks[0].stop();
        if (videoSrcChange == false) {
          videoTrackReplace.stop();
        }
        stream.addTrack(audioTrackReplace);
        localVideo.muted = true;
        localVideo.volume = 0;

        await audioProducer.replaceTrack({ track: audioTrackReplace });

        const audioState = audioProducer.paused ? "paused" : "active";
        console.log(audioState);
        if (audioState == "paused") {
          audioTrackReplace.stop();
        }
        const videoState = videoProducer.paused ? "paused" : "active";
        console.log(videoState);
        if (videoState == "paused") {
          videoTrackReplace.stop();
        }
        let track = audioTrackReplace;
        const audioSettings = track.getSettings();
        const audioDeviceId = audioSettings.deviceId;

        const audioConstraints = { deviceId: { exact: audioDeviceId } };
        localStorage.setItem(
          "audioConstraints",
          JSON.stringify(audioConstraints)
        );

        let id = "localVideo";
        if (harkInstances[id]) {
          console.log("EXISTS HARK INSTANCE");
          harkInstances[id].stop();
          harkInstances[id] = null;
          delete harkInstances[id];
        }
        console.log(harkInstances);
        let audioStream = new MediaStream();
        audioStream.addTrack(stream.getAudioTracks()[0]);
        let options = {
          threshold: -70,
        };
        harkInstances[id] = hark(audioStream, options);

        harkInstances[id].on("speaking", () => {
          //console.log(`${id} is speaking on track ${track.id}`);
          showDots(id);
          if (id == "localVideo") {
            showDots("outputCanvas");
          }
          moveDivToPositionWhenSpeaking(id);
        });

        harkInstances[id].on("stopped_speaking", () => {
          //console.log(`${id} speech stopped on track ${track.id}`);
          stopDots(id);
          if (id == "localVideo") {
            stopDots("outputCanvas");
          }
        });
        harkInstances[id].on("volume_change", (volume, threshold) => {
          //console.log(`Volume change: ${volume}, Threshold: ${threshold}`);

          updateDots(volume, id);
          if (id == "localVideo") {
            updateDots(volume, "outputCanvas");
          }
        });
      } else {
        console.error("No video tracks found in local video stream.");
      }

      audioSrcChange = false;
    }
  } catch (error) {
    console.log("error when change source: ", error);
  }
  videoPreview.muted = true;
});

$("#changeSourceCloseButton").on("click", function () {
  stopBothPreviewStream();
});
$("#closeSettingModalButton").on("click", function () {
  stopBothPreviewStream();
});
function stopBothPreviewStream() {
  const videoPreview = document.getElementById("videoPreview");
  let stream = videoPreview.srcObject;
  let videoTracks = stream.getVideoTracks();
  videoTracks.forEach((track) => track.stop());
  let audioTracks = stream.getAudioTracks();
  //audioTracks.stop();
  audioTracks.forEach((track) => track.stop());
  videoPreview.srcObject = null;
}
let privateMeetingSwitch = document.getElementById("toggleSwitch");
if (privateMeetingSwitch) {
  privateMeetingSwitch.addEventListener("change", function () {
    if (this.checked) {
      console.log("Toggle switch is ON");
      $("#meetingAccessDes").text("This meeting is private");
      ws.send(
        JSON.stringify({
          action: "settingsUpdate",
          private: true,
          roomId: roomId,
          userId: id,
          userEmail: user.userEmail,
        })
      );
    } else {
      $("#meetingAccessDes").text("This meeting is public");

      ws.send(
        JSON.stringify({
          action: "settingsUpdate",
          private: false,
          roomId: roomId,
          userId: id,
          userEmail: user.userEmail,
        })
      );
    }
  });
}

$("#acceptButton").on("click", function () {
  const requestorId = $("#requestorId").val();
  console.log("ACCEPT NEW USER");
  acceptRequest(requestorId);
});

$("#declineButton").on("click", function () {
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
let invitedUsers = [];
$("#input-invite").on("input", function () {
  getUserByContainingEmail();
});
$("#inviteButton").on("click", function () {
  sendInvites();
});
function sendInvites() {
  $.ajax({
    url: "/addRoomAttendees",
    type: "POST",
    contentType: "application/json",
    data: JSON.stringify({
      newAttendees: invitedUsers,
      roomId: roomId,
    }),
    success: function (response) {
      console.log("add new attendee success:", response);
    },
    error: function (xhr, status, error) {
      console.error("Send error:", xhr.responseText);
    },
  });
  invitedUsers.forEach((email) => {
    sendInvite(roomId, user.userEmail, email);
  });
  $("#inviteToast").toast("show");
  invitedUsers.forEach((email) => {
    removeUser(email);
  });
  $("#input-invite").val("");
}
function sendInvite(roomId, from, to) {
  try {
    $.ajax({
      url: "/sendNotification",
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify({
        roomId: roomId,
        from: from,
        to: to,
      }),
      success: function (response) {
        ws.send(
          JSON.stringify({
            action: "inviteUser",
            userEmailInvited: to,
            roomId: roomId,
            id: user.id,
            userEmail: user.userEmail,
          })
        );
        console.log("Send notification success:", response);
      },
      error: function (xhr, status, error) {
        console.error("Send error:", xhr.responseText);
      },
    });
    $.ajax({
      url: "/sendInviteEmail",
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify({
        roomId: roomId,
        to: to,
      }),
      success: function (response) {
        console.log("Send Email Invitation success:", response);
      },
      error: function (xhr, status, error) {
        console.error("Send error:", xhr.responseText);
      },
    });
  } catch (error) {
    console.log("Error when sending invitation: ", error);
  }
}
function getUserByContainingEmail() {
  let email = $("#input-invite").val();
  if (email.trim().length < 5) {
    return;
  }
  setTimeout(function () {
    $.ajax({
      url: "/getUserByContainingEmail",
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify({
        email: email.trim(),
      }),
      success: function (response) {
        const users = response;
        console.log(users);
        if (users.length == 0) {
          $("#noUserDiv").removeClass("d-none");
        } else {
          $("#noUserDiv").addClass("d-none");
          const foundUser = $("#foundUser");
          const foundUserDiv = $("#foundUser div");
          foundUserDiv.remove();
          users.forEach((iUser) => {
            if (iUser.email == user.userEmail && users.length == 1) {
              $("#noUserDiv").removeClass("d-none");
              return;
            }
            const newUserFound = $(` 
                            <div class="list-group">
                                <label class="list-group-item d-flex align-items-center">
                                    <div class="w-100"> 
                                        <img src="${
                                          iUser.avatar
                                            ? iUser.avatar
                                            : "/images/GoLogoNBg.png"
                                        }" alt="" srcset="" class="user-avatar rounded-circle" style="height: 28px; width: 28px; object-fit: contain;"> 
                                        ${iUser.email}
                                    </div>
                                    <input id="input${
                                      iUser.email
                                    }" class="invite-user-button form-check-input me-1 flex-shrink-1" type="checkbox" value="" 
                                    data-avatar='${iUser.avatar}' data-email='${
              iUser.email
            }'" ${invitedUsers.includes(iUser.email) ? "checked" : ""}>
                                </label>
                            </div>
                        `);
            foundUser.append(newUserFound);
          });
          // $(document).on('change', '.invite-user-button', function() {

          // });
          $(".invite-user-button").on("change", function () {
            const userEmail = $(this).data("email");
            const userAvatar = $(this).data("avatar");
            console.log(userEmail, userAvatar);
            inviteUser(userEmail, this, userAvatar);
          });
        }
      },
      error: function (xhr, status, error) {
        console.error("Send error:", xhr.responseText);
      },
    });
  }, 2000);
}
function removeUser(email) {
  invitedUsers = invitedUsers.filter((userEmail) => userEmail != email);
  const listOfUsersDiv = document.querySelectorAll("#listOfUsers div");
  listOfUsersDiv.forEach((user) => {
    if (user.getAttribute("data-id") === email) {
      user.remove();
      const listItem = document.getElementById(`input${email}`);
      if (listItem) {
        listItem.checked = false;
      }
    }
  });
}
function inviteUser(email, checkbox, avatar) {
  const listOfUsersDiv = document.querySelectorAll("#listOfUsers div");

  const listOfUsers = $("#listOfUsers");

  if (checkbox.checked) {
    const newUserInvited = $(`
            <div data-id="${email}" class="invited-user col rounded-pill border border-secondary d-flex align-items-center p-0">
                <div class="text-start user-invited-content">
                    <img src="${
                      avatar ? avatar : "/images/GoLogoNBg.png"
                    }" alt="" class="user-invited-avatar rounded-circle">
                    <span>${email}</span>
                </div>
                <i class="bi bi-x text-dark delete-invite-user" data-email='${email}'"></i>
            </div>
        `);
    const input = $("#input-invite");
    input.before(newUserInvited);
    invitedUsers.push(email);

    $(".delete-invite-user").on("click", function () {
      const userEmail = $(this).data("email");
      console.log(userEmail);
      removeUser(userEmail);
    });

    //listOfUsers.insertBefore(input, newUserInvited[0]);
  } else {
    invitedUsers = invitedUsers.filter((userEmail) => userEmail != email);
    listOfUsersDiv.forEach((user) => {
      if (user.getAttribute("data-id") === email) {
        user.remove();
      }
    });
  }
}
function showRecordingUsers(recordingUsers) {
  if (recordingUsers.length > 0) {
    let users = "";
    const specialUserIndex = recordingUsers.findIndex(
      (user) => user.userId === id
    );
    if (specialUserIndex !== -1) {
      const [specialUser] = recordingUsers.splice(specialUserIndex, 1);
      specialUser.name = "You";
      recordingUsers.unshift(specialUser);
    }
    if (recordingUsers.length > 5) {
      const firstFiveUsers = recordingUsers.slice(0, 5);
      users =
        firstFiveUsers.map((user) => user.name).join(", ") +
        ` and ${recordingUsers.length - 5} other users`;
    } else {
      users = recordingUsers.map((user) => user.name).join(", ");
    }
    $("#recording-users").text(users.trim().replace(/,\s*$/, ""));
    $("#recordings-container").removeClass("d-sm-none");
    $("#recordings-container").addClass("d-sm-inline");
  } else {
    $("#recordings-container").removeClass("d-sm-inline");
    $("#recordings-container").addClass("d-sm-none");
  }
}

let timeOutAnimation;

let frameCount = 0;

let isVideoMetaLoaded = false;

async function setupWebRTCAndCanvas() {
  const video = document.getElementById("localVideo");
  const canvas = document.getElementById("outputCanvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  // Create canvas for background and video
  const backgroundCanvas = document.createElement("canvas");
  const backgroundCtx = backgroundCanvas.getContext("2d", {
    willReadFrequently: true,
  });
  const videoCanvas = document.createElement("canvas");
  const videoCtx = videoCanvas.getContext("2d", { willReadFrequently: true });
  const blurCanvas = document.createElement("canvas");
  const blurCtx = blurCanvas.getContext("2d", { willReadFrequently: true });

  // Load the BodyPix model
  const net = await bodyPix.load({
    architecture: "MobileNetV1",
    outputStride: 16,
    multiplier: 0.5,
  });

  // Set canvas sizes
  video.onloadedmetadata = () => {
    setCanvasSize();

    renderFrame();
    isVideoMetaLoaded = true;
  };
  const setCanvasSize = () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    backgroundCanvas.width = video.videoWidth;
    backgroundCanvas.height = video.videoHeight;
    videoCanvas.width = video.videoWidth;
    videoCanvas.height = video.videoHeight;
    blurCanvas.width = video.videoWidth;
    blurCanvas.height = video.videoHeight;
    console.log(
      "set width and height to " + video.videoWidth + ", " + video.videoHeight
    );
  };

  // Get video stream from WebRTC
  // const stream = await navigator.mediaDevices.getUserMedia({
  //   video: true,
  // });
  // video.srcObject = stream;

  //setCanvasSize();
  //window.onresize = setCanvasSize;

  // Load background image
  const backgroundImage = new Image();

  async function renderFrame() {
    try {
      const selectedRadio = document.querySelector(
        `input[name="mode"]:checked`
      );
      const video = document.getElementById("localVideo");
      if (!video.srcObject.getVideoTracks()[0]) {
        clearTimeout(timeOutAnimation);
        renderFrame();
        return;
      }
      video.play();

      if (frameCount % 1 === 0) {
        const segmentation = await net.segmentPerson(video);

        if (selectedRadio.value == "defaultMode") {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        } else if (selectedRadio.value == "blurMode") {
          videoCtx.drawImage(video, 0, 0, canvas.width, canvas.height);

          blurCtx.filter = "blur(3px)";
          blurCtx.drawImage(videoCanvas, 0, 0);
          const blurredImageData = blurCtx.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
          );
          const videoImageData = videoCtx.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
          );
          const blurredPixels = blurredImageData.data;
          const videoPixels = videoImageData.data;

          const resultImageData = ctx.createImageData(
            canvas.width,
            canvas.height
          );
          const resultPixels = resultImageData.data;

          for (let i = 0; i < videoPixels.length; i += 4) {
            const isPerson = segmentation.data[i / 4] === 1;
            const alpha = isPerson ? 0.9 : 0.3;

            resultPixels[i] = isPerson
              ? videoPixels[i] * alpha + blurredPixels[i] * (1 - alpha)
              : blurredPixels[i];
            resultPixels[i + 1] = isPerson
              ? videoPixels[i + 1] * alpha + blurredPixels[i + 1] * (1 - alpha)
              : blurredPixels[i + 1];
            resultPixels[i + 2] = isPerson
              ? videoPixels[i + 2] * alpha + blurredPixels[i + 2] * (1 - alpha)
              : blurredPixels[i + 2];
            resultPixels[i + 3] = 255;
          }
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.putImageData(resultImageData, 0, 0);
        } else {
          const value = selectedRadio.value;
          const isBase64 = value.startsWith("data:image/");
          if (
            backgroundImage.src.split("/")[
              backgroundImage.src.split("/").length - 1
            ] != selectedRadio.value
          ) {
            if (isBase64) {
              backgroundImage.src = value;
            } else {
              backgroundImage.src = `../images/bg/${value}`;
            }
          }

          backgroundCtx.drawImage(
            backgroundImage,
            0,
            0,
            canvas.width,
            canvas.height
          );
          blurCtx.filter = "blur(10px)";
          blurCtx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

          const blurImageData = blurCtx.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
          );
          const blurredPixels = blurImageData.data;

          // Draw the video frame on the video canvas

          videoCtx.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Get image data from video canvas
          const videoImageData = videoCtx.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
          );
          const videoPixels = videoImageData.data;

          // Get image data from background canvas
          const backgroundImageData = backgroundCtx.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
          );
          const backgroundPixels = backgroundImageData.data;

          // Create a new ImageData object for the result
          const resultImageData = ctx.createImageData(
            canvas.width,
            canvas.height
          );
          const resultPixels = resultImageData.data;

          for (let i = 0; i < videoPixels.length; i += 4) {
            const currentIndex = i / 4;

            const rightNeighbor = currentIndex + 1;
            const bottomNeighbor = currentIndex + canvas.width;

            const isEdge =
              segmentation.data[currentIndex] !==
                segmentation.data[rightNeighbor] ||
              segmentation.data[currentIndex] !==
                segmentation.data[bottomNeighbor];

            if (segmentation.data[i / 4] === 0) {
              resultPixels[i] = backgroundPixels[i];
              resultPixels[i + 1] = backgroundPixels[i + 1];
              resultPixels[i + 2] = backgroundPixels[i + 2];
              resultPixels[i + 3] = backgroundPixels[i + 3];
            } else {
              // Use the video frame data for the person
              resultPixels[i] = videoPixels[i];
              resultPixels[i + 1] = videoPixels[i + 1];
              resultPixels[i + 2] = videoPixels[i + 2];
              resultPixels[i + 3] = videoPixels[i + 3];
            }
          }

          // Clear the canvas and draw the combined result
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.putImageData(resultImageData, 0, 0);
        }
        frameCount++;
        if (timeOutAnimation) {
          clearTimeout(timeOutAnimation);
        }
        timeOutAnimation = setTimeout(renderFrame, 100 / 60);
      }
    } catch (error) {
      console.log(error);
      clearTimeout(timeOutAnimation);
      //renderFrame();
    }
  }

  if (isVideoMetaLoaded != true) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    backgroundCanvas.width = video.videoWidth;
    backgroundCanvas.height = video.videoHeight;
    videoCanvas.width = video.videoWidth;
    videoCanvas.height = video.videoHeight;
    blurCanvas.width = video.videoWidth;
    blurCanvas.height = video.videoHeight;
    renderFrame();
  }

  const streamFromCanvas = canvas.captureStream();
  if (!streamFromCanvas || !streamFromCanvas.getVideoTracks().length) {
    console.error("Failed to capture stream from canvas.");
    return;
  }
  const videoTracks = streamFromCanvas.getVideoTracks();
  if (videoTracks.length > 0) {
    const videoTrack = streamFromCanvas.getVideoTracks()[0];

    if (videoProducer) {
      try {
        await videoProducer.replaceTrack({
          track: videoTrack,
        });
      } catch (error) {
        console.log("Error when trying to replace video track: " + error);
      }
      console.log("Replace track successfully");
    }
  } else {
    console.error("No video tracks found in stream.");
  }
}

let offlineStartTime = null;
const RECONNECT_DELAY = 7000;

window.addEventListener("online", function () {
  console.log("Đã kết nối lại mạng.");
  $(".reconnecting-layout").addClass("d-none");

  if (offlineStartTime && Date.now() - offlineStartTime > RECONNECT_DELAY) {
    console.log("Mất kết nối lâu hơn 7 giây. Khởi động lại cuộc gọi...");
    startCall();
    isReconnect = true;

    consumerTransports = {};
    consumers = {};
  }
  offlineStartTime = null;
});

window.addEventListener("offline", function () {
  console.log("Mất kết nối mạng.");
  $(".reconnecting-layout").removeClass("d-none");
  console.log("Reconnecting...");

  offlineStartTime = Date.now();
});
