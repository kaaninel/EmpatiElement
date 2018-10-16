
import EEBase, { html, Constructor } from "./Particles";
import EmpatiElement from "./Element";
import { Property } from "./Particles/PropertyParticle";

declare global {
  interface Window { View: ViewManager, Meta: MetaManager }
}

export function Execute(ctor: Constructor<EEBase>) {
  customElements.define(ctor.toString(), ctor);
  const E = document.createElement(ctor.toString());
  document.documentElement.appendChild(E);
}

export default class Manager extends EmpatiElement {

  Style = {
    display: "none"
  };

}

export class ViewManager extends Manager {
  CreateRoot(){
    return document.body;
  }
}

export class MetaManager extends Manager {
  
  @Property Title: string;
  @Property Manifest: Record<string, string> = {};

  CreateRoot(){
    return document.head;
  }

  Render(){
    return html`
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${Object.keys(this.Manifest).map(Key => html`
        <meta name="${Key}" content="${this.Manifest[Key]}">
      `)}
      <title>${this.Title}</title>
    `;
  }
}