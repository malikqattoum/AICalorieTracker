export interface CoachAnswer {
  id: number;
  user_id: number;
  question: string;
  answer: string;
  rating?: number | null;
  comment?: string | null;
  created_at?: Date;
}