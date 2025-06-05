import { BaseEvent } from "./BaseEvent";

export class PageChanged extends BaseEvent {
  public type: string = 'page_changed';
  public pageId: string;

  constructor(pageId: string) {
    super();
    this.pageId = pageId;
  }
}
