class CapacitorComponent extends HTMLElement {
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

class CapacitorRoute extends CapacitorComponent {
  constructor() {
    super()
  }

  css(){
    return `
      :host {
        display: none;
      }
      :host([activating]),
      :host([active]) {
        display: contents;
      }
    `
  }

  connectedCallback(){
    this.currentDom = []
    /* Routes have two copies of their DOM. One is a simple string representation
    *  of the DOM, the other is the detached children in their current state. The 
    *  first is great if we need a fresh copy of the route, but the second is good
    *  If we want to preserve the state of things like input fields and js listeners
    */
    this.domCopy = this.innerHTML
    this._detachChildren()

    let path = this.getAttribute('path') || ''
    this.path = new RegExp(path)

    let parentRoute = this.parentElement.closest('capacitor-route')
    if(parentRoute) {
      parentRoute.addEventListener('routeactivate', ()=>{
        if(this.test()) this.activate()
      })
    }
  }

  static get observedAttributes() {
    return ['path', 'active', 'script']
  }

  attributeChangedCallback(name, oldValue, newValue){
    switch(name){
      case "path":
        this.path = new RegExp(newValue)
        break
      case "script":
        fetch(newValue).then(res => res.text()).then(script => {
          let options = eval(script)
          if(options.onActivate) this.addEventListener('routeactivate', options.onActivate)
          if(options.onDeactivate) this.addEventListener('routedeactivate', options.onDeactivate)
          if(this.active) options.onActivate()
        })
    }
  }

  get active() {
    return this.hasAttribute('active')
  }

  activate(fresh){
    if(this.hasAttribute('active')) return 0
    // If fresh is true, we load a fresh copy of the route. Otherwise we load
    // the previous state.
    if(fresh || this.hasAttribute('fresh')) this.innerHTML = this.domCopy
    else this._attachChildren()

    // Very briefly add the activating class, followed immediately by the active
    // class. This allows us to bind animation transitions easily for page loads.
    this.setAttribute('activating', '')
    setTimeout(()=>{
      this.removeAttribute('activating')
      this.setAttribute('active', '')
      let e = new CustomEvent('routeactivate', {bubbles: false})
      this.dispatchEvent(e)
    },1)
  }

  deactivate(){
    if(this.hasAttribute('active')){
      this.removeAttribute('active')
      this._detachChildren()
    }
  }

  test(){
    let path
    switch(this.getAttribute('test')) {
      case 'hash':
        path = window.location.hash
        break
      case 'both':
        path = window.location.pathname + window.location.hash
        break
      default:
        path = window.location.pathname
        break
    }

    if(this.getAttribute('path').charAt(0) == '/') return this.getAttribute('path') == path
    return this.path.test(path)
  }

  _detachChildren(){
    while(this.children.length){
      this.currentDom.push(this.removeChild(this.children[0]))
    }
  }

  _attachChildren(){
    while(this.currentDom.length){
      this.appendChild(this.currentDom.shift())
    }
  }
}

window.customElements.define('capacitor-route', CapacitorRoute)

class CapacitorRouter {
  constructor(){
    window.addEventListener('popstate', this.onPopState.bind(this))
    window.addEventListener('hashchange', this.onHashChange.bind(this))
    window.addEventListener('link', this.onHashChange.bind(this))
    this.onHashChange()
  }

  onPopState(e){
    this.onHashChange()
  }

  onHashChange(e){
    let path = window.location.pathname + window.location.hash
    path = path.slice(1)
    if(path == this._currentPath) return 0
    this._currentPath = path
    this.route(path, e && e.detail == 'fresh')
  }

  route(path, fresh){
    document.querySelectorAll('capacitor-route').forEach(route=>{
      if(route.test()){
        route.activate(fresh)
      } else route.deactivate()
    })
  }
}

window.capacitorRouter = new CapacitorRouter()

class CapacitorLink extends CapacitorComponent {
  constructor() {
    super()
  }

  static get observedAttributes() {
    return ['href']
  }

  css() { return `
    :host {
      color: blue;
      text-decoration: underline;
      display: inline-block;
      cursor: pointer;
    }
    
    a {
      text-decoration: inherit;
      color: inherit;
    }
  `}

  // Even though we're just doing fake navigation, we still want users to be able to middle
  // click on links, so we wrap our slot in an <a> rather than just binding the click event
  // to the host.
  html(){ return `
    <a @click=localLink ?fresh=${this.hasAttribute('fresh')}>
      <slot></slot>
    </a>
  `}

  attributeChangedCallback(name, oldValue, newValue){
    if(name == 'href') this.shadowRoot.querySelector('a').href = newValue
  }

  localLink(e){
    e.preventDefault()
    let link = e.currentTarget
    window.history.pushState(null, null, link.href)
    window.dispatchEvent(new CustomEvent('link', {detail: link.hasAttribute('fresh') ? 'fresh' : ''}))
  }
}

window.customElements.define('capacitor-link', CapacitorLink)

window.capacitor = CapacitorRoute