import { useEffect } from "react";
import { useWebSocket } from "./WebSocketContext";

export const useKeyboardControls = () => {
  const { socket } = useWebSocket();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "keyEvent", key: event.code }));
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [socket]);
};
