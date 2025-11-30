import mongoose, { Schema, Document } from 'mongoose';

interface IChatMessage extends Document {
  sessionId: mongoose.Types.ObjectId;
  quizId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId | null; // null for system messages
  username: string;
  userAvatar?: string;
  message: string;
  messageType: 'TEXT' | 'SYSTEM';
  isEdited: boolean;
  editedAt?: Date;
  timestamp: Date;
  createdAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>({
  sessionId: {
    type: Schema.Types.ObjectId,
    ref: 'QuizSession',
    required: true,
    index: true
  },
  quizId: {
    type: Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  username: {
    type: String,
    required: true
  },
  userAvatar: String,
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  messageType: {
    type: String,
    enum: ['TEXT', 'SYSTEM'],
    default: 'TEXT'
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
chatMessageSchema.index({ sessionId: 1, timestamp: 1 });

export const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', chatMessageSchema);
