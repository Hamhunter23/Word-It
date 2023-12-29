import axios from "axios";
import React, { useContext, useState } from "react";
import { UserContext } from "./UserContext.jsx";
import Logo from "./Logo.jsx";
export default function RegisterAndLoginForm() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoginOrRegister, setIsLoginOrRegister] = useState('register'); // ['login', 'register'
    const {setUsername:setLoggedInUsername, setId} = useContext(UserContext);
    async function handleSubmit(ev) {
        ev.preventDefault();
        const url = isLoginOrRegister === 'register' ? 'register' : 'login';
        try {
            const {data} = await axios.post(url,{username, password});
            setLoggedInUsername(username);
            setId(data.id);
        } catch (err) {
            if (err.response) {
                console.error(err.response.data); // Log the server's response
            } else {
                console.error(err); // Log the error
            }
        }
    }
    return (
            <div className="bg-blue-100 h-screen flex flex-col items-center justify-center">
                <Logo />
                <form className="w-64 mx-auto mb-12" onSubmit={handleSubmit}>
                    <input value={username} onChange={ev => setUsername(ev.target.value)}
                    type="text" 
                    placeholder="username" 
                    className="block w-full rounded-sm p-2 mb-2 border"/>
                    <input value={password} onChange={ev => setPassword(ev.target.value)}
                    type="password" 
                    placeholder="password" 
                    className="block w-full rounded-sm p-2 mb-2 border" />
                    <button className="bg-blue-500 text-white block w-full rounded-sm p-2">
                        {isLoginOrRegister === 'register' ? 'Register' : 'Login'}
                    </button> 
                    <div className="text-center mt-2">
                        {isLoginOrRegister === 'register' && (
                            <div>
                                Already a member? <button className="underline" onClick={() =>setIsLoginOrRegister('login')}>
                                    Login here
                                </button>
                            </div>
                        )}
                        {isLoginOrRegister === 'login' && (
                            <div>
                                Don't have an account? 
                                <button className="underline" onClick={() =>setIsLoginOrRegister('register')}>
                                    Register here
                                </button>
                            </div>
                        )}
                    </div>
                </form>
            </div>
    ); // got a cors error while submitting the form. did not specify what kind of apps can talk with our api
}