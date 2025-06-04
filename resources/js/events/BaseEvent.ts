export class BaseEvent {
  public type: string = 'BaseEvent';
  public source: string;

  constructor() {
    this.source = 'plandalf';
  }
}
