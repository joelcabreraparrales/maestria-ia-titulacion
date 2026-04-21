import { MessageProps } from "../interfaces/conversation.interface";

export class MessageEntity {
  private readonly messageId: number;
  private readonly messageCode: string;
  private readonly conversationId: number;
  private readonly role: "user" | "assistant";
  private readonly content: string;
  private readonly createdAt: Date;

  constructor(props: MessageProps) {
    this.messageId = props.messageId;
    this.messageCode = props.messageCode;
    this.conversationId = props.conversationId;
    this.role = props.role;
    this.content = props.content;
    this.createdAt = props.createdAt;
  }

  public getId(): number { return this.messageId; }
  public getCode(): string { return this.messageCode; }
  public getConversationId(): number { return this.conversationId; }
  public getRole(): "user" | "assistant" { return this.role; }
  public getContent(): string { return this.content; }
  public getCreatedAt(): Date { return this.createdAt; }
}
