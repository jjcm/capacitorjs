import CapacitorRoute from "/components/capacitor-route.js"
window.customElements.define('capacitor-route', CapacitorRoute)

import CapacitorRouter from "/components/capacitor-router.js"
window.capacitorRouter = new CapacitorRouter()

import CapacitorLink from "/components/capacitor-link.js"
window.customElements.define('capacitor-link', CapacitorLink)

window.capacitor = CapacitorRoute