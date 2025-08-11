"use client"
import { CommonConfig } from '@/shared/Const/Common.const';
import { SwapProvider } from '@/shared/Enum/Common.enum';
import { ChatBotResponse, SwapRequest } from '@/shared/Models/Common.model';
import { CryptoService } from '@/shared/Services/CryptoService';
import React, { useState, useEffect, useRef } from 'react';

type PropsType = {
    sendSwapChatDetail: (swapData: SwapRequest)=> void;
};

export default function SwapChatBot(props: PropsType) {

    const [messages, setMessages] = useState([
        { role: "assistant", content: "Hi! Let's start your swap. You can tell me everything in one sentence, like: 'I need to swap 0.005 ETH from Arbitrum to USDC on BSC'." }
    ]);
    const [input, setInput] = useState("");
    const chatEndRef = useRef<HTMLDivElement>(null);
    let [showSearchingLoader, setShowSearchingLoader] = useState<boolean>(false);

    // Auto-scroll when new messages arrive
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    async function sendMessage() {

        if (!input.trim()) return;

        const newMessages = [...messages, { role: "user", content: input }];
        setMessages(newMessages);
        setInput("");

        const data = await askSwapBot(newMessages);
        const message = data?.message + " " + GetSwapDetail(data?.object) ;
        setMessages(prev => [...prev, { role: "assistant", content: message }]);

        if(data.object.allDone == 1){
            props.sendSwapChatDetail(data.object);
        }
    }
    

    function GetSwapDetail(data: SwapRequest) {
        let result = "";
        try{
            const { allDone, ...rest } = data;
            result = Object.entries(rest)
            .map(([key, value]) => `${key}: ${value}`)
            .join(' ');
        }catch{
            result = "";
        }
        return result;
    }

    async function askSwapBot(messages) : Promise<ChatBotResponse> {

        let apiConfig = CommonConfig[SwapProvider.RAPIDDEX];
        let response = new ChatBotResponse();
        setShowSearchingLoader(true);
        try{
            const res = await fetch(apiConfig?.apiUrl + "swapbot", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(messages)
            });
    
            if(res.status == 200) {
                const apiResponse = await res.json();
                response = (apiResponse && apiResponse.Data) ? JSON.parse(apiResponse.Data) : new ChatBotResponse();
            } 
            setShowSearchingLoader(false);
        }
        catch{
            console.log("error while fetching data from groq");
            setShowSearchingLoader(false);
        }
        return response;
    }

    return (
        <div className="inner-card w-100 py-2 px-3 mt-3"
            style={{
                display: "flex",
                flexDirection: "column",
                height: "400px", // fixed height
                border: "1px solid #ccc",
                borderRadius: "8px"
            }}
        >
            {/* Chat messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
                {messages.map((msg, i) => (
                    <div key={i} style={{
                        display: "flex",
                        flexDirection: msg?.role === "user" ? "row-reverse" : "row",
                        alignItems: "flex-start",
                        margin: "8px 0"
                    }}>
                        {/* Profile icon */}
                        <div
                            style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "50%",
                                backgroundColor: msg?.role === "user" ? "#C8D8FA" : "#FAC7C7",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                fontSize: "18px",
                                color: "#333",
                                margin: msg?.role === "user" ? "0 0 0 8px" : "0 8px 0 0"
                            }}
                        >
                            <i className={`fas ${msg?.role === "user" ? "fa-user" : "fa-robot"}`}></i>
                        </div>

                        {/* Chat bubble */}
                        <div
                            style={{
                                backgroundColor: msg?.role === "user" ? "#C8D8FA" : "#FAC7C7",
                                padding: "10px 14px",
                                borderRadius: "12px",
                                maxWidth: "70%",
                                textAlign: "left"
                            }}
                        >
                            {msg?.content}
                        </div>
                    </div>
                ))}
                <div ref={chatEndRef}></div>
            </div>
            {
                showSearchingLoader && (
                    <div style={{ display: "flex", alignItems: "center" }}>
                        {/* Bot Profile */}
                        <div
                            style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "50%",
                                backgroundColor: "#FAC7C7",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                fontSize: "18px",
                                color: "#333",
                                marginRight: "8px"
                            }}
                        >
                            <i className="fas fa-robot"></i>
                        </div>

                        {/* Spinner */}
                        <div>
                            <i className="fa-solid fa-spinner fa-spin"></i>
                        </div>
                    </div>
                )
            }

            {/* Input Textbox */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px",
                    borderTop: "1px solid #ccc",
                }}
            >
                {/* Small Textbox */}
                <input
                    type="text"
                    className="form-control"
                    style={{
                        width: "480px", // smaller fixed width
                        height: "50px",
                        padding: "6px 10px",
                    }}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            sendMessage(); // Call your function
                        }
                    }}
                    placeholder="Type..."
                />

                {/* Send Icon Button */}
                <button
                    onClick={() => sendMessage()}
                    className="btn btn-primary"
                    style={{
                        width: "50px",
                        height: "40px",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        padding: 0,
                    }}
                >
                    <i className="fas fa-paper-plane"></i>
                </button>
            </div>

        </div>
    );

}