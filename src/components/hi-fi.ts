import { Factory } from "../lib/Factory";
import { BaseComponent } from "../lib/types";

const html = /*html*/ `
    <style>
    :host{
          --height : 100px;
          --width : 100px ;
          --background-color : white;
          
    }
    .container{
        height : var(--height) ;
        width : var(--width);
        position : relative;
    }
    .record,.gear,.disk,.modal{
        height:100%;
        width:100%;
    }
    .record{
        overflow: hidden;
        position : relative;
        margin:2px;
    }
    .disk{
        border-radius: 50%;
        --duration : calc(1s/var(--speed,1) );
        animation: spin var(--duration) infinite linear;
        background-color: var(--color,hsl(360,80%,50%));
    }
    .needle{
        height: 50%;
        border-left: 1px solid black ;
        position: absolute;
        left: 50%;
    }
    @keyframes spin {
        from{
            rotate: 0deg;
        }to{
            rotate: 360deg;
        }
    }
    .modal{
        position : absolute;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background-color :var(--background-color);
        top: 100%;
        left: 0px;
        border: 1px solid black;
        z-index:10;
    }
    .close{
        position : absolute;
        right : 0px;
        top : 0px;
        padding: 1px;
        border-radius:50%;
        translate: 50% -50%;
        transition: transform ease-in-out 400ms;
    }
    .close:hover{
        cursor: pointer;
        transform: scale(105%);
    }
    #speed-range,#speed-count{
        width: 90%;
    } 
    </style>
    <style re-render="playing,speed">
    .disk{
        --speed: {{speed}};
        --color:hsl(calc({{speed}}*90),80%,50%);
        animation-play-state : {{playing}};
    }
    </style>
    <div class="container">
        <div class="record">
                <div class="disk">
                    <div class="needle"></div>
                </div>
        </div>
        <audio id="audio" loop=true data-src="{{src}}"></audio>
        <div class="modal" style="display: {{open}};" re-render="open">
            <input id="speed-range" min=".1" step=".1" max="4" re-render="speed" value={{speed}}  type="range">
            <input id="speed-count" onkeyup="if (event.key === 'Enter') { this.click(); }" min=".1" step=".1" max="4" re-render="speed" value={{speed}} type="number">
        </div>
        <div class="close" style="display: {{open}};" re-render="open">X</div>
    <div>
`;

type StateType = {
  playing: "running" | "paused";
  speed: number;
  open: "flex" | "none";
  src: string;
};

const speedHandle = (event: string) => ({
  event,
  handler(this: BaseComponent<StateType>, ev: Event) {
    const speed = parseFloat((ev.target as HTMLInputElement).value);
    this.state.speed = speed;
    this.value = speed;
    const audio = this.$("#audio") as HTMLAudioElement;
    audio.pause();
    audio.playbackRate = this.state.speed;
    audio.play();
  },
});

const openHandle = (event: string, open: boolean) => ({
  event,
  handler(this: BaseComponent<StateType>, ev: Event) {
    this.state.open = open ? "flex" : "none";
  },
});

const playHandle = (event: string, play: boolean) => ({
  event,
  handler(this: BaseComponent<StateType>) {
    const newState = play ? "running" : "paused";
    if (this.state.playing == newState) return;
    this.state.playing = newState;
    const audio = this.$("#audio") as HTMLAudioElement;
    play ? audio.play() : audio.pause();
  },
});

Factory<StateType>("hi-fi", html, {
  state() {
    return {
      speed: parseFloat(this.getAttribute("speed") ?? "1"),
      playing: "paused",
      open: "none",
      src: this.getAttribute("src") || "dial.mp3",
    };
  },
  value() {
    return parseFloat(this.getAttribute("speed") ?? "1");
  },
  onMount() {
    window.addEventListener(
      "click",
      () => {
        const audio = this.$("#audio") as HTMLAudioElement;
        audio.preservesPitch = false;
        audio.play();
        this.state.playing = "running";
      },
      { once: true }
    );
  },
  eventListener: {
    ".container": [
      openHandle("mouseenter", true),
      openHandle("mouseleave", false),
    ],
    ".record": [
      playHandle("mousedown", false),
      playHandle("mouseup", true),
      playHandle("touchstart", false),
      playHandle("touchend", true),
    ],
    "#speed-range": [speedHandle("mouseup"), speedHandle("touchend")],
    "#speed-count": [speedHandle("blur"), speedHandle("click")],
    ".close": [
      {
        event: "click",
        handler() {
          this.destroy();
        },
      },
    ],
  },
});
