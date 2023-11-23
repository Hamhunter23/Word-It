const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cors = require('cors'); //using cors because my client and server are on different ports
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Message = require('./models/Message');
const ws = require('ws');
const fs = require('fs');
dotenv.config();
jwtSecret = process.env.JWT_SECRET;
const bcryptSalt = bcrypt.genSaltSync(10);  // 10 is the number of rounds

mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log('MongoDB connected...'))
    .catch(err => console.error(err));
const app = express();
app.use('/uploads', express.static(__dirname+'/uploads'));
app.use(express.json());
app.use(cookieParser());
app.use(cors({   //linking server and client
    credentials : true,
    origin: process.env.CLIENT_URL,
}));

async function getUserDataFromRequest(req) {
    return new Promise((resolve, reject) => {
        const token = req.cookies?.token; // to use callback and to return values using this async function we are using a promise function.
        if (token) {
            jwt.verify(token, jwtSecret, {}, (err, userData) => {
            if (err) throw err;
            resolve(userData);
        });
        } else {
            reject('no token');
        }
    }); 
}

app.get('/test', (req, res) => {
    res.json('test ok');
});

app.get('/messages/:userId', async (req,res) => {
    // res.json(req.params);
    const {userId} = req.params;
    // our userID is with the token. we have to get it from there using jwt
    const userData = await getUserDataFromRequest(req); //let it be stable
    const ourUserId = userData.userId;
    const messages = await Message.find({
        sender: {$in: [userId, ourUserId]},
        recipient: {$in: [userId, ourUserId]}, //to fetch the history of messages between two users
    }).sort({createdAt: 1}); //sorts the messages in the order of creation
    res.json(messages);
})

app.get('/profile',(req,res)=>{
    const token = req.cookies?.token;
    if (token) {
        jwt.verify(token, jwtSecret, {}, (err, userData) => {
            if (err) throw err;
            res.json(userData);
        });
    }  else {
        res.status(401).json('no token');
    }
});

app.get('/people', async (req, res) => {
    const users = await User.find({},{'_id':1,username:1}); //this is a promise
    res.json(users);
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const foundUser = await User.findOne({username});
    if (foundUser) {
        const passOk = bcrypt.compareSync(password, foundUser.password);
        if (passOk) {
            jwt.sign({userId: foundUser._id, username}, jwtSecret, {}, (err, token) => {
                res.cookie('token', token,{sameSite:'none', secure:true}).json({
                    id: foundUser._id,
                });
            });
        }
    }
});

app.post('/logout', (req, res) => {
    res.cookie('token', '', { expires: new Date(0), sameSite: 'none', secure: true }).json('ok');
});

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = bcrypt.hashSync(password , bcryptSalt);
        const createdUser = await User.create({ 
            username: username, 
            password: hashedPassword
        });
        jwt.sign({userId: createdUser._id, username}, jwtSecret, {}, (err, token) => {
            if (err) throw err;
            res.cookie('token', token, {sameSite:'none', secure:true}).status(201).json({
                id: createdUser._id,
            });
        });
    } catch (err) {
        if (err.code === 11000) {
            res.status(400).json({ message: 'Username already exists' });
        } else {
            throw err;
        }
    }
});
const server = app.listen(4000);
const wss = new ws.WebSocketServer({ server });
wss.on('connection', (connection, req) => { //web socket is a protocol desgned for bidrectional web communication in real time
    // reading username and if from the cookie for the connection

    function notifyAboutOnlinePeople() {
        [...wss.clients].forEach(client => {
            client.send(JSON.stringify({
                online: [...wss.clients].map(c => ({userId: c.userId, username: c.username})),
            }
            ));
        });
    }

    connection.isAlive = true;
    connection.timer = setInterval(() => {
        connection.ping();
        connection.deathTimer = setTimeout(() => {
            connection.isAlive = false;
            clearInterval(connection.timer);
            connection.terminate();
            notifyAboutOnlinePeople();
        }, 1000);
    }, 5000);

    connection.on('pong', () => {
        clearTimeout(connection.deathTimer);
    });

    const cookies = req.headers.cookie;
    if (cookies) {
        const tokenCookieString = cookies.split(';').find(str => str.startsWith('token='));
        if (tokenCookieString) {
            const token = tokenCookieString.split('=')[1];
            if (token) {
                jwt.verify(token, jwtSecret,{},(err,userData)=>{
                    if (err) throw err;
                    const {userId,username} = userData;
                    connection.userId = userId;
                    connection.username = username;
                });
            }
        }
    }

    connection.on('message', async (message) => {
        const messageData = JSON.parse(message.toString());
        const {recipient, text, file} = messageData;// the message is an object. we have to convert it to a string.\
        let filename = null;
        if (file) {
            const parts = file.name.split('.'); //daddy.png
            const ext = parts[parts.length - 1];
            filename = Date.now() + '.' + ext; 
            const path = __dirname + '/uploads/' + filename;
            const bufferData = Buffer.from(file.data, 'base64');
            fs.writeFile(path, bufferData, { encoding: 'binary' }, (err) => {
                if (err) {
                    console.error('Error writing file', err);
                } else {
                    console.log('file saved: ' + path);
                }
            });
        }
        if (recipient && (text || file)) {
            const messageDoc = await Message.create({
                sender: connection.userId,
                recipient,
                text,
                file: file ? filename : null,
            });

            [...wss.clients] 
                .filter(c => c.userId === recipient) //filtering the clients to find the recipient instead of USING FIND METHOD keeping in mind the multiple connections
                .forEach(c => c.send(JSON.stringify({text,sender: connection.userId,recipient,file: file ? filename : null,_id: messageDoc._id})));
        } //id's in mongoose databses are stored as _id
    });

    // notify everyone about online people (when someone connects)
    notifyAboutOnlinePeople(); //when i am developing this app it shows that there are two connections this is because when create-react-app is in dev mode, it renders everything twice
});
//username:chatapp
//password: RrBUnM9vSZoRVpak
//Nodemon is a utility that helps you develop Node.js applications by 
//automatically restarting your Node.js application when it detects changes 
//in the source code
//5:09:35