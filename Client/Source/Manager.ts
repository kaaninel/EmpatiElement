
import EmpatiElement, { Constructor, Particle } from "./EmpatiElement";
import { html } from "./Lit/lit-html";
import { Property } from "./Particles/Property";
import { GhostParticle } from "./Particles/Style";

export default class Manager extends EmpatiElement {
  CreateRoot(): HTMLElement{
    return this;
  }
}

@Particle(GhostParticle)
export class ViewManager extends Manager {
  CreateRoot(){
    return document.body;
  }
}

@Particle(GhostParticle)
export class MetaManager extends Manager {
  @Property Title: string;
  @Property Manifest: Record<string, string> = {};

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
    `;
  }
}

export function Execute(ctor: Constructor<Manager>) {
  customElements.define(ctor.toString(), ctor);
  const E: Manager = new ctor();
  document.documentElement.appendChild(E);
}
