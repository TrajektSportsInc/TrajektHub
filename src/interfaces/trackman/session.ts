export interface ITrackmanSessionData {
  Version: string;
  Time: string;
  SessionId: string;
  SessionType: string;
  Location: Location;
  Batters: Batter[];
  Pitchers: Pitcher[];
  SessionState: SessionState;
}

export interface ITrackmanSession {
  id: string;
  subject: string;
  data: ITrackmanSessionData;
  eventType: string;
  dataVersion: string;
  metadataVersion: string;
  eventTime: string;
  topic: string;
}

interface Location {
  Venue: Venue;
  Field: Field;
}

interface Venue {
  Name: string;
}

interface Field {
  Name: string;
}

interface Batter {
  ForeignId: string;
  // format: "[last name], [first name]"
  NameRef: string;
}

interface Pitcher {
  ForeignId: string;
  // format: "[last name], [first name]"
  NameRef: string;
}

interface SessionState {
  State: string;
  SessionStartedUtc: string;
  SessionStartedLocal: string;
  SessionEndedUtc: string;
  SessionEndedLocal: string;
}
