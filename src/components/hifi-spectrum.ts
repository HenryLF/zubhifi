import { Factory } from "../lib/Factory";

const graphHtml = /*html */ `
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
`;
const barHtml = /*html */ `
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
`;
Factory("graph-bar", barHtml, {
  noShadow: true,
  state: {
    freq: 1,
    count: 1,
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
  },
});

function getSpectralData(el: Element) {
  const hifis = Array.from(
    el.parentElement?.querySelectorAll("hi-fi") ?? []
  ) as HTMLInputElement[];
  return hifis.reduce((acc: Record<number, number>, hifi: HTMLInputElement) => {
    const roundedFreq = Math.round(444 * parseFloat(hifi.value));
    const freq = roundedFreq - (roundedFreq % 10);
    if (!acc[freq]) {
      acc[freq] = 0;
    }
    acc[freq] += 1;
    return acc;
  }, {});
}

Factory("hifi-spectrum", graphHtml, {
  onMount() {
    /* list to child list */
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
  },
});
