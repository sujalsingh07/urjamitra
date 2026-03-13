import { useState, useEffect, useRef } from "react";
import { api } from "../services/api";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=Playfair+Display:wght@700;900&display=swap');

@keyframes fadeUp { 
from{opacity:0;transform:translateY(18px)} 
to{opacity:1;transform:translateY(0)} 
}

@keyframes blink { 
0%,100%{opacity:1} 
50%{opacity:0.3} 
}

.um-card { 
background: rgba(255,255,255,0.65);
backdrop-filter: blur(24px);
border: 1px solid rgba(255,255,255,0.8);
transition: all .35s cubic-bezier(0.16,1,0.3,1);
}

.msg-user{
background: linear-gradient(135deg,#f59e0b,#ea580c);
color:white;
border-radius:16px 16px 4px 16px;
padding:10px 14px;
font-weight:600;
max-width:70%;
}

.msg-bot{
background: rgba(255,255,255,0.7);
border:1px solid rgba(253,230,138,0.6);
color:#451a03;
border-radius:16px 16px 16px 4px;
padding:10px 14px;
font-weight:600;
max-width:70%;
}
`;

export default function ChatPage(){

const [messages,setMessages] = useState([]);
const [input,setInput] = useState("");
const [loading,setLoading] = useState(false);

const chatRef = useRef();

useEffect(()=>{
fetchMessages();
},[]);

const fetchMessages = async()=>{
try{

const res = await api.getChatHistory();

if(res.success){
setMessages(res.messages);
}

}catch(e){
console.log("chat history error");
}
}

const sendMessage = async()=>{

if(!input.trim()) return;

const userMsg = {role:"user",content:input};

setMessages(prev=>[...prev,userMsg]);
setInput("");
setLoading(true);

try{

const res = await api.sendMessage(input);

if(res.success){

setMessages(prev=>[
...prev,
{role:"assistant",content:res.reply}
]);

}

}catch(e){

setMessages(prev=>[
...prev,
{role:"assistant",content:"⚠️ Error getting reply"}
]);

}

setLoading(false);

setTimeout(()=>{
chatRef.current?.scrollTo({
top:chatRef.current.scrollHeight,
behavior:"smooth"
})
},100);

};

return(

<div style={{
fontFamily:"'DM Sans','Segoe UI',sans-serif",
background:
"radial-gradient(ellipse at top right, rgba(253,230,138,0.35), transparent 70%), radial-gradient(ellipse at bottom left, rgba(254,215,170,0.35), transparent 70%), #fffdf5",
minHeight:"100vh"
}}>

<style>{CSS}</style>

{/* HEADER */}

<div style={{padding:"48px 24px 20px"}}>

<div style={{maxWidth:900,margin:"0 auto"}}>

<p style={{
fontSize:12,
color:"#92740a",
fontWeight:800,
textTransform:"uppercase",
letterSpacing:1.5
}}>
Urjamitra
</p>

<h1 style={{
fontFamily:"'Playfair Display',serif",
fontWeight:900,
fontSize:32,
margin:"6px 0",
color:"#451a03"
}}>
⚡ Energy Assistant
</h1>

<p style={{color:"#92400e",fontWeight:500}}>
Ask anything about energy trading
</p>

</div>
</div>

{/* CHAT */}

<div style={{
maxWidth:900,
margin:"0 auto",
padding:"0 24px 60px"
}}>

<div className="um-card" style={{
height:"65vh",
borderRadius:24,
padding:20,
display:"flex",
flexDirection:"column"
}}>

<div
ref={chatRef}
style={{
flex:1,
overflowY:"auto",
display:"flex",
flexDirection:"column",
gap:14
}}
>

{messages.map((msg,i)=>(
<div
key={i}
style={{
display:"flex",
justifyContent:
msg.role==="user"?"flex-end":"flex-start"
}}
>

<div className={msg.role==="user"?"msg-user":"msg-bot"}>
{msg.content}
</div>

</div>
))}

{loading && (
<div style={{display:"flex",gap:6}}>
<div style={{animation:"blink 1s infinite"}}>•</div>
<div style={{animation:"blink 1s infinite .2s"}}>•</div>
<div style={{animation:"blink 1s infinite .4s"}}>•</div>
</div>
)}

</div>

{/* INPUT */}

<div style={{
marginTop:16,
display:"flex",
gap:10
}}>

<input
value={input}
onChange={(e)=>setInput(e.target.value)}
placeholder="Ask something..."
style={{
flex:1,
padding:"12px 14px",
borderRadius:14,
border:"1px solid rgba(253,230,138,0.7)",
fontWeight:600,
outline:"none",
background:"rgba(255,255,255,0.8)"
}}
/>

<button
onClick={sendMessage}
style={{
padding:"12px 18px",
borderRadius:14,
border:"none",
fontWeight:800,
background:"linear-gradient(135deg,#f59e0b,#ea580c)",
color:"white",
cursor:"pointer"
}}
>
Send
</button>

</div>

</div>

</div>

</div>

);
}