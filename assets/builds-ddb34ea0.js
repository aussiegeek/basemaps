import{r as h,j as e,c as j,R as y}from"./index-97f852db.js";function B(t,n=2){if(!+t)return"0 Bytes";const i=1024,s=n<0?0:n,o=["Bytes","KiB","MiB","GiB","TiB","PiB","EiB","ZiB","YiB"],r=Math.floor(Math.log(t)/Math.log(i));return`${parseFloat((t/Math.pow(i,r)).toFixed(s))} ${o[r]}`}function b(t){const n=t.build,i=`https://build.protomaps.com/${n.key}`,s=t.idx,o=()=>{t.setCmpA(s)},r=()=>{t.setCmpB(s)};return e.jsxs("tr",{children:[e.jsxs("td",{children:[e.jsx("span",{style:{display:"inline-block",width:"20px"},children:s>t.cmpB&&e.jsx("input",{type:"radio",onChange:o,checked:s===t.cmpA})}),e.jsx("span",{style:{display:"inline-block",width:"20px"},children:s<t.cmpA&&e.jsx("input",{type:"radio",onChange:r,checked:s===t.cmpB})})]}),e.jsx("td",{children:n.key}),e.jsx("td",{children:B(n.size)}),e.jsx("td",{children:n.uploaded}),e.jsx("td",{children:e.jsx("a",{href:"/#tiles="+i,children:"map"})}),e.jsx("td",{children:e.jsx("a",{href:"https://protomaps.github.io/PMTiles/?url="+i,children:"xray"})}),e.jsx("td",{children:e.jsx("a",{href:i,children:"download"})})]})}function g(){const[t,n]=h.useState([]),[i,s]=h.useState(1),[o,r]=h.useState(0),a="2.0.0-alpha.0",c="light",m=()=>{const l=t[i].key.replace(".pmtiles",""),d=t[o].key.replace(".pmtiles",""),p={name:`${l} ${a} ${c}`,type:"maplibre-gl",renderer:"maplibre-gl",index:0,url:`https://build-metadata.protomaps.dev/style@${a}+theme@${c}+tiles@${l}.json`},u={name:`${d} ${a} ${c}`,type:"maplibre-gl",renderer:"maplibre-gl",index:0,url:`https://build-metadata.protomaps.dev/style@${a}+theme@${c}+tiles@${d}.json`},x=JSON.stringify([p,u]);open("https://stamen.github.io/maperture/#maps="+encodeURIComponent(x))};return h.useEffect(()=>{fetch("https://build-metadata.protomaps.dev/builds.json").then(l=>l.json()).then(l=>{n(l.sort((d,p)=>d.key<p.key))})},[]),e.jsxs("div",{className:"builds",children:[e.jsx("h1",{children:"Builds"}),e.jsx("button",{onClick:m,children:"Compare in Maperture"}),e.jsx("table",{children:e.jsx("tbody",{children:t.map((l,d)=>e.jsx(b,{build:l,idx:d,cmpA:i,cmpB:o,setCmpA:s,setCmpB:r},l.key))})})]})}j.createRoot(document.getElementById("root")).render(e.jsx(y.StrictMode,{children:e.jsx(g,{})}));
