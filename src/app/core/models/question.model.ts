export interface Question {
  id: number;
  text: string;
  category: 'valores' | 'comunicacion' | 'metas' | 'intereses' | 'estilo';
  weight: number;
}

export interface Answer {
  questionId: number;
  value: number;
}
