import { DateManager } from "../../../plugins/dayjs/dayjs.class";
import { Session } from "../classes/session.class";
import { SessionConfig } from "../enums/session.enum";
import { SessionProps } from "../interfaces/session.props.interface";

export class SessionEntity extends Session {
  private readonly dateInit: string;
  private readonly dateEnd: string;
  private readonly credentialId: number;
  private readonly accessToken: string;
  private readonly sessionCode: string;
  private readonly sessionIsActive: boolean;

  constructor(sessionProps: SessionProps, dateManager: DateManager) {
    super();
    this.credentialId = sessionProps.credentialId;
    this.accessToken = sessionProps.accessToken;
    this.sessionCode = sessionProps.sessionCode;
    this.dateInit = dateManager.getStringDate(SessionConfig.DATE_FORMAT);
    this.dateEnd = dateManager.add(this.dateInit, SessionConfig.DURATION_HOURS, "hours");
    this.sessionIsActive = true;
  }

  public getCredential(): number {
    return this.credentialId;
  }

  public getCode(): string {
    return this.sessionCode;
  }

  public getToken(): string {
    return this.accessToken;
  }

  public getDateInit(): string {
    return this.dateInit;
  }

  public getDateEnd(): string {
    return this.dateEnd;
  }

  public getSessionActive(): boolean {
    return this.sessionIsActive;
  }
}
