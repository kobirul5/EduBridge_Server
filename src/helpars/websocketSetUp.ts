import { Server } from "http";
import { WebSocket, WebSocketServer } from "ws";
import config from "../config";
import prisma from "../shared/prisma";
import { jwtHelpers } from "./jwtHelpers";
import { UserRole } from "@prisma/client";

interface ExtendedWebSocket extends WebSocket {
  userId?: string;
  role?: string;
  userName?: string;
  isAlive?: boolean;
  path?: string;
}

export const onlineUsers = new Map<
  string,
  { socket: ExtendedWebSocket; path: string }
>();

const userSockets = new Map<string, ExtendedWebSocket>();


export function setupWebSocket(server: Server) {
  // const wss = new WebSocketServer({ server });
  const wss = new WebSocketServer({
    server,
    perMessageDeflate: false,
    handleProtocols: (protocols: string[] | Set<string>) => {
      const protocolArray = Array.isArray(protocols)
        ? protocols
        : Array.from(protocols);
      return protocolArray.length === 0 ? "" : protocolArray[0];
    },
  });

  // Keep clients alive
  function heartbeat(ws: ExtendedWebSocket) {
    ws.isAlive = true;
  }

  // Check every 30 seconds for alive connections
  const interval = setInterval(() => {
    wss.clients.forEach((ws: ExtendedWebSocket) => {
      if (ws.isAlive === false) {
        if (ws.userId) {
          onlineUsers.delete(ws.userId);
          if (ws.role === UserRole.STUDENT || ws.role === UserRole.TUTOR) {
            onlineUsers.delete(ws.userId);
          }
        }
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  console.log("WebSocket server is running");

  // Handle WebSocket connections
  wss.on("connection", (ws: ExtendedWebSocket, req) => {
    ws.isAlive = true;
    ws.path = req.url;
    console.log("New WebSocket connection established on path:", ws.path);

    // Send message when connected
    ws.send(
      JSON.stringify({
        event: "info",
        message: "Connected to server. Please authenticate.",
      })
    );

    ws.on("pong", () => heartbeat(ws));

    ws.on("message", async (data: string) => {
      try {
        const parsedData = JSON.parse(data);

        if (!ws.userId && parsedData.event !== "authenticate") {
          ws.send(
            JSON.stringify({
              event: "error",
              message: "Please authenticate first",
            })
          );
          return;
        }

        switch (parsedData.event) {
          // 🔹 Authenticate event
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
            const { id, role } = user;

            // Remove existing connection for this user
            const existingConnection = onlineUsers.get(id);

            if (existingConnection && existingConnection.path === ws.path) {
              existingConnection.socket.close();
              onlineUsers.delete(id);
              if (role === UserRole.STUDENT || role === UserRole.TUTOR) {
                onlineUsers.delete(id);
              }
            }
            ws.userId = id;
            ws.role = role;
            onlineUsers.set(id, { socket: ws, path: ws.path! });
            userSockets.set(id, ws);

            await prisma.user.update({
              where: { id: user.id },
              data: { isOnline: true },
            });

            broadcastToAll(wss, {
              event: "userStatus",
              data: { userId: id, isOnline: true },
            });
            break;
          }

          // 🔹 Send single message
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

          // 🔹 Project event
          case "project": {
            ws.send(JSON.stringify({ parsedData }));
            return;
          }

          // 🔹 Fetch single chat history
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

          // 🔹 Unread messages count
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

            ws.send(
              JSON.stringify({
                event: "unReadMessages",
                data: {
                  messages: unReadMessages,
                  count: unReadMessages.length,
                },
              })
            );
            break;
          }

          // 🔹 Message list (all conversations with last message + unread count)
          case "messageList": {
            try {
              if (!ws.userId) {
                ws.send(
                  JSON.stringify({
                    event: "error",
                    message: "User not authenticated",
                  })
                );
                return;
              }

              const rooms = await prisma.room.findMany({
                where: {
                  OR: [{ senderId: ws.userId }, { receiverId: ws.userId }],
                },
                include: {
                  chat: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                  },
                },
              });

              if (!rooms.length) {
                ws.send(JSON.stringify({ event: "messageList", data: [] }));
                return;
              }

              const userIds = rooms.map((room) =>
                room.senderId === ws.userId ? room.receiverId : room.senderId
              );

              const userInfos = await prisma.user.findMany({
                where: { id: { in: userIds } },
                select: {
                  id: true,
                  fullName: true,
                  profileImage: true,
                },
              });

              const userWithLastMessages = await Promise.all(
                rooms.map(async (room) => {
                  const otherUserId =
                    room.senderId === ws.userId
                      ? room.receiverId
                      : room.senderId;

                  const userInfo = userInfos.find((u) => u.id === otherUserId);

                  // Unread count for this room
                  const unreadCount = await prisma.chat.count({
                    where: {
                      roomId: room.id,
                      receiverId: ws.userId,
                      isRead: false,
                    },
                  });

                  return {
                    user: userInfo || null,
                    lastMessage: room.chat[0] || null,
                    unreadCount,
                  };
                })
              );

              ws.send(
                JSON.stringify({
                  event: "messageList",
                  data: userWithLastMessages,
                })
              );
            } catch (error) {
              console.error("Error fetching message list:", error);
              ws.send(
                JSON.stringify({
                  event: "error",
                  message: "Failed to fetch message list",
                })
              );
            }
            break;
          }

          default:
            console.log("Unknown event type:", parsedData.event);
        }

        await handleCallEvents(ws, parsedData);
      } catch (error) {
        console.error("Error handling WebSocket message:", error);
      }
    });

    ws.on("close", async () => {
      if (ws.userId) {
        onlineUsers.delete(ws.userId);
        userSockets.delete(ws.userId);
        await prisma.user.update({
          where: { id: ws.userId },
          data: { isOnline: false },
        });


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


// function broadcastToAll(wss: WebSocketServer, message: object) {
//   wss.clients.forEach((client) => {
//     if (client.readyState === WebSocket.OPEN) {
//       client.send(JSON.stringify(message));
//     }
//   });
// }

async function handleCallEvents(ws: ExtendedWebSocket, parsedData: any) {
  const { event } = parsedData;

  switch (event) {
    case "callUser": {
      const { toUserId, offer, callType } = parsedData;

      console.log(
        `[callUser] From: ${ws.userId} To: ${toUserId} Type: ${callType}`
      );

      if (ws.role !== UserRole.STUDENT) {
        ws.send(
          JSON.stringify({
            event: "error",
            message: "Only Student can initiate a call.",
          })
        );
        return;
      }

      if (!callType || !["audio", "video"].includes(callType)) {
        ws.send(
          JSON.stringify({
            event: "error",
            message: "Invalid or missing callType. Must be 'audio' or 'video'.",
          })
        );
        return;
      }

      const receiverConnection = onlineUsers.get(toUserId);
      if (
        receiverConnection?.socket.readyState === WebSocket.OPEN &&
        receiverConnection.socket.role === UserRole.TUTOR
      ) {
        receiverConnection.socket.send(
          JSON.stringify({
            event: "incomingCall",
            data: {
              fromUserId: ws.userId,
              offer,
              callType,
            },
          })
        );
        console.log(`event ✅ Success: Call delivered to ${toUserId}`);
      } else {
        console.log(`event ❌ Failed: Tutor not available`);
        ws.send(
          JSON.stringify({
            event: "error",
            message: "Tutor not available or invalid recipient.",
          })
        );
      }
      break;
    }

    case "answerCall": {
      const { toUserId, answer } = parsedData;

      console.log(`[answerCall] From: ${ws.userId} To: ${toUserId}`);

      const callerConnection = onlineUsers.get(toUserId);
      if (callerConnection?.socket.readyState === WebSocket.OPEN) {
        callerConnection.socket.send(
          JSON.stringify({
            event: "callAnswered",
            data: {
              fromUserId: ws.userId,
              answer,
            },
          })
        );
        console.log(`event ✅ Success: Answer sent to ${toUserId}`);
      } else {
        console.log(`event ❌ Failed: Caller not available`);
      }
      break;
    }

    case "iceCandidate": {
      const { toUserId, candidate } = parsedData;

      console.log(`[iceCandidate] From: ${ws.userId} To: ${toUserId}`);

      const peerConnection = onlineUsers.get(toUserId);
      if (peerConnection?.socket.readyState === WebSocket.OPEN) {
        peerConnection.socket.send(
          JSON.stringify({
            event: "iceCandidate",
            data: {
              fromUserId: ws.userId,
              candidate,
            },
          })
        );
        console.log(`event ✅ Success: ICE candidate sent to ${toUserId}`);
      } else {
        console.log(`event ❌ Failed: Peer not available`);
      }
      break;
    }

    case "disconnectCall": {
      const { toUserId } = parsedData;
      console.log(`[disconnectCall] From: ${ws.userId} To: ${toUserId}`);

      const peerConnection = onlineUsers.get(toUserId);
      if (peerConnection?.socket.readyState === WebSocket.OPEN) {
        peerConnection.socket.send(
          JSON.stringify({
            event: "callDisconnected",
            data: {
              fromUserId: ws.userId,
              message: "Call has been disconnected.",
            },
          })
        );
        console.log(`event ✅ Success: Call disconnect sent to ${toUserId}`);
      } else {
        console.log(`event ❌ Failed: Peer not available`);
      }
      break;
    }

    default:
      // For unknown events, do nothing (they might be handled by the main switch)
      break;
  }
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
