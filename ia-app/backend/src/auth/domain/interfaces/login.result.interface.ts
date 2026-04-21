import { Session } from "../classes/session.class";
import { UserProfile } from "./user.profile.interface";

export interface LoginResult {
  session: Session;
  roles: string[];
  profile: UserProfile;
}
