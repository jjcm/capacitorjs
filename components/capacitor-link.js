import CapacitorComponent from './capacitor-component.js'

export default class CapacitorLink extends CapacitorComponent {
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
    <a @click=localLink ?refresh=${this.hasAttribute('refresh')}>
      <slot></slot>
    </a>
  `}

  attributeChangedCallback(name, oldValue, newValue){
    if(name == 'href') this.shadowRoot.querySelector('a').href = newValue
  }

  localLink(e){
    e.preventDefault()
    console.log('heyo')
    let link = e.currentTarget
    window.history.pushState(null, null, link.href)
    window.dispatchEvent(new CustomEvent('link', {detail: link.hasAttribute('refresh') ? 'refresh' : ''}))
  }
}
