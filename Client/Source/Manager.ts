
import EmpatiElement, { Constructor, Particle } from "./EmpatiElement";
import { html } from "./Lit/lit-html";
import { Property } from "./Particles/Property";

declare global {
  interface Window { Managers: Record<string, Manager> }
}

window.Managers = {};

export default class Manager extends EmpatiElement {
  _DOM = true;

  CreateRoot(): HTMLElement{
    return this;
  }

}

export class ViewManager extends Manager {
  _DOM = false;
  
  CreateRoot(){
    return document.body;
  }
}

export class MetaManager extends Manager {
  @Property Title: string;
  @Property Manifest: Record<string, string> = {};

  _InnerView = false;
  _DOM = false;

  CreateRoot(){
    return document.head;
  }

  Template(){
    return html`
      <meta charset="UTF-8" >
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${Object.keys(this.Manifest).map(Key => html`
        <meta name="${Key}" content="${this.Manifest[Key]}">
      `)}
      <title>${this.Title}</title>
      <style></style>
    `;
  }
}

export function Execute(ctor: Constructor<Manager>) {
  customElements.define(ctor.toString(), ctor);
  const E: Manager = new ctor();
  window.Managers[ctor.name] = E;
  if(E._DOM) document.documentElement.appendChild(E);
}
