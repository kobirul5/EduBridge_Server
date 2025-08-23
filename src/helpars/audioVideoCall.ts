// import { Server } from "http";
// import { WebSocket, WebSocketServer } from "ws";
// import { Secret } from "jsonwebtoken";
// import config from "../config";
// import { UserRole } from "@prisma/client";
// import { jwtHelpers } from "../helpars/jwtHelpers";

// // Extended WebSocket type to track user info
// interface ExtendedWebSocket extends WebSocket {
//   userId?: string;
//   userRole?: UserRole;
//   userName?: string;
//   isAlive?: boolean;
// }

// export const onlineUsers = new Map<string, ExtendedWebSocket>();

// export function setupWebSocket(server: Server) {
//   const wss = new WebSocketServer({ server, perMessageDeflate: false });

//   function heartbeat(ws: ExtendedWebSocket) {
//     ws.isAlive = true;
//   }

//   // Connection health check
//   setInterval(() => {
//     wss.clients.forEach((ws: ExtendedWebSocket) => {
//       if (ws.isAlive === false) {
//         if (ws.userId) onlineUsers.delete(ws.userId);
//         return ws.terminate();
//       }
//       ws.isAlive = false;
//       ws.ping();
//     });
//   }, 30000);

//   wss.on("connection", (ws: ExtendedWebSocket) => {
//     ws.isAlive = true;

//     ws.send(JSON.stringify({ event: "info", message: "Connected. Please authenticate." }));

//     ws.on("pong", () => heartbeat(ws));

//     ws.on("message", async (data: string) => {
//       try {
//         const parsedData = JSON.parse(data);

//         if (!ws.userId && parsedData.event !== "authenticate") {
//           ws.send(JSON.stringify({ event: "error", message: "Please authenticate first" }));
//           return;
//         }

//         // 🔐 Authentication
//         if (parsedData.event === "authenticate") {
//           try {
//             const user = jwtHelpers.verifyToken(parsedData.token, config.jwt.jwt_secret as Secret);
//             const { id, role, email } = user;

//             // If user already connected → remove old connection
//             if (onlineUsers.has(id)) {
//               onlineUsers.get(id)?.close();
//               onlineUsers.delete(id);
//             }

//             ws.userId = id;
//             ws.userRole = role;
//             ws.userName = email;
//             onlineUsers.set(id, ws);

//             ws.send(JSON.stringify({ event: "authenticated", data: { userId: id, role } }));
//           } catch {
//             ws.send(JSON.stringify({ event: "error", message: "Invalid token" }));
//           }
//           return;
//         }

//         // Handle call-related events
//         await handleCallEvents(ws, parsedData);
//       } catch {
//         ws.send(JSON.stringify({ event: "error", message: "Invalid message format" }));
//       }
//     });

//     ws.on("close", () => {
//       if (ws.userId) onlineUsers.delete(ws.userId);
//     });
//   });

//   return wss;
// }

// // 🎯 Call Events Only
// async function handleCallEvents(ws: ExtendedWebSocket, parsedData: any) {
//   switch (parsedData.event) {
//     case "callUser": {
//       const { toUserId, offer, callType } = parsedData;
//       console.log(`[callUser] From: ${ws.userId} → To: ${toUserId} (${callType})`);

//       if (ws.userRole !== UserRole.STUDENT) {
//         ws.send(JSON.stringify({ event: "error", message: "Only students can initiate a call." }));
//         return;
//       }

//       if (!callType || !["audio", "video"].includes(callType)) {
//         ws.send(JSON.stringify({ event: "error", message: "callType must be 'audio' or 'video'." }));
//         return;
//       }

//       const receiver = onlineUsers.get(toUserId);
//       if (receiver?.readyState === WebSocket.OPEN && receiver.userRole === UserRole.TUTOR) {
//         receiver.send(
//           JSON.stringify({
//             event: "incomingCall",
//             data: { fromUserId: ws.userId, offer, callType },
//           })
//         );
//         console.log(`✅ Call delivered to ${toUserId}`);
//       } else {
//         ws.send(JSON.stringify({ event: "error", message: "Tutor not available." }));
//         console.log(`❌ Call failed: Tutor not available`);
//       }
//       break;
//     }

//     case "answerCall": {
//       const { toUserId, answer } = parsedData;
//       console.log(`[answerCall] From: ${ws.userId} → To: ${toUserId}`);

//       const caller = onlineUsers.get(toUserId);
//       if (caller?.readyState === WebSocket.OPEN) {
//         caller.send(JSON.stringify({ event: "callAnswered", data: { fromUserId: ws.userId, answer } }));
//         console.log(`✅ Answer sent to ${toUserId}`);
//       } else {
//         console.log(`❌ Answer failed: Caller not available`);
//       }
//       break;
//     }

//     case "iceCandidate": {
//       const { toUserId, candidate } = parsedData;
//       console.log(`[iceCandidate] From: ${ws.userId} → To: ${toUserId}`);

//       const peer = onlineUsers.get(toUserId);
//       if (peer?.readyState === WebSocket.OPEN) {
//         peer.send(JSON.stringify({ event: "iceCandidate", data: { fromUserId: ws.userId, candidate } }));
//         console.log(`✅ ICE candidate sent to ${toUserId}`);
//       } else {
//         console.log(`❌ ICE candidate failed: Peer not available`);
//       }
//       break;
//     }

//     case "disconnectCall": {
//       const { toUserId } = parsedData;
//       console.log(`[disconnectCall] From: ${ws.userId} → To: ${toUserId}`);

//       const peer = onlineUsers.get(toUserId);
//       if (peer?.readyState === WebSocket.OPEN) {
//         peer.send(
//           JSON.stringify({
//             event: "callDisconnected",
//             data: { fromUserId: ws.userId, message: "Call has been disconnected." },
//           })
//         );
//         console.log(`✅ Disconnect sent to ${toUserId}`);
//       } else {
//         console.log(`❌ Disconnect failed: Peer not available`);
//       }
//       break;
//     }

//     default:
//       ws.send(JSON.stringify({ event: "error", message: "Unknown event type" }));
//   }
// }
