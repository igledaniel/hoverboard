var RenderingInterface = require('./renderingInterface');

module.exports = L.TileLayer.Canvas.extend({
  options: {
    async: true
  },
  initialize: function(url, options){
    L.TileLayer.Canvas.prototype.initialize.call(this, options);

    this._tileCache = {};
    this._renderers = [];

    this.setUrl(url);

    this.on("tileunload", function(d){
      if (d.tile.abort) d.tile.abort();
      d.tile.abort = null;
    });
  },
  projector: function(tilePoint, layer){
    var tilesLong = Math.pow(2, tilePoint.z);
    var sideLength = 40075016.68557849;
    var pixelsPerTile = sideLength / tilesLong;

    var x = tilePoint.x % tilesLong;
    var y = tilePoint.y % tilesLong;

    var tilePosition = {
      top: (sideLength/2) - ((y+1) / tilesLong * sideLength),
      left: -(sideLength/2) + (x / tilesLong * sideLength)
    };

    tilePosition.bottom = tilePosition.top+pixelsPerTile;
    tilePosition.right = tilePosition.left+pixelsPerTile;

    return d3.geo.transform({
      point: function(lng, lat) {
        var point = L.CRS.EPSG3857.project({lat: lat, lng: lng});
        point.x = (point.x - tilePosition.left)/pixelsPerTile;
        point.y = 1-((point.y - tilePosition.top)/pixelsPerTile);
        point.x *= 256;
        point.y *= 256;
        this.stream.point(point.x, point.y);
      }
    });
  },
  clippedProjector: function(tilePoint, layer){
    var projector = this.projector(tilePoint, layer);

    var clip = d3.geo.clipExtent()
      .extent([[-8, -8], [256+8, 256+8]]);

    return {stream: function(s) { return projector.stream(clip.stream(s)); }};
  },
  _fetchTile: function(tilePoint, callback){
    var cacheKey = this._url+'@@'+JSON.stringify(tilePoint);

    if (typeof this._tileCache[cacheKey] != 'undefined') {
      callback(null, this._tileCache[cacheKey]);
      return function(){};
    } else {
      var self = this;
      var url = this.getTileUrl(tilePoint);
      return this.fetch(url, function(err, result){
        if (!err) {
          self._tileCache[cacheKey] = self.parse(result);
        }
        callback(err, self._tileCache[cacheKey]);
      });
    }
  },
  render: function(layerName, fn){
    if (typeof fn == 'function') {
      this._renderers.push({
        layer: layerName,
        run: fn
      });
      return this;
    } else {
      var renderer = new RenderingInterface(this, layerName);
      this._renderers.push({
        layer: layerName,
        run: renderer.run.bind(renderer)
      });
      return renderer;
    }
  },
  drawData: function(canvas, tilePoint, data, callback){
    var context = canvas.getContext('2d');

    var width = canvas.width, height = canvas.height;
    if (this.options.hidpiPolyfill) {
      width *= (1/window.devicePixelRatio);
      height *= (1/window.devicePixelRatio);
    }
    context.clearRect(0, 0, width, height);

    var paths = {};

    if (this._renderers.length) {
      var self = this;
      this._renderers.forEach(function(renderer){
        if (!data[renderer.layer]) return;

        if (typeof paths[renderer.layer] == 'undefined') {
          paths[renderer.layer] = d3.geo.path()
            .projection(self.clippedProjector(tilePoint, renderer.layer))
            .context(context);
        }

        renderer.run(context, data[renderer.layer].features, tilePoint, function(features){
          if (typeof features == 'object' && !Array.isArray(features)) {
            features = [features];
          }

          context.beginPath();
          features.forEach(paths[renderer.layer]);
        });
      });
      callback();
    } else {
      callback(new Error('No renderer specified!'));
    }
  },
  drawTile: function(canvas, tilePoint, zoom){
    this._adjustTilePoint(tilePoint);

    var self = this;
    canvas.abort = this._fetchTile(tilePoint, function(err, result){
      if (err) {
        self.tileDrawn(canvas);
        throw err;
      }

      self.drawData(canvas, tilePoint, result, function(err){
        self.tileDrawn(canvas);
        if (err) {
          throw err;
        }
      });
    });
  }
});

module.exports.json = module.exports.extend({
  fetch: function(url, callback){
    var xhr = d3.json(url, function(err, xhrResponse){
      callback(err, xhrResponse.response || xhrResponse);
    });

    return xhr.abort.bind(xhr);
  }
});

module.exports.geojson = module.exports.json.extend({
  parse: function(data){
    return {geojson: data};
  }
});

module.exports.topojson = module.exports.json.extend({
  parse: function(data){
    var layers = {};

    for (var key in data.objects) {
      layers[key] = topojson.feature(data, data.objects[key]);
    }

    return layers;
  }
});

module.exports.mvt = module.exports.extend({
  fetch: function(url, callback){
    var xhr = d3.xhr(url)
      .responseType('arraybuffer')
      .get(function(err, xhrResponse){
        callback(err, xhrResponse.response || xhrResponse);
      });

    return xhr.abort.bind(xhr);
  },
  parse: function(data){
    var tile = new VectorTile( new pbf( new Uint8Array(data) ) );

    var layers = {};

    if (typeof this.layerExtents == 'undefined') {
      this.layerExtents = {};

      for (var key in tile.layers) {
        this.layerExtents[key] = tile.layers[key].extent;
      }
    }

    for (var key in tile.layers) {
      layers[key] = tile.layers[key].toGeoJSON();
    }

    return layers;
  },
  projector: function(tilePoint, layer){
    var self = this;

    return d3.geo.transform({
      point: function(x, y) {
        x = x/self.layerExtents[layer]*256;
        y = y/self.layerExtents[layer]*256;

        this.stream.point(x, y);
      }
    });
  }
});