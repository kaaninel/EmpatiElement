import EmpatiElement from "./Element";
import { Property } from "./Particles/Property";
import { EmpatiStyle, css } from "./Template";
import { render } from "./Lit/lit-html";

export default class EmpatiComponent extends EmpatiElement {

  static $ComponentMark = true;
  
  Root: EmpatiElement;
  Doc = this;
  _InnerView = true;

  $StyleSheet = document.createElement("style");
  $StaticStyle: EmpatiStyle;
  @Property $Styles: Record<string, EmpatiStyle> = {};

  $SetStyle(Host: EmpatiElement, Value: EmpatiStyle){
    this.$Styles[Host.id] = Value;
    render(css`${this.$StaticStyle}${Object.values(this.$Styles)}`, this.$StyleSheet);
  }

  protected CreateRoot() {
    return this.attachShadow({ mode: "open" });
  }

  async $$Constr(){
    this.$StaticStyle = await (this.constructor as typeof EmpatiComponent).Style();
    this.Root.appendChild(this.$StyleSheet);
    render(css`${this.$StaticStyle}`, this.$StyleSheet);
  }

}