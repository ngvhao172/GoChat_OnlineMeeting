const webSocket = require('ws');

let rooms = {};
const createWebRtcTransport = async (router) => {
  const transportOptions = {
    listenIps: [{ ip: '0.0.0.0', announcedIp: '127.0.0.1' }],
    // listenIps: [{ ip: '0.0.0.0', announcedIp: 'videochatapp.online' }],
    enableUdp: true,
    enableTcp: true,
    preferUdp: true
  };
  return await router.createWebRtcTransport(transportOptions);
};

module.exports = async (httpServer, router) => {

  const wss = new webSocket.Server({ server: httpServer }, () => {
    console.log(`Websocket server is started up: ${wss.address} `);
  });
  wss.on('connection', ws => {
    ws.on('message', async message => {
      const data = JSON.parse(message);
      // const data = JSON.parse(message);
      console.log("Data send to ws", data);
      const { roomId, userId } = data;

      switch (data.action) {
        case 'create':
          {
            if(!rooms[roomId]){
              // lắng nghe âm thanh
              // const audioLevelObserver = await router.createAudioLevelObserver({
              //   maxEntries: 5,//tối đa 5 người được theo dõi 
              //   threshold: -80, 
              //   interval: 800 
              // });
              rooms[data.roomId] = {
                users: {},
                producers: {},
                consumers: {},
                ownerCreatedId: userId,
                settings: {
                  'private': false
                },
                approvedUsers: [userId],
                requestingUsers: [],
                requestingUsersWs: {}
                // audioLevelObserver: audioLevelObserver
              };

              ws.send(JSON.stringify({
                action: 'created',
                status: true,
                roomId: data.roomId,
                message: "Room created"
              }))
            }
            else{
              ws.send(JSON.stringify({
                action: 'created',
                status: false,
                roomId: data.roomId,
                message: "Room already exists"
              }))
            }
          }
          break;
        case 'join':
          {
            if (!rooms[data.roomId]) {
              // rooms[data.roomId] = {
              //   users: {},
              //   producers: {},
              //   consumers: {}
              // };
              ws.send(JSON.stringify({
                action: 'join',
                status: false,
                roomId: data.roomId,
                message: "Room not found"
              }))
              break;
            }
            if(rooms[data.roomId].settings["private"] == false){
              if(!rooms[data.roomId].approvedUsers.includes(data.userId)){
                rooms[data.roomId].approvedUsers.push(data.userId);
              }
            }
            if(rooms[data.roomId].approvedUsers.includes(data.userId)){
              rooms[data.roomId].users[data.userId] = { id: data.userId, ws, name: data.name, producerTransport: null, consumerTransports: {} };
              rooms[data.roomId].consumers[data.userId] = {};

              // console.log("Room", rooms[data.roomId]);

              let users = [];
              let usersObject = Object.values(rooms[data.roomId].users);
              usersObject.forEach(user => {
                users.push({ id: user.id, name: user.name });
              });
              sendBroadcast(data.roomId, { action: 'user-list', room: data.roomId, users: users, ownerId: rooms[data.roomId].ownerCreatedId, newUser: { name: data.name, id: data.userId } });
            }
            else{
              //xin request
              // rooms[roomId].requestingUsers.push(data.userId);
              // const ownerWS = rooms[roomId].users[rooms[data.roomId].ownerId].ws;
              // ownerWS.send(JSON.stringify({
              //   action: 'newRequest',
              //   newUser: { name: data.name, id: data.userId },
              //   requestingUsers:  rooms[roomId].requestingUsers
              // }
              // ));
              // ws.send(JSON.stringify({
              //   action: 'waitingApproved'
              // }
              // ))
              //USER NOT APPROVED
              ws.send(JSON.stringify({
                action: 'requestResponse',
                isApproved: false
              }));
            }
          }
          break;
        case 'settingsUpdate':
          {
            const { private, roomId, userId } = data;
            if(userId == rooms[roomId].ownerCreatedId){
              rooms[roomId].settings["private"] = private;
            }
          }
          break;
        case 'requestJoin':
          {
            if(rooms[data.roomId].approvedUsers.includes(data.userId) || rooms[data.roomId].settings["private"] == false){
              ws.send(JSON.stringify({
                action: 'requestResponse',
                isApproved: true
            }));
            }else{
              const exists = rooms[roomId].requestingUsers.some(user => user.id === data.userId);
              if(!exists){
                rooms[roomId].requestingUsers.push({ name: data.name, id: data.userId });
              }
              rooms[roomId].requestingUsersWs[data.userId] = ws;
              console.log(rooms[roomId]);
              try{
                const ownerWS = rooms[roomId].users[rooms[data.roomId].ownerCreatedId]["ws"];
                  ownerWS.send(JSON.stringify({
                    action: 'newRequest',
                    newUser: { name: data.name, id: data.userId },
                    requestingUsers:  rooms[roomId].requestingUsers
                  }
                ));
              }catch(e){
                console.log(e);
              }
            }
            break;
          }
        case 'acceptRequest':
          {
            const {roomId, requestorId} = data;
            if(!rooms[roomId].approvedUsers.includes(requestorId)){
              rooms[roomId].approvedUsers.push(requestorId);
              //xoa khoi requesting list
              //
              // const index = rooms[roomId].requestingUsers.indexOf(requestorId);
              // if (index !== -1) {
              //     list.splice(index, 1);
              // }
              const updatedRequestingUsers = rooms[roomId].requestingUsers.filter(user => user.id !== requestorId);
              rooms[roomId].requestingUsers = updatedRequestingUsers;
              console.log("REQUESTINGUSER:", rooms[roomId].requestingUsersWs);
              const requestorWs = rooms[roomId].requestingUsersWs[requestorId];

              if(requestorWs){
                requestorWs.send(JSON.stringify({
                  action: 'requestResponse',
                  isApproved: true
                }));

                delete rooms[roomId].requestingUsersWs[requestorId];
              }
            }
          }
          break;
        case 'declineRequest':
          {
            const {roomId, requestorId} = data;
            if(!rooms[roomId].approvedUsers.includes(requestorId)){
              //xoa khoi requesting list
              //
              // const index = rooms[roomId].requestingUsers.indexOf(requestorId);
              // if (index !== -1) {
              //     list.splice(index, 1);
              // }
              const updatedRequestingUsers = rooms[roomId].requestingUsers.filter(user => user.id !== requestorId);
              rooms[roomId].requestingUsers = updatedRequestingUsers;
              const requestorWs = rooms[roomId].requestingUsersWs[requestorId];
              if(requestorWs){
                requestorWs.send(JSON.stringify({
                  action: 'requestResponse',
                  isApproved: false
                }));

                //delete rooms[roomId].requestingUsersWs[requestorId];

                console.log("REQUESTINGUSER:", rooms[roomId].requestingUsersWs);
              }
            }
            break;
          }
        case 'getRtpCapabilities':
          {
            const rtpCapabilities = router.rtpCapabilities
            ws.send(JSON.stringify({
              action: 'getRtpCapabilities',
              rtpCapabilities: rtpCapabilities,
              userId: data.userId,
              roomId: data.roomId
            }
            ));
          }
          break;
        case 'producerNotProvided':
          {
            const {roomId, userId, kind, name} = data;
            console.log("ROOMSSSSSS");
            console.log(rooms[roomId].users)
            for (let id in rooms[roomId].users) {
              if (id !== userId) {
                console.log("PRODUCER MOI NE");
                rooms[roomId].users[id].ws.send(JSON.stringify({
                  action: 'producerNotProvided',
                  kind: kind,
                  producerUserId: userId,
                  name: name,
                  producerStatus: "off"
                }));
              }
            }
            break;
          }
        case 'createProducerTransport':
          {
            const transport = await createWebRtcTransport(router);
            console.log(rooms[roomId]);
            rooms[roomId].users[userId].producerTransport = transport;

            ws.send(JSON.stringify({
              action: 'producerTransportCreated',
              id: transport.id,
              iceParameters: transport.iceParameters,
              iceCandidates: transport.iceCandidates,
              dtlsParameters: transport.dtlsParameters,
              userId: userId
            }));


            let users = [];
              let usersObject = Object.values(rooms[data.roomId].users);
              usersObject.forEach(user => {
                users.push({ id: user.id, name: user.name });
              });
              console.log(users);
              //Create consumers for the new user for all existing producers
              
              users.forEach(async user => {
                if (user.id != userId) {
                  console.log("USERID:", user.id);
                  let producer = rooms[roomId].producers[user.id];
                  // console.log("PRODUCERS:", producer)
                  if(producer){
                    if (!rooms[roomId].consumers[userId][producer.id]) {
                      //tao consumer transport//
                      let transport;
                      if(rooms[roomId].users[userId].consumerTransports[user.id]){
                        transport = rooms[roomId].users[userId].consumerTransports[user.id]
                      }
                      else{
                        transport = await createWebRtcTransport(router);
                        rooms[roomId].users[userId].consumerTransports[user.id] = transport
                      }
                      // gui ve client tao consumer transport thanh cong
                      if(producer["video"]){
                        ws.send(JSON.stringify({
                          action: 'consumerTransportCreated',
                          id: transport.id,
                          iceParameters: transport.iceParameters,
                          iceCandidates: transport.iceCandidates,
                          dtlsParameters: transport.dtlsParameters,
                          producerId: producer["video"].id,
                          producerUserId: user.id,
                          producerStatus: producer["video"].status
                        }));
                      }
                      else{
                        ws.send(JSON.stringify({
                          action: 'producerNotProvided',
                          kind: "video",
                          producerUserId: user.id,
                          name: user.name,
                          producerStatus: "off"
                        }));
                      }
                      // console.log(producer["video"].status);//
                      if(producer["audio"]){
                        console.log("AUDIO PRODUCER ON SERVER SIDE: ", producer["audio"].id)
                        ws.send(JSON.stringify({
                          action: 'consumerTransportCreated',
                          id: transport.id,
                          iceParameters: transport.iceParameters,
                          iceCandidates: transport.iceCandidates,
                          dtlsParameters: transport.dtlsParameters,
                          producerId: producer["audio"].id,
                          producerUserId: user.id,
                          producerStatus: producer["audio"].status
                        }));
                      }
                      else{
                        ws.send(JSON.stringify({
                          action: 'producerNotProvided',
                          kind: "audio",
                          producerUserId: user.id,
                          name: user.name,
                          producerStatus: "off"
                        }));
                      }
                      if(producer["sharing"]){
                        ws.send(JSON.stringify({
                          action: 'consumerTransportCreated',
                          id: transport.id,
                          iceParameters: transport.iceParameters,
                          iceCandidates: transport.iceCandidates,
                          dtlsParameters: transport.dtlsParameters,
                          producerId: producer["sharing"].id,
                          producerUserId: user.id,
                          producerStatus: producer["sharing"].status,
                        }));
                      } 
                  }
                    // console.log(producer["audio"].id)
                    // console.log(producer["video"].id)

                    // ws.send(JSON.stringify({action: 'newConsumer', producerId: producer.id}));
                  }
                  else{
                    ws.send(JSON.stringify({
                      action: 'producerNotProvided',
                      kind: "video",
                      producerUserId: user.id,
                      name: user.name,
                      producerStatus: "off"
                    }));
                    ws.send(JSON.stringify({
                      action: 'producerNotProvided',
                      kind: "audio",
                      producerUserId: user.id,
                      name: user.name,
                      producerStatus: "off"
                    }));
                    
                  }
                }
              });
          }
          break;

        case 'connectProducerTransport':
          {
            const { dtlsParameters } = data;
            const transport = rooms[roomId].users[userId].producerTransport;
            if (transport.dtlsState === 'connected') {
              console.log("transport already connected")
            }
            else {
              await rooms[roomId].users[userId].producerTransport.connect({ dtlsParameters }).then(() => {
                console.log('Producer transport connected');
              }).catch(error => {
                console.error('Error connecting consumer transport:', error);
              });;
            }
            ws.send(JSON.stringify({ action: 'producerTransportConnected' }));
          }
          break;

        case 'produce':
          {
            // console.log(rooms[roomId]);
            const { kind, rtpParameters, appData, allProduce, isSharing } = data;
            const transport = rooms[roomId].users[userId].producerTransport;
            const producer = await transport.produce({ kind, rtpParameters });
            if (!rooms[roomId].producers[userId]) {
              rooms[roomId].producers[userId] = {};
            }
            if(isSharing == true){
              rooms[roomId].producers[userId]["sharing"] = producer;
            }
            else{
              rooms[roomId].producers[userId][kind] = producer;
            }
            console.log("ROOM after produce", rooms[roomId]);


            ws.send(JSON.stringify({ action: 'produced', id: producer.id, kind: kind }));
            // thêm vào audio observer
            // if(kind == 'audio'){
            //   rooms[roomId].audioLevelObserver.addProducer({ producerId: producer.id });
            // } 


            for (let id in rooms[roomId].users) {
              if (id !== userId) {
                console.log("PRODUCER MOI NE");
                rooms[roomId].users[id].ws.send(JSON.stringify({
                  action: 'newProducer',
                  producerId: producer.id,
                  roomId: roomId,
                  kind: producer.kind,
                  producerUserId: userId,
                  isSharing: isSharing
                }));
              }
            }
            console.log("ALL PRODUCE:", allProduce);
            // khi ca audio va video dc gui thanh cong -> moi tien hanh tao cac consumer transport -> gui toi client moi join
            if (allProduce) {
              
            };
          }
          break;

        case 'createConsumerTransport':
          {
            const { producerId, producerUserId } = data;
            let transport;
            if (rooms[roomId].users[userId].consumerTransports[producerUserId]) {
              transport = rooms[roomId].users[userId].consumerTransports[producerUserId];
            }
            else {
              transport = await createWebRtcTransport(router);
              rooms[roomId].users[userId].consumerTransports[producerUserId] = transport;
            }
            // console.log("ROOM after createConsumerTransport", rooms[roomId]);

            ws.send(JSON.stringify({
              action: 'consumerTransportCreated',
              id: transport.id,
              iceParameters: transport.iceParameters,
              iceCandidates: transport.iceCandidates,
              dtlsParameters: transport.dtlsParameters,
              producerId: producerId,
              producerUserId: producerUserId,
            }));
          }
          break;

        case 'connectConsumerTransport':
          {
            const { dtlsParameters, producerId, producerUserId } = data;
            const transport = rooms[roomId].users[userId].consumerTransports[producerUserId];
            // console.log("transport.dtlsState: ", transport.dtlsState)
            if (transport.dtlsState === 'new') {
              await rooms[roomId].users[userId].consumerTransports[producerUserId].connect({ dtlsParameters }).then(() => {
                console.log('Consumer transport connected');
              }).catch(error => {
                console.error('Error connecting consumer transport:', error);
              });
            }
            else {
              // await rooms[roomId].users[userId].consumerTransports[producerUserId].connect({ dtlsParameters }).then(() => {
              //   console.log('Consumer transport connected');
              // }).catch(error => {
              //   console.error('Error connecting consumer transport:', error);
              // });
              console.error('consumer transport is already connected');
            }
            ws.send(JSON.stringify({ action: 'consumerTransportConnected', producerId }));
          }
          break;

        case 'consume':
          {
            const { producerUserId, producerId, rtpCapabilities, producerStatus } = data;
            if (router.canConsume({ producerId, rtpCapabilities })) {
              console.log(rooms[roomId])
              console.log(userId, producerUserId)
              const transport = rooms[roomId].users[userId].consumerTransports[producerUserId];
              const consumer = await transport.consume({ producerId, rtpCapabilities, paused: true });
              rooms[roomId].consumers[userId][producerId] = consumer;
              const name = rooms[roomId].users[producerUserId].name;

              // console.log("ROOM AFTER CONSUMER:", rooms[roomId]);
              const isSharingProducer = rooms[roomId].producers[producerUserId]["sharing"];
              console.log(producerUserId)
              console.log(isSharingProducer)
              if(isSharingProducer !=null && isSharingProducer.id == producerId){
                ws.send(JSON.stringify({
                  action: 'consumed',
                  id: consumer.id,
                  producerId,
                  kind: consumer.kind,
                  rtpParameters: consumer.rtpParameters,
                  producerUserId: producerUserId,
                  name: name,
                  producerStatus: producerStatus,
                  isSharing: true,
                  roomId: roomId
                }));
              }
              else{
                console.log("AUDIO CONSUMER ON SERVER SIDE: ", producerId)
                ws.send(JSON.stringify({
                  action: 'consumed',
                  id: consumer.id,
                  producerId,
                  kind: consumer.kind,
                  rtpParameters: consumer.rtpParameters,
                  producerUserId: producerUserId,
                  name: name,
                  producerStatus: producerStatus,
                  roomId: roomId
                }));
              }
            }
            else {
              ws.send(JSON.stringify({
                action: 'consumed',
                message: 'cant consume'
              }));
            }
          }
          break;
        case 'consumer-resume':
          {
            console.log(rooms[roomId]);

            let consumer = rooms[roomId].consumers[userId][data.id]
            console.log("Consumer for resume:", consumer.id)
            // console.log(consumer);
            if (consumer) {
              await consumer.resume()
            }
          }
          break;
        case 'message':
          {
            // console.log(rooms[roomId]);
            const sendUser = rooms[roomId].users[data.userId];
            data.from = sendUser.name;
            sendBroadcast(data.roomId, data, data.userId);
          }
          break;
        case 'onCamera':
          {
            // const { producerUserId, roomId } = data;
            // const videoProducer = rooms[roomId].producers[producerUserId]["video"];
            // videoProducer.resume();
            // console.log("Camera ON");
            const { producerUserId, roomId } = data;
            let producer = rooms[roomId].producers[producerUserId]["video"];
            producer.status = "on";
            sendBroadcast(roomId, data, producerUserId)
          }
          break;
        case 'offCamera':
          {
            const { producerUserId, roomId } = data;
            let producer = rooms[roomId].producers[producerUserId]["video"];
            producer.status = "off";
            sendBroadcast(roomId, data, producerUserId)
            // const videoProducer = rooms[roomId].producers[producerUserId]["video"];
            // videoProducer.pause();
            // console.log("Camera OFF");
          }
          break;
        case 'muted':
          {
            const { producerUserId, roomId } = data;
            let producer = rooms[roomId].producers[producerUserId]["audio"];
            producer.status = "off";
            // handleProducerStop(roomId, producer, producerUserId);
            sendBroadcast(roomId, data, producerUserId)
            // const { producerUserId, roomId } = data;
            // const audioProducer = rooms[roomId].producers[producerUserId]["audio"];
            // audioProducer.pause();
          }
          break;
        case 'unmuted':
          {
            const { producerUserId, roomId } = data;
            let producer = rooms[roomId].producers[producerUserId]["audio"];
            producer.status = "on";
            sendBroadcast(roomId, data, producerUserId)
            // handleProducerStop(roomId, producer, producerUserId);
            // handleProducerStart(roomId, producer, producerUserId);
            // const { producerUserId, roomId } = data;
            // const audioProducer = rooms[roomId].producers[producerUserId]["audio"];
            // audioProducer.resume();
          }
          break;
        // case 'sharing':
        //   {
        //     const { producerUserId, roomId } = data;
        //     let producer = rooms[roomId].producers[producerUserId]["audio"];
        //     producer.status = "on";
        //     sendBroadcast(roomId, data, producerUserId)
        //     // const { producerUserId, roomId } = data;
        //     // const audioProducer = rooms[roomId].producers[producerUserId]["audio"];
        //     // audioProducer.resume();
        //   }
        //   break;
        case 'stopSharing':
          {
            const {producerUserId, roomId} = data;
            let sharingProducer = rooms[roomId].producers[producerUserId]["sharing"];
            if(sharingProducer){
              delete rooms[roomId].producers[producerUserId]["sharing"];
              const room = rooms[roomId];
              for (let userId in room.users) {
                delete room.consumers[userId][sharingProducer.id];
                delete room.consumers[userId][sharingProducer.id];
              }
            }
            sendBroadcast(roomId, data, producerUserId)
            break;
          }
        case 'check-room-existed':
          {
            // console.log(data);
            if(roomId == "favicon.ico"){
              break;
            }
            console.log(rooms);
            if (!rooms[roomId]) {
              ws.send(JSON.stringify({ action: 'checked-result', roomId: roomId, exists: false,}));
            }
            else {
              let isApproved = rooms[roomId].approvedUsers.includes(data.userId);
              let isPrivateRoom = rooms[roomId].settings["private"];
              if(isPrivateRoom == false){
                isApproved = true;
              }
              console.log(rooms[roomId].users.size);
              ws.send(JSON.stringify({ action: 'checked-result', roomId: roomId, exists: true, 
                usersNumber: Object.keys(rooms[roomId].users).length, ownerId: rooms[roomId].ownerCreatedId, isApproved: isApproved}))
            }
          }
          break;
        default:
          ws.send(JSON.stringify({ action: 'error', message: 'Unknown message action' }));
      }
    });

    ws.on('close', () => {
      for (let roomId in rooms) {
        const room = rooms[roomId];
        for (let userId in room.users) {
          if (room.users[userId].ws === ws) {
            // đóng producer transport
            if (room.users[userId].producerTransport) {
              room.users[userId].producerTransport.close();
            }

            // đóng all consumer transports
            for (let producerId in room.users[userId].consumerTransports) {
              room.users[userId].consumerTransports[producerId].close();
            }
            // xóa all consumers trong các comsumers của các người khác
            let producerVideoId;
            let producerAudioId;
            let producerSharingId;
            // try {
            //   producerVideoId = room.producers[userId]['video'].id;
            //   producerAudioId = room.producers[userId]['audio'].id;
            // } catch (error) {
            //   console.log(error);
            // }
            if(room.producers[userId]){
              if(room.producers[userId]['video']){
                producerVideoId = room.producers[userId]['video'].id;
              }
              if(room.producers[userId]['audio']){
                producerAudioId = room.producers[userId]['audio'].id;
              }
  
              if(room.producers[userId]['sharing']){
                producerSharingId = room.producers[userId]['sharing'].id;
              }
            }
            console.log(producerVideoId, producerAudioId)
            if (producerVideoId) {
              // xoa khoi audio observer
              // handleProducerStop(roomId, room.producers[userId]["audio"], userId);
              for (let id in room.users) {
                delete room.consumers[id][producerAudioId];
                // console.log("PRODUCER SHARING: ", room.producers[userId]['sharing'].id);
                // console.log(producerSharingId)
              }
            }
            if(producerAudioId){
              for (let id in room.users) {
                delete room.consumers[id][producerAudioId];
                // console.log("PRODUCER SHARING: ", room.producers[userId]['sharing'].id);
                // console.log(producerSharingId)
              }
            }
            if(producerSharingId){
              sendBroadcast(roomId, {action: "stopSharing", producerUserId: userId, roomId: roomId, username: room.users[userId].name});
              for(let id in room.users){
                if(room.producers[userId]['sharing']!=null){
                  delete room.consumers[userId][producerSharingId];
                }
              }
            }

            // xoa room neu empty
            // if (Object.keys(room.users).length === 0) {
            //   delete rooms[roomId];
            // }
            let users = [];
            let usersObject = Object.values(rooms[roomId].users);
            usersObject.forEach(user => {
              if (user.id != userId) {
                users.push({ id: user.id, name: user.name })
              }
            });

            sendBroadcast(roomId, {
              action: 'leave',
              room: roomId,
              users: users,
              // ownerId: rooms[roomId].ownerId,
              userLeftId: userId,
              username: room.users[userId].name
            });

            // xoa user from room
            delete room.users[userId];
            delete room.consumers[userId];
            delete room.producers[userId];

            break;
          }
        }
        console.log(room)
      }
    });
  });
  wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
  });

  return wss;

  function sendBroadcast(roomId, data, skipClient) {
    //   console.log("DATA WS SEND TO CLIENT:", data);
    //   console.log("ALL ROOM:", rooms)
    //   console.log("ROOMID", roomId)
    //   console.log("ROOM WITH ID", rooms[roomId])
    const room = rooms[roomId];
    // console.log(room);
    if (!room) return;


    const message = JSON.stringify(data);

    //   console.log("ROOM ON SEND BROADCAST:", room);
    // console.log("SEND BROADCAST MESSAGE:", message);

    let users = [];
    let usersObject = Object.values(rooms[roomId].users);
    usersObject.forEach(user => {
      users.push({ id: user.id, ws: user.ws });
    });

    users.forEach(client => {
      // console.log(client)
      if (client.id !== skipClient) {
        // console.log(client);
        // console.log(client.ws.readyState == webSocket.OPEN);
        client.ws.send(message);
      }
    });
  }

  // function handleProducerStart(roomId, producer, userId) {
  //   if (producer.kind === 'audio') {
  //     rooms[roomId].audioLevelObserver.addProducer({ producerId: producer.id, userId: userId });
  //   }
  // }

  // function handleProducerStop(roomId, producer, userId) {
  //   if (producer.kind === 'audio') {
  //     rooms[roomId].audioLevelObserver.removeProducer({ producerId: producer.id, userId: userId });
  //   }
  // }
};




