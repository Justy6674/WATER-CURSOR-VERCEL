
export type MessageType = 'info' | 'tip' | 'reminder' | 'achievement';

export interface Message {
  id: string;
  text: string;
  type: MessageType;
  timestamp: number;
  read: boolean;
}
