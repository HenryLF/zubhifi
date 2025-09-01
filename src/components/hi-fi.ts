import { Factory } from "../lib/Factory";
import { BaseComponent } from "../lib/types";

export type HifiValue = {
  freq: number;
  playing: boolean;
  src: string;
};

type StateType = {
  playing: "running" | "paused";
  freq: number;
  open: "flex" | "none";
  src: string;
};

export type HifiComponent = BaseComponent<StateType, HifiValue>;

function requestAutoplay(audio?: HTMLAudioElement, fallback = () => {}) {
  const playPromise = audio?.play();
  if (playPromise) {
    playPromise.catch(fallback);
  }
}

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
    .waveform{
      height : 40%;
      width : auto;
    }
    img {
      height: calc( var(--height)/5);
      aspect-ratio: 1;
    }
    .close:hover{
        cursor: pointer;
        transform: scale(105%);
    }
    #freq-range,#freq-count{
        width: 90%;
    } 
    </style>
    <style re-render="playing,freq">
    .disk{
        --speed: calc({{freq}}/440);
        --color:hsl(calc({{freq}}*90/440),80%,50%);
        animation-play-state : {{playing}};
    }
    </style>
    <audio id="audio" loop=true src="{{src}}.mp3" re-render="src"></audio>
    <div class="container">
        <div class="record">
          <div class="disk">
              <div class="needle"></div>
          </div>
        </div>
        <div class="modal" style="display: {{open}};" re-render="open">
            <input id="freq-range" min="50" step="10" max="1800" re-render="freq" value={{freq}}  type="range">
            <input id="freq-count" onkeyup="if (event.key === 'Enter') { this.click(); }" min="50" step="10" max="1800" re-render="freq" value={{freq}} type="number">
            <select id="src" >
                <option value="sine"> Waveform : </option>
                <option value="sine">    Sine</option>
                <option value="square"> Square </option>
                <option value="sawtooth">Sawtooth </option>
            </select>
            <img src="{{src}}.svg" alt="waveform" class="waveform" re-render="src">        
        </div>
        <div class="close" style="display: {{open}};" re-render="open">
          <img src="close.svg">
        </div>
    <div>
`;

const speedHandle = (event: string) => ({
  event,
  handler(this: BaseComponent<StateType>, ev: Event) {
    const freq = parseFloat((ev.target as HTMLInputElement).value);
    this.state.freq = freq;
    const audio = this.$("#audio") as HTMLAudioElement;
    audio.pause();
    audio.playbackRate = this.state.freq / 440;
    audio.play();
  },
});

const openHandle = (event: string, open: boolean) => ({
  event,
  handler(this: BaseComponent<StateType>) {
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
    console.log(this.getAttribute("freq"));
    return {
      freq: parseFloat(this.getAttribute("freq") ?? "440"),
      playing: "paused",
      open: "none",
      src: "sine",
    };
  },
  value() {
    const { freq, src, playing } = this.state;
    return {
      freq,
      playing: playing == "running",
      src,
    };
  },
  onRender() {
    const audio = this.$("#audio") as HTMLAudioElement;
    if (!audio) return;
    requestAutoplay(audio);
  },
  onMount() {
    const srcAttr = this.getAttribute("src");
    if (srcAttr) {
      this.state.freq = parseFloat(srcAttr);
    }

    const playAudio = () => {
      const audio = this.$("#audio") as HTMLAudioElement;
      if (audio) {
        audio.playbackRate = this.state.freq / 440;
        audio.preservesPitch = false;
        requestAutoplay(audio, () => {
          window.addEventListener("click", () => requestAutoplay(audio), {
            once: true,
          });
        });
        this.state.playing = "running";
      }
    };
    playAudio();
    window.addEventListener("click", playAudio, { once: true });
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
    "#freq-range": [speedHandle("mouseup"), speedHandle("touchend")],
    "#freq-count": [speedHandle("blur"), speedHandle("click")],
    ".close": [
      {
        event: "click",
        handler() {
          this.destroy();
        },
      },
    ],
    "#src": [
      {
        event: "input",
        handler(ev) {
          this.state.src = ev.target?.value ?? "sine";
        },
      },
    ],
  },
});
