var a='aksdfjasf'
class Registry {
  static store={}
  constructor() {
    Registry.store={}
  }

  static set(name: string, obj) {
    Registry.store[name] = obj
  }
  static get(name: string) {
    return Registry.store[name]
  }

  static update(name:string,obj:any){

  }

}
export=Registry
