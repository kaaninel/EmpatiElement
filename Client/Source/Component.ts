import EmpatiElement from "./Element";

export default class EmpatiComponent extends EmpatiElement {

  _InnerView = true;
  
  Root: ShadowRoot;

  protected CreateRoot() {
    return this.attachShadow({ mode: "open" });
  }

}