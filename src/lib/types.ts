export type EventHandle<T extends object> = {
  event: string;
  handler: (this: BaseComponent<T>, ev: Event) => void;
  option?: AddEventListenerOptions | boolean;
};
export type EventListernerRecord<T extends object> = Record<
  string,
  EventHandle<T>[]
>;


export type DynamicFieldsRecord<T> =
  | Record<keyof T, { id: string; raw: string }[]>
  | {};

export class BaseComponent<T extends object> extends HTMLElement {
  rawHTML: string;
  root: ShadowRoot;
  name: string;
  state: T;
  value: any;
  $: (css: string) => HTMLElement | null;
  $$: (css: string) => HTMLElement[] | null;
  $on: (css: string, ...handle: EventHandle<T>[]) => void;
  $$on: (css: string, ...handle: EventHandle<T>[]) => void;
  destroy: () => void;
}

export interface FactoryOption<T extends object> {
  state?: T | ((this: Omit<BaseComponent<T>, "state">) => T);
  value?: any | ((this: Omit<BaseComponent<T>, "state">) => any);
  onMount?: (this: BaseComponent<T>) => void;
  onUnMount?: (this: BaseComponent<T>) => void;
  eventListener?: EventListernerRecord<T>;
  wrapperElement?: keyof HTMLElementTagNameMap | "none";
  noShadow?: true;
  onAttributeChange?: (
    this: BaseComponent<T>,
    name?: string,
    oldValue?: string,
    newValue?: string
  ) => void;
}
