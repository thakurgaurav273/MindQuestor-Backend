import { Server, Socket } from 'socket.io';
import { Quiz } from '../model/quiz.model';

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

    // User joins socket connection
    socket.on('user:join', (data: { userId: string; userName: string }) => {
      userSockets.set(data.userId, socket.id);
      console.log(`${data.userName} connected with socket ${socket.id}`);
    });

    // Create a new quiz session (called AFTER DB creation)
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

      // Create a room for this quiz
      socket.join(data.quizId);

      // Emit quiz created event back to host
      socket.emit('quiz:created', {
        quizId: data.quizId,
        message: 'Quiz created successfully',
        quiz: newQuiz,
      });

      console.log(`Quiz created: ${data.quizId} by ${data.hostName}`);
    });

    // Join existing quiz
    socket.on('quiz:join', (data: { quizId: string; participantId: string; participantName: string }) => {
      console.log('quiz:join received', { quizId: data.quizId, participantId: data.participantId, participantName: data.participantName });

      const quiz = quizSessions.get(data.quizId);

      if (!quiz) {
        console.log(`Quiz not found: ${data.quizId}`);
        console.log('Available quizzes:', Array.from(quizSessions.keys()));
        socket.emit('quiz:error', { message: 'Quiz not found' });
        return;
      }

      if (quiz.status !== 'waiting') {
        console.log(`Quiz ${data.quizId} is not in waiting state. Status: ${quiz.status}`);
        socket.emit('quiz:error', { message: 'Quiz has already started' });
        return;
      }

      // Check if participant already joined
      const alreadyJoined = quiz.participants.some(p => p.id === data.participantId);
      if (alreadyJoined) {
        console.log(`Participant ${data.participantName} already joined`);
        // Still send success response so they can see the waiting room
        socket.join(data.quizId);
        socket.emit('quiz:joined', {
          quizId: data.quizId,
          quiz: {
            quizId: quiz.quizId,
            hostName: quiz.hostName,
            numQuestions: quiz.numQuestions,
            participants: quiz.participants,
            status: quiz.status,
            currentQuestion: quiz.currentQuestion,
            createdAt: quiz.createdAt,
          },
        });
        return;
      }

      // Add participant
      quiz.participants.push({
        id: data.participantId,
        name: data.participantName,
        socketId: socket.id,
      });

      socket.join(data.quizId);

      console.log(`${data.participantName} successfully joined quiz ${data.quizId}`);
      console.log(`Quiz now has ${quiz.participants.length} participants`);

      // Send confirmation to the joiner
      socket.emit('quiz:joined', {
        quizId: data.quizId,
        quiz: {
          quizId: quiz.quizId,
          hostName: quiz.hostName,
          numQuestions: quiz.numQuestions,
          participants: quiz.participants,
          status: quiz.status,
          currentQuestion: quiz.currentQuestion,
          createdAt: quiz.createdAt,
        },
      });

      // Notify all participants in the room about the new joiner
      io.to(data.quizId).emit('quiz:participant_joined', {
        participantName: data.participantName,
        participantId: data.participantId,
        participants: quiz.participants.map((p) => ({ id: p.id, name: p.name })),
        totalParticipants: quiz.participants.length,
      });

      console.log(`Broadcasted participant_joined to room ${data.quizId}`);
    });

    // Start the quiz
    socket.on('quiz:start', (data: { quizId: string; hostId: string }) => {
      console.log('quiz:start received for:', data.quizId, 'hostId:', data.hostId);
      const quiz = quizSessions.get(data.quizId);

      if (!quiz) {
        console.log(`Quiz not found: ${data.quizId}`);
        socket.emit('quiz:error', { message: 'Quiz not found' });
        return;
      }

      // Verify the person starting the quiz is the host
      if (data.hostId !== quiz.hostId) {
        console.log(`Auth failed: User ${data.hostId} tried to start quiz hosted by ${quiz.hostId}`);
        socket.emit('quiz:error', { message: 'Only host can start the quiz' });
        return;
      }

      quiz.status = 'in_progress';
      quiz.currentQuestion = 0;

      // Broadcast quiz started to all participants
      io.to(data.quizId).emit('quiz:started', {
        quizId: data.quizId,
        totalQuestions: quiz.numQuestions,
        participants: quiz.participants.map((p) => ({ id: p.id, name: p.name })),
      });

      console.log(`Quiz ${data.quizId} started with ${quiz.participants.length} participants`);
    });

    // Receive answer from participant
    // socket.on('quiz:answer', (data: { quizId: string; participantId: string; questionIndex: number; answer: string; isCorrect: boolean; timeSpent: number }) => {
    //   const quiz = quizSessions.get(data.quizId);

    //   if (!quiz) {
    //     socket.emit('quiz:error', { message: 'Quiz not found' });
    //     return;
    //   }

    //   const answers = quizAnswers.get(data.quizId) || [];
    //   answers.push({
    //     quizId: data.quizId,
    //     participantId: data.participantId,
    //     questionIndex: data.questionIndex,
    //     answer: data.answer,
    //     isCorrect: data.isCorrect,
    //     timeSpent: data.timeSpent,
    //   });

    //   quizAnswers.set(data.quizId, answers);

    //   // Notify all participants about who answered
    //   io.to(data.quizId).emit('quiz:participant_answered', {
    //     participantId: data.participantId,
    //     questionIndex: data.questionIndex,
    //   });

    //   // Check if all participants answered
    //   const answeredCount = new Set(
    //     answers.filter((a) => a.questionIndex === data.questionIndex).map((a) => a.participantId)
    //   ).size;

    //   if (answeredCount === quiz.participants.length) {
    //     // Move to next question
    //     quiz.currentQuestion++;

    //     if (quiz.currentQuestion >= quiz.numQuestions) {
    //       // Quiz completed
    //       quiz.status = 'completed';
    //       io.to(data.quizId).emit('quiz:completed', {
    //         answers: quizAnswers.get(data.quizId),
    //         participants: quiz.participants.map((p) => ({ id: p.id, name: p.name })),
    //       });
    //     } else {
    //       // Send next question to all participants
    //       io.to(data.quizId).emit('quiz:next_question', {
    //         questionIndex: quiz.currentQuestion,
    //       });
    //     }
    //   }
    // });

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

    // Get quiz leaderboard
    socket.on('quiz:leaderboard', (data: { quizId: string }) => {
      const answers = quizAnswers.get(data.quizId) || [];
      const quiz = quizSessions.get(data.quizId);

      if (!quiz) {
        socket.emit('quiz:error', { message: 'Quiz not found' });
        return;
      }

      // Calculate scores
      const scores: { [key: string]: { name: string; correct: number; total: number; timeSpent: number } } = {};

      quiz.participants.forEach((p) => {
        scores[p.id] = { name: p.name, correct: 0, total: 0, timeSpent: 0 };
      });

      answers.forEach((answer) => {
        if (scores[answer.participantId]) {
          scores[answer.participantId].total++;
          if (answer.isCorrect) {
            scores[answer.participantId].correct++;
          }
          scores[answer.participantId].timeSpent += answer.timeSpent;
        }
      });

      const leaderboard = Object.values(scores)
        .map((score) => ({
          ...score,
          accuracy: score.total > 0 ? ((score.correct / score.total) * 100).toFixed(1) : 0,
        }))
        .sort((a, b) => b.correct - a.correct || a.timeSpent - b.timeSpent);

      socket.emit('quiz:leaderboard', leaderboard);
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);

      // Remove user from quiz if they're in one
      for (const [quizId, quiz] of quizSessions.entries()) {
        const participantIndex = quiz.participants.findIndex((p) => p.socketId === socket.id);
        if (participantIndex !== -1) {
          const participant = quiz.participants[participantIndex];
          quiz.participants.splice(participantIndex, 1);

          // Notify remaining participants
          io.to(quizId).emit('quiz:participant_left', {
            participantName: participant.name,
            participantId: participant.id,
            participants: quiz.participants.map((p) => ({ id: p.id, name: p.name })),
            totalParticipants: quiz.participants.length,
          });

          console.log(`${participant.name} left quiz ${quizId}`);

          // If host left and quiz hasn't started, delete the quiz
          if (participant.id === quiz.hostId && quiz.status === 'waiting') {
            io.to(quizId).emit('quiz:host_left', {
              message: 'Host has left. Quiz cancelled.',
            });
            quizSessions.delete(quizId);
            quizAnswers.delete(quizId);
            console.log(`Quiz ${quizId} deleted due to host leaving`);
          }
        }
      }
    });
  });
};

export { quizSessions, quizAnswers };