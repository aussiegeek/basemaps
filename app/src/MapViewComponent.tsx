import { useEffect, useState, useRef, KeyboardEvent } from "react";
import layers from "../../styles/src/index.ts";
import maplibregl from "maplibre-gl";
import { StyleSpecification } from "maplibre-gl";
import * as pmtiles from "pmtiles";
import "maplibre-gl/dist/maplibre-gl.css";
import "ol/ol.css";
import { Map as OpenLayersMap, View } from "ol";
import VectorTile from "ol/layer/VectorTile";

import { LayerSpecification } from '@maplibre/maplibre-gl-style-spec';

// @ts-ignore
import { PMTilesVectorSource } from "ol-pmtiles";
import { useGeographic } from "ol/proj";
import { stylefunction } from "ol-mapbox-style";

const GIT_SHA = (import.meta.env.VITE_GIT_SHA || "main").substr(0, 8);

// maplibre GL JS has a bug related to style diffing.
let cachebuster = 0;

function getMaplibreStyle(theme: string, tiles?: string, npmLayers?: LayerSpecification[]): StyleSpecification {
  if (tiles && tiles.endsWith(".pmtiles")) {
    tiles = "pmtiles://" + tiles;
  }
  const style = {
    version: 8 as any,
    sources: {},
    layers: []
  } as StyleSpecification;
  if (!tiles) return style;
  style.glyphs = "https://cdn.protomaps.com/fonts/pbf/{fontstack}/{range}.pbf";
  style.sources = {
    protomaps: {
      type: "vector",
      url: tiles,
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
    },
  };
  style.layers = [
    {
      type: "fill",
      source: "protomaps",
      "source-layer": "nonexistent",
      id: `${cachebuster++}`,
    }
  ];

  if (npmLayers && npmLayers.length > 0) {
    style.layers = style.layers.concat(npmLayers);
  } else {
    style.layers = style.layers.concat(layers("protomaps", theme));
  }

  return style;
}

function StyleJsonPane(props: { theme: string }) {
  // TODO: wrong structure for OpenLayers
  const stringified = JSON.stringify(
    getMaplibreStyle(props.theme, "https://example.com/tiles.json"),
    null,
    4,
  );

  return (
    <div>
      <button
        onClick={() => {
          navigator.clipboard.writeText(stringified);
        }}
      >
        Copy to clipboard
      </button>
      <pre className="stylePane">{stringified}</pre>
    </div>
  );
}

function MapLibreView(props: { theme: string; tiles?: string, npmLayers: LayerSpecification[] }) {
  const mapRef = useRef<maplibregl.Map>();

  useEffect(() => {
    if (maplibregl.getRTLTextPluginStatus() === "unavailable") {
      maplibregl.setRTLTextPlugin(
        "https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.min.js",
        () => {},
        true,
      );
    }

    const protocol = new pmtiles.Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);

    const map = new maplibregl.Map({
      hash: true,
      container: "map",
      style: getMaplibreStyle(props.theme, props.tiles, props.npmLayers),
    });

    map.addControl(new maplibregl.NavigationControl());
    map.addControl(new maplibregl.ScaleControl({}));
    map.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
      }),
    );

    map.on("mousedown", function (e) {
      map.queryRenderedFeatures(e.point).map((feat) => {
        console.log(feat);
      });
    });

    mapRef.current = map;

    return () => {
      maplibregl.removeProtocol("pmtiles");
      map.remove();
    };
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setStyle(getMaplibreStyle(props.theme, props.tiles, props.npmLayers));
    }
  }, [props.tiles, props.theme, props.npmLayers]);

  return <div id="map"></div>;
}

// TODO: does not sync map hash state
function OpenLayersView(props: { theme: string; tiles?: string }) {
  useEffect(() => {
    useGeographic();

    const layer = new VectorTile({
      declutter: true,
      source: new PMTilesVectorSource({
        url: "https://r2-public.protomaps.com/protomaps-sample-datasets/protomaps-basemap-opensource-20230408.pmtiles",
        attributions: ["© OpenStreetMap"],
      }),
      style: null,
    });

    stylefunction(
      layer,
      {
        version: "8",
        layers: layers("protomaps", props.theme),
        sources: { protomaps: { type: "vector" } },
      },
      "protomaps",
    );

    new OpenLayersMap({
      target: "map",
      layers: [layer],
      view: new View({
        center: [0, 0],
        zoom: 0,
      }),
    });
  }, []);

  return <div id="map"></div>;
}

// if no tiles are passed, loads the latest daily build.
export default function MapViewComponent() {
  const params = new URLSearchParams(location.search);
  const [theme, setTheme] = useState<string>(params.get("theme") || "light");

  let tilesParam = params.get("tiles") || undefined;

  const [tiles, setTiles] = useState<string | undefined>(tilesParam);
  const [renderer, setRenderer] = useState<string>(
    params.get("renderer") || "maplibregl",
  );
  const [showStyleJson, setShowStyleJson] = useState<boolean>(false);
  const [publishedStyleVersion, setPublishedStyleVersion] =
    useState<string>("");
  const [knownNpmVersions, setKnownNpmVersions] = useState<string[]>([]);
  const [npmLayers, setNpmLayers] = useState<LayerSpecification[]>([]);

  // TODO: language tag selector

  useEffect(() => {
    if (!tiles) {
      fetch("https://build-metadata.protomaps.dev/builds.json")
        .then((r) => {
          return r.json();
        })
        .then((j) => {
          setTiles("https://build.protomaps.com/" + j[j.length - 1].key);
        });
    }
  }, [tiles]);

  const handleKeyPress = (event: KeyboardEvent<HTMLDivElement>) => {
    const c = event.charCode;
    if (c >= 49 && c <= 53) {
      setTheme(["light", "dark", "white", "grayscale", "black"][c - 49]);
    }
  };

  const loadVersionsFromNpm = async () => {
    let resp = await fetch("https://registry.npmjs.org/protomaps-themes-base", {
      headers: { Accept: "application/vnd.npm.install-v1+json" },
    });
    let j = await resp.json();
    setKnownNpmVersions(Object.keys(j.versions).sort().filter(v => +v.split('.')[0] >= 2).reverse());
  };

  useEffect(() => {
    (async () => {
      if (publishedStyleVersion == "") {
        setNpmLayers([]);
      } else {
        fetch(`https://unpkg.com/protomaps-themes-base@${publishedStyleVersion}/dist/layers/${theme}.json`).then(resp => {
          return resp.json();
        }).then(j => {
          setNpmLayers(j);
        })
      }
    })();
  }, [publishedStyleVersion, theme]);

  return (
    <div className="map-container">
      <nav>
        <input defaultValue={tiles} style={{ width: "50%" }} />
        <button>load</button>
        <select onChange={(e) => setTheme(e.target.value)} value={theme}>
          <option value="light">light</option>
          <option value="dark">dark</option>
          <option value="white">data viz (white)</option>
          <option value="grayscale">data viz (grayscale)</option>
          <option value="black">data viz (black)</option>
        </select>
        <select onChange={(e) => setRenderer(e.target.value)} value={renderer}>
          <option value="maplibregl">maplibregl</option>
          <option value="openlayers">openlayers</option>
        </select>
        {knownNpmVersions.length == 0 ? (
          <button onClick={loadVersionsFromNpm}>npm version...</button>
        ) : (
          <select
            onChange={(e) => setPublishedStyleVersion(e.target.value)}
            value={publishedStyleVersion}
          >
            <option key="" value="">
              main
            </option>
            {knownNpmVersions.map((v: string) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        )}
        <button onClick={() => setShowStyleJson(!showStyleJson)}>
          get style JSON
        </button>
        <a href="/visualtests/">visual tests</a>|
        <a target="_blank" href="https://github.com/protomaps/basemaps">
          {GIT_SHA}
        </a>
      </nav>
      <div className="split" onKeyPress={handleKeyPress}>
        {renderer == "maplibregl" ? (
          <MapLibreView tiles={tiles} theme={theme} npmLayers={npmLayers}/>
        ) : (
          <OpenLayersView tiles={tiles} theme={theme} />
        )}
        {showStyleJson && <StyleJsonPane theme={theme} />}
      </div>
    </div>
  );
}