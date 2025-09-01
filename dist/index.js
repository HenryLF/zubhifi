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
  function importDataSrc(target) {
    target.querySelectorAll("[data-src]").forEach((element) => {
      const src = element.getAttribute("data-src");
      element.setAttribute("src", src);
    });
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
      constructor() {
        super();
        if (typeof option?.value === "function") {
          this._value = option.value.bind(this)();
        } else {
          this._value = option?.value ?? null;
        }
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
        for (let css in option?.eventListener) {
          const eventTargets = this.$$(css);
          eventTargets.forEach((target) => {
            if (!option?.eventListener?.[css]) return;
            for (let handle of option.eventListener[css]) {
              this.registerEventHandler(target, css, handle);
            }
          });
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
            return true;
          }
        };
        return new Proxy(initialState, handler);
      }
      updateDynamicField(property) {
        const toUpdate = this.dynamicFields[property];
        if (!toUpdate) return;
        for (let { id, raw } of toUpdate) {
          const element = this.$(`[internal-id=${id}]`);
          if (!element) continue;
          element.outerHTML = renderTemplate(raw, this.state);
          importDataSrc(element);
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
        importDataSrc(this.root);
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
  var html = (
    /*html*/
    `

    <style>
    .container{
        height : var(--height,50px) ;
        width : var(--width,50px );
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
        width: 100%;
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
            <input id="speed-count" min=".1" step=".1" max="4" re-render="speed" value={{speed}} type="number">
        </div>
        <div class="close" style="display: {{open}};" re-render="open">X</div>
    <div>
`
  );
  var speedHandle = {
    event: "input",
    handler(ev) {
      const speed = parseFloat(ev.target.value);
      this.state.speed = speed;
      this.value = speed;
      const audio = this.$("#audio");
      audio.pause();
      audio.playbackRate = this.state.speed;
      audio.play();
    }
  };
  Factory("hi-fi", html, {
    state() {
      return {
        speed: parseFloat(this.getAttribute("speed") ?? "1"),
        playing: "paused",
        open: "none",
        src: this.getAttribute("src") || "dial.mp3"
      };
    },
    value() {
      return parseFloat(this.getAttribute("speed") ?? "1");
    },
    onMount() {
      window.addEventListener(
        "click",
        () => {
          const audio = this.$("#audio");
          audio.preservesPitch = false;
          audio.play();
          this.state.playing = "running";
        },
        { once: true }
      );
    },
    eventListener: {
      ".container": [
        {
          event: "mouseenter",
          handler() {
            this.state.open = "inline";
          }
        },
        {
          event: "mouseleave",
          handler() {
            this.state.open = "none";
          }
        }
      ],
      ".record": [
        {
          event: "mousedown",
          handler() {
            this.state.playing = "paused";
            this.$("#audio").pause();
          }
        },
        {
          event: "mouseup",
          handler() {
            this.state.playing = "running";
            this.$("#audio").play();
          }
        }
      ],
      "#speed-range": [speedHandle],
      "#speed-count": [speedHandle],
      ".close": [
        {
          event: "click",
          handler() {
            this.destroy();
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
            hifiComponent.setAttribute("src", "dial.mp3");
            hifiComponent.setAttribute("speed", `${Math.random() * 0.8 + 0.2}`);
            this.parentElement?.appendChild(hifiComponent.cloneNode(true));
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
  }
  .slot-container{
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
      .bar{
        position:absolute;
        width : 5%;
        --left: calc(100% * var(--ratio));
        height:var(--height);
        left:var(--left);
        bottom : 0px;
        background-color: hsl(calc(var(--ratio)*360) , 80% , 50%);
    }
    </style>
    <div class="bar" style="--ratio : calc({{freq}} /1800);--height : calc(10% * {{count}});" re-render="freq,count"></div>
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
      const roundedFreq = Math.round(444 * parseFloat(hifi.value));
      const freq = roundedFreq - roundedFreq % 10;
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
