import { BaseEvent } from "./BaseEvent";

export class PageChanged extends BaseEvent {
  public type: string = 'page_change';
  public pageId: string;

  constructor(pageId: string) {
    super('page_change', {
      pageId: pageId
    });
    this.pageId = pageId;
  }
}
