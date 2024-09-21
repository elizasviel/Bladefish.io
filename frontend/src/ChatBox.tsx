import React, { useState } from "react";

interface ChatMessage {
  playerId: string;
  message: string;
  timestamp: number;
}

interface ChatLog {
  messages: ChatMessage[];
}

interface ChatBoxProps {
  socket: WebSocket | undefined;
  playerId: string;
  chatLog: ChatLog;
}

export const ChatBox: React.FC<ChatBoxProps> = ({
  socket,
  playerId,
  chatLog,
}) => {
  console.log("CHAT LOG", chatLog);
  const [inputMessage, setInputMessage] = useState("");

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() && socket) {
      socket.send(
        JSON.stringify({
          type: "chatMessage",
          payload: { playerId, message: inputMessage.trim() },
        })
      );
      setInputMessage("");
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        bottom: "10px",
        right: "10px",
        width: "300px",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          height: "200px",
          backgroundColor: "rgba(0,0,0,0.5)",
          color: "white",
          overflowY: "auto",
          padding: "10px",
          marginBottom: "10px",
        }}
      >
        {chatLog.messages.map((msg, index) => (
          <div key={index}>
            {msg.playerId === playerId ? "You" : msg.playerId}: {msg.message}
          </div>
        ))}
      </div>
      <form onSubmit={handleChatSubmit}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          style={{ width: "100%" }}
        />
      </form>
    </div>
  );
};
