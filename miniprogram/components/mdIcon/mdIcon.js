import * as mdi from './mdi'

const getSvg = (path, color) => 'url("data:image/svg+xml, ' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="24" height="24" viewBox="0 0 24 24"><path fill="${color}" d="${path}" /></svg>`) + '")'

Component({
  properties: {
    type: String,
    color: String,
    size: String,
  },
  data: {
    backgroundImage: '',
    iconSize: '',
  },
  observers: {
    'type, color, size'() {
      this.setData({
        backgroundImage: getSvg(mdi[this.properties.type], this.properties.color),
        iconSize: this.properties.size,
      })
    },
  },
})
