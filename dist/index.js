(() => {
  // src/lib/utils.ts
  function getId() {
    const now = window.performance.now();
    const timeSeed = [0, 1].map(
      (_, id) => String.fromCharCode(
        Math.floor(now % Math.pow(26, id + 1) / Math.pow(26, id)) + 65
      )
    );
    return `${timeSeed.join("")}${Math.floor(Math.random() * 1e3).toString().padStart(3, "0")}`;
  }
  function renderTemplate(rawHTML, object) {
    return rawHTML.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return object[key]?.toString() || "";
    });
  }

  // src/lib/Factory.ts
  function Factory(name, temp, option) {
    class Component extends HTMLElement {
      rawHTML;
      root;
      state;
      /*value field for input-like behavior */
      _value;
      get value() {
        return this._value;
      }
      set value(newValue) {
        if (newValue == this.value) return;
        this._value = newValue;
        this.dispatchEvent(new Event("input"));
      }
      dynamicFields = {};
      boundEventListener = {};
      boundValueUpdater() {
      }
      constructor() {
        super();
        this.rawHTML = temp;
        if (option?.noShadow) {
          this.root = this;
        } else {
          this.root = this.attachShadow({ mode: "closed" });
        }
        if (option?.state) {
          let initialState;
          if (typeof option.state === "function") {
            initialState = option.state.bind(this)();
          } else {
            initialState = option.state;
          }
          this.state = this.createReactiveState(initialState);
        } else {
          this.state = {};
        }
        if (option?.value) {
          this.boundValueUpdater = option?.value?.bind(this);
        }
        this._value = this.boundValueUpdater();
      }
      /* Public utilities */
      $(css) {
        return this.root.querySelector(css);
      }
      $$(css) {
        return this.root.querySelectorAll(css);
      }
      $on(css, ...handles) {
        const element = this.$(css);
        if (!element) return;
        for (let handle of handles) {
          this.registerEventHandler(element, css, handle);
        }
      }
      $$on(css, ...handles) {
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
      registerEventHandler(el, css, { handler, event, option: option2 }) {
        const boundHandler = handler.bind(this);
        el.addEventListener(event, boundHandler, option2);
        if (!this.boundEventListener[css]) {
          this.boundEventListener[css] = [];
        }
        this.boundEventListener[css].push({ event, handler: boundHandler });
      }
      attachListener() {
        for (let selectors in option?.eventListener) {
          for (const selector of selectors.split(",")) {
            const css = selector.trim();
            const eventTargets = this.$$(selector.trim());
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
      createReactiveState(initialState) {
        const handler = {
          get: (target, property) => {
            if (typeof target[property] === "object" && target[property] !== null) {
              return new Proxy(target[property], handler);
            }
            return target[property];
          },
          set: (target, property, value) => {
            if (target[property] == value) return true;
            target[property] = value;
            this.updateDynamicField(property);
            const newValue = this.boundValueUpdater();
            if (this.value != newValue) {
              this.value = this.boundValueUpdater();
            }
            return true;
          }
        };
        return new Proxy(initialState, handler);
      }
      updateDynamicField(property) {
        const toUpdate = this.dynamicFields[property];
        if (!toUpdate) return;
        for (let { id, raw } of toUpdate) {
          let element = this.$(`[internal-id=${id}]`);
          if (!element) continue;
          element.outerHTML = renderTemplate(raw, this.state);
          for (let css in this.boundEventListener) {
            const eventTargets = [
              ...this.$$(`[internal-id=${id}] ${css}`)
            ];
            if (element.matches(css)) {
              eventTargets.push(this.$(`[internal-id=${id}]`));
            }
            eventTargets.forEach((target) => {
              this.boundEventListener[css].forEach(
                ({ event, handler, option: option2 }) => {
                  target.addEventListener(event, handler, option2);
                }
              );
            });
          }
        }
        option?.onRender?.bind(this)();
      }
      initialRender() {
        const rawTemp = document.createElement("template");
        rawTemp.innerHTML = this.rawHTML;
        if (option?.wrapperElement == "none") {
          this.root.appendChild(rawTemp.content);
        } else {
          const wrapper = document.createElement(
            option?.wrapperElement ?? "main"
          );
          wrapper.appendChild(rawTemp.content);
          this.root.appendChild(wrapper);
        }
        this.$$("[re-render]").forEach((el) => {
          const id = getId();
          el.setAttribute("internal-id", id);
        });
        this.$$("[re-render]").forEach((el) => {
          const dataAttr = el.getAttribute("re-render")?.split(",").map((e) => e.trim()) ?? [];
          const id = el.getAttribute("internal-id");
          for (let attr of dataAttr) {
            if (!this.dynamicFields[attr]) {
              this.dynamicFields[attr] = [];
            }
            this.dynamicFields[attr].push({ id, raw: el.outerHTML });
          }
        });
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
      attributeChangedCallback(name2, oldValue, newValue) {
        option?.onAttributeChange?.bind(this)(name2, oldValue, newValue);
      }
    }
    customElements.define(name, Component);
  }

  // src/components/hi-fi.ts
  function requestAutoplay(audio, fallback = () => {
  }) {
    const playPromise = audio?.play();
    if (playPromise) {
      playPromise.catch(fallback);
    }
  }
  var html = (
    /*html*/
    `
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
`
  );
  var speedHandle = (event) => ({
    event,
    handler(ev) {
      const freq = parseFloat(ev.target.value);
      this.state.freq = freq;
      const audio = this.$("#audio");
      audio.pause();
      audio.playbackRate = this.state.freq / 440;
      audio.play();
    }
  });
  var openHandle = (event, open) => ({
    event,
    handler() {
      this.state.open = open ? "flex" : "none";
    }
  });
  var playHandle = (event, play) => ({
    event,
    handler() {
      const newState = play ? "running" : "paused";
      if (this.state.playing == newState) return;
      this.state.playing = newState;
      const audio = this.$("#audio");
      play ? audio.play() : audio.pause();
    }
  });
  Factory("hi-fi", html, {
    state() {
      console.log(this.getAttribute("freq"));
      return {
        freq: parseFloat(this.getAttribute("freq") ?? "440"),
        playing: "paused",
        open: "none",
        src: "sine"
      };
    },
    value() {
      const { freq, src, playing } = this.state;
      return {
        freq,
        playing: playing == "running",
        src
      };
    },
    onRender() {
      const audio = this.$("#audio");
      if (!audio) return;
      requestAutoplay(audio);
    },
    onMount() {
      const srcAttr = this.getAttribute("src");
      if (srcAttr) {
        this.state.freq = parseFloat(srcAttr);
      }
      const playAudio = () => {
        const audio = this.$("#audio");
        if (audio) {
          audio.playbackRate = this.state.freq / 440;
          audio.preservesPitch = false;
          requestAutoplay(audio, () => {
            window.addEventListener("click", () => requestAutoplay(audio), {
              once: true
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
        openHandle("mouseleave", false)
      ],
      ".record": [
        playHandle("mousedown", false),
        playHandle("mouseup", true),
        playHandle("touchstart", false),
        playHandle("touchend", true)
      ],
      "#freq-range": [speedHandle("mouseup"), speedHandle("touchend")],
      "#freq-count": [speedHandle("blur"), speedHandle("click")],
      ".close": [
        {
          event: "click",
          handler() {
            this.destroy();
          }
        }
      ],
      "#src": [
        {
          event: "input",
          handler(ev) {
            this.state.src = ev.target?.value ?? "sine";
          }
        }
      ]
    }
  });

  // src/components/add-button.ts
  var html2 = (
    /*html*/
    `
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
`
  );
  Factory("add-button", html2, {
    onMount() {
      const callback = () => {
        this.state.count = document.querySelectorAll("hi-fi").length;
      };
      const observer = new MutationObserver(callback);
      observer.observe(this.parentElement ?? this, { childList: true });
      callback();
    },
    state: {
      count: 0
    },
    eventListener: {
      "#add": [
        {
          event: "click",
          handler() {
            const hifiComponent = document.createElement("hi-fi");
            hifiComponent.setAttribute("freq", `${Math.floor(Math.random() * 170) * 10 + 100}`);
            this.parentElement?.insertBefore(hifiComponent.cloneNode(true), this);
          }
        }
      ],
      "#clear": [
        {
          event: "click",
          handler() {
            const hifis = this.parentElement?.querySelectorAll("hi-fi");
            console.log(hifis);
            hifis?.forEach((hifi) => this.parentElement?.removeChild(hifi));
          }
        }
      ]
    }
  });

  // src/components/hifi-spectrum.ts
  var graphHtml = (
    /*html */
    `
<style>
  main{
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .slot-container{
    flex: 1;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-evenly;
  }
  .graph{
    position: relative;
    height : 20vh ;
    width: 100vw;
  }
  </style>
  
  <div class="slot-container">
    <slot></slot>
  </div>    
    <div class="graph">
    </div>
`
  );
  var barHtml = (
    /*html */
    `
    <style>
      .bar,.freq{
        
        position:absolute;
      }
    .bar{
        width : 5%;
        --left: calc(100% * var(--ratio));
        left:var(--left);
        height:var(--height);
        bottom : 0px;
        background-color: hsl(calc(var(--ratio)*360) , 80% , 50%);
    }
    .bar:hover > *{
      display: inline;

    }
    .freq{
      display: none;
      bottom: calc(var(--height));
      text-align: center;
      line-height: 12px;
      width: 100%;
    }

    </style>
    <div class="bar" style="--ratio : calc({{freq}} /1800);--height : calc(10% * {{count}});" re-render="freq,count">
      <p class="freq">{{freq}}Hz</p>
    </div>
`
  );
  Factory("graph-bar", barHtml, {
    noShadow: true,
    state: {
      freq: 1,
      count: 1
    },
    onMount() {
      this.state.freq = parseInt(this.getAttribute("freq") ?? "1");
      this.state.count = parseInt(this.getAttribute("count") ?? "1");
    },
    onAttributeChange(name, _, val) {
      switch (name) {
        case "freq":
        case "count":
          this.state[name] = parseInt(val ?? "1");
          break;
        default:
      }
    }
  });
  function getSpectralData(el) {
    const hifis = Array.from(
      el.parentElement?.querySelectorAll("hi-fi") ?? []
    );
    return hifis.reduce((acc, hifi) => {
      const { freq, playing } = hifi.value;
      if (!playing) return acc;
      if (!acc[freq]) {
        acc[freq] = 0;
      }
      acc[freq] += 1;
      return acc;
    }, {});
  }
  Factory("hifi-spectrum", graphHtml, {
    onMount() {
      const renderGraph = () => {
        const graph = this.$(".graph");
        if (!graph) return;
        graph.innerHTML = "";
        const data = getSpectralData(this);
        for (let [freq, count] of Object.entries(data)) {
          const bar = document.createElement("graph-bar");
          bar.setAttribute("freq", freq);
          bar.setAttribute("count", count.toString());
          this.$(".graph")?.appendChild(bar);
        }
      };
      const callback = () => {
        this.querySelectorAll("hi-fi").forEach((hifi) => {
          hifi.removeEventListener("input", renderGraph);
        });
        this.querySelectorAll("hi-fi").forEach((hifi) => {
          hifi.addEventListener("input", renderGraph);
        });
        renderGraph();
      };
      const observer = new MutationObserver(callback);
      observer.observe(this, { childList: true });
      callback();
    }
  });
})();
