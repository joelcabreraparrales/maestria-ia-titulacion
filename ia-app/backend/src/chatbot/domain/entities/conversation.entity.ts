import { ConversationProps, MessageProps } from "../interfaces/conversation.interface";
import { MessageEntity } from "./message.entity";

export class ConversationEntity {
  private readonly conversationId: number;
  private readonly conversationCode: string;
  private readonly credentialId: number;
  private readonly username: string;
  private title: string | null;
  private readonly isActive: boolean;
  private readonly createdAt: Date;
  private messages: MessageEntity[];

  constructor(props: ConversationProps, messages: MessageProps[] = []) {
    this.conversationId = props.conversationId;
    this.conversationCode = props.conversationCode;
    this.credentialId = props.credentialId;
    this.username = props.username;
    this.title = props.title;
    this.isActive = props.isActive;
    this.createdAt = props.createdAt;
    this.messages = messages.map((m) => new MessageEntity(m));
  }

  public getId(): number { return this.conversationId; }
  public getCode(): string { return this.conversationCode; }
  public getCredentialId(): number { return this.credentialId; }
  public getUsername(): string { return this.username; }
  public getTitle(): string | null { return this.title; }
  public getIsActive(): boolean { return this.isActive; }
  public getCreatedAt(): Date { return this.createdAt; }
  public getMessages(): MessageEntity[] { return this.messages; }

  public setTitle(title: string): void { this.title = title; }
}
