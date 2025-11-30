export type Question = {
    unique_id: string;
    category: string;
    subCategory: string;
    question: string;
    options: string[];
    correct_answer_index: number;
    hint: string;
}