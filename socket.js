const webSocket = require('ws');

let rooms = {};
const createWebRtcTransport = async (router) => {
    const transportOptions = {
      listenIps: [{ ip: '0.0.0.0', announcedIp: '127.0.0.1' }],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        // {
        //   urls: "stun:stun.relay.metered.ca:80",
        // },
        // {
        //     urls: "turn:global.relay.metered.ca:80",
        //     username: "ad5b1b255ff7868080c67d5a",
        //     credential: "pq8cUtoQPWmQ2u69",
        // },
        // {
        //     urls: "turn:global.relay.metered.ca:80?transport=tcp",
        //     username: "ad5b1b255ff7868080c67d5a",
        //     credential: "pq8cUtoQPWmQ2u69",
        // },
        // {
        //     urls: "turn:global.relay.metered.ca:443",
        //     username: "ad5b1b255ff7868080c67d5a",
        //     credential: "pq8cUtoQPWmQ2u69",
        // },
        // {
        //     urls: "turns:global.relay.metered.ca:443?transport=tcp",
        //     username: "ad5b1b255ff7868080c67d5a",
        //     credential: "pq8cUtoQPWmQ2u69",
        // },
      ],
    };
    return await router.createWebRtcTransport(transportOptions);
  };

module.exports = (httpServer, router) => {
    const wss = new webSocket.Server({ server: httpServer }, () => {
        console.log(`Websocket server is started up: ${wss.address} `);
    });

    // server.on('connection', (ws) => {
    //     ws.on('message', (message) => {
    //         const data = JSON.parse(message);

    //         console.log("DATA SEND TO WS", data);
    //         switch (data.type) {
    //             case 'join':
    //                 if (!rooms[data.roomId]) {
    //                     rooms[data.roomId] = {};
    //                     rooms[data.roomId].users = [];
    //                     rooms[data.roomId].ownerId = data.userId;
    //                 }
    //                 rooms[data.roomId].users.push({ id: data.userId, ws: ws, name: data.name });
    //                 console.log("SEND USER LIST BROAD CAST");
    //                 sendBroadcast(data.roomId, { type: 'user-list', room: data.roomId, users: rooms[data.roomId].users.map(user => ({ id: user.id, name: user.name })), ownerId: rooms[data.roomId].ownerId, newUser: { name: data.name, id: data.userId } });
    //                 break;
    //             case 'offer':
    //                 // console.log("DATA:" + data);
    //                 // console.log("ROOM:" + rooms[data.room]);
    //                 const targetClient = rooms[data.roomId].users.find(c => c.id === data.userId);
    //                 // console.log("OFFER CLIENT:");
    //                 // console.log(targetClient);
    //                 if (targetClient && targetClient.ws.readyState === webSocket.OPEN) {
    //                     // console.log("DATA OFFER:" + JSON.stringify(data));
    //                     // targetClient.ws.send(JSON.stringify(data));
    //                     sendBroadcast(data.roomId, data, data.userId)
    //                 }
    //                 break;
    //             case 'answer':
    //                 const offerSender = rooms[data.roomId].users.find(c => c.id === data.userId);
    //                 // console.log("ANSWER CLIENT:");
    //                 // console.log(offerSender);
    //                 if (offerSender && offerSender.ws.readyState === webSocket.OPEN) {
    //                     // offerSender.ws.send(JSON.stringify(data));
    //                     sendBroadcast(data.roomId, data, data.userId)
    //                 }
    //                 break;

    //             case 'candidate':
    //                 // console.log("VO DAY MA?")
    //                 // console.log(data);
    //                 const targetUser = rooms[data.roomId].users.find(user => user.id === data.userId);
    //                 if (targetUser && targetUser.ws.readyState === webSocket.OPEN) {
    //                     // console.log("CANDIDATE:");
    //                     // console.log(targetUser);
    //                     // targetUser.ws.send(JSON.stringify(data));
    //                     sendBroadcast(data.roomId, data, data.userId)
    //                 }
    //                 break;
    //             case 'message':
    //                 // console.log("SEND MESSAGE");
    //                 // console.log(data);
    //                 const sendUser = rooms[data.roomId].users.find(user => user.id === data.userId);
    //                 data.from = sendUser.name;
    //                 sendBroadcast(data.roomId, data, data.userId);
    //                 break;
    //             case 'onCamera':
    //                 // console.log(data);
    //                 sendBroadcast(data.roomId, data, data.userId)
    //                 break;
    //             case 'offCamera':
    //                 // console.log(data);
    //                 sendBroadcast(data.roomId, data, data.userId)
    //                 break;
    //             case 'muted':
    //                 sendBroadcast(data.roomId, data, data.userId)
    //                 break;
    //             case 'unmuted':
    //                 sendBroadcast(data.roomId, data, data.userId)
    //                 break;
    //             case 'screen-share':
    //                 // sendBroadcast(message, data.room);
    //                 break;
    //             //check if room exists
    //             case 'check':
    //                 if (!rooms["/" + data.roomId]) {
    //                     data.exists = false;
    //                     ws.send(JSON.stringify({ type: 'check', data: data }))
    //                 }
    //                 else {
    //                     data.exists = true;
    //                     ws.send(JSON.stringify({ type: 'check', data: data }))
    //                 }
    //                 break;
    //             default:
    //                 ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
    //         }
    //     });

    //     ws.on('close', () => {
    //         // console.log("CASE ON CLOSE");
    //         for (let roomId in rooms) {
    //             const userIndex = rooms[roomId].users.findIndex(user => user.ws === ws);
    //             // console.log(userIndex);
    //             if (userIndex !== -1) {
    //                 userLeft = rooms[roomId].users.filter(user => user.ws == ws);
    //                 rooms[roomId].users = rooms[roomId].users.filter(user => user.ws !== ws);

    //                 // console.log(userLeft);
    //                 sendBroadcast(roomId, {
    //                     type: 'leave',
    //                     room: roomId,
    //                     users: rooms[roomId].users.map(user => ({ id: user.id, name: user.name })),
    //                     ownerId: rooms[roomId].ownerId,
    //                     userLeftId: userLeft[0].id,
    //                     username: userLeft[0].name
    //                 });

    //                 break;
    //             }
    //         }
    //     });
    // });
    wss.on('connection', ws => {
        ws.on('message', async message => {
          const data = JSON.parse(message);
          // const data = JSON.parse(message);
          console.log("Data send to ws", data);
          const { roomId, userId } = data;
      
          switch (data.action) {
            case 'join':
              {
                if (!rooms[data.roomId]) {
                  rooms[data.roomId] = {
                    users: {},
                    producers: {},
                    consumers: {}
                  };
                }   
        
                rooms[data.roomId].users[data.userId] = { id: data.userId, ws, name: data.name, producerTransport: null, consumerTransports: {} };
                rooms[data.roomId].consumers[data.userId] = {};
        
                // console.log("Room", rooms[data.roomId]);
      
                let users = [];
                let usersObject = Object.values(rooms[data.roomId].users);
                usersObject.forEach(user => {
                  users.push({ id: user.id, name: user.name });
                });
            
        
                sendBroadcast(data.roomId, { action: 'user-list', room: data.roomId, users: users, ownerId: rooms[data.roomId].ownerId, newUser: { name: data.name, id: data.userId } });
              }
              break;
            case 'getRtpCapabilities':
              {
                const rtpCapabilities = router.rtpCapabilities
                ws.send(JSON.stringify({
                  action: 'getRtpCapabilities',
                  rtpCapabilities: rtpCapabilities
                }
                ));
              }
              break;
      
            case 'createProducerTransport':
              {
                const transport = await createWebRtcTransport(router);
                // console.log(rooms[roomId].users[userId]);
                rooms[roomId].users[userId].producerTransport = transport;
      
                ws.send(JSON.stringify({
                  action: 'producerTransportCreated',
                  id: transport.id,
                  iceParameters: transport.iceParameters,
                  iceCandidates: transport.iceCandidates,
                  dtlsParameters: transport.dtlsParameters,
                }));
              }
              break;
      
            case 'connectProducerTransport':
              {
                const { dtlsParameters } = data;
                const transport = rooms[roomId].users[userId].producerTransport;
                if(transport.dtlsState === 'connected'){
                  console.log("transport already connected")
                }
                else{
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
                console.log(rooms[roomId]);
                const { kind, rtpParameters, appData, allProduce } = data;
                const transport = rooms[roomId].users[userId].producerTransport;
                const producer = await transport.produce({ kind, rtpParameters });
                if(!rooms[roomId].producers[userId]){
                  rooms[roomId].producers[userId] = {};
                }
                rooms[roomId].producers[userId][kind] = producer;
      
                console.log("ROOM after produce", rooms[roomId]);
      
      
                ws.send(JSON.stringify({ action: 'produced', id: producer.id }));
      
      
                for (let id in rooms[roomId].users) {
                  if (id !== userId) {
                    rooms[roomId].users[id].ws.send(JSON.stringify({
                      action: 'newProducer',
                      producerId: producer.id,
                      kind: producer.kind,
                      producerUserId: userId
                    }));
                  }
                }
                console.log("ALL PRODUCE:", allProduce);
                // khi ca audio va video dc gui thanh cong -> moi tien hanh tao cac consumer transport -> gui toi client moi join
                if(allProduce){
                  let users = [];
                let usersObject = Object.values(rooms[data.roomId].users);
                usersObject.forEach(user => {
                  users.push({ id: user.id, name: user.name });
                });
                console.log(users);
                //Create consumers for the new user for all existing producers
                users.forEach(async user => {
                  if(user.id != userId){
                    // console.log("USERID:", user.id);
                    let producer = rooms[roomId].producers[user.id];
                    console.log("PRODUCERS:", producer)
                    
                    if(!rooms[roomId].consumers[userId][producer.id]){
                      //tao consumer transport//
                      const transport = await createWebRtcTransport(router);
                      rooms[roomId].users[userId].consumerTransports[user.id] = transport
                      // gui ve client tao consumer transport thanh cong
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
                      console.log(producer["video"].status);
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
      
                      // console.log(producer["audio"].id)
                      // console.log(producer["video"].id)
      
                      // ws.send(JSON.stringify({action: 'newConsumer', producerId: producer.id}));
                    }
                  }
                });
              };    
              }
              break;
      
            case 'createConsumerTransport':
              {
                const { producerId, producerUserId } = data;
                let transport;
                if(rooms[roomId].users[userId].consumerTransports[producerUserId]){
                  transport = rooms[roomId].users[userId].consumerTransports[producerUserId];
                }
                else{
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
                console.log("transport.dtlsState: ", transport.dtlsState)
                if(transport.dtlsState === 'new'){
                  await rooms[roomId].users[userId].consumerTransports[producerUserId].connect({ dtlsParameters }).then(() => {
                    console.log('Consumer transport connected');
                  }).catch(error => {
                    console.error('Error connecting consumer transport:', error);
                  });
                }
                else{
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
                  const transport = rooms[roomId].users[userId].consumerTransports[producerUserId];
                  const consumer = await transport.consume({ producerId, rtpCapabilities, paused: true });
                  rooms[roomId].consumers[userId][producerId] = consumer;
                  const name  = rooms[roomId].users[producerUserId].name;
      
                  // console.log("ROOM AFTER CONSUMER:", rooms[roomId]);
      
                  ws.send(JSON.stringify({
                    action: 'consumed',
                    id: consumer.id,
                    producerId,
                    kind: consumer.kind,
                    rtpParameters: consumer.rtpParameters,
                    producerUserId: producerUserId,
                    name: name,
                    producerStatus: producerStatus
                  }));
                }
                else{
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
                // console.log("Consumer for consume:", consumer)
                // console.log(consumer);
                if(consumer){
                  await consumer.resume()
                }
              }
              break;
              case 'message':
                {
                  console.log(rooms[roomId]);
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
                  // const { producerUserId, roomId } = data;
                  // const audioProducer = rooms[roomId].producers[producerUserId]["audio"];
                  // audioProducer.resume();
                }
                break;
          }
        });
      
        ws.on('close', () => {
          // Clean up resources when a client disconnects
          for (let roomId in rooms) {
            const room = rooms[roomId];
            for (let userId in room.users) {
              if (room.users[userId].ws === ws) {
                // Close producer transport
                if (room.users[userId].producerTransport) {
                  room.users[userId].producerTransport.close();
                }
      
                // Close all consumer transports
                for (let producerId in room.users[userId].consumerTransports) {
                  room.users[userId].consumerTransports[producerId].close();
                }
                //delete all consumers from other channels
                let producerVideoId;
                let producerAudioId;
                try {
                  producerVideoId = room.producers[userId]['video'].id;
                  producerAudioId = room.producers[userId]['audio'].id;  
                } catch (error) {
                  console.log(error);
                }
                console.log(producerVideoId, producerAudioId)
                if(producerVideoId && producerAudioId){
                  for (let userId in room.users) {
                    delete room.consumers[userId][producerVideoId];
                    delete room.consumers[userId][producerAudioId];
                  }
                }
      
                // If room is empty, remove the room
                if (Object.keys(room.users).length === 0) {
                  delete rooms[roomId];
                }
                let users = [];
                let usersObject = Object.values(rooms[roomId].users);
                usersObject.forEach(user => {
                  if(user.id != userId){
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
      
                // Remove user from room
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
};




