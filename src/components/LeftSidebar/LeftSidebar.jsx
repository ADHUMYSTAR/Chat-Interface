import React, { useContext, useState } from 'react'
import './LeftSidebar.css'
import assets from '../../assets/assets'
import { useNavigate } from 'react-router-dom'
import {arrayUnion, collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where} from 'firebase/firestore'
import { db } from '../../config/firebase';
import { AppContext } from '../../context/AppContext'
import { toast } from 'react-toastify'

const LeftSidebar = () => {
    const navigate=useNavigate();
    const {userData,chatData,chatUser,setChatUser,setMessagesId,messagesId}=useContext(AppContext);
    const [user,setUser]=useState(null);
    const [showSearch,setShowSearch]=useState(false);
    const inputHandler=async(e)=>{
        try{
            const input=e.target.value;
            if(input){
                setShowSearch(true);
                const userRef=collection(db,'users');
                const q=query(userRef,where("username","==",input.toLowerCase()));
                const querySnap=await getDocs(q);
                if(!querySnap.empty && querySnap.docs[0].data().id!==userData.id){
                    console.log(querySnap.docs[0].data());
                    let userExist=false;
                    chatData.map((user)=>{
                        if(user.rId===querySnap.docs[0].data().id){
                            userExist=true;
                        }
                    })
                    if(!userExist){
                        setUser(querySnap.docs[0].data());
                    }
                }
                else{
                    setUser(null);
                }
            }
            else{
                setShowSearch(false);
            }
        }
        catch(error){
            console.error("Search error:", error);
        }
    }

    const addChat =async()=>{
        const messagesRef=collection(db,"messages");
        const chatsRef=collection(db,"chats");
        try{
            const newMessageRef=doc(messagesRef);
            await setDoc(newMessageRef,{
                createAt:serverTimestamp(),
                messages:[]
            })
            await updateDoc(doc(chatsRef,userData.id),{
                chatsData:arrayUnion({
                    messageId:newMessageRef.id,
                    lastMessage:"",
                    rId:user.id,
                    updatedAt:Date.now(),
                    messageSeen:true
                })
            })
            await updateDoc(doc(chatsRef,user.id),{
                chatsData:arrayUnion({
                    messageId:newMessageRef.id,
                    lastMessage:"",
                    rId:userData.id,
                    updatedAt:Date.now(),
                    messageSeen:true
                })
            })
        }
        catch(error){
            toast.error(error.message);
            console.error(error);
        }
    }

    const setChat=async(item)=>{
        try{
            setMessagesId(item.messageId);
            setChatUser(item);
            const userChatsRef=doc(db,'chats',userData.id);
            const userChatsSnapshot=await getDoc(userChatsRef);
            const userChatsData=userChatsSnapshot.data();
            const chatIndex=userChatsData.chatsData.findIndex((c)=>c.messageId===item.messageId);
            userChatsData.chatsData[chatIndex].messageSeen=true;
            await updateDoc(userChatsRef,{
                chatsData:userChatsData.chatsData
            })
        }
        catch(error){
            toast.error(error.message);
        }
    }
  return (
    <div className='ls'>
        <div className='ls-top'>
            <div className='ls-nav'>
                <img src={assets.logo} className='side-logo' style={{height: "35px",width:"35px"}}/>
                <h3 className='chat-app'>Chat app</h3>
                <div className='menu'>
                    <img src={assets.menu}/>
                    <div className='sub-menu'>
                        <p onClick={()=>navigate('/profile')}>Edit profile</p>
                        <hr/>
                        <p>Logout</p>
                    </div>
                </div>
            </div>
            <div className='ls-search'>
            <img src={assets.search_icon} style={{height: "20px"}}/>
            <input onChange={inputHandler} type="text" placeholder='Search here...'/>
            </div>
        </div>
        <div className='ls-list'>
            {showSearch && user
            ?<div onClick={addChat} className='friends add-user'>
                <img src={user.avatar}/>
                <p>{user.name}</p>

            </div>
            :
            chatData && Array.isArray(chatData) && chatData.map((item, index) => {
                const avatar = item?.userData?.avatar || assets.user;
                const name = item?.userData?.name || "Unknown User";
                const lastMessage = item?.lastMessage || "";
              
                return (
                  <div onClick={()=>setChat(item)} key={index} className={`friends ${item.messageSeen || item.messageId===messagesId? "":"border"}`}>
                    <img src={avatar} style={{ height: "40px" }} />
                    <div>
                      <p>{name}</p>
                      <span>{lastMessage}</span>
                    </div>
                  </div>
                );
              })
            }
        </div>
    </div>
  )
}

export default LeftSidebar