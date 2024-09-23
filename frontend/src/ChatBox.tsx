import React, { useState, useRef, useEffect } from "react";

interface ChatMessage {
  playerId: number;
  message: string;
  timestamp: number;
}

interface ChatBoxProps {
  socket: WebSocket;
  playerId: number;
  chatLog: ChatMessage[];
}

export const ChatBox: React.FC<ChatBoxProps> = ({
  socket,
  playerId,
  chatLog,
}) => {
  const [inputMessage, setInputMessage] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatLog]);

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim()) {
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
        bottom: "20px",
        right: "20px",
        width: "300px",
        zIndex: 1000,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        ref={chatContainerRef}
        style={{
          height: "250px",
          backgroundColor: "rgba(0,0,0,0.7)",
          color: "white",
          overflowY: "auto",
          padding: "15px",
          marginBottom: "10px",
          borderRadius: "10px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        }}
      >
        {chatLog.map((msg) => (
          <div
            key={msg.timestamp}
            style={{
              marginBottom: "8px",
              padding: "8px",
              backgroundColor:
                msg.playerId === playerId
                  ? "rgba(0, 128, 255, 0.3)"
                  : "rgba(255, 255, 255, 0.1)",
              borderRadius: "5px",
            }}
          >
            <span
              style={{
                fontWeight: "bold",
                color: msg.playerId === playerId ? "#4CAF50" : "#FFA500",
              }}
            >
              {msg.playerId === playerId ? "You" : msg.playerId}:
            </span>{" "}
            {msg.message}
          </div>
        ))}
      </div>
      <form onSubmit={handleChatSubmit} style={{ display: "flex" }}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          style={{
            flex: 1,
            padding: "10px",
            fontSize: "16px",
            borderRadius: "5px 0 0 5px",
            border: "none",
            outline: "none",
          }}
          placeholder="Type your message..."
        />
        <button
          type="submit"
          style={{
            padding: "10px 15px",
            fontSize: "16px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "0 5px 5px 0",
            cursor: "pointer",
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
};
