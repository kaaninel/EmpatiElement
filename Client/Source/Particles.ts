export * from "./Lit/lit-html";

export default class EEBase extends HTMLElement {
  public Root = this.CreateRoot();

  get Proto() {
    return this.constructor.prototype;
  }

  protected CreateRoot(): ShadowRoot | Node {
    return this.attachShadow({ mode: "open" });
  }

  static Namespace = "empati";

  static toString() {
    return this.Namespace + "-" + (
      this.name.charAt(0).toLowerCase() +
      this.name.substr(1).replace(/([A-Z])/g, g => `-${g[0].toLowerCase()}`)
    );
  }

  static get X(){
    return document.createElement(this.toString());
  }  
}

export type Constructor<T = {}> = new (...args: any[]) => T;

export function CustomElement(ctor: Constructor<EEBase>) {
  customElements.define(ctor.toString(), ctor);
}
