
import EmpatiElement, { Constructor, CustomElement } from "./Element";
import { html } from "./Lit/lit-html";
import { Property } from "./Particles/Property";
import { EmpatiStyle, css } from "./Template";

declare global {
  interface Window { 
    Managers: Record<string, Manager>,
    Styles: Record<string, EmpatiStyle>
  }
}

window.Styles = {};
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
  @Property Manifest: Record<string, string> = {
    viewport: "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0"
  };
  
  _DOM = false;

  CreateRoot(){
    return document.head as EmpatiElement;
  }

  Template(){
    return html`
      <meta charset="UTF-8" >
      ${Object.keys(this.Manifest).map(Key => html`
        <meta name="${Key}" content="${this.Manifest[Key]}">
      `)}
      <title>${this.Title}</title>
    `;
  }
}

export function Execute(ctor: Constructor<Manager>) {
  const G = CustomElement(ctor as typeof EmpatiElement);
  const E: Manager = new G();
  window.Managers[ctor.name] = E;
  if(E._DOM) document.documentElement.appendChild(E);
}

@Execute
class Stylist extends Manager {

  @Property Styles: Record<string, EmpatiStyle> = {};

  Set(Host: EmpatiElement, Value: EmpatiStyle){
    this.Styles[Host.id] = Value;
    this.Refresh(); 
  }

  static Style(){
    return css`
      ${this} {
        display: none;
      }
    `;
  }

  Template(){
    return html`
      <style>
        ${Object.values(window.Styles)}
        ${Object.values(this.Styles)}
        </style>
    `;
  }

}