import { Factory } from "../lib/Factory";

const html = /*html*/ `
    <style>
        :host{
          --height : 200px;
          --width : 100%;
          flex-basis: 100%;
        }
        main{
        height : var(--height);
        width : var(--width );
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }
    </style>
    <div>
      <button id="add" aria-roledescription="add hifi">Add</button>
      <button id="clear" aria-roledescription="add hifi">Clear</button>
    </div>
      <p re-render="count">
        Now {{count}} Hi-Fi.
      </p>
`;

Factory("add-button", html, {
  onMount() {
    const callback = () => {
      this.state.count = document.querySelectorAll("hi-fi").length;
    };
    const observer = new MutationObserver(callback);
    observer.observe(this.parentElement ?? this, { childList: true });
    callback();
  },
  state: {
    count: 0,
  },
  eventListener: {
    "#add": [
      {
        event: "click",
        handler() {
          const hifiComponent = document.createElement("hi-fi");
          hifiComponent.setAttribute("freq", `${Math.floor(Math.random()*170)*10 + 100}`);
          this.parentElement?.insertBefore(hifiComponent.cloneNode(true),this);
        },
      },
    ],
    "#clear": [
      {
        event: "click",
        handler() {
          const hifis = this.parentElement?.querySelectorAll("hi-fi");
          console.log(hifis);
          hifis?.forEach((hifi) => this.parentElement?.removeChild(hifi));
        },
      },
    ],
  },
});
