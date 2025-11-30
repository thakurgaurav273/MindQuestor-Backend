# MindQuestor Backend 🚀

A real-time multiplayer quiz platform backend built with Node.js, Express, Socket.IO, and MongoDB.

## ✨ Features

- **Real-time Multiplayer Quizzes** - Live quiz sessions with WebSocket support
- **Secure Answer Validation** - Server-side answer checking to prevent cheating
- **JWT Authentication** - Secure user authentication and authorization
- **Quiz Management** - Create, join, and manage quiz sessions
- **Category-based Questions** - Organize questions by categories
- **Leaderboard System** - Track and display player rankings

## 🛠️ Tech Stack

- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Real-time:** Socket.IO
- **Authentication:** JWT (jsonwebtoken)
- **Security:** bcryptjs for password hashing

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone <repository-url>
cd MindQuestorBackend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:

```env
PORT=8080
MONGODB_URI=mongodb://localhost:27017/mindquestor
JWT_SECRET=your_super_secret_jwt_key_here
NODE_ENV=development
```

### 4. Run the application

**Development mode (with hot reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start at `http://localhost:8080`

## 📁 Project Structure

```
MindQuestorBackend/
├── controller/          # Request handlers
│   ├── auth.controller.ts
│   ├── question.controller.ts
│   ├── quiz.controller.ts
│   └── user.controller.ts
├── model/              # Database schemas
│   ├── question.model.ts
│   ├── quiz.model.ts
│   └── user.model.ts
├── routes/             # API routes
│   ├── auth.route.ts
│   ├── question.route.ts
│   ├── quiz.route.ts
│   └── user.route.ts
├── websocket/          # Socket.IO handlers
│   └── quizSocket.ts
├── index.ts            # Entry point
├── .env                # Environment variables
└── package.json
```

## 🔌 API Endpoints

### Authentication
- `POST /auth/signup` - Register new user
- `POST /auth/login` - Login user

### Quiz
- `POST /quiz/create` - Create new quiz
- `GET /quiz/getQuiz/:quizId` - Get quiz details (without answers)
- `GET /quiz/all` - Get all quizzes

### Questions
- `POST /question/create` - Create new question
- `GET /question/category/:category` - Get questions by category

## 🔄 WebSocket Events

### Client → Server
- `user:join` - User connects to socket
- `quiz:create` - Create quiz session
- `quiz:join` - Join existing quiz
- `quiz:start` - Host starts the quiz
- `quiz:answer` - Submit answer for validation

### Server → Client
- `quiz:created` - Quiz creation confirmation
- `quiz:joined` - Join confirmation
- `quiz:participant_joined` - New participant joined
- `quiz:started` - Quiz has started
- `quiz:isCorrect` - Answer validation result
- `quiz:error` - Error messages

## 🔒 Security Features

- Password hashing with bcrypt
- JWT-based authentication
- Server-side answer validation
- Protected API routes
- CORS configuration

## 📝 Scripts

```json
{
  "dev": "nodemon index.ts",
  "start": "ts-node index.ts",
  "build": "tsc"
}
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Gaurav**

---

Made with ❤️ using Node.js and Socket.IO
