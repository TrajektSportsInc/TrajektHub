export interface ITrackmanBall {
  id: string;

  subject: string;

  data: {
    Version: string;

    // e.g. "2018-02-22T20:39:17.312076160Z"
    Time: string;

    // e.g. "abc93729-ac13-11e9-9ed5-989096a0d95d"
    SessionId: string;

    // e.g. "53427fe0-52e3-4017-9aa2-236c87718f6c"
    PlayId: string;

    // e.g. "b2cc3109-7410-4150-867a-7b1bfb0fbc0c"
    TrackId: string;

    // e.g. "2019-09-04T14:37:14.531193Z"
    TrackStartTime: string;

    Kind: 'Pitch' | 'Hit';

    // only populated if Kind === 'Pitch'
    Pitch?: ITrackmanPitch;

    // only populated if Kind === 'Hit'
    Hit?: ITrackmanHit;
  };

  eventType: string;
  dataVersion: string;
  metadataVersion: string;
  eventTime: string;
  topic: string;
}

export interface ITrackmanPitch {
  Release: ITrackmanRelease;
  Location: ITrackmanLocation;
  Movement: ITrackmanMovement;
  NineP: ITrackmanNineP;
}

export interface ITrackmanRelease {
  // ftps
  Speed: number;
  Height: number;
  Side: number;

  Extension?: number;
  VerticalAngle?: number;
  HorizontalAngle?: number;

  SpinRate?: number;
  SpinAxis3dTilt?: string;
  SpinAxis3dActiveSpinRate?: number;
  SpinAxis3dSpinEfficiency?: number;
  SpinAxis3dTransverseAngle?: number;
  SpinAxis3dLongitudinalAngle?: number;
}

export interface ITrackmanLocation {
  Time: number;
  // feet
  Height: number;
  // feet
  Side: number;
}

export interface ITrackmanMovement {
  // inches
  Horizontal?: number;
  // inches
  Vertical?: number;
  // inches
  InducedVertical?: number;
  // degrees
  SpinAxis?: number;
}

export interface ITrackmanNineP {
  X0: {
    X: number;
    Y: number;
    Z: number;
  };
  V0: {
    X: number;
    Y: number;
    Z: number;
  };
  A0: {
    X: number;
    Y: number;
    Z: number;
  };
  Pfxx: number;
  Pfxz: number;
}

export interface ITrackmanHit {
  Launch: ITrackmanLaunch;
  LandingFlat: ITrackmanLandingFlat;
}

export interface ITrackmanLaunch {
  Speed: number;
  SpinRate: any;
  VerticalAngle: number;
  HorizontalAngle: number;
}

export interface ITrackmanLandingFlat {
  Time: number;
  Distance: number;
  Bearing: number;
}
