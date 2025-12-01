import mongoose, { Schema, Document } from 'mongoose';

interface IChatMessage extends Document {
  quizId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId | null;
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
  quizId: {
    type: Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  senderId: {
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

chatMessageSchema.index({timestamp: 1 });

export const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', chatMessageSchema);
