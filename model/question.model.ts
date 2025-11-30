import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
    unique_id: { type: String, required: true, unique: true },
    category: { type: String, required: true },
    subcategory: { type: String, required: true },
    question: { type: String, required: true },
    options: { type: [String], required: true },
    correct_answer_index: { type: Number, required: true },
    hint: { type: String, required: false },
}, {
    timestamps: true
})

const QuestionModel = mongoose.model('Question', questionSchema);

export default QuestionModel;