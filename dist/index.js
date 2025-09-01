(()=>{function g(){let t=window.performance.now();return`${[0,1].map((n,a)=>String.fromCharCode(Math.floor(t%Math.pow(26,a+1)/Math.pow(26,a))+65)).join("")}${Math.floor(Math.random()*1e3).toString().padStart(3,"0")}`}function p(t){t.querySelectorAll("[data-src]").forEach(s=>{let n=s.getAttribute("data-src");s.setAttribute("src",n)})}function m(t,s){return t.replace(/\{\{(\w+)\}\}/g,(n,a)=>s[a]?.toString()||"")}function c(t,s,n){class a extends HTMLElement{rawHTML;root;state;_value;get value(){return this._value}set value(e){e!=this.value&&(this._value=e,this.dispatchEvent(new Event("input")))}dynamicFields={};boundEventListener={};constructor(){if(super(),typeof n?.value=="function"?this._value=n.value.bind(this)():this._value=n?.value??null,this.rawHTML=s,n?.noShadow?this.root=this:this.root=this.attachShadow({mode:"closed"}),n?.state){let e;typeof n.state=="function"?e=n.state.bind(this)():e=n.state,this.state=this.createReactiveState(e)}else this.state={}}$(e){return this.root.querySelector(e)}$$(e){return this.root.querySelectorAll(e)}$on(e,...i){let r=this.$(e);if(r)for(let o of i)this.registerEventHandler(r,e,o)}$$on(e,...i){this.$$(e).forEach(r=>{for(let o of i)this.registerEventHandler(r,e,o)})}destroy(){this.parentElement?.removeChild(this)}registerEventHandler(e,i,{handler:r,event:o,option:l}){let d=r.bind(this);e.addEventListener(o,d,l),this.boundEventListener[i]||(this.boundEventListener[i]=[]),this.boundEventListener[i].push({event:o,handler:d})}attachListener(){for(let e in n?.eventListener)for(let i of e.split(",")){let r=i.trim();this.$$(i.trim()).forEach(l=>{if(n?.eventListener?.[e])for(let d of n.eventListener[e])this.registerEventHandler(l,r,d)})}}removeListener(){for(let e in this.boundEventListener)this.$$(e).forEach(r=>{for(let{event:o,handler:l}of this.boundEventListener[e])r.removeEventListener(o,l)})}createReactiveState(e){let i={get:(r,o)=>typeof r[o]=="object"&&r[o]!==null?new Proxy(r[o],i):r[o],set:(r,o,l)=>(r[o]==l||(r[o]=l,this.updateDynamicField(o)),!0)};return new Proxy(e,i)}updateDynamicField(e){let i=this.dynamicFields[e];if(i)for(let{id:r,raw:o}of i){let l=this.$(`[internal-id=${r}]`);if(l){l.outerHTML=m(o,this.state),p(l);for(let d in this.boundEventListener){let v=[...this.$$(`[internal-id=${r}] ${d}`)];l.matches(d)&&v.push(this.$(`[internal-id=${r}]`)),v.forEach(y=>{this.boundEventListener[d].forEach(({event:E,handler:w,option:L})=>{y.addEventListener(E,w,L)})})}}}}initialRender(){let e=document.createElement("template");if(e.innerHTML=this.rawHTML,n?.wrapperElement=="none")this.root.appendChild(e.content);else{let i=document.createElement(n?.wrapperElement??"main");i.appendChild(e.content),this.root.appendChild(i)}this.$$("[re-render]").forEach(i=>{let r=g();i.setAttribute("internal-id",r)}),this.$$("[re-render]").forEach(i=>{let r=i.getAttribute("re-render")?.split(",").map(l=>l.trim())??[],o=i.getAttribute("internal-id");for(let l of r)this.dynamicFields[l]||(this.dynamicFields[l]=[]),this.dynamicFields[l].push({id:o,raw:i.outerHTML})}),this.root.innerHTML=m(this.root.innerHTML,this.state),p(this.root),this.attachListener()}connectedCallback(){this.initialRender(),n?.onMount?.bind(this)()}disconnectedCallback(){n?.onUnMount?.bind(this)(),this.removeListener()}connectedMoveCallback(){console.log("Custom move-handling logic here.")}attributeChangedCallback(e,i,r){n?.onAttributeChange?.bind(this)(e,i,r)}}customElements.define(t,a)}var T=`
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
`,f=t=>({event:t,handler(s){let n=parseFloat(s.target.value);this.state.speed=n,this.value=n;let a=this.$("#audio");a.pause(),a.playbackRate=this.state.speed,a.play()}}),b=(t,s)=>({event:t,handler(n){this.state.open=s?"flex":"none"}}),u=(t,s)=>({event:t,handler(){let n=s?"running":"paused";if(this.state.playing==n)return;this.state.playing=n;let a=this.$("#audio");s?a.play():a.pause()}});c("hi-fi",T,{state(){return{speed:parseFloat(this.getAttribute("speed")??"1"),playing:"paused",open:"none",src:this.getAttribute("src")||"dial.mp3"}},value(){return parseFloat(this.getAttribute("speed")??"1")},onMount(){window.addEventListener("click",()=>{let t=this.$("#audio");t.preservesPitch=!1,t.play(),this.state.playing="running"},{once:!0})},eventListener:{".container":[b("mouseenter",!0),b("mouseleave",!1)],".record":[u("mousedown",!1),u("mouseup",!0),u("touchstart",!1),u("touchend",!0)],"#speed-range":[f("mouseup")],"#speed-count":[f("blur"),f("click")],".close":[{event:"click",handler(){this.destroy()}}]}});var x=`
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
`;c("add-button",x,{onMount(){let t=()=>{this.state.count=document.querySelectorAll("hi-fi").length};new MutationObserver(t).observe(this.parentElement??this,{childList:!0}),t()},state:{count:0},eventListener:{"#add":[{event:"click",handler(){let t=document.createElement("hi-fi");t.setAttribute("src","dial.mp3"),t.setAttribute("speed",`${Math.random()*.8+.2}`),this.parentElement?.insertBefore(t.cloneNode(!0),this)}}],"#clear":[{event:"click",handler(){let t=this.parentElement?.querySelectorAll("hi-fi");console.log(t),t?.forEach(s=>this.parentElement?.removeChild(s))}}]}});var H=`
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
`,M=`
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
`;c("graph-bar",M,{noShadow:!0,state:{freq:1,count:1},onMount(){this.state.freq=parseInt(this.getAttribute("freq")??"1"),this.state.count=parseInt(this.getAttribute("count")??"1")},onAttributeChange(t,s,n){switch(t){case"freq":case"count":this.state[t]=parseInt(n??"1");break;default:}}});function $(t){return Array.from(t.parentElement?.querySelectorAll("hi-fi")??[]).reduce((n,a)=>{let h=Math.round(444*parseFloat(a.value)),e=h-h%10;return n[e]||(n[e]=0),n[e]+=1,n},{})}c("hifi-spectrum",H,{onMount(){let t=()=>{let a=this.$(".graph");if(!a)return;a.innerHTML="";let h=$(this);for(let[e,i]of Object.entries(h)){let r=document.createElement("graph-bar");r.setAttribute("freq",e),r.setAttribute("count",i.toString()),this.$(".graph")?.appendChild(r)}},s=()=>{this.querySelectorAll("hi-fi").forEach(a=>{a.removeEventListener("input",t)}),this.querySelectorAll("hi-fi").forEach(a=>{a.addEventListener("input",t)}),t()};new MutationObserver(s).observe(this,{childList:!0}),s()}});})();
