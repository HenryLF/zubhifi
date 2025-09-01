import {
  DynamicFieldsRecord,
  EventHandle,
  EventListernerRecord,
  FactoryOption,
} from "./types";
import { renderTemplate, importDataSrc, getId } from "./utils";

export function Factory<T extends object>(
  name: string,
  temp: string,
  option?: FactoryOption<T>
) {
  class Component extends HTMLElement {
    rawHTML: string;
    root: ShadowRoot | HTMLElement;
    state: T;
    /*value field for input-like behavior */
    private _value: any;
    get value() {
      return this._value;
    }
    set value(newValue: any) {
      if (newValue == this.value) return;
      this._value = newValue;
      this.dispatchEvent(new Event("input"));
    }

    private dynamicFields: DynamicFieldsRecord<T> = {};
    private boundEventListener: EventListernerRecord<T> = {};
    private boundValueUpdater() {}
    constructor() {
      super();
      this.rawHTML = temp;
      if (option?.noShadow) {
        this.root = this;
      } else {
        this.root = this.attachShadow({ mode: "closed" });
      }
      /* set initial state */
      if (option?.state) {
        let initialState: T;
        if (typeof option.state === "function") {
          initialState = option.state.bind(this)();
        } else {
          initialState = option.state;
        }
        this.state = this.createReactiveState(initialState);
      } else {
        this.state = {} as T;
      }
      /* set initialize value */
      if (option?.value) {
        this.boundValueUpdater = option?.value?.bind(this);
      }
      this._value = this.boundValueUpdater();
    }
    /* Public utilities */
    $(css: string) {
      return this.root.querySelector(css);
    }
    $$(css: string) {
      return this.root.querySelectorAll(css);
    }
    $on(css: string, ...handles: EventHandle<T>[]) {
      const element = this.$(css);
      if (!element) return;
      for (let handle of handles) {
        this.registerEventHandler(element, css, handle);
      }
    }
    $$on(css: string, ...handles: EventHandle<T>[]) {
      this.$$(css).forEach((el) => {
        for (let handle of handles) {
          this.registerEventHandler(el, css, handle);
        }
      });
    }
    destroy() {
      this.parentElement?.removeChild(this);
    }
    /* shadowed methoded */
    registerEventHandler(
      el: Element,
      css: string,
      { handler, event, option }: EventHandle<T>
    ) {
      const boundHandler = handler.bind(this);
      el.addEventListener(event, boundHandler, option);
      if (!this.boundEventListener[css]) {
        this.boundEventListener[css] = [];
      }
      this.boundEventListener[css].push({ event, handler: boundHandler });
    }

    attachListener() {
      for (let selectors in option?.eventListener) {
        /* comma split user provided selectors */
        for (const selector of selectors.split(",")) {
          const css = selector.trim();
          const eventTargets = this.$$(selector.trim());
          /* register each target individualy */
          eventTargets.forEach((target) => {
            if (!option?.eventListener?.[selectors]) return;
            for (let handle of option.eventListener[selectors]) {
              this.registerEventHandler(target, css, handle);
            }
          });
        }
      }
    }
    removeListener() {
      for (let css in this.boundEventListener) {
        const eventTargets = this.$$(css);
        eventTargets.forEach((target) => {
          for (let { event, handler } of this.boundEventListener[css]) {
            target.removeEventListener(event, handler);
          }
        });
      }
    }

    createReactiveState<T extends object>(initialState: T) {
      const handler = {
        get: (target: T, property: string) => {
          if (
            typeof target[property] === "object" &&
            target[property] !== null
          ) {
            return new Proxy(target[property], handler);
          }
          return target[property];
        },
        set: (target: T, property: string, value: any) => {
          if (target[property] == value) return true;
          target[property] = value;
          this.updateDynamicField(property);
          const newValue = this.boundValueUpdater();
          if (this.value != newValue) {
            this.value = this.boundValueUpdater();
          }
          return true;
        },
      };

      return new Proxy(initialState, handler);
    }

    updateDynamicField(property: string) {
      const toUpdate = this.dynamicFields[property];
      if (!toUpdate) return;
      for (let { id, raw } of toUpdate) {
        /*fetch element by internal id*/
        let element = this.$(`[internal-id=${id}]`);
        if (!element) continue;
        /*rerender field*/
        element.outerHTML = renderTemplate(raw, this.state);


        /*reattach lost event handlers */
        for (let css in this.boundEventListener) {
          /* search for child event target */
          const eventTargets: Element[] = [
            ...this.$$(`[internal-id=${id}] ${css}`),
          ];
          /* check if self is event target*/
          if (element.matches(css)) {
            eventTargets.push(this.$(`[internal-id=${id}]`)!);
          }

          /* reattach event handlers*/
          eventTargets.forEach((target) => {
            this.boundEventListener[css].forEach(
              ({ event, handler, option }) => {
                target.addEventListener(event, handler, option);
              }
            );
          });
        }
      }
      option?.onRender?.bind(this)();

    }
    initialRender() {
      /* Import template */
      const rawTemp = document.createElement("template");
      rawTemp.innerHTML = this.rawHTML;
      /* Make wrapper */
      if (option?.wrapperElement == "none") {
        this.root.appendChild(rawTemp.content);
      } else {
        const wrapper = document.createElement(
          option?.wrapperElement ?? "main"
        );
        wrapper.appendChild(rawTemp.content);
        this.root.appendChild(wrapper);
      }
      /* Process dynamic fields *
      /*    - add internal id */
      this.$$("[re-render]").forEach((el) => {
        const id = getId();
        el.setAttribute("internal-id", id);
      });
      /*    - register dynamic field */
      this.$$("[re-render]").forEach((el) => {
        const dataAttr =
          el
            .getAttribute("re-render")
            ?.split(",")
            .map((e) => e.trim()) ?? [];
        const id = el.getAttribute("internal-id");
        for (let attr of dataAttr) {
          if (!this.dynamicFields[attr]) {
            this.dynamicFields[attr] = [];
          }
          this.dynamicFields[attr].push({ id, raw: el.outerHTML });
        }
      });
      /*render full root*/
      this.root.innerHTML = renderTemplate(this.root.innerHTML, this.state);
      this.attachListener();
    }

    connectedCallback() {
      this.initialRender();
      option?.onMount?.bind(this)();
    }
    disconnectedCallback() {
      option?.onUnMount?.bind(this)();
      this.removeListener();
    }
    connectedMoveCallback() {
      console.log("Custom move-handling logic here.");
    }
    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
      option?.onAttributeChange?.bind(this)(name, oldValue, newValue);
    }
  }
  customElements.define(name, Component);
}
