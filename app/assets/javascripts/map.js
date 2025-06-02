import parse from 'wellknown'
import maplibregl from 'maplibre-gl'
import { add, capitalize, map, startCase } from 'lodash'
import { getApiToken, getFreshApiToken } from './os-api-token.js'

const mapColours = {
  orange: '#C44200',
  purple: '#330165',
  turquoise: '#007A7A',
  pink: '#CD2380',
  green: '#217E01',
  dark_pink: '#6C003B',
  light_blue: '#2A72B2',
  dark_blue: '#001B4D'
}

const layerStyles = [
  {
    lineColor: mapColours.orange,
    lineWidth: 2,
    fillColor: mapColours.orange,
    fillOpacity: 0.2,
  },
  {
    lineColor: mapColours.purple,
    lineWidth: 2,
    fillColor: mapColours.purple,
    fillOpacity: 0.2,
  },
  {
    lineColor: mapColours.pink,
    lineWidth: 2,
    fillColor: mapColours.pink,
    fillOpacity: 0.2,
  },
  {
    lineColor: mapColours.green,
    lineWidth: 2,
    fillColor: mapColours.green,
    fillOpacity: 0.2,
  },
  {
    lineColor: mapColours.dark_pink,
    lineWidth: 2,
    fillColor: mapColours.dark_pink,
    fillOpacity: 0.2,
  },
  {
    lineColor: mapColours.dark_blue,
    lineWidth: 2,
    fillColor: mapColours.dark_blue,
    fillOpacity: 0.2,
  }
]

const focusStyle = {
  fillColor: '#ffdd00',
  fillOpacity: 1,
  lineColor: '#0b0c0c',
  lineWidth: 4
}


const boundaryLineColor = mapColours.turquoise
const boundaryLineOpacity = 1
const boundaryLineWidth = 4

const pointOpacity = 0.8
const pointRadius = 5
const popupMaxListLength = 10

const defaultOsMapStyle = '/public/static/OS_VTS_3857_Light.json'
const fallbackMapStyle = 'https://api.maptiler.com/maps/basic-v2/style.json?key=ncAXR9XEn7JgHBLguAUw'
const OS_API_ACCESS_TOKEN = 'clwU00Qa5AYZOdAoXcl4XenBq4ZMTC6t'

/**
* Creates a Map instance.
* @param {MapOptions} opts - The options for creating the map.
* @constructor
*/
/**
* Options for creating a Map instance.
* @typedef {Object} MapOptions
* @property {string} containerId - Required - The ID of the HTML container element for the map.
* @property {string[]} data - Required - An array of URLs or WKT geometries to be added to the map.
* @property {string} [boundaryGeoJsonUrl] - Optional - The URL of the boundary GeoJSON to be added to the map.
* @property {boolean} [interactive] - Optional - Indicates whether the map should be interactive. Default is true.
* @property {boolean} [wktFormat] - Optional - Indicates whether the data is in WKT format. Default is false.
* @property {number[]} [boundingBox] - Optional - The bounding box coordinates [minX, minY, maxX, maxY] to set the initial view of the map.
*/
export class Map {
  constructor (opts) {
    this.opts = opts
    this.bbox = this.opts.boundingBox ?? null
    this.map = new maplibregl.Map({
      container: this.opts.containerId,
      style: this.opts.style ?? defaultOsMapStyle,
      zoom: 11,
      center: [-0.1298779, 51.4959698],
      interactive: this.opts.interactive ?? true,
      transformRequest: (url, resourceType) => {
        if (url.indexOf('api.os.uk') > -1) {
          if (!/[?&]key=/.test(url)) url += '?key=null'
      
          const requestToMake = {
            url: url + '&srs=3857'
          }
      
          const token = getApiToken()
          console.log
          requestToMake.headers = {
            Authorization: 'Bearer ' + token
          }
      
          return requestToMake
        }
      }
    })
    
    // Add map controls
    this.addControls(this.opts.interactive)
    
    this.map.on('load', async () => {
      // Store the first symbol layer id
      this.setFirstMapLayerId()
      
      // Add the boundary GeoJSON to the map
      console.log('Adding boundary GeoJSON to map', this.opts.boundaryGeoJsonUrl)
      if (this.opts.boundaryGeoJsonUrl) this.addBoundaryGeoJsonToMap(this.opts.boundaryGeoJsonUrl)
        
      for (const i in this.opts.data) {
        if (this.opts.data[i].url) {
          // If the data is a URL, add it to the map
          console.log('Adding GeoJSON URL to map', this.opts.data[i])
          this.addGeoJsonUrlsToMap(this.opts.data[i].url, layerStyles[i % layerStyles.length], this.opts.data[i].dataset)
        } else if (this.opts.data[i].wkt) {
          // If the data is in WKT format, add it to the map
          console.log('Adding WKT data to map', this.opts.data[i].wkt)
          this.addWktDataToMap(this.opts.data[i].wkt)
        } else if (this.opts.data[i].data) {
          // If the data is a GeoJSON object, add it to the map
          console.log('Adding GeoJSON object to map', this.opts.data[i])
          this.addGeoJsonObjsToMap(this.opts.data[i].data, layerStyles[i % layerStyles.length], this.opts.data[i].dataset)
        }
      }

      try {
        if (this.opts.data[0].dataset == "single-entity") {
          // If the data is a single entity, set the map view to the bounding box
          this.bbox = await this.generateBoundingBox(this.map.getSource('geometry-single-entity'))
        } else {
          // If the data is not a single entity, calculate the bounding box from the geometries
          // const features = this.map.queryRenderedFeatures().filter(f => f.source.startsWith('geometry-') || f.source === 'boundary')
          // const geometries = features.map(f => f.geometry)

          // this.bbox = await calculateBoundingBoxFromGeometries(geometries.map(g => g.coordinates))

              
          this.bbox = await this.generateBoundingBox(this.map.getSource('boundary'))
        }
      } finally {
        this.setMapViewToBoundingBox(this.bbox)
      }
      
      // Add popup to map
      if (opts.interactive) this.addPopupToMap()
    })
  }
  
  addControls (interactive = true) {
    this.map.addControl(new maplibregl.ScaleControl(), 'bottom-left')
    
    if (interactive) {
      this.map.addControl(new maplibregl.NavigationControl())
      this.map.addControl(new maplibregl.FullscreenControl())
    }
  }
  
  setFirstMapLayerId () {
    const layers = this.map.getStyle().layers
    
    // Find the index of the first symbol layer in the map style
    for (let i = 0; i < layers.length; i++) {
      if (layers[i].type === 'symbol') {
        this.firstMapLayerId = layers[i].id
        break
      }
    }
  }
  
  addWktDataToMap (geometriesWkt) {
    const geometries = []
    geometriesWkt.forEach((geometryWkt, index) => {
      const name = `geometry-${index}`
      
      // Convert the coordinates string to a GeoJSON object
      const geometry = parse(geometryWkt)
      
      // if the geometry is invalid, log an error and continue
      if (!geometry) {
        console.error('Invalid WKT geometry format', geometryWkt)
        return
      }
      
      // store geometries for use in calculating the bbox later
      geometries.push(geometry)
      // add the source
      this.map.addSource(name, {
        type: 'geojson',
        data: geometry
      })
      
      // Add a layer to the map based on the geometry type
      if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
        this.map.addLayer({
          id: name,
          type: 'fill',
          source: name,
          layout: {},
          paint: {
            'fill-color': fillColor,
            'fill-opacity': fillOpacity
          }
        }, this.firstMapLayerId)
        
        this.map.addLayer({
          id: name + '-border',
          type: 'line',
          source: name,
          layout: {},
          paint: {
            'line-color': lineColor,
            'line-width': 1
          }
        }, this.firstMapLayerId)
      } else if (geometry.type === 'Point' || geometry.type === 'MultiPoint') {
        this.map.addLayer({
          id: name,
          type: 'circle',
          source: name,
          paint: {
            'circle-radius': pointRadius,
            'circle-color': pointColor,
            'circle-opacity': pointOpacity
          }
        }, this.firstMapLayerId)
      }
    })
    
    this.bbox = calculateBoundingBoxFromGeometries(geometries.map(g => g.coordinates))
  }
  
  async addGeoJsonUrlsToMap (url, style, slug) {
    const name = `geometry-${slug}`
    this.map.addSource(name, {
      type: 'geojson',
      data: url,
      promoteId: 'entity'
    })
    
    this.addLayers(name, style, this)
  }
  
  async addGeoJsonObjsToMap (geoJsonObjs, style, slug) {
    const name = `geometry-${slug}`
    this.map.addSource(name, {
      type: 'geojson',
      data: geoJsonObjs,
      promoteId: 'entity'
    })
    
    this.addLayers(name, style, this)
  }
  
  addLayers (name, style, mapInstance) {
    mapInstance.map.addLayer({
      id: name,
      type: 'fill',
      source: name,
      layout: {},
      paint: {
        'fill-color': style.fillColor,
        'fill-opacity': style.fillOpacity
      }
    }, this.firstMapLayerId)
    
    mapInstance.map.addLayer({
      id: `${name}-point`,
      type: 'circle',
      source: name,
      paint: {
        'circle-radius': pointRadius,
        'circle-color': style.fillColor,
        'circle-opacity': pointOpacity
      },
      filter: ['==', '$type', 'Point']
    }, mapInstance.firstMapLayerId)
    
    mapInstance.map.addLayer({
      id: `${name}-border`,
      type: 'line',
      source: name,
      paint: {
        'line-color': style.lineColor,
        'line-width': style.lineWidth
      }
    }, mapInstance.firstMapLayerId)

    if (document.querySelectorAll('.app-map-sidebar-list__item').length > 0) {
      console.log('Adding focus layers to map')
      mapInstance.map.addLayer({
        id: 'focus',
        type: 'fill',
        source: name,
        paint: {
          'fill-color': focusStyle.fillColor,
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            1,
            0
          ]
        }
      }, mapInstance.firstMapLayerId);
      
      mapInstance.map.addLayer({
        id: 'focus-border',
        type: 'line',
        source: name,
        paint: {
          'line-color': focusStyle.lineColor,
          'line-width': focusStyle.lineWidth,
          'line-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            1,
            0
          ]
        }
      }, mapInstance.firstMapLayerId);
    }
  }
  
  async addBoundaryGeoJsonToMap (geoJsonUrl) {
    this.map.addSource('boundary', {
      type: 'geojson',
      data: geoJsonUrl
    })
    
    this.map.addLayer({
      id: 'boundary',
      type: 'line',
      source: 'boundary',
      layout: {},
      paint: {
        'line-color': boundaryLineColor,
        'line-width': boundaryLineWidth,
        'line-opacity': boundaryLineOpacity
      }
    }, this.firstMapLayerId)
  }
  
  generateBoundingBox = async (source) => {
    console.log('Generating bounding box from source', source)
    if (!source) return []
    
    let minX, minY, maxX, maxY
    
    if (this.bbox && this.bbox.length === 2) {
      console.log('Using existing bounding box', this.bbox)
      [minX, minY] = this.bbox[0]
      [maxX, maxY] = this.bbox[1]
    } else {
      console.log('No existing bounding box, calculating from source')
      minX = Infinity
      minY = Infinity
      maxX = -Infinity
      maxY = -Infinity
    }
    
    const coords = await source.getBounds()
    console.log('Source bounds', coords)
    
    minX = Math.min(minX, coords._sw.lng)
    minY = Math.min(minY, coords._sw.lat)
    maxX = Math.max(maxX, coords._ne.lng)
    maxY = Math.max(maxY, coords._ne.lat)
    console.log('Calculated bounding box', [[minX, minY], [maxX, maxY]])
    
    return [[minX, minY], [maxX, maxY]]
  }
  
  setMapViewToBoundingBox (bbox) {
    this.map.fitBounds(bbox, { padding: 20, duration: 0, maxZoom: 16 })
  }
  
  addPopupToMap () {
    this.map.on('click', (e) => {
      const features = this.map.queryRenderedFeatures(e.point).filter(f => f.layer.id.startsWith('geometry-'))
      if (!features.length) return
      
      const popupContent = document.createElement('div')
      
      if (features.length > popupMaxListLength) {
        const tooMany = document.createElement('p')
        tooMany.classList.add('govuk-body-s')
        tooMany.textContent = `
          You clicked on ${features.length} features. <br/>
          Zoom in or turn off layers to narrow down your choice.`
        popupContent.appendChild(tooMany)
      } else {
        features.forEach(feature => {
          // add heading
          const item = document.createElement('div')
          item.classList.add('app-c-map__popup-list-item')
          
          const heading = document.createElement('h4')
          heading.classList.add('govuk-heading-s')
          heading.textContent = capitalize(startCase(feature.properties.dataset))
          
          let message
          if (feature.layer.id.includes('alternative-sources')) {
            // add message
            message = document.createElement('p')
            message.classList.add('app-warning-message')
            message.innerHTML = `This ${capitalize(startCase(feature.properties.dataset))} is from an alternative source`
          }
          
          // feature text content
          const textContent = document.createElement('p')
          textContent.classList.add('govuk-body-s')
          textContent.innerHTML = `${feature.properties.name || ''} `
          
          const link = document.createElement('a')
          link.classList.add('govuk-link')
          link.href = feature.properties.url || '#'
          link.textContent = `Reference: ${feature.properties.reference}`
          
          textContent.appendChild(link)
          
          item.appendChild(heading)
          if (message) item.appendChild(message)
            item.appendChild(textContent)
          popupContent.appendChild(item)
        })
      }
      
      const popup = new maplibregl.Popup({
        maxWidth: '300px'
      })
      .setLngLat(e.lngLat)
      .setDOMContent(popupContent)
      .addTo(this.map)
      
      popup.getElement().onwheel = preventScroll(['.app-c-map__popup-list'])
    })
    
    this.map.getCanvas().style.cursor = 'pointer'
    
    this.map.on('mouseleave', () => {
      this.map.getCanvas().style.cursor = ''
    })
  }
}

export const calculateBoundingBoxFromGeometries = (geometries) => {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  
  if (!geometries) return []
  
  const pullOutCoordinates = (geometry) => {
    if (Array.isArray(geometry[0])) {
      geometry.forEach(pullOutCoordinates)
    } else {
      const [x, y] = geometry
      
      // if x or y isn't a valid number log an error and continue
      if (isNaN(x) || isNaN(y)) {
        console.error('Invalid coordinates', x, y)
        return
      }
      
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    }
  }
  
  pullOutCoordinates(geometries)
  
  // Return the bounding box
  return [[minX, minY], [maxX, maxY]]
}

// Prevents scrolling of the page when the user triggers the wheel event on a div
// while still allowing scrolling of any specified scrollable child elements.
// Params:
//  scrollableChildElements: an array of class names of potential scrollable elements
const preventScroll = (scrollableChildElements = []) => {
  return (e) => {
    const closestClassName = scrollableChildElements.find((c) => {
      return e.target.closest(c) != null
    })
    
    if (!closestClassName) {
      e.preventDefault()
      return false
    }
    
    const list = e.target.closest(closestClassName)
    
    if (!list) {
      e.preventDefault()
      return false
    }
    
    const verticalScroll = list.scrollHeight > list.clientHeight
    if (!verticalScroll) { e.preventDefault() }
    
    return false
  }
}

export const generatePaginatedGeoJsonLinks = async (geoJsonObj) => {
  const geoJsonLinks = [geoJsonObj]
  const initialResponse = geoJsonObj
  const initialData = await initialResponse.json()
  
  // return if no pagination is needed
  if (!initialData.links || !initialData.links.last) {
    return geoJsonLinks
  }
  
  const lastLink = new URL(initialData.links.last)
  const limit = parseInt(lastLink.searchParams.get('limit'))
  const lastOffset = parseInt(lastLink.searchParams.get('offset'))
  
  if (!limit || !lastOffset) {
    console.error('Invalid pagination links', lastLink)
    return geoJsonLinks
  }
  
  // create a loop to generate the links
  for (let offset = limit; offset <= lastOffset; offset += limit) {
    const newLink = new URL(geoJsonUrl)
    newLink.searchParams.set('offset', offset)
    
    geoJsonLinks.push(newLink.toString())
  }
  
  return geoJsonLinks
}

export const createMapFromServerContext = async () => {
  const { containerId, mapType, data, boundaryGeoJsonUrl } = window.serverContext
  const options = {
    containerId,
    data: data,
    boundaryGeoJsonUrl,
    interactive: mapType !== 'static',
    wktFormat: data === undefined
  }

  // fetch initial token
  try {
    await getFreshApiToken()
  } catch (error) {
    console.error('Error fetching OS Map API token', error.message)
    options.style = fallbackMapStyle
  }
  
  // If only boundaryGeoJsonUrl is present, allow map to render
  if (options.boundaryGeoJsonUrl && !options.data) {
    options.data = []
  }
  
  if (!options.containerId) {
    console.log('Missing required property containerId on window.serverContext', window.serverContext)
    return null
  }
  
  return new Map(options)
}

export const simulateClick = (coords) => {
  const event = {
    type: 'click',
    lngLat: [],
    point: {}
  }

  event.lngLat = coords
  event.point = window.map.map.project(coords)

  window.map.map.fire(event)
}

export const findMiddlePoint = (geometry) => {
  if (!geometry || geometry.length === 0) {
    console.error('No geometry provided to find middle point')
    return null
  }

  // Flatten nested arrays if needed (handles MultiPolygon, etc.)
  const flattenCoords = (coords) => {
    if (typeof coords[0] === 'number') return [coords]
    return coords.flatMap(flattenCoords)
  }

  const flatCoords = flattenCoords(geometry)

  let sumX = 0
  let sumY = 0
  let count = 0

  flatCoords.forEach(([x, y]) => {
    sumX += x
    sumY += y
    count++
  })

  if (count === 0) return null

  return [sumX / count, sumY / count]
}


document.addEventListener("DOMContentLoaded", async () => {
  try {
    window.map = await createMapFromServerContext()
    window.map.map.on('error', err => {
      console.warn('map error', err)
    })

    // set up event listeners for the sidebar items
    document.querySelectorAll('.app-map-sidebar-list__item').forEach(item => {
      window.matchingFeatures = []
      
      item.addEventListener('mouseenter', (e) => {
        const target = e.currentTarget
        const layerId = 'focus'
        const entityId = target.dataset.entity  
        
        const layer = window.map.map.getLayer(layerId)
        const alternativeFeatures = window.map.map.queryRenderedFeatures({ layers: [ layerId ] })
        
        window.matchingFeatures = alternativeFeatures.filter(feature => feature.properties.entity == entityId)
        
        if (window.matchingFeatures.length > 0) {
          const filter = ['in', ['get', 'entity'], entityId]
          window.map.map.setFeatureState(window.matchingFeatures[0], { hover: true })
          const middlePoint = findMiddlePoint(window.matchingFeatures[0].geometry.coordinates)
          simulateClick(middlePoint)
        } else {
          console.warn('No matching features found for entity', entityId)
        }
        
      })
      
      item.addEventListener('mouseleave', (e) => {
        const target = e.currentTarget
        const layerId = 'focus'
        
        window.map.map.setFeatureState(window.matchingFeatures[0], { hover: false})
      })
    })
  } catch (error) {
    console.error('Error creating map', error)
  }
})
