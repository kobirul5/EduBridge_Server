import { Server } from "http";
import { WebSocket, WebSocketServer } from "ws";
import config from "../config";
import prisma from "../shared/prisma";
import { jwtHelpers } from "./jwtHelpers";

interface ExtendedWebSocket extends WebSocket {
  userId?: string;
}

const onlineUsers = new Set<string>();
const userSockets = new Map<string, ExtendedWebSocket>();

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server });
  console.log("WebSocket server is running");

  wss.on("connection", (ws: ExtendedWebSocket) => {
    console.log("A user connected");

    ws.on("message", async (data: string) => {
      try {
        const parsedData = JSON.parse(data);

        switch (parsedData.event) {
          case "authenticate": {
            const token = parsedData.token;

            if (!token) {
              console.log("No token provided");
              ws.close();
              return;
            }

            const user = jwtHelpers.verifyToken(
              token,
              config.jwt.jwt_secret as string
            );

            if (!user) {
              console.log("Invalid token");
              ws.close();
              return;
            }

            const { id } = user;

            ws.userId = id;
            onlineUsers.add(id);
            userSockets.set(id, ws);

            broadcastToAll(wss, {
              event: "userStatus",
              data: { userId: id, isOnline: true },
            });
            break;
          }

          case "message": {
            const { receiverId, message, images } = parsedData;

            if (!ws.userId || !receiverId || !message) {
              console.log("Invalid message payload");
              return;
            }

            let room = await prisma.room.findFirst({
              where: {
                OR: [
                  { senderId: ws.userId, receiverId },
                  { senderId: receiverId, receiverId: ws.userId },
                ],
              },
            });

            if (!room) {
              room = await prisma.room.create({
                data: { senderId: ws.userId, receiverId },
              });
            }

            const chat = await prisma.chat.create({
              data: {
                senderId: ws.userId,
                receiverId,
                roomId: room.id,
                message,
                images: { set: images || [] },
              },
            });

            const receiverSocket = userSockets.get(receiverId);
            if (receiverSocket) {
              receiverSocket.send(
                JSON.stringify({ event: "message", data: chat })
              );
            }
            ws.send(JSON.stringify({ event: "message", data: chat }));
            break;
          }
          case "project": {
            ws.send(JSON.stringify({ parsedData }));
            return;
          }

          case "fetchChats": {
            const { receiverId } = parsedData;
            if (!ws.userId) {
              console.log("User not authenticated");
              return;
            }

            const room = await prisma.room.findFirst({
              where: {
                OR: [
                  { senderId: ws.userId, receiverId },
                  { senderId: receiverId, receiverId: ws.userId },
                ],
              },
            });

            if (!room) {
              ws.send(JSON.stringify({ event: "noRoomFound" }));
              return;
            }

            const chats = await prisma.chat.findMany({
              where: { roomId: room.id },
              orderBy: { createdAt: "asc" },
            });

            await prisma.chat.updateMany({
              where: { roomId: room.id, receiverId: ws.userId },
              data: { isRead: true },
            });

            ws.send(
              JSON.stringify({
                event: "fetchChats",
                data: chats,
              })
            );
            break;
          }

          case "unReadMessages": {
            const { receiverId } = parsedData;
            if (!ws.userId || !receiverId) {
              console.log("Invalid unread messages payload");
              return;
            }

            const room = await prisma.room.findFirst({
              where: {
                OR: [
                  { senderId: ws.userId, receiverId },
                  { senderId: receiverId, receiverId: ws.userId },
                ],
              },
            });

            if (!room) {
              ws.send(JSON.stringify({ event: "noUnreadMessages", data: [] }));
              return;
            }

            const unReadMessages = await prisma.chat.findMany({
              where: { roomId: room.id, isRead: false, receiverId: ws.userId },
            });

            const unReadCount = unReadMessages.length;

            ws.send(
              JSON.stringify({
                event: "unReadMessages",
                data: { messages: unReadMessages, count: unReadCount },
              })
            );
            break;
          }

          case "messageList": {
            try {
              // Fetch all rooms where the user is involved
              const rooms = await prisma.room.findMany({
                where: {
                  OR: [{ senderId: ws.userId }, { receiverId: ws.userId }],
                },
                include: {
                  chat: {
                    orderBy: {
                      createdAt: "desc",
                    },
                    take: 1, // Fetch only the latest message for each room
                  },
                },
              });

              // Extract the relevant user IDs from the rooms
              const userIds = rooms.map((room) => {
                return room.senderId === ws.userId
                  ? room.receiverId
                  : room.senderId;
              });

              // Fetch user profiles for the corresponding user IDs
              const userInfos = await prisma.user.findMany({
                where: {
                  id: {
                    in: userIds,
                  },
                },
                select: {
                  photos: true,
                  name: true,
                  id: true,
                  // interest: true,
                  // favoritesFood:true,
                  // lat: true,
                  // long:true,
                  
                },
              });

              

              // Combine user info with their last message
              const userWithLastMessages = rooms.map((room) => {
                const otherUserId =
                  room.senderId === ws.userId ? room.receiverId : room.senderId;
                const userInfo:any = userInfos.find(
                  (userInfo) => userInfo.id === otherUserId
                );

                userInfo.photos = userInfo.photos[0]

                return {
                  user: userInfo || null,
                  // image:userInfo?.photos[0]|| null,
                  lastMessage: room.chat[0] || null,
                };
              });

              // Send the result back to the requesting client
              ws.send(
                JSON.stringify({
                  event: "messageList",
                  data: userWithLastMessages,
                })
              );
            } catch (error) {
              console.error(
                "Error fetching user list with last messages:",
                error
              );
              ws.send(
                JSON.stringify({
                  event: "error",
                  message: "Failed to fetch users with last messages",
                })
              );
            }
            break;
          }

          case "groupMessage": {
            const {groupId, message, images} = parsedData;

            if (!ws.userId || !groupId || !message) {
              console.log("Invalid group message payload");
              return;
            }

            // Check if the group exists
            const isMember = await prisma.groupMember.findFirst({
              where: {
                groupId,
                userId: ws.userId,
              },
            });

            if(!isMember){
              ws.send(JSON.stringify({
                event: "error",
                message: "You are not a member of this group",
              })
            );
              return;
            }

            //create group message
            const newMessage = await prisma.groupMessage.create({
              data: {
                groupId,
                senderId: isMember.id,
                message,
                images: images || [],
              },
              include: {
                sender: true,
              }
            });

            // Broadcast the message to all group members
            const groupMembers = await prisma.groupMember.findMany({
              where: {
                groupId,
              },
              select: {
                userId: true,
              },
            });

            groupMembers.forEach(({userId})=> {
              const socket = userSockets.get(userId);
              if(socket) {
                socket.send(
                  JSON.stringify({
                    event: "groupMessage",
                    data: newMessage,
                  })
                );
              }
            });
            break;
          }

          case "fetchGroupMessages": {
            const {groupId} = parsedData;

            if(!ws.userId || !groupId){
              return ;
            }

            const isMember = await prisma.groupMember.findFirst({
              where: {
                groupId,
                userId: ws.userId,
              },
            });

            if(!isMember){
              ws.send(
                JSON.stringify({
                  event: "error",
                  message: "You are not a member of this group",
                })
              );
              return;
            }

            const messages = await prisma.groupMessage.findMany({
              where: {
                groupId,
              },
              orderBy: {
                createdAt: "asc",
              },
              include: {
                sender: true,
              },
            });

            ws.send(
              JSON.stringify({
                event: "fetchGroupMessages",
                data: messages,
              })
            );
            break;
          }

          default:
            console.log("Unknown event type:", parsedData.event);
        }
      } catch (error) {
        console.error("Error handling WebSocket message:", error);
      }
    });

    ws.on("close", () => {
      if (ws.userId) {
        onlineUsers.delete(ws.userId);
        userSockets.delete(ws.userId);

        broadcastToAll(wss, {
          event: "userStatus",
          data: { userId: ws.userId, isOnline: false },
        });
      }
      console.log("User disconnected");
    });
  });

  return wss;
}

function broadcastToAll(wss: WebSocketServer, message: object) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}












// // authenticate event 

// {
//   "event": "authenticate",
//   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4MzRhZjgwM2Y1ZjZiNDZkYzczNGQzZSIsImVtYWlsIjoic2Fzb2xvdjk3NEBvZnVsYXIuY29tIiwicm9sZSI6IlVTRVIiLCJpYXQiOjE3NDgyODMyODQsImV4cCI6MTc3OTgxOTI4NH0.tXjUf2Uljdj008YmmYu8R3CRyEh5LWSF9lG4re0jfKs"
// }

// // single message event 

// {
//     "event": "message",
//     "receiverId": "934593023490",
//     "message": " this is single message",
//     "images": []
// }

// // project event , own data seen 
// {
//     "event": "project"
// }



// // fetchChats event 

// {
//     "event": "fetchChats",
//     "receiverId": "395839458392"
// }

// // unReadMessages 

// {
//     "event": "unReadMessages",
//     "receiverId": "935903890523"
// }

// //messageList single 

// {
//     "event": "messageList",

// }

// //groupMessage 

// {
//     "event": "groupMessage",
//     "groupId": "345098902",
//     "message": "this is test",
//     "images": []
// }


// //fetchGroupMessages

// {
//     "event": "fetchGroupMessages",
//     "groupId": "83459203859208"
// }

