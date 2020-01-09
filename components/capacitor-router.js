export default class CapacitorRouter {

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
    this.route(path, e && e.detail == 'refresh')
  }

  route(path, refresh){
    let matchFound = false
    document.querySelectorAll('capacitor-route').forEach(route=>{
      if(!matchFound && route.pattern.test(path)){
        matchFound = true
        route.activate(refresh)
      } else route.deactivate()
    })
  }
}
