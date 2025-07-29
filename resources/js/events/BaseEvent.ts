export class BaseEvent {
  public type: string = 'BaseEvent';
  public source: string;

  constructor(type, data) {
    this.source = 'plandalf';
    this.type = type;
    this.data = data;
  }
}
