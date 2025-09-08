
```json

Authentication

First, you need to authenticate using the authenticate event:

{
  "event": "authenticate",
  "token": "your-jwt-token-here"
}

Call Events

1. Initiate Call (Tutor only)
Request:
{
  "event": "initiateCall",
  "participantIds": ["user-id-1", "user-id-2", "user-id-3"],
  "callType": "video",
  "offer": { /* WebRTC offer object */ }
}

Response (to tutor):
{
  "event": "callInitiated",
  "data": {
    "callId": "call_123456789_abc123def",
    "participants": ["tutor-id", "user-id-1", "user-id-2", "user-id-3"]
  }
}

Response (to participants):
{
  "event": "incomingCall",
  "data": {
    "callId": "call_123456789_abc123def",
    "hostId": "tutor-id",
    "offer": { /* WebRTC offer object */ },
    "callType": "video",
    "participants": ["tutor-id", "user-id-1", "user-id-2", "user-id-3"]
  }
}

2. Answer Call
Request:
{
  "event": "answerCall",
  "callId": "call_123456789_abc123def",
  "answer": { /* WebRTC answer object */ }
}

Response (to all participants except the answering user):
{
  "event": "participantJoined",
  "data": {
    "callId": "call_123456789_abc123def",
    "userId": "user-id-1",
    "answer": { /* WebRTC answer object */ }
  }
}

Response (to the answering user):
{
  "event": "callParticipants",
  "data": {
    "callId": "call_123456789_abc123def",
    "participants": ["tutor-id", "user-id-1", "user-id-2", "user-id-3"],
    "hostId": "tutor-id",
    "callType": "video",
    "offer": { /* WebRTC offer object */ }
  }
}

3. Send ICE Candidate
Request (broadcast to all):
{
  "event": "iceCandidate",
  "callId": "call_123456789_abc123def",
  "candidate": { /* ICE candidate object */ }
}

Request (send to specific user):
{
  "event": "iceCandidate",
  "callId": "call_123456789_abc123def",
  "candidate": { /* ICE candidate object */ },
  "targetUserId": "specific-user-id"
}
Response (to target users):
{
  "event": "iceCandidate",
  "data": {
    "callId": "call_123456789_abc123def",
    "fromUserId": "sender-user-id",
    "candidate": { /* ICE candidate object */ }
  }
}

4. Leave Call
Request:

{
  "event": "leaveCall",
  "callId": "call_123456789_abc123def"
}

Response (to remaining participants):
{
  "event": "participantLeft",
  "data": {
    "callId": "call_123456789_abc123def",
    "userId": "user-who-left-id"
  }
}

Response (if host leaves):
{
  "event": "callEnded",
  "data": {
    "callId": "call_123456789_abc123def",
    "reason": "Host ended the call"
  }
}

5. Join Existing Call
Request:
{
  "event": "joinExistingCall",
  "callId": "call_123456789_abc123def"
}

Response (to other participants):
{
  "event": "participantJoined",
  "data": {
    "callId": "call_123456789_abc123def",
    "userId": "new-user-id"
  }
}

Response (to joining user):

{
  "event": "callParticipants",
  "data": {
    "callId": "call_123456789_abc123def",
    "participants": ["tutor-id", "user-id-1", "user-id-2", "new-user-id"],
    "hostId": "tutor-id",
    "callType": "video",
    "offer": { /* WebRTC offer object */ }
  }
}

6. Active Call Notification (Automatically sent when user comes online)
Response:
{
  "event": "activeCallNotification",
  "data": {
    "callId": "call_123456789_abc123def",
    "hostId": "tutor-id",
    "callType": "video",
    "participants": ["tutor-id", "user-id-1", "user-id-2"]
  }
}

Error Responses
General Error:

{
  "event": "error",
  "message": "Error description here"
}

Role Error (non-tutor trying to initiate call):
{
  "event": "error",
  "message": "Only tutors can initiate calls."
}

Call Not Found Error:
{
  "event": "error",
  "message": "Call not found."
}