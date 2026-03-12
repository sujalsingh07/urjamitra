import React, { useState, useEffect } from "react";
import socket from "../socket";

export default function Chat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  // Load previous messages from localStorage
  useEffect(() => {
    const savedMessages = localStorage.getItem("chatMessages");
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, []);

  // Listen for incoming messages
  useEffect(() => {
    socket.on("receive_message", (data) => {
      setMessages((prev) => {
        const updated = [...prev, data];
        localStorage.setItem("chatMessages", JSON.stringify(updated));
        return updated;
      });
    });

    return () => socket.off("receive_message");
  }, []);

  const sendMessage = () => {
    if (!message.trim()) return;

    const msgData = {
      message,
      time: new Date().toLocaleTimeString(),
    };

    socket.emit("send_message", msgData);

    setMessages((prev) => {
      const updated = [...prev, msgData];
      localStorage.setItem("chatMessages", JSON.stringify(updated));
      return updated;
    });

    setMessage("");
  };

  return (
    <div style={{ padding: "40px" }}>
      <h2 style={{ marginBottom: "20px" }}>💬 Energy Marketplace Chat</h2>

      <div
        style={{
          background: "#ffffff",
          borderRadius: "10px",
          padding: "20px",
          height: "400px",
          overflowY: "auto",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        {messages.length === 0 && (
          <p style={{ color: "#888" }}>No messages yet.</p>
        )}

        {messages.map((msg, index) => (
          <div key={index} style={{ marginBottom: "10px" }}>
            <strong>⚡ User:</strong> {msg.message}
            <div style={{ fontSize: "12px", color: "#999" }}>{msg.time}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #ddd",
          }}
        />

        <button
          onClick={sendMessage}
          style={{
            background: "#2ecc71",
            color: "white",
            border: "none",
            padding: "10px 16px",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}