
import EmpatiElement, { Constructor } from "./Element";
import { html } from "./Lit/lit-html";
import { Property } from "./Particles/Property";
import { EmpatiStyle } from "./Template";

declare global {
  interface Window { Managers: Record<string, Manager> }
}

window.Managers = {};

export default class Manager extends EmpatiElement {

}

export class ViewManager extends Manager {
  _DOM = false;
  
  CreateRoot(){
    return document.body as EmpatiElement;
  }
}

export class MetaManager extends Manager {
  @Property Title: string;
  @Property Manifest: Record<string, string> = {};

  _InnerView = false;
  _DOM = false;

  CreateRoot(){
    return document.head as EmpatiElement;
  }

  Template(){
    return html`
      <meta charset="UTF-8" >
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${Object.keys(this.Manifest).map(Key => html`
        <meta name="${Key}" content="${this.Manifest[Key]}">
      `)}
      <title>${this.Title}</title>
    `;
  }
}

export function Execute(ctor: Constructor<Manager>) {
  customElements.define(ctor.toString(), ctor);
  const E: Manager = new ctor();
  window.Managers[ctor.name] = E;
  if(E._DOM) document.documentElement.appendChild(E);
}

@Execute
class Stylist extends Manager {

  static Styles: Record<string, EmpatiStyle> = {};

  @Property Styles: Record<string, EmpatiStyle> = {};

  Set(Host: EmpatiElement, Value: EmpatiStyle){
    //Value.strings = Value.strings.map(x => x.replace(/&(&|\|)/, Key => Key == "&" ? Host.tagName : Host.id));
    this.Styles[Host.id] = Value;
    this.Refresh(); 
  }

  Template(){
    return html`
      <style>
        ${Object.values((this.constructor as typeof Stylist).Styles)}
        ${Object.values(this.Styles)}
        </style>
    `;
  }

}