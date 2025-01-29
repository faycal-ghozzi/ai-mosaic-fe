import React, { useState, useEffect, useRef } from "react";
import "./App.css";

function ChatPage() {
  const [role, setRole] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const chatBoxRef = useRef(null);
  const typingIntervalRef = useRef(null);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  const typeWriterEffect = (text, callback) => {
    let i = 0;
    let output = "";

    setIsThinking(false);
    setIsBotTyping(true);

    typingIntervalRef.current = setInterval(() => {
      if (i < text.length) {
        output += text.charAt(i);
        callback(output);
        i++;
      } else {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
        setIsBotTyping(false);
      }
    }, 30);
  };

  const stopBotTyping = () => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
      setIsBotTyping(false);
      setIsThinking(false);
    }
  };

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";  // Fallback to localhost for development

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { sender: "user", text: input }]);
    setInput("");
    setIsThinking(true);

    try {
      console.log("Sending API request...", { role, query: input });

      const res = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, query: input }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }

      const data = await res.json();
      console.log("API Response:", data);

      if (!data.result || data.result.trim() === "") {
        data.result = "I'm sorry, I couldn't generate a response.";
      }

      let botResponse = "";
      setMessages((prev) => [...prev, { sender: "bot", text: botResponse }]);

      typeWriterEffect(data.result, (newText) => {
        setMessages((prev) => {
          const updatedMessages = [...prev];
          updatedMessages[updatedMessages.length - 1].text = newText;
          return [...updatedMessages];
        });
      });
    } catch (error) {
      console.error("Error:", error);
      setIsThinking(false);
      setIsBotTyping(false);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Error fetching response." },
      ]);
    }
  };

  const handleRoleSwitch = (newRole) => {
    setRole(newRole);
    setMessages([
      { sender: "bot", text: `You have selected the "${newRole.replace("_", " ")}" role. How can I help you?` },
    ]);
  };

  return (
    <div className="pageContainer">
      {/* Navigation Bar */}
      <div className="navBar">
        <img src="/bot-icon.png" alt="Bot Icon" className="navBotIcon" />
        <div className="navButtons">
          <button onClick={() => handleRoleSwitch("pediatric")} className="navButton">Pediatric</button>
          <button onClick={() => handleRoleSwitch("medical_student")} className="navButton">Medical Student</button>
          <button onClick={() => handleRoleSwitch("parent")} className="navButton">Parent</button>
        </div>
      </div>

      {!role ? (
        <div className="selectRoleMessage">
          <p>Please select a role before beginning.</p>
        </div>
      ) : (
        <div className="chatContainer">
          <div className="chatBox" ref={chatBoxRef}>
            {messages.map((msg, index) => (
              <div key={index} className={`chatBubble ${msg.sender === "user" ? "userBubble" : "botBubble"}`}>
                {msg.sender === "bot" && (
                  <>
                    <img src="/bot-icon.png" alt="Bot Icon" className="botIcon" />
                    <span className="botMessage">{msg.text}</span>
                  </>
                )}
                {msg.sender !== "bot" && msg.text}
              </div>
            ))}
            {isThinking && (
              <div className="chatBubble botBubble typingAnimation">
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}
          </div>
          <div className="inputContainer">
            <input
              type="text"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              className="chatInput"
            />
            {isBotTyping ? (
              <button onClick={stopBotTyping} className="stopButton">
              </button>
            ) : (
              <button onClick={handleSendMessage} className="sendButton">
                Send
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatPage;
