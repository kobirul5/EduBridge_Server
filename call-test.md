
# WebSocket Audio/Video Call Testing Guide

This document provides a comprehensive guide for testing the WebSocket-based audio/video call functionality using Postman.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [WebSocket Connection Setup](#websocket-connection-setup)
3. [Authentication](#authentication)
4. [Call Flow Events](#call-flow-events)
5. [Testing Scenarios](#testing-scenarios)
6. [Postman Configuration](#postman-configuration)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

- Postman installed with WebSocket support
- Valid JWT token for authentication
- Two user accounts: one Student and one Tutor
- Server running on your local environment

## WebSocket Connection Setup

### Base URL
```
ws://204.197.173.249
```

### Connection Headers
```
Connection: Upgrade
Upgrade: websocket
Sec-WebSocket-Version: 13
```

## Authentication

Before making any calls, you must authenticate your WebSocket connection.

### Authentication Event
```json
{
  "event": "authenticate",
  "token": "your_jwt_token_here"
}
```

### Expected Response
```json
{
  "event": "authenticated",
  "data": {
    "userId": "user_id",
    "role": "STUDENT|TUTOR",
    "success": true
  }
}
```

### Error Response (Invalid Token)
```json
{
  "event": "error",
  "message": "Invalid token"
}
```

## Call Flow Events

### 1. Initiating a Call (Student → Tutor)

**Event:** `callUser`

**Payload:**
```json
{
  "event": "callUser",
  "toUserId": "tutor_user_id",
  "offer": {
    "type": "offer",
    "sdp": "your_sdp_offer_here"
  },
  "callType": "audio|video"
}
```

**Expected Response (Success):**
- No direct response to caller
- Tutor receives incoming call notification

**Expected Response (Error):**
```json
{
  "event": "error",
  "message": "Only Student can initiate a call."
}
```

```json
{
  "event": "error",
  "message": "Invalid or missing callType. Must be 'audio' or 'video'."
}
```

```json
{
  "event": "error",
  "message": "Tutor not available or invalid recipient."
}
```

### 2. Incoming Call Notification (Tutor receives)

**Event:** `incomingCall`

**Payload:**
```json
{
  "event": "incomingCall",
  "data": {
    "fromUserId": "student_user_id",
    "offer": {
      "type": "offer",
      "sdp": "caller_sdp_offer"
    },
    "callType": "audio|video"
  }
}
```

### 3. Answering a Call (Tutor → Student)

**Event:** `answerCall`

**Payload:**
```json
{
  "event": "answerCall",
  "toUserId": "student_user_id",
  "answer": {
    "type": "answer",
    "sdp": "your_sdp_answer_here"
  }
}
```

### 4. Call Answered Notification (Student receives)

**Event:** `callAnswered`

**Payload:**
```json
{
  "event": "callAnswered",
  "data": {
    "fromUserId": "tutor_user_id",
    "answer": {
      "type": "answer",
      "sdp": "tutor_sdp_answer"
    }
  }
}
```

### 5. ICE Candidate Exchange

**Sending ICE Candidate:**
```json
{
  "event": "iceCandidate",
  "toUserId": "peer_user_id",
  "candidate": {
    "candidate": "ice_candidate_string",
    "sdpMLineIndex": 0,
    "sdpMid": "0"
  }
}
```

**Receiving ICE Candidate:**
```json
{
  "event": "iceCandidate",
  "data": {
    "fromUserId": "peer_user_id",
    "candidate": {
      "candidate": "ice_candidate_string",
      "sdpMLineIndex": 0,
      "sdpMid": "0"
    }
  }
}
```

### 6. Disconnecting a Call

**Event:** `disconnectCall`

**Payload:**
```json
{
  "event": "disconnectCall",
  "toUserId": "peer_user_id"
}
```

**Call Disconnected Notification:**
```json
{
  "event": "callDisconnected",
  "data": {
    "fromUserId": "peer_user_id",
    "message": "Call has been disconnected."
  }
}
```

## Testing Scenarios

### Scenario 1: Successful Audio Call
1. **Student connects and authenticates**
2. **Tutor connects and authenticates**
3. **Student initiates audio call**
4. **Tutor receives incoming call**
5. **Tutor answers call**
6. **Student receives call answered**
7. **ICE candidates are exchanged**
8. **Call is established**

### Scenario 2: Successful Video Call
1. **Student connects and authenticates**
2. **Tutor connects and authenticates**
3. **Student initiates video call**
4. **Tutor receives incoming call**
5. **Tutor answers call**
6. **Student receives call answered**
7. **ICE candidates are exchanged**
8. **Video call is established**

### Scenario 3: Call Rejection
1. **Student connects and authenticates**
2. **Tutor connects and authenticates**
3. **Student initiates call**
4. **Tutor receives incoming call**
5. **Tutor disconnects call**
6. **Student receives call disconnected**

### Scenario 4: Invalid Authentication
1. **Student connects without authentication**
2. **Student tries to make call**
3. **Student receives authentication error**

## Postman Configuration

### Step 1: Create WebSocket Request
1. Open Postman
2. Click "New" → "WebSocket Request"
3. Enter URL: `ws://204.197.173.249`
4. Click "Connect"

### Step 2: Authentication
1. In the message input, enter:
```json
{
  "event": "authenticate",
  "token": "your_jwt_token"
}
```
2. Click "Send"
3. Verify you receive authentication success response

### Step 3: Testing Calls
1. Open two Postman tabs with WebSocket connections
2. Authenticate both connections with different user tokens
3. Use the event payloads from the sections above
4. Monitor responses in the WebSocket console

### Step 4: Message Format
- All messages must be valid JSON
- Include the `event` field for all messages
- Include required data fields as specified

## Testing Checklist

### Connection Testing
- [ ] WebSocket connection establishes successfully
- [ ] Authentication works with valid token
- [ ] Authentication fails with invalid token
- [ ] Connection closes properly

### Call Testing
- [ ] Student can initiate audio call
- [ ] Student can initiate video call
- [ ] Tutor receives incoming call notification
- [ ] Tutor can answer call
- [ ] Student receives call answered notification
- [ ] ICE candidates are exchanged
- [ ] Call can be disconnected
- [ ] Error handling works for invalid scenarios

### Role Testing
- [ ] Only Student can initiate calls
- [ ] Tutor cannot initiate calls
- [ ] Proper error messages for role violations

### Error Testing
- [ ] Invalid callType returns error
- [ ] Missing required fields return error
- [ ] Unauthenticated requests return error
- [ ] Invalid user IDs return error

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Ensure server is running
   - Check WebSocket URL is correct
   - Verify port is accessible

2. **Authentication Fails**
   - Check JWT token is valid
   - Ensure token hasn't expired
   - Verify token format is correct

3. **Calls Not Working**
   - Ensure both users are authenticated
   - Check user roles (Student vs Tutor)
   - Verify user IDs are correct
   - Check WebSocket connection status

4. **No Response Received**
   - Check message format is valid JSON
   - Verify event names are correct
   - Ensure all required fields are present

### Debug Information

The server logs the following information:
- New WebSocket connections
- Received events and paths
- Authentication attempts
- Call events and responses

Check your server console for these logs to debug issues.

## Sample Test Data

### Valid JWT Token Format
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXJfaWQiLCJyb2xlIjoiU1RVRk5UIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNjM5NzI5NjAwLCJleHAiOjE2Mzk4MTYwMDB9.signature
```

### Sample SDP Offer
```json
{
  "type": "offer",
  "sdp": "v=0\r\no=- 1234567890 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0\r\na=msid-semantic: WMS\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\nc=IN IP4 0.0.0.0\r\na=mid:0\r\na=sendonly\r\na=rtpmap:111 opus/48000/2\r\n"
}
```

### Sample SDP Answer
```json
{
  "type": "answer",
  "sdp": "v=0\r\no=- 1234567890 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0\r\na=msid-semantic: WMS\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\nc=IN IP4 0.0.0.0\r\na=mid:0\r\na=recvonly\r\na=rtpmap:111 opus/48000/2\r\n"
}
```

This documentation should help you thoroughly test the WebSocket audio/video call functionality using Postman.
}