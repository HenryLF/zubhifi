import { Factory } from "../lib/Factory";

const html = /*html*/ `
    <style>
        main{
            padding : 20px;
            background-color: aqua;
        }
    </style>
    <button id="add" aria-roledescription="add hifi">Add</button>
    <button id="clear" aria-roledescription="add hifi">Clear</button>
    <div re-render="count">
        Now {{count}} Hi-Fi.
    </div>
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
          hifiComponent.setAttribute("src", "dial.mp3");
          hifiComponent.setAttribute("speed", `${Math.random() * 0.8 + 0.2}`);
          this.parentElement?.appendChild(hifiComponent.cloneNode(true));
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
