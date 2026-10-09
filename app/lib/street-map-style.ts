import type { StyleSpecification } from 'mapbox-gl'

// Kept in step with the theme in globals.css
export const colors = {
  paper: '#eef0ea',
  park: '#dde6d3',
  water: '#b6d0cc',
  building: '#e8ebe4',
  street: '#cdd3cb',
  mainRoad: '#c4cbc3',
  route: '#2440e6',
}

const MAIN_ROADS = ['motorway', 'trunk', 'primary', 'secondary', 'tertiary']
const SIDE_STREETS = ['street', 'street_limited', 'service']

// A bare street map: no labels, just streets, faint buildings, parks and the Avon.
export const streetStyle: StyleSpecification = {
  version: 8,
  sources: {
    streets: { type: 'vector', url: 'mapbox://mapbox.mapbox-streets-v8' },
  },
  layers: [
    { id: 'paper', type: 'background', paint: { 'background-color': colors.paper } },
    {
      id: 'parks',
      type: 'fill',
      source: 'streets',
      'source-layer': 'landuse',
      filter: ['in', ['get', 'class'], ['literal', ['park', 'grass', 'pitch']]],
      paint: { 'fill-color': colors.park },
    },
    {
      id: 'water',
      type: 'fill',
      source: 'streets',
      'source-layer': 'water',
      paint: { 'fill-color': colors.water },
    },
    {
      id: 'rivers',
      type: 'line',
      source: 'streets',
      'source-layer': 'waterway',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': colors.water,
        'line-width': ['interpolate', ['linear'], ['zoom'], 12, 2, 16, 8],
      },
    },
    {
      id: 'paths',
      type: 'line',
      source: 'streets',
      'source-layer': 'road',
      filter: ['==', ['get', 'class'], 'path'],
      paint: {
        'line-color': colors.street,
        'line-width': ['interpolate', ['linear'], ['zoom'], 13, 0.5, 16, 1.5],
        'line-dasharray': [2, 2],
      },
    },
    {
      id: 'buildings',
      type: 'fill',
      source: 'streets',
      'source-layer': 'building',
      paint: { 'fill-color': colors.building },
    },
    {
      id: 'side-streets',
      type: 'line',
      source: 'streets',
      'source-layer': 'road',
      filter: ['in', ['get', 'class'], ['literal', SIDE_STREETS]],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': colors.street,
        'line-width': ['interpolate', ['linear'], ['zoom'], 12, 0.7, 14, 1.75, 17, 5.5],
      },
    },
    // Main roads, like the Four Avenues, sit a step heavier than side streets
    {
      id: 'main-roads',
      type: 'line',
      source: 'streets',
      'source-layer': 'road',
      filter: ['in', ['get', 'class'], ['literal', MAIN_ROADS]],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': colors.mainRoad,
        'line-width': ['interpolate', ['linear'], ['zoom'], 12, 1.1, 14, 2.75, 17, 7.5],
      },
    },
  ],
}
