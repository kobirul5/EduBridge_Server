import { Server } from "http";
import { WebSocket, WebSocketServer } from "ws";
import config from "../config";
import prisma from "../shared/prisma";
import { jwtHelpers } from "./jwtHelpers";

interface ExtendedWebSocket extends WebSocket {
  userId?: string;
  role?: string;
}

const onlineUsers = new Set<string>();
const userSockets = new Map<string, ExtendedWebSocket>();

const activeCalls = new Map<
  string,
  {
    participants: Set<string>;
    hostId: string;
    callType: "audio" | "video";
    offer: any;
  }
>();

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server });
  console.log("WebSocket server is running");

  wss.on("connection", (ws: ExtendedWebSocket) => {
    console.log("A user connected");

    ws.on("message", async (data: string) => {
      try {
        const parsedData = JSON.parse(data);

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
            ws.userId = id;
            ws.role = role;
            onlineUsers.add(id);
            userSockets.set(id, ws);

            await prisma.user.update({
              where: { id: user.id },
              data: { isOnline: true },
            });

            // Check if there are active calls this user should be notified about
            for (const [callId, call] of activeCalls.entries()) {
              if (call.participants.has(id)) {
                // Notify user about active call
                ws.send(
                  JSON.stringify({
                    event: "activeCallNotification",
                    data: {
                      callId,
                      hostId: call.hostId,
                      callType: call.callType,
                      participants: Array.from(call.participants),
                    },
                  })
                );
              }
            }

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

        // Remove user from any active calls
        for (const [callId, call] of activeCalls.entries()) {
          if (call.participants.has(ws.userId)) {
            call.participants.delete(ws.userId);

            // Notify other participants about the user leaving
            broadcastToCallParticipants(callId, {
              event: "participantLeft",
              data: { userId: ws.userId },
            });

            // If host leaves or no participants left, end the call
            if (call.hostId === ws.userId || call.participants.size === 0) {
              activeCalls.delete(callId);
              broadcastToCallParticipants(callId, {
                event: "callEnded",
                data: { reason: "Host ended the call" },
              });
            }
          }
        }

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

function broadcastToCallParticipants(callId: string, message: object) {
  const call = activeCalls.get(callId);
  if (!call) return;

  call.participants.forEach((participantId) => {
    const participantSocket = userSockets.get(participantId);
    if (participantSocket && participantSocket.readyState === WebSocket.OPEN) {
      participantSocket.send(JSON.stringify(message));
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
    case "initiateCall": {
      // Only tutors can initiate calls
      if (ws.role !== "TUTOR") {
        ws.send(
          JSON.stringify({
            event: "error",
            message: "Only tutors can initiate calls.",
          })
        );
        return;
      }

      const { participantIds, callType } = parsedData;

      if (!ws.userId) {
        ws.send(
          JSON.stringify({ event: "error", message: "User not authenticated." })
        );
        return;
      }

      if (!callType || !["audio", "video"].includes(callType)) {
        ws.send(
          JSON.stringify({
            event: "error",
            message: "callType must be 'audio' or 'video'.",
          })
        );
        return;
      }

      if (!participantIds || !Array.isArray(participantIds)) {
        ws.send(
          JSON.stringify({
            event: "error",
            message: "participantIds must be an array.",
          })
        );
        return;
      }

      // Generate a unique call ID
      const callId = `call_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Create the call with host and participants
      const participants = new Set<string>([ws.userId, ...participantIds]);
      activeCalls.set(callId, {
        participants,
        hostId: ws.userId,
        callType,
        offer: parsedData.offer,
      });

      // Notify all participants about the call
      participants.forEach((participantId) => {
        if (participantId !== ws.userId) {
          const participantSocket = userSockets.get(participantId);
          if (
            participantSocket &&
            participantSocket.readyState === WebSocket.OPEN
          ) {
            participantSocket.send(
              JSON.stringify({
                event: "incomingCall",
                data: {
                  callId,
                  hostId: ws.userId,
                  offer: parsedData.offer,
                  callType,
                  participants: Array.from(participants),
                },
              })
            );
          }
        }
      });

      // Confirm call initiation to host
      ws.send(
        JSON.stringify({
          event: "callInitiated",
          data: { callId, participants: Array.from(participants) },
        })
      );
      break;
    }

    case "answerCall": {
      const { callId, answer } = parsedData;

      if (!ws.userId) return;

      const call = activeCalls.get(callId);
      if (!call) {
        ws.send(JSON.stringify({ event: "error", message: "Call not found." }));
        return;
      }

      // Add user to call participants if not already there
      if (!call.participants.has(ws.userId)) {
        call.participants.add(ws.userId);
      }

      // Send answer to all other participants
      call.participants.forEach((participantId) => {
        if (participantId !== ws.userId) {
          const participantSocket = userSockets.get(participantId);
          if (
            participantSocket &&
            participantSocket.readyState === WebSocket.OPEN
          ) {
            participantSocket.send(
              JSON.stringify({
                event: "participantJoined",
                data: {
                  callId,
                  userId: ws.userId,
                  answer,
                },
              })
            );
          }
        }
      });

      // Send current participants list to the joining user
      ws.send(
        JSON.stringify({
          event: "callParticipants",
          data: {
            callId,
            participants: Array.from(call.participants),
            hostId: call.hostId,
            callType: call.callType,
            offer: call.offer,
          },
        })
      );
      break;
    }

    case "iceCandidate": {
      const { callId, candidate, targetUserId } = parsedData;

      if (!ws.userId) return;

      // If targetUserId is specified, send to that user only
      if (targetUserId) {
        const targetSocket = userSockets.get(targetUserId);
        if (targetSocket && targetSocket.readyState === WebSocket.OPEN) {
          targetSocket.send(
            JSON.stringify({
              event: "iceCandidate",
              data: { callId, fromUserId: ws.userId, candidate },
            })
          );
        }
        return;
      }

      // Otherwise, broadcast to all call participants
      const call = activeCalls.get(callId);
      if (!call) return;

      call.participants.forEach((participantId) => {
        if (participantId !== ws.userId) {
          const participantSocket = userSockets.get(participantId);
          if (
            participantSocket &&
            participantSocket.readyState === WebSocket.OPEN
          ) {
            participantSocket.send(
              JSON.stringify({
                event: "iceCandidate",
                data: { callId, fromUserId: ws.userId, candidate },
              })
            );
          }
        }
      });
      break;
    }

    case "leaveCall": {
      const { callId } = parsedData;

      if (!ws.userId) return;

      const call = activeCalls.get(callId);
      if (!call) return;

      // Remove user from call participants
      call.participants.delete(ws.userId);

      // Notify other participants about the user leaving
      call.participants.forEach((participantId) => {
        const participantSocket = userSockets.get(participantId);
        if (
          participantSocket &&
          participantSocket.readyState === WebSocket.OPEN
        ) {
          participantSocket.send(
            JSON.stringify({
              event: "participantLeft",
              data: { callId, userId: ws.userId },
            })
          );
        }
      });

      // If host leaves or no participants left, end the call
      if (call.hostId === ws.userId || call.participants.size === 0) {
        activeCalls.delete(callId);
        call.participants.forEach((participantId) => {
          const participantSocket = userSockets.get(participantId);
          if (
            participantSocket &&
            participantSocket.readyState === WebSocket.OPEN
          ) {
            participantSocket.send(
              JSON.stringify({
                event: "callEnded",
                data: { callId, reason: "Host ended the call" },
              })
            );
          }
        });
      }
      break;
    }

    case "joinExistingCall": {
      const { callId } = parsedData;

      if (!ws.userId) return;

      const call = activeCalls.get(callId);
      if (!call) {
        ws.send(JSON.stringify({ event: "error", message: "Call not found." }));
        return;
      }

      // Add user to call participants
      call.participants.add(ws.userId);

      // Notify other participants about the new user
      call.participants.forEach((participantId) => {
        if (participantId !== ws.userId) {
          const participantSocket = userSockets.get(participantId);
          if (
            participantSocket &&
            participantSocket.readyState === WebSocket.OPEN
          ) {
            participantSocket.send(
              JSON.stringify({
                event: "participantJoined",
                data: { callId, userId: ws.userId },
              })
            );
          }
        }
      });

      // Send current participants list to the joining user
      ws.send(
        JSON.stringify({
          event: "callParticipants",
          data: {
            callId,
            participants: Array.from(call.participants),
            hostId: call.hostId,
            callType: call.callType,
            offer: call.offer,
          },
        })
      );
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
