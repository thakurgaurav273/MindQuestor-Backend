import { Server, Socket } from 'socket.io';
import { Quiz } from '../model/quiz.model';
import { updateUserQuizHistory } from '../controller/user.controller'; // RESTORED IMPORT

interface QuizSession {
  quizId: string;
  hostId: string;
  hostName: string;
  numQuestions: number;
  participants: { id: string; name: string; socketId: string }[];
  status: 'waiting' | 'in_progress' | 'completed';
  currentQuestion: number;
  createdAt: Date;
}

interface QuizAnswer {
  quizId: string;
  participantId: string;
  questionIndex: number;
  answer: string;
  isCorrect: boolean;
  timeSpent: number;
}

const quizSessions = new Map<string, QuizSession>();
const userSockets = new Map<string, string>(); // userId -> socketId
const quizAnswers = new Map<string, QuizAnswer[]>();

export const setupQuizSocketHandlers = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log('User connected:', socket.id);

    // Track user's latest active socket connection
    socket.on('user:join', (data: { userId: string; userName: string }) => {
      userSockets.set(data.userId, socket.id);
      console.log(`${data.userName} connected with socket ${socket.id}`);
    });

    // Create a new quiz session (Host only)
    socket.on('quiz:create', (data: { quizId: string; hostId: string; hostName: string; numQuestions: number }) => {
      const newQuiz: QuizSession = {
        quizId: data.quizId,
        hostId: data.hostId,
        hostName: data.hostName,
        numQuestions: data.numQuestions,
        participants: [
          {
            id: data.hostId,
            name: data.hostName,
            socketId: socket.id,
          },
        ],
        status: 'waiting',
        currentQuestion: 0,
        createdAt: new Date(),
      };

      quizSessions.set(data.quizId, newQuiz);
      quizAnswers.set(data.quizId, []);
      socket.join(data.quizId);

      socket.emit('quiz:created', { quizId: data.quizId, message: 'Quiz created successfully', quiz: newQuiz });
      console.log(`✓ Quiz created: ${data.quizId} by ${data.hostName}`);
    });

    // Join existing quiz (Participant or Host)
    socket.on('quiz:join', async (data: { quizId: string; participantId: string; participantName: string }) => {
      console.log('=== QUIZ:JOIN RECEIVED ===');
      
      const quiz = quizSessions.get(data.quizId);

      if (!quiz) {
        console.log(`❌ Quiz not found: ${data.quizId}`);
        socket.emit('quiz:error', { message: 'Quiz not found' });
        return;
      }

      const existingParticipant = quiz.participants.find(p => p.id === data.participantId);
      
      if (existingParticipant) {
        console.log(`⚠ Participant ${data.participantName} already exists - updating socket ID`);
        existingParticipant.socketId = socket.id;
      } else {
        console.log(`✓ Adding new participant: ${data.participantName}`);
        quiz.participants.push({
          id: data.participantId,
          name: data.participantName,
          socketId: socket.id,
        });
      }

      // CRITICAL UPDATE 1: Update global userSockets map on join
      userSockets.set(data.participantId, socket.id);
      console.log(`✓ userSockets updated for ${data.participantName} to ${socket.id}`);

      socket.join(data.quizId);
      console.log(`✓ ${data.participantName} joined room ${data.quizId}. Total participants: ${quiz.participants.length}`);
      
      // RESTORED FUNCTIONALITY: Update database quiz history
      try {
        const dbQuiz = await Quiz.findOne({ inviteCode: data.quizId });

        if (dbQuiz) {
          await updateUserQuizHistory(data.participantId, dbQuiz._id.toString());
          console.log(`✓ Updated quiz history for user ${data.participantId}`);
        } else {
          console.log(`⚠ Warning: Quiz not found in database with invite code: ${data.quizId}`);
        }
      } catch (error) {
        console.error('❌ Error updating user quiz history:', error);
      }
      // END RESTORED FUNCTIONALITY

      socket.emit('quiz:joined', {
        quizId: data.quizId,
        quiz: { quizId: quiz.quizId, hostName: quiz.hostName, participants: quiz.participants },
      });

      if (!existingParticipant) {
        io.to(data.quizId).emit('quiz:participant_joined', {
          participantName: data.participantName,
          participantId: data.participantId,
          participants: quiz.participants.map((p) => ({ id: p.id, name: p.name })),
          totalParticipants: quiz.participants.length,
        });
        console.log(`✓ Broadcasted participant_joined to room ${data.quizId}`);
      }

      console.log('=== QUIZ:JOIN COMPLETE ===\n');
    });

    // Rejoin handler - for when users navigate between pages
    socket.on('quiz:rejoin', (data: { quizId: string; participantId: string }) => {
      console.log('=== QUIZ:REJOIN RECEIVED ===');
      
      const quiz = quizSessions.get(data.quizId);
      if (!quiz) {
        console.log(`❌ Quiz not found for rejoin: ${data.quizId}`);
        socket.emit('quiz:error', { message: 'Quiz session not found' });
        return;
      }

      const participant = quiz.participants.find(p => p.id === data.participantId);
      if (!participant) {
        console.log(`❌ Participant ${data.participantId} not found in quiz ${data.quizId}`);
        socket.emit('quiz:error', { message: 'You are not a participant of this quiz' });
        return;
      }

      const oldSocketId = participant.socketId;
      participant.socketId = socket.id;
      
      // CRITICAL UPDATE 2: Update global userSockets map on rejoin
      userSockets.set(data.participantId, socket.id);

      socket.join(data.quizId);
      
      console.log(`✓ ${participant.name} rejoined room ${data.quizId}. Socket updated: ${oldSocketId} → ${socket.id}`);
      
      socket.emit('quiz:rejoined', {
        quizId: data.quizId,
        message: 'Successfully rejoined quiz room',
      });

      console.log('=== QUIZ:REJOIN COMPLETE ===\n');
    });

    // Start the quiz
    socket.on('quiz:start', (data: { quizId: string; hostId: string }) => {
      console.log('quiz:start received for:', data.quizId);
      const quiz = quizSessions.get(data.quizId);

      if (!quiz || data.hostId !== quiz.hostId) {
        socket.emit('quiz:error', { message: 'Unauthorized or Quiz not found' });
        return;
      }

      quiz.status = 'in_progress';
      quiz.currentQuestion = 0;

      io.to(data.quizId).emit('quiz:started', {
        quizId: data.quizId,
        totalQuestions: quiz.numQuestions,
        participants: quiz.participants.map((p) => ({ id: p.id, name: p.name })),
      });

      console.log(`Quiz ${data.quizId} started with ${quiz.participants.length} participants`);
    });

    // Receive answer from participant (omitted detailed log)
    socket.on("quiz:answer", async (data) => {
      console.log("Received answer data:", data);

      try {
        // Get quiz from session or database
        const quiz = await Quiz.findOne({ inviteCode: data.quizId });

        if (!quiz) {
          console.log("Quiz not found:", data.quizId);
          socket.emit('quiz:error', { message: 'Quiz not found' });
          return;
        }

        // Find the question in the embedded questions array
        const question = quiz.questions.find(
          (q: any) => q._id.toString() === data.questionId
        );

        if (!question) {
          socket.emit('quiz:error', { message: 'Question not found' });
          return;
        }
        // Check if correct
        const correctAnswer = question.options[question.correctAnswerIndex];
        const isCorrect = data.answer === correctAnswer;

        socket.emit('quiz:isCorrect', {
          questionId: data.questionId,
          isCorrect: isCorrect,
        });

      } catch (error) {
        console.error("Error:", error);
        socket.emit('quiz:error', { message: 'Error processing answer' });
      }
    });

    // Handle messages
    socket.on("message:sent", (data: { quizId: string, senderId: string, username: string, text: string, messageType: string }) => {
      console.log(`Incoming chat message in ${data.quizId} from ${data.username}`);
      
      io.to(data.quizId).emit("message:received", {
        quizId: data.quizId,
        senderId: data.senderId,
        username: data.username,
        text: data.text,
        messageType: data.messageType,
        timestamp: Date.now(),
      });
      console.log(`✓ Message broadcasted to room ${data.quizId}`);
    });

    // Debug: Check room membership
    socket.on('debug:check_rooms', (data: { quizId: string }) => {
      const rooms = io.sockets.adapter.rooms;
      const quizRoom = rooms.get(data.quizId);
      
      console.log('=== ROOM DEBUG ===');
      console.log('Quiz ID:', data.quizId);
      console.log('Sockets in room:', quizRoom ? Array.from(quizRoom) : []);
      console.log('==================\n');
    });

    // Disconnect handler - CRITICAL FIX
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);

      let disconnectedParticipantId: string | null = null;
      let participantName: string | null = null;
      let quizIdWithParticipant: string | null = null;

      // 1. Find the user ID and quiz ID associated with the disconnecting socket
      for (const [quizId, quiz] of quizSessions.entries()) {
        const participant = quiz.participants.find((p) => p.socketId === socket.id);
        if (participant) {
            disconnectedParticipantId = participant.id;
            participantName = participant.name;
            quizIdWithParticipant = quizId;
            break; 
        }
      }

      // 2. If a participant was found, check if they have a replacement socket (reconnection)
      if (disconnectedParticipantId && participantName && quizIdWithParticipant) {
        const currentSocketId = userSockets.get(disconnectedParticipantId);
        
        // CRITICAL CHECK: Is the user active on a DIFFERENT, non-disconnected socket?
        const isReconnected = currentSocketId && currentSocketId !== socket.id && io.sockets.adapter.sids.has(currentSocketId);

        if (isReconnected) {
            // Found a replacement socket! This is a fast reconnect (e.g., page navigation).
            console.log(`⚠ ${participantName} (${disconnectedParticipantId}) disconnected (socket ${socket.id}), but is active on socket ${currentSocketId}. Skipping removal and broadcast.`);
            return; // STOP EXECUTION
        }
      }

      // 3. If no replacement socket was found, proceed with removal and broadcast (true disconnect)
      if (quizIdWithParticipant) {
          const quiz = quizSessions.get(quizIdWithParticipant)!;
          const participantIndex = quiz.participants.findIndex((p) => p.socketId === socket.id);
          
          if (participantIndex !== -1) {
              const participant = quiz.participants[participantIndex];
              
              // Remove participant from the quiz session list
              quiz.participants.splice(participantIndex, 1);
              
              // Remove user from userSockets map (since this was the last known connection)
              if (userSockets.get(participant.id) === socket.id) {
                  userSockets.delete(participant.id);
              }

              // Notify remaining participants
              io.to(quizIdWithParticipant).emit('quiz:participant_left', {
                participantName: participant.name,
                participantId: participant.id,
                participants: quiz.participants.map((p) => ({ id: p.id, name: p.name })),
                totalParticipants: quiz.participants.length,
              });

              console.log(`✓ ${participant.name} left quiz ${quizIdWithParticipant}`);

              // Handle host leaving
              if (participant.id === quiz.hostId && quiz.status === 'waiting') {
                io.to(quizIdWithParticipant).emit('quiz:host_left', { message: 'Host has left. Quiz cancelled.' });
                quizSessions.delete(quizIdWithParticipant);
                quizAnswers.delete(quizIdWithParticipant);
                console.log(`Quiz ${quizIdWithParticipant} deleted due to host leaving`);
              }
          }
      }
    });
  });
};

export { quizSessions, quizAnswers };