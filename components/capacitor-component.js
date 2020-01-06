export default class CapacitorComponent extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({'mode':'open'})

    // This allows us to define css and html blocks within components
    this.shadowRoot.innerHTML = `
      ${this.css ? `<style>${this.css()}</style>` : ''}
      ${this.html ? this.html() : '<slot></slot>'}
    `

    // Think of this like a shitty lit-html. Just allows binding with @events 
    // and ?booleanAttributes. 
    this.shadowRoot.querySelectorAll('*').forEach(el=> {
      Array.from(el.attributes).forEach(attr => {
        const prefix = attr.name.charAt(0)
        if(prefix == '@'){
          this[attr.value] = this[attr.value].bind(this)
          el.addEventListener(attr.name.slice(1), this[attr.value])
          el.removeAttribute(attr.name)
        }
        if(prefix == '?'){
          el[attr.value != 'false' ? 'setAttribute' : 'removeAttribute'](attr.name.slice(1), '')
          el.removeAttribute(attr.name)
        }
      })
    })
  }
}
